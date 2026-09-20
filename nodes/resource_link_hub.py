import json

class McValley_ResourceLinkHub:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "resources_json": ("STRING", {"default": "[]", "multiline": False}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "noop"
    OUTPUT_NODE = True
    CATEGORY = "Mc_Valley Nodes/Utilities"

    def noop(self, resources_json="[]", unique_id="0"):
        return ()

NODE_CLASS_MAPPINGS = {
    "McValley_ResourceLinkHub": McValley_ResourceLinkHub
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_ResourceLinkHub": "Resource Link Hub"
}
