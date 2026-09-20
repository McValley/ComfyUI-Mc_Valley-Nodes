class McValley_VideoPromptDirector:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # 1. I2V (Image to Video) - Activo por defecto
                "i2v_active": ("BOOLEAN", {"default": True}),
                "i2v_prompt": ("STRING", {"default": "", "multiline": True}),

                # 2. T2V (Text to Video)
                "t2v_active": ("BOOLEAN", {"default": False}),
                "t2v_prompt": ("STRING", {"default": "", "multiline": True}),

                # 3. FL2VA (First & Last Frame to Video)
                "fl2va_active": ("BOOLEAN", {"default": False}),
                "fl2va_prompt": ("STRING", {"default": "", "multiline": True}),
            },
            "optional": {
                "prefix_override": ("STRING", {"forceInput": True}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("selected_prompt",)
    FUNCTION = "direct_prompt"
    CATEGORY = "Mc_Valley Nodes/MiniMax"
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, i2v_active=True, i2v_prompt="", t2v_active=False, t2v_prompt="", fl2va_active=False, fl2va_prompt="", prefix_override="", **kwargs):
        # Retrocompatibilidad si vienen nombres de clave previos
        if "fla_active" in kwargs and not fl2va_active:
            fl2va_active = kwargs["fla_active"]
        if "fla_prompt" in kwargs and not fl2va_prompt:
            fl2va_prompt = kwargs["fla_prompt"]

        # Genera una firma que solo cambia si se altera el texto o los conmutadores
        active_signature = (
            f"i2v:{i2v_active}:{i2v_prompt.strip()}|"
            f"t2v:{t2v_active}:{t2v_prompt.strip()}|"
            f"fl2va:{fl2va_active}:{fl2va_prompt.strip()}|"
            f"prefix:{prefix_override.strip() if prefix_override else ''}"
        )
        return hash(active_signature)

    def direct_prompt(self, i2v_active=True, i2v_prompt="", t2v_active=False, t2v_prompt="", fl2va_active=False, fl2va_prompt="", prefix_override="", unique_id="0", **kwargs):
        if "fla_active" in kwargs and not fl2va_active:
            fl2va_active = kwargs["fla_active"]
        if "fla_prompt" in kwargs and not fl2va_prompt:
            fl2va_prompt = kwargs["fla_prompt"]

        active_parts = []
        mode_used = []

        # 1. I2V
        if i2v_active and i2v_prompt.strip():
            active_parts.append(i2v_prompt.strip())
            mode_used.append("I2V")

        # 2. T2V
        if t2v_active and t2v_prompt.strip():
            active_parts.append(t2v_prompt.strip())
            mode_used.append("T2V")

        # 3. FL2VA
        if fl2va_active and fl2va_prompt.strip():
            active_parts.append(fl2va_prompt.strip())
            mode_used.append("FL2VA")

        combined_text = ", ".join(active_parts)

        # Prefijo externo por cable
        has_prefix = prefix_override is not None and prefix_override.strip() != ""
        if has_prefix:
            if combined_text:
                combined_text = f"{prefix_override.strip()}, {combined_text}"
            else:
                combined_text = prefix_override.strip()
            mode_used.append("PREFIX")

        if not combined_text:
            fallback_msg = "[WARNING: Video Prompt Director has no prompt content or prefix input]"
            print(f"[McValley VideoPromptDirector] {fallback_msg}")
            return {
                "ui": {"payload": [{"output": fallback_msg, "modes": "NONE"}]},
                "result": ("",)
            }

        return {
            "ui": {
                "payload": [{
                    "output": combined_text,
                    "modes": " + ".join(mode_used)
                }]
            },
            "result": (combined_text,)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_VideoPromptDirector": McValley_VideoPromptDirector
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_VideoPromptDirector": "Video Prompt Director Studio"
}
