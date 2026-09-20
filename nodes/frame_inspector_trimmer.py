"""
=============================================================================
McValley Frame Range Inspector & Trimmer (Persistent Preview Stream)
Suite: ComfyUI-Mc_Valley-Nodes
Persistencia de miniaturas, navegación de frames y recorte selectivo
=============================================================================
"""

import os
import random
import torch
import numpy as np
from PIL import Image
import folder_paths

class McValley_FrameInspectorTrimmer:
    def __init__(self):
        # Guardado en output/mcv_previews para que nunca se purgue de la memoria del flujo
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "start_frame": ("INT", {"default": 0, "min": 0, "max": 10000, "step": 1}),
                "end_frame": ("INT", {"default": -1, "min": -1000, "max": 10000, "step": 1}),
                "preview_target_frame": ("INT", {"default": 0, "min": 0, "max": 10000, "step": 1}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "trim_and_inspect"
    CATEGORY = "Mc_Valley Nodes/Video"

    def trim_and_inspect(self, images, start_frame=0, end_frame=-1, preview_target_frame=0):
        total_frames = images.shape[0]

        # 1. Normalizar rangos de recorte
        start_idx = max(0, min(start_frame, total_frames - 1))

        if end_frame < 0:
            end_idx = max(start_idx + 1, total_frames + end_frame + 1)
        elif end_frame == 0:
            end_idx = total_frames
        else:
            end_idx = max(start_idx + 1, min(end_frame, total_frames))

        trimmed_images = images[start_idx:end_idx]

        # 2. Generar sprite de miniaturas permanente
        preview_subfolder = "mcv_previews"
        full_folder = os.path.join(self.output_dir, preview_subfolder)
        os.makedirs(full_folder, exist_ok=True)

        thumb_w, thumb_h = 160, 160
        sprite_img = Image.new("RGB", (thumb_w * total_frames, thumb_h))

        for i in range(total_frames):
            arr = (images[i].cpu().numpy() * 255.0).clip(0, 255).astype(np.uint8)
            f_img = Image.fromarray(arr, mode="RGB")
            f_img.thumbnail((thumb_w, thumb_h), Image.Resampling.BILINEAR)

            x_offset = (i * thumb_w) + (thumb_w - f_img.width) // 2
            y_offset = (thumb_h - f_img.height) // 2
            sprite_img.paste(f_img, (x_offset, y_offset))

        sprite_filename = f"mcv_frames_sheet_{random.randint(100000, 999999)}.jpg"
        sprite_path = os.path.join(full_folder, sprite_filename)
        sprite_img.save(sprite_path, quality=80)

        meta = {
            "filename": sprite_filename,
            "subfolder": preview_subfolder,
            "type": self.type,
            "total_frames": total_frames,
            "thumb_w": thumb_w,
            "thumb_h": thumb_h,
            "start_idx": start_idx,
            "end_idx": end_idx
        }

        return {"ui": {"sprite_meta": [meta]}, "result": (trimmed_images,)}

NODE_CLASS_MAPPINGS = {
    "McValley_FrameInspectorTrimmer": McValley_FrameInspectorTrimmer,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_FrameInspectorTrimmer": "Frame Range Inspector & Trimmer",
}
