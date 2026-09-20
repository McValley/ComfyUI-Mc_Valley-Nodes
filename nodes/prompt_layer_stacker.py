import json

class McValley_PromptLayerStacker:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "layer_data": ("STRING", {"default": "[]", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("PROMPT",)
    FUNCTION = "build_prompt"
    CATEGORY = "Mc_Valley Nodes/Prompting"

    def build_prompt(self, layer_data="[]"):
        try:
            layers = json.loads(layer_data)
        except Exception:
            layers = []

        active_chunks = []
        for item in layers:
            chunk = str(item.get("text", "")).strip()
            # Descarta automáticamente capas vacías sin requerir switch UI
            if not chunk:
                continue

            chunk = chunk.rstrip(",").strip()
            if chunk:
                active_chunks.append(chunk)

        # Concatenación vertical con coma y salto de línea
        final_prompt = ",\n".join(active_chunks)
        if final_prompt:
            final_prompt += ",\n"

        return (final_prompt,)

NODE_CLASS_MAPPINGS = {
    "McValley_PromptLayerStacker": McValley_PromptLayerStacker
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_PromptLayerStacker": "Prompt Layer Stacker"
}
