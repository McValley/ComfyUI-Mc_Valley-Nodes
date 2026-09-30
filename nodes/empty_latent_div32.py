import torch

class McValley_EmptyLatentDiv32:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "aspect_ratio": ([
                    "1:1 (Square)",
                    "3:4 (Portrait)",
                    "9:16 (Portrait Tall)",
                    "4:3 (Standard)",
                    "16:9 (Cinematic)",
                    "21:9 (Ultrawide)"
                ], {"default": "16:9 (Cinematic)"}),
                "megapixels": ("FLOAT", {"default": 1.0, "min": 0.1, "max": 16.0, "step": 0.1}),
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 64}),
            }
        }

    RETURN_TYPES = ("LATENT", "INT", "INT")
    RETURN_NAMES = ("LATENT", "WIDTH", "HEIGHT")
    FUNCTION = "generate_latent"
    CATEGORY = "Mc_Valley Nodes/Latents"

    def generate_latent(self, aspect_ratio, megapixels, batch_size):
        raw_ratio = aspect_ratio.split(" ")[0]
        ratio_w, ratio_h = map(float, raw_ratio.split(":"))

        target_pixels = megapixels * 1000000.0

        width = (target_pixels * (ratio_w / ratio_h)) ** 0.5
        height = width * (ratio_h / ratio_w)

        # Regla fija obligatoria: Divisible por 32 exactos
        width = int(round(width / 32.0) * 32)
        height = int(round(height / 32.0) * 32)

        latent = torch.zeros([batch_size, 4, height // 8, width // 8])

        info_label = f"{width} × {height} px | {megapixels:.1f} MP (Div 32)"

        return {
            "ui": {
                "text": [info_label]
            },
            "result": ({"samples": latent}, width, height)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_EmptyLatentDiv32": McValley_EmptyLatentDiv32
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_EmptyLatentDiv32": "Empty Latent Div32"
}
