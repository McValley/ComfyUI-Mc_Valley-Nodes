import json

class McValley_StructuredPromptBuilder:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # JSON serializado desde la UI con los bloques {title, text}
                "prompt_blocks": ("STRING", {"default": "[]", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "build_prompt"
    CATEGORY = "Mc_Valley Nodes/Prompting"

    def build_prompt(self, prompt_blocks="[]"):
        try:
            blocks = json.loads(prompt_blocks)
        except Exception:
            blocks = []

        active_prompts = []
        for item in blocks:
            text = str(item.get("text", "")).strip()
            # Descarta bloques vacíos sin contenido
            if not text:
                continue

            cleaned = text.rstrip(",").strip()
            if cleaned:
                active_prompts.append(cleaned)

        # Concatenación ordenada de cada bloque con comas y saltos de línea
        final_prompt = ",\n".join(active_prompts)
        if final_prompt:
            final_prompt += ",\n"

        return (final_prompt,)

NODE_CLASS_MAPPINGS = {
    "McValley_StructuredPromptBuilder": McValley_StructuredPromptBuilder
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_StructuredPromptBuilder": "Structured Prompt Builder Studio"
}
