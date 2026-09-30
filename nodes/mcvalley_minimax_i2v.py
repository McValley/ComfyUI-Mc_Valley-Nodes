"""
=============================================================================
MiniMax H3 Image to Video Node (Fast Edition)
Zero-Stall Pipeline Engine with Multi-Pass Attention Guidance
=============================================================================
"""

import math
import torch
import torch.nn.functional as F
import gc
import comfy.model_management
import comfy.nested_tensor
import comfy.utils
import node_helpers

CANVAS_MULTIPLE = 32
FPS = 24
AUDIO_LATENT_FPS = 40

ASPECT_RATIOS = [
    "original",
    "1:1 (Square)",
    "2:3 (Portrait Photo)",
    "3:2 (Photo)",
    "3:4 (Portrait Standard)",
    "4:3 (Standard)",
    "9:16 (Portrait Widescreen)",
    "16:9 (Widescreen)",
    "21:9 (Ultrawide)",
]

def align_frame_count(n):
    while n % 17 != 5:
        n += 1
    return n

def video_latent_t(frame_count):
    return 2 if frame_count <= 5 else ((frame_count - 5) // 17) * 5 + 2

def temporal_shape(length):
    frame_count = align_frame_count(max(5, length))
    duration = frame_count / FPS
    return frame_count, video_latent_t(frame_count), round(duration * AUDIO_LATENT_FPS)

def _fast_gpu_resize(image, width, height):
    img = image[..., :3].movedim(-1, 1)
    if img.shape[2] != height or img.shape[3] != width:
        img = F.interpolate(img.float(), size=(height, width), mode="bilinear", align_corners=False)
    return img.movedim(1, -1)

def _empty_av_latent(width, height, length, batch_size=1):
    frame_count, latent_t, audio_t = temporal_shape(length)
    dev = comfy.model_management.intermediate_device()
    video = torch.zeros([batch_size, 24, latent_t, height // 16, width // 16], device=dev, dtype=torch.float16)
    audio = torch.zeros([batch_size, 32, 2, audio_t], device=dev, dtype=torch.float16)
    return {"samples": comfy.nested_tensor.NestedTensor((video, audio))}, frame_count

def parse_aspect_ratio(aspect_str, first_frame=None):
    if aspect_str.startswith("original") and first_frame is not None:
        return first_frame.shape[2] / first_frame.shape[1]

    # Extrae el prefijo numérico (ej: "16:9 (Widescreen)" -> "16:9")
    clean_ratio = aspect_str.strip().split(" ")[0]
    if ":" in clean_ratio:
        try:
            rw, rh = clean_ratio.split(":")
            return float(rw) / float(rh)
        except Exception:
            return 1.0
    return 1.0


class MiniMaxH3ImageToVideoFast:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
                "vae": ("VAE",),
                "prompt": ("STRING", {"multiline": True, "dynamicPrompts": True}),
                "target_megapixels": ("FLOAT", {"default": 0.60, "min": 0.20, "max": 1.50, "step": 0.05}),
                "aspect_ratio": (ASPECT_RATIOS, {"default": "original"}),
                "length": ("INT", {"default": 124, "min": 5, "max": 3600, "step": 17}),
                "guidance_mode": ([
                    "Hybrid (Early Guidance)",
                    "Fast (Latent Only)",
                    "Full Dense (Native)"
                ], {"default": "Hybrid (Early Guidance)"}),
                "early_guidance_steps": ("INT", {"default": 2, "min": 1, "max": 16, "step": 1}),
            },
            "optional": {
                "first_frame": ("IMAGE",),
                "last_frame": ("IMAGE",),
                "clean_memory_before_diffusion": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("CONDITIONING", "LATENT")
    RETURN_NAMES = ("positive", "LATENT")
    FUNCTION = "generate_conditioning"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def generate_conditioning(self, clip, vae, prompt, target_megapixels, aspect_ratio, length,
                              guidance_mode, early_guidance_steps, first_frame=None,
                              last_frame=None, clean_memory_before_diffusion=True):

        with torch.inference_mode():
            # 1. Cálculo exacto de relación de aspecto alineado a múltiplos de 32
            r = parse_aspect_ratio(aspect_ratio, first_frame)

            total_pixels = float(target_megapixels) * 1_000_000.0
            w_raw = math.sqrt(total_pixels * r)
            h_raw = w_raw / r
            width = max(32, int(round(w_raw / CANVAS_MULTIPLE) * CANVAS_MULTIPLE))
            height = max(32, int(round(h_raw / CANVAS_MULTIPLE) * CANVAS_MULTIPLE))

            # 2. Asignación sincronizada de audio y video latente
            latent, frame_count = _empty_av_latent(width, height, length)

            images_for_clip = []
            keyframes = []

            # 3. Preparación de keyframes y ruteo de vision encoder
            requires_vision_encoder = (guidance_mode != "Fast (Latent Only)")

            if first_frame is not None:
                img_first = _fast_gpu_resize(first_frame[:1], width, height)
                keyframes.append({"resolved_frame_index": 0, "image": img_first})
                if requires_vision_encoder:
                    images_for_clip.append(img_first)

            if last_frame is not None:
                img_last = _fast_gpu_resize(last_frame[:1], width, height)
                keyframes.append({"resolved_frame_index": frame_count - 1, "image": img_last})
                if requires_vision_encoder:
                    images_for_clip.append(img_last)

            # 4. Tokenización
            if images_for_clip:
                tokens = clip.tokenize(prompt, images=images_for_clip)
            else:
                tokens = clip.tokenize(prompt)

            cond = clip.encode_from_tokens_scheduled(tokens)

            # 5. Inyección de latentes de keyframes
            if keyframes:
                for kf in keyframes:
                    raw_img = kf.pop("image")
                    kf["latent"] = vae.encode(raw_img[:, :, :, :3])

                cond_values = {"minimax_keyframes": keyframes}

                if guidance_mode == "Hybrid (Early Guidance)":
                    cond_values["early_guidance_steps"] = int(early_guidance_steps)
                    cond_values["guidance_mode"] = "hybrid"
                elif guidance_mode == "Full Dense (Native)":
                    cond_values["guidance_mode"] = "full"
                else:
                    cond_values["guidance_mode"] = "fast"

                cond = node_helpers.conditioning_set_values(cond, cond_values)

            # 6. Desfragmentación de memoria
            if clean_memory_before_diffusion:
                images_for_clip = None
                keyframes = None
                comfy.model_management.soft_empty_cache()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                gc.collect()

            return (cond, latent)


NODE_CLASS_MAPPINGS = {
    "MiniMaxH3ImageToVideoFast": MiniMaxH3ImageToVideoFast,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MiniMaxH3ImageToVideoFast": "MiniMax H3 Image to Video (Fast)",
}
