class McValley_BenchmarkTimerStudio:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "execute"
    OUTPUT_NODE = True
    CATEGORY = "Mc_Valley Nodes/Utilities"

    def execute(self, unique_id=None):
        return ()

NODE_CLASS_MAPPINGS = {
    "McValley_BenchmarkTimerStudio": McValley_BenchmarkTimerStudio
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_BenchmarkTimerStudio": "Benchmark Timer Studio"
}
