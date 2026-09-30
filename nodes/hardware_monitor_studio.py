import psutil
import torch
import glob
from aiohttp import web
from server import PromptServer

def get_gpu_load():
    # Detección para AMD ROCm / Linux (Nobara / Kernel DRM)
    try:
        paths = glob.glob("/sys/class/drm/card*/device/gpu_busy_percent")
        if paths:
            with open(paths[0], "r") as f:
                return int(f.read().strip())
    except Exception:
        pass

    # Fallback si existe utilidad de Nvidia/PyTorch
    try:
        if torch.cuda.is_available():
            return 0
    except Exception:
        pass
    return 0

# Endpoint HTTP consultado por el widget JS
@PromptServer.instance.routes.get("/mcv/hw_telemetry")
async def get_hw_telemetry(request):
    ram = psutil.virtual_memory()
    ram_used_gb = round(ram.used / (1024**3), 2)
    ram_total_gb = round(ram.total / (1024**3), 2)
    ram_pct = ram.percent

    cpu_pct = psutil.cpu_percent(interval=None)

    vram_used_gb = 0.0
    vram_total_gb = 0.0
    vram_pct = 0.0
    gpu_name = "No GPU Detected"

    if torch.cuda.is_available():
        try:
            gpu_name = torch.cuda.get_device_name(0)
            free_b, total_b = torch.cuda.mem_get_info()
            used_b = total_b - free_b
            vram_used_gb = round(used_b / (1024**3), 2)
            vram_total_gb = round(total_b / (1024**3), 2)
            vram_pct = round((used_b / max(1, total_b)) * 100, 1)
        except Exception:
            pass

    gpu_load = get_gpu_load()

    return web.json_response({
        "gpu_name": gpu_name,
        "vram_used": vram_used_gb,
        "vram_total": vram_total_gb,
        "vram_pct": vram_pct,
        "gpu_load": gpu_load,
        "ram_used": ram_used_gb,
        "ram_total": ram_total_gb,
        "ram_pct": ram_pct,
        "cpu_pct": cpu_pct
    })

class McValley_HardwareMonitorStudio:
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
    "McValley_HardwareMonitorStudio": McValley_HardwareMonitorStudio
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_HardwareMonitorStudio": "Hardware Monitor Studio"
}
