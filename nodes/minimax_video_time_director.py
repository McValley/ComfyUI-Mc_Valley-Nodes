"""
=============================================================================
MiniMax Video Time Director
Suite: ComfyUI-Mc_Valley-Nodes
=============================================================================
"""

def calculate_aligned_frames(seconds: float, fps: int = 24) -> int:
    base = max(5, round(seconds * fps))
    aligned = base + (5 - (base % 17)) % 17
    return int(aligned)


class McValley_MiniMaxTimeDirector:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "duration_seconds": ("FLOAT", {
                    "default": 5.0,
                    "min": 0.1,
                    "max": 180.0,
                    "step": 0.1,
                    "display": "number"
                }),
                "fps": ("INT", {
                    "default": 24,
                    "min": 1,
                    "max": 120,
                    "step": 1
                }),
            }
        }

    RETURN_TYPES = ("INT", "FLOAT")
    RETURN_NAMES = ("duration", "frame rate")
    FUNCTION = "calculate_time"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def calculate_time(self, duration_seconds: float, fps: int = 24):
        duration = calculate_aligned_frames(duration_seconds, fps)
        return (duration, float(fps))


NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxTimeDirector": McValley_MiniMaxTimeDirector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxTimeDirector": "MiniMax Video Time Director",
}
