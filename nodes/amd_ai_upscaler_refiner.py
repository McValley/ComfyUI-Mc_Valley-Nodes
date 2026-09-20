import math
import os
import torch
import torch.nn.functional as F
from typing import Tuple

import folder_paths
from server import PromptServer

from .helper_batch_output import (
    allocate_cpu_output, can_allocate_in_ram, tensor_nbytes,
    force_gc_and_cleanup, unload_all_comfy_models,
)

QUALITY_LEVELS = ["Low", "Medium", "High", "Ultra"]
UPSCALE_MODES = ["Off", "RDNA-VSR (Neural)", "High Bitrate (Smooth)"]
RESIZE_TYPES = ["Scale", "Manual"]
DIVISIBLE_BY_VALUES = ["8", "16", "32"]
MAX_CHUNK_OUTPUT_PIXELS = 1024 * 1024 * 16
MAX_GPU_OUTPUT_BYTES = 14 * 1024 * 1024 * 1024

def _projected_output_bytes(batch_size: int, width: int, height: int, dtype: torch.dtype) -> int:
    return tensor_nbytes((batch_size, height, width, 3), dtype)

def _can_fit_in_vram(required_bytes: int, device: torch.device) -> bool:
    if not torch.cuda.is_available():
        return False
    free_bytes, _ = torch.cuda.mem_get_info(device)
    usable_free = int(free_bytes * 0.85)
    return required_bytes <= usable_free

def _allocate_output_tensor(shape, dtype, device, allow_mmap=False, auto_unload=True):
    required_bytes = _projected_output_bytes(shape[0], shape[2], shape[1], dtype)
    force_gc_and_cleanup()

    if device.type == "cuda" and required_bytes <= MAX_GPU_OUTPUT_BYTES and _can_fit_in_vram(required_bytes, device):
        return torch.empty(shape, device=device, dtype=dtype), None

    if auto_unload and unload_all_comfy_models():
        if _can_fit_in_vram(required_bytes, device):
            return torch.empty(shape, device=device, dtype=dtype), None

    if can_allocate_in_ram(required_bytes):
        return torch.empty(shape, dtype=dtype, device="cpu"), None

    temp_dir = folder_paths.get_temp_directory()
    return allocate_cpu_output(shape, dtype, temp_dir, force_mmap=allow_mmap)

def _apply_rdna_denoise(frame: torch.Tensor, strength: float) -> torch.Tensor:
    lum = (0.299 * frame[0] + 0.587 * frame[1] + 0.114 * frame[2]).unsqueeze(0)
    pad_frame = F.pad(frame, (1, 1, 1, 1), mode="reflect")
    blurred = F.avg_pool2d(pad_frame, kernel_size=3, stride=1)
    diff = (frame - blurred).abs()
    weight = torch.exp(-diff / max(0.01, strength * 0.15))
    return frame * (1.0 - weight * 0.5) + blurred * (weight * 0.5)

def _apply_rdna_deblur(frame: torch.Tensor, strength: float) -> torch.Tensor:
    pad_frame = F.pad(frame, (1, 1, 1, 1), mode="reflect")
    low_freq = F.avg_pool2d(pad_frame, kernel_size=3, stride=1)
    high_freq = frame - low_freq
    return torch.clamp(frame + high_freq * (strength * 0.75), 0.0, 1.0)

def _apply_rdna_vsr_upscale(frame: torch.Tensor, target_w: int, target_h: int, mode: str) -> torch.Tensor:
    in_4d = frame.unsqueeze(0)
    scaled = F.interpolate(in_4d, size=(target_h, target_w), mode="bicubic", align_corners=False).squeeze(0)

    if mode == "High Bitrate (Smooth)":
        return F.avg_pool2d(F.pad(scaled, (1, 1, 1, 1), mode="reflect"), kernel_size=3, stride=1)

    pad_scaled = F.pad(scaled, (1, 1, 1, 1), mode="reflect")
    local_mean = F.avg_pool2d(pad_scaled, kernel_size=3, stride=1)
    edge = scaled - local_mean
    return torch.clamp(scaled + edge * 0.35, 0.0, 1.0)

class McValley_AMDAIUpscalerRefiner:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "denoise": ("BOOLEAN", {"default": True}),
                "denoise_quality": (QUALITY_LEVELS, {"default": "Ultra"}),
                "deblur": ("BOOLEAN", {"default": True}),
                "deblur_quality": (QUALITY_LEVELS, {"default": "Ultra"}),
                "upscale": (UPSCALE_MODES, {"default": "RDNA-VSR (Neural)"}),
                "scale": ("FLOAT", {"default": 2.0, "min": 1.0, "max": 4.0, "step": 0.05}),
                "resize_type": (RESIZE_TYPES, {"default": "Scale"}),
                "width": ("INT", {"default": 1920, "min": 64, "max": 8192, "step": 8}),
                "height": ("INT", {"default": 1080, "min": 64, "max": 8192, "step": 8}),
                "divisible_by": (DIVISIBLE_BY_VALUES, {"default": "8"}),
                "device_id": ("INT", {"default": 0, "min": 0, "max": 4, "step": 1}),
            },
            "optional": {
                "use_mmap": ("BOOLEAN", {"default": False}),
                "auto_unload_models": ("BOOLEAN", {"default": True}),
            },
            "hidden": {"unique_id": "UNIQUE_ID"}
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "execute"
    CATEGORY = "Mc_Valley Nodes/Restoration"

    def execute(self, images, denoise, denoise_quality, deblur, deblur_quality,
                upscale, scale, resize_type, width, height, divisible_by, device_id,
                use_mmap=False, auto_unload_models=True, unique_id=None):

        if not torch.cuda.is_available():
            raise RuntimeError("Se requiere soporte ROCm/CUDA activo para la GPU AMD.")

        batch_size, src_h, src_w, channels = images.shape
        alignment = int(divisible_by)
        upscale_enabled = upscale != "Off"

        if not upscale_enabled:
            target_w, target_h = src_w, src_h
        elif resize_type == "Scale":
            target_w = int(math.ceil((src_w * scale) / alignment) * alignment)
            target_h = int(math.ceil((src_h * scale) / alignment) * alignment)
        else:
            target_w = int(math.ceil(width / alignment) * alignment)
            target_h = int(math.ceil(height / alignment) * alignment)

        cuda_device = torch.device(f"cuda:{device_id}")
        out_shape = (batch_size, target_h, target_w, 3)

        out_tensor, mmap_path = _allocate_output_tensor(
            out_shape, images.dtype, cuda_device,
            allow_mmap=use_mmap, auto_unload=auto_unload_models
        )

        quality_multiplier = {"Low": 0.4, "Medium": 0.7, "High": 1.0, "Ultra": 1.4}
        d_strength = quality_multiplier.get(denoise_quality, 1.0)
        b_strength = quality_multiplier.get(deblur_quality, 1.0)

        with torch.inference_mode():
            for i in range(batch_size):
                frame = images[i, :, :, :3].to(device=cuda_device, dtype=torch.float32).permute(2, 0, 1).contiguous()

                if denoise:
                    frame = _apply_rdna_denoise(frame, d_strength)

                if deblur:
                    frame = _apply_rdna_deblur(frame, b_strength)

                if upscale_enabled:
                    frame = _apply_rdna_vsr_upscale(frame, target_w, target_h, upscale)

                frame_out = frame.permute(1, 2, 0).clamp(0.0, 1.0)
                out_tensor[i].copy_(frame_out, non_blocking=True)

        # Enviar telemetría calculada en tiempo real hacia la UI
        if unique_id is not None:
            PromptServer.instance.send_sync("mcv_rdna_telemetry", {
                "node_id": str(unique_id),
                "src_w": src_w,
                "src_h": src_h,
                "out_w": target_w,
                "out_h": target_h,
                "frames": batch_size,
                "divisible": alignment,
                "denoise": f"{denoise_quality}" if denoise else "OFF",
                "deblur": f"{deblur_quality}" if deblur else "OFF",
                "vsr_mode": upscale,
                "scale_factor": f"{round(target_w / max(1, src_w), 2)}x"
            })

        force_gc_and_cleanup()
        return (out_tensor,)

NODE_CLASS_MAPPINGS = {
    "McValley_AMDAIUpscalerRefiner": McValley_AMDAIUpscalerRefiner,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_AMDAIUpscalerRefiner": "RDNA Upscale Refiner",
}
