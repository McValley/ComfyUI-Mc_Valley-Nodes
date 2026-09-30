"""
=============================================================================
MiniMax Turbo Engine Studio - ComfyUI-Mc_Valley-Nodes
Consolidated Turbo-LoRA Engine and Fast Multi-Step Diffusion Driver for MiniMax H3.
Tailored for AMD ROCm / Linux Nobara environments.
=============================================================================
"""

import math
import torch
import torch.nn.functional as F
from tqdm.auto import trange

import comfy.samplers
import comfy.model_sampling
import comfy.lora
import comfy.weight_adapter
import comfy.utils
import folder_paths

SHIFT_V, SHIFT_A = 12.0, 3.0


def _time_shift_sigma(sigma, fr, to):
    base = sigma / (fr + sigma * (1.0 - fr))
    return to * base / (1.0 + (to - 1.0) * base)


def _time_shift_slope(sigma, fr, to):
    base = sigma / (fr + sigma * (1.0 - fr))
    return (to * (1.0 + (fr - 1.0) * base) ** 2) / (fr * (1.0 + (to - 1.0) * base) ** 2)


def _audio_sigma(sv):
    return _time_shift_sigma(sv, SHIFT_V, SHIFT_A)


def _audio_slope(sv):
    return _time_shift_slope(sv, SHIFT_V, SHIFT_A)


def _latent_shapes(model):
    guider = getattr(model, "inner_model", model)
    conds = getattr(guider, "conds", None)
    if conds:
        for cond_list in conds.values():
            for c in (cond_list or []):
                mc = c.get("model_conds", {}) if isinstance(c, dict) else {}
                if "latent_shapes" in mc:
                    return mc["latent_shapes"].cond
    return None


def _model_sampling(model):
    for chain in (("inner_model", "inner_model", "model_sampling"),
                  ("inner_model", "model_sampling"),
                  ("model_sampling",)):
        o = model
        try:
            for a in chain:
                o = getattr(o, a)
        except AttributeError:
            continue
        if o is not None:
            return o
    return None


def _native_av_schedule(model):
    ms = _model_sampling(model)
    if ms is None:
        return False
    if getattr(ms, "audio_shift", None) is not None:
        return True
    av = getattr(comfy.model_sampling, "ModelSamplingAV", None)
    return av is not None and isinstance(ms, av)


@torch.no_grad()
def _valley_turbo_sampler(model, x, sigmas, extra_args=None, callback=None, disable=None, **kwargs):
    extra_args = {} if extra_args is None else extra_args
    s_in = x.new_ones([x.shape[0]])

    # ComfyUI moderno con ModelSamplingAV nativo
    if _native_av_schedule(model):
        for i in trange(len(sigmas) - 1, disable=disable):
            sv, sv_n = float(sigmas[i]), float(sigmas[i + 1])
            denoised = model(x, sigmas[i] * s_in, **extra_args)
            d = (x - denoised) / sigmas[i]
            x = x + (sv_n - sv) * d
            if callback is not None:
                callback({"i": i, "denoised": denoised, "x": x, "sigma": sigmas[i], "sigma_hat": sigmas[i]})
        return x

    # Ruta con sincronización dual de reloj audio/video
    shapes = _latent_shapes(model)
    if not shapes or len(shapes) < 2:
        for i in trange(len(sigmas) - 1, disable=disable):
            sv, sv_n = float(sigmas[i]), float(sigmas[i + 1])
            denoised = model(x, sigmas[i] * s_in, **extra_args)
            d = (x - denoised) / sigmas[i]
            x = x + (sv_n - sv) * d
            if callback is not None:
                callback({"i": i, "denoised": denoised, "x": x, "sigma": sigmas[i], "sigma_hat": sigmas[i]})
        return x

    v_numel = math.prod(shapes[0][1:])
    for i in trange(len(sigmas) - 1, disable=disable):
        sv, sv_n = float(sigmas[i]), float(sigmas[i + 1])
        denoised = model(x, sigmas[i] * s_in, **extra_args)
        out = (x - denoised) / sigmas[i]
        xv, ov = x[..., :v_numel], out[..., :v_numel]
        xa, oa = x[..., v_numel:], out[..., v_numel:]
        xv = xv + (sv_n - sv) * ov
        sl = _audio_slope(max(sv, 1e-6))
        xa = xa + (_audio_sigma(sv_n) - _audio_sigma(sv)) * (oa / sl)
        x = torch.cat([xv, xa], dim=-1)
        if callback is not None:
            callback({"i": i, "denoised": denoised, "x": x, "sigma": sigmas[i], "sigma_hat": sigmas[i]})
    return x


class _FrugalLoRA(comfy.weight_adapter.LoRAAdapter):
    def bypass_forward(self, org_forward, x, *args, **kwargs):
        base_out = org_forward(x, *args, **kwargs)
        if getattr(self, "is_conv", False):
            return super().bypass_forward(org_forward, x, *args, **kwargs)
        up, down, alpha = self.weights[0], self.weights[1], self.weights[2]
        rank = down.shape[0]
        scale = (alpha / rank if alpha is not None else 1.0) * getattr(self, "multiplier", 1.0)
        down = down.to(dtype=x.dtype)
        up = up.to(dtype=x.dtype)
        return base_out.add_(F.linear(F.linear(x, down), up), alpha=scale)


class McValley_MiniMaxTurboEngine:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "turbo_lora": (folder_paths.get_filename_list("loras"),),
                "strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 3.0, "step": 0.05}),
                "profile": (["4 Steps (Draft / Fast)", "6 Steps (Sweet Spot)", "8 Steps (High Detail)"], {"default": "6 Steps (Sweet Spot)"}),
                "memory_mode": (["Bypass Frugal (Sharp - 16GB+)", "Weight Merge (Lowest VRAM)"], {"default": "Bypass Frugal (Sharp - 16GB+)"}),
            }
        }

    RETURN_TYPES = ("MODEL", "SAMPLER", "INT")
    RETURN_NAMES = ("MODEL", "TURBO_SAMPLER", "STEP_COUNT")
    FUNCTION = "apply_engine"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def apply_engine(self, model, turbo_lora, strength, profile, memory_mode):
        step_map = {
            "4 Steps (Draft / Fast)": 4,
            "6 Steps (Sweet Spot)": 6,
            "8 Steps (High Detail)": 8,
        }
        steps = step_map.get(profile, 6)

        if strength <= 0.001 or not turbo_lora:
            return (model, comfy.samplers.KSAMPLER(_valley_turbo_sampler), steps)

        path = folder_paths.get_full_path("loras", turbo_lora)
        lora = comfy.utils.load_torch_file(path, safe_load=True)
        modules = sorted({k.rsplit(".lora_", 1)[0] for k in lora})
        new_model = model.clone()

        use_merge = (memory_mode == "Weight Merge (Lowest VRAM)")

        if use_merge:
            key_map = {m: f"diffusion_model.{m}.weight" for m in modules}
            loaded = comfy.lora.load_lora(lora, key_map, log_missing=False)
            new_model.add_patches(loaded, strength)
        else:
            key_map = {m: f"diffusion_model.{m}.weight" for m in modules}
            loaded = comfy.lora.load_lora(lora, key_map, log_missing=False)
            manager = comfy.weight_adapter.BypassInjectionManager()
            sd_keys = set(new_model.model.state_dict().keys())

            for key, adapter in loaded.items():
                if key not in sd_keys:
                    continue
                if isinstance(adapter, comfy.weight_adapter.LoRAAdapter):
                    adapter = _FrugalLoRA(adapter.loaded_keys, adapter.weights)
                elif not isinstance(adapter, comfy.weight_adapter.WeightAdapterBase):
                    continue
                manager.add_adapter(key, adapter, strength=strength)

            injections = manager.create_injections(new_model.model)
            if manager.get_hook_count() > 0:
                new_model.set_injections("bypass_lora", injections)

        turbo_sampler = comfy.samplers.KSAMPLER(_valley_turbo_sampler)
        return (new_model, turbo_sampler, steps)


NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxTurboEngine": McValley_MiniMaxTurboEngine
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxTurboEngine": "MiniMax Turbo Engine Studio"
}
