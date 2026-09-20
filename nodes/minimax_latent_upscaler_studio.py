"""
=============================================================================
McValley MiniMax Latent Upscaler Studio (Clean Cascade Bridge)
Suite: ComfyUI-Mc_Valley-Nodes
Plataforma: AMD ROCm / Linux (Optimizado para RX 9070 16GB)
=============================================================================
"""

import os
import gc
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import folder_paths

try:
    import comfy.model_management as mm
    HAS_MM = True
except ImportError:
    HAS_MM = False

try:
    import comfy.nested_tensor
    HAS_NESTED = True
except ImportError:
    HAS_NESTED = False

_LATENT_UPSCALE_FOLDER = "latent_upscale_models"
if _LATENT_UPSCALE_FOLDER not in folder_paths.folder_names_and_paths:
    folder_paths.add_model_folder_path(
        _LATENT_UPSCALE_FOLDER,
        os.path.join(folder_paths.models_dir, _LATENT_UPSCALE_FOLDER)
    )

VAE_DOWNSAMPLE = 16
H3_PATCH_SIZE = 2

LATENTS_MEAN = [
    0.858090341091156, -0.9606591463088989, 1.0661640167236328, -0.5090325474739075,
    -0.2727581858634949, -1.3675414323806763, -0.2553254961967468, -0.26907554268836975,
    -0.5376840829849243, -0.0464097298681736, 0.6657370328903198, 0.19690127670764923,
    -0.5460608005523682, -0.4035342037677765, -0.23683024942874908, 0.25928452610969543,
    -0.30133944749832153, 0.211341992020607, -1.1206848621368408, 0.3581933379173279,
    -0.04225143790245056, 0.2604829967021942, 0.22864092886447906, 0.7056031823158264
]
LATENTS_STD = [
    1.2223774194717407, 1.2767263650894165, 1.6831774711608887, 1.7549455165863037,
    1.5636216402053833, 2.194143533706665, 0.9653137922286987, 1.0569885969161987,
    0.841948926448822, 0.7729952931404114, 1.8955937623977661, 0.946841835975647,
    0.7996809482574463, 0.44988900423049927, 0.7197399735450745, 0.6936293244361877,
    2.961095094680786, 2.7694199085235596, 3.0496184825897217, 2.1088054180145264,
    3.276226282119751, 3.1627357006073, 2.2816812992095947, 2.6127843856811523
]

def _make_norm_tensors(device, dtype):
    mean = torch.tensor(LATENTS_MEAN, dtype=dtype, device=device).view(1, -1, 1, 1, 1)
    std = torch.tensor(LATENTS_STD, dtype=dtype, device=device).view(1, -1, 1, 1, 1)
    return mean, std

def normalization(channels):
    return nn.GroupNorm(32, channels)

class ResBlockEmb3D(nn.Module):
    def __init__(self, channels, emb_channels, dropout=0, out_channels=None):
        super().__init__()
        self.out_channels = out_channels or channels
        self.in_layers = nn.Sequential(
            normalization(channels), nn.SiLU(),
            nn.Conv3d(channels, self.out_channels, 3, padding=1),
        )
        self.emb_layers = nn.Sequential(
            nn.SiLU(), nn.Linear(emb_channels, 2 * self.out_channels),
        )
        self.out_norm = normalization(self.out_channels)
        self.out_layers = nn.Sequential(
            nn.SiLU(), nn.Dropout(p=dropout),
            nn.Conv3d(self.out_channels, self.out_channels, 3, padding=1),
        )
        self.skip = (
            nn.Conv3d(channels, self.out_channels, 1)
            if self.out_channels != channels else nn.Identity()
        )
        for p in self.out_layers[-1].parameters():
            p.detach().zero_()

    def forward(self, x, emb):
        h = self.in_layers(x)
        emb_out = self.emb_layers(emb).type(h.dtype)
        while len(emb_out.shape) < len(h.shape):
            emb_out = emb_out[..., None]
        scale, shift = torch.chunk(emb_out, 2, dim=1)
        h = self.out_norm(h) * (1 + scale) + shift
        h = self.out_layers(h)
        return self.skip(x) + h

class TemporalConv(nn.Module):
    def __init__(self, channels, kernel_size=5):
        super().__init__()
        padding = kernel_size // 2
        self.norm = normalization(channels)
        self.dwconv = nn.Conv3d(channels, channels,
                                kernel_size=(kernel_size, 1, 1),
                                padding=(padding, 0, 0),
                                groups=channels)
        self.pwconv = nn.Conv3d(channels, channels, kernel_size=1)
        nn.init.zeros_(self.pwconv.weight)
        nn.init.zeros_(self.pwconv.bias)

    def forward(self, x):
        return x + self.pwconv(self.dwconv(F.silu(self.norm(x))))

class LatentResizer3D(nn.Module):
    def __init__(self, in_channels=24, in_blocks=12, out_blocks=12, channels=512, dropout=0.1, temporal_every=2, temporal_kernel=5):
        super().__init__()
        self.conv_in = nn.Conv3d(in_channels, channels, 3, padding=1)
        embed_dim = 64
        self.embed = nn.Sequential(nn.Linear(1, embed_dim), nn.SiLU(), nn.Linear(embed_dim, embed_dim))

        self.in_blocks = nn.ModuleList()
        for b in range(in_blocks):
            self.in_blocks.append(ResBlockEmb3D(channels, embed_dim, dropout))
            if temporal_every > 0 and b % temporal_every == 0:
                self.in_blocks.append(TemporalConv(channels, temporal_kernel))

        self.out_blocks = nn.ModuleList()
        for b in range(out_blocks):
            self.out_blocks.append(ResBlockEmb3D(channels, embed_dim, dropout))
            if temporal_every > 0 and b % temporal_every == 0:
                self.out_blocks.append(TemporalConv(channels, temporal_kernel))

        self.norm_out = normalization(channels)
        self.conv_out = nn.Conv3d(channels, in_channels, 3, padding=1)

    def forward(self, x, scale=None, target_size=None):
        size = target_size
        scale_emb = torch.tensor([scale - 1.0 if scale is not None else 0.0], dtype=x.dtype, device=x.device).unsqueeze(0)
        emb = self.embed(scale_emb)

        x = self.conv_in(x)
        for b in self.in_blocks:
            x = b(x, emb.expand(x.shape[0], -1)) if isinstance(b, ResBlockEmb3D) else b(x)

        x = F.interpolate(x, size=size, mode="trilinear", align_corners=False)

        for b in self.out_blocks:
            x = b(x, emb.expand(x.shape[0], -1)) if isinstance(b, ResBlockEmb3D) else b(x)

        return self.conv_out(F.silu(self.norm_out(x)))

MODEL_CACHE = {}

def scan_models():
    files = [
        f for f in folder_paths.get_filename_list(_LATENT_UPSCALE_FOLDER)
        if os.path.splitext(f)[1].lower() in (".pth", ".safetensors")
    ]
    return files if files else ["minimax_h3_latent_upscaler_3d_fp16.safetensors"]

def load_resizer(model_name, device, dtype):
    cache_key = f"{model_name}::{device}::{dtype}"
    if cache_key in MODEL_CACHE:
        return MODEL_CACHE[cache_key].to(device)

    path = folder_paths.get_full_path_or_raise(_LATENT_UPSCALE_FOLDER, model_name)
    if path.endswith('.safetensors'):
        from safetensors.torch import load_file
        sd = load_file(path, device='cpu')
    else:
        sd = torch.load(path, map_location='cpu', weights_only=False)

    if 'model' in sd:
        sd = sd['model']
    sd = {k[len("upscaler."):] if k.startswith("upscaler.") else k: v for k, v in sd.items()}

    model = LatentResizer3D(in_channels=24, in_blocks=12, out_blocks=12, channels=512)
    model.load_state_dict(sd, strict=False)
    model = model.to(device=device, dtype=dtype).eval().requires_grad_(False)
    MODEL_CACHE[cache_key] = model
    return model

def adapt_minimax_conditioning_clean(conditioning, target_h, target_w):
    if conditioning is None:
        return None
    pad_h = target_h + (-target_h) % H3_PATCH_SIZE
    pad_w = target_w + (-target_w) % H3_PATCH_SIZE
    result = []
    for entry in conditioning:
        if not isinstance(entry, (list, tuple)) or len(entry) < 2 or not isinstance(entry[1], dict):
            result.append(entry)
            continue
        meta = entry[1].copy()
        kfs = meta.get("minimax_keyframes")
        if kfs:
            new_kfs = []
            for kf in kfs:
                nkf = dict(kf)
                lt = nkf.get("latent")
                if lt is not None and isinstance(lt, torch.Tensor):
                    orig_type = lt.dtype
                    if lt.ndim == 4:
                        nkf["latent"] = F.interpolate(lt.float(), size=(pad_h, pad_w), mode="bilinear", align_corners=False).to(orig_type)
                    elif lt.ndim == 5:
                        b, c, t, h, w = lt.shape
                        work = lt.permute(0, 2, 1, 3, 4).reshape(b * t, c, h, w).float()
                        out = F.interpolate(work, size=(pad_h, pad_w), mode="bilinear", align_corners=False)
                        nkf["latent"] = out.reshape(b, t, c, pad_h, pad_w).permute(0, 2, 1, 3, 4).to(orig_type)
                new_kfs.append(nkf)
            meta["minimax_keyframes"] = new_kfs
        result.append([entry[0], meta, *entry[2:]])
    return result

class McValley_MiniMaxLatentUpscalerStudio:
    """Reescalador 3D para MiniMax con selección libre de megapíxeles y ratio automático."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "latent": ("LATENT",),
                "conditioning": ("CONDITIONING",),
                "model_name": (scan_models(),),
                "target_megapixels": ("FLOAT", {"default": 0.80, "min": 0.20, "max": 4.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("LATENT", "CONDITIONING")
    RETURN_NAMES = ("LATENT", "CONDITIONING")
    FUNCTION = "execute_upscale"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def execute_upscale(self, latent, conditioning, model_name, target_megapixels=0.80):
        samples = latent["samples"]
        audio_tensor = None
        if HAS_NESTED and isinstance(samples, comfy.nested_tensor.NestedTensor):
            video_tensor = samples.tensors[0]
            audio_tensor = samples.tensors[1] if len(samples.tensors) > 1 else None
        elif isinstance(samples, (list, tuple)):
            video_tensor = samples[0]
            audio_tensor = samples[1] if len(samples) > 1 else None
        else:
            video_tensor = samples

        orig_dtype = video_tensor.dtype
        was_4d = (video_tensor.dim() == 4)

        dev = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        compute_dtype = torch.float16

        # VRAM Guard en ROCm
        if dev.type == "cuda" and HAS_MM:
            mm.unload_all_models()
            mm.soft_empty_cache()
            torch.cuda.empty_cache()

        work = video_tensor.unsqueeze(2) if was_4d else video_tensor
        B, C, T, H_in, W_in = work.shape

        # Cálculo dinámico proporcional divisible por 32 y par de MiniMax
        aspect = (W_in * VAE_DOWNSAMPLE) / (H_in * VAE_DOWNSAMPLE)
        mp_float = float(target_megapixels)
        target_total_pixels = mp_float * 1_000_000.0
        calc_w = (target_total_pixels * aspect) ** 0.5
        calc_h = calc_w / aspect

        w_px = max(32, int(round(calc_w / 32.0) * 32))
        h_px = max(32, int(round(calc_h / 32.0) * 32))

        w_out = max(2, int(w_px // VAE_DOWNSAMPLE))
        h_out = max(2, int(h_px // VAE_DOWNSAMPLE))

        w_out = w_out + (w_out % H3_PATCH_SIZE)
        h_out = h_out + (h_out % H3_PATCH_SIZE)
        effective_scale = ((w_out / W_in) + (h_out / H_in)) / 2.0

        # Inferencia Convolucional 3D
        net = load_resizer(model_name, dev, compute_dtype)
        norm_mean, norm_std = _make_norm_tensors(dev, compute_dtype)

        work = work.to(device=dev, dtype=compute_dtype, copy=True)
        with torch.inference_mode():
            work.sub_(norm_mean).div_(norm_std)
            upscaled = net(work, scale=effective_scale, target_size=(T, h_out, w_out))
            del work
            upscaled.mul_(norm_std).add_(norm_mean)

        if was_4d:
            upscaled = upscaled.squeeze(2)

        upscaled = upscaled.to(device="cpu", dtype=orig_dtype)

        if dev.type == "cuda":
            net.to("cpu")
            if HAS_MM:
                mm.soft_empty_cache()
            torch.cuda.empty_cache()
            gc.collect()

        if audio_tensor is not None:
            final_samples = comfy.nested_tensor.NestedTensor((upscaled, audio_tensor)) if HAS_NESTED else (upscaled, audio_tensor)
        else:
            final_samples = upscaled

        output_latent = {**latent, "samples": final_samples}
        adapted_cond = adapt_minimax_conditioning_clean(conditioning, h_out, w_out)

        mp_fmt = f"{mp_float:.2f}".rstrip('0').rstrip('.')
        info_text = f"{w_px} × {h_px} px | {mp_fmt} MP"

        return {
            "ui": {"text": [info_text]},
            "result": (output_latent, adapted_cond)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxLatentUpscalerStudio": McValley_MiniMaxLatentUpscalerStudio,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxLatentUpscalerStudio": "MiniMax Latent Upscaler Studio",
}
