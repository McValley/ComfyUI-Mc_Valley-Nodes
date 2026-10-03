class McValley_GroupBypasserStudio:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "Mc_Valley Nodes/Utilities"

    def execute(self, unique_id=None):
        # Es un nodo puramente de control visual en el frontend
        return ()

NODE_CLASS_MAPPINGS = {
    "McValley_GroupBypasserStudio": McValley_GroupBypasserStudio
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_GroupBypasserStudio": "Group Bypasser Studio"
}
