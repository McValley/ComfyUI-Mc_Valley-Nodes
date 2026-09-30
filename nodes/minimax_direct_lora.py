import folder_paths
import comfy.sd
import comfy.utils

class McValleyMiniMaxDirectLora:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "model": ("MODEL",),
                "mode": (["Model Only (Fast / DiT)", "Model + CLIP (Dense / Hybrid)"], {"default": "Model Only (Fast / DiT)"}),
                "lora_name_1": (folder_paths.get_filename_list("loras"), ),
                "strength_model_1": ("FLOAT", {"default": 0.60, "min": -10.0, "max": 10.0, "step": 0.05}),
            },
            "optional": {
                "clip": ("CLIP",),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP")
    RETURN_NAMES = ("MODEL", "CLIP")
    FUNCTION = "apply_direct_loras"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def apply_direct_loras(self, model, mode, clip=None, **kwargs):
        curr_model = model
        curr_clip = clip

        # Detectar todos los índices de LoRAs presentes
        indices = set()
        for k in kwargs.keys():
            if k.startswith("lora_name_"):
                try:
                    idx = int(k.split("_")[-1])
                    indices.add(idx)
                except ValueError:
                    pass

        sorted_indices = sorted(list(indices))

        for idx in sorted_indices:
            lora_name = kwargs.get(f"lora_name_{idx}")
            strength_model = kwargs.get(f"strength_model_{idx}", 0.0)

            if not lora_name or lora_name == "None" or strength_model == 0.0:
                continue

            lora_path = folder_paths.get_full_path("loras", lora_name)
            if not lora_path:
                continue

            lora = comfy.utils.load_torch_file(lora_path, safe_load=True)

            if mode == "Model Only (Fast / DiT)":
                curr_model, _ = comfy.sd.load_lora_for_models(curr_model, None, lora, strength_model, 0.0)
            else:
                if curr_clip is not None:
                    curr_model, curr_clip = comfy.sd.load_lora_for_models(curr_model, curr_clip, lora, strength_model, strength_model)
                else:
                    curr_model, _ = comfy.sd.load_lora_for_models(curr_model, None, lora, strength_model, 0.0)

        return (curr_model, curr_clip)

NODE_CLASS_MAPPINGS = {
    "McValleyMiniMaxDirectLora": McValleyMiniMaxDirectLora
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValleyMiniMaxDirectLora": "McValley MiniMax Direct LoRA"
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
