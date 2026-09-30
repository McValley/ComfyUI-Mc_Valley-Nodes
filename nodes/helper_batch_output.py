import os
import gc
import torch
import psutil
from typing import Tuple

def tensor_nbytes(shape: Tuple[int, ...], dtype: torch.dtype) -> int:
    numel = 1
    for dim in shape:
        numel *= dim
    element_size = torch.tensor([], dtype=dtype).element_size()
    return numel * element_size

def can_allocate_in_ram(required_bytes: int) -> bool:
    available = psutil.virtual_memory().available
    headroom = 0.20  # 20% de seguridad
    return required_bytes <= int(available * (1.0 - headroom))

def unload_all_comfy_models() -> bool:
    try:
        import comfy.model_management as mm
        mm.unload_all_models()
        mm.soft_empty_cache()
        return True
    except Exception:
        return False

def force_gc_and_cleanup(directory: str = None) -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    if directory and os.path.exists(directory):
        for f in os.listdir(directory):
            if f.endswith(".mmap") or f.endswith(".tmp_tensor"):
                try:
                    os.remove(os.path.join(directory, f))
                except Exception:
                    pass

def allocate_cpu_output(shape: Tuple[int, ...], dtype: torch.dtype, temp_dir: str, force_mmap: bool = False):
    if not force_mmap:
        return torch.empty(shape, dtype=dtype, device="cpu"), None

    os.makedirs(temp_dir, exist_ok=True)
    mmap_path = os.path.join(temp_dir, f"mcv_amd_tensor_{os.getpid()}_{id(shape)}.mmap")

    nbytes = tensor_nbytes(shape, dtype)
    with open(mmap_path, "wb") as f:
        f.seek(nbytes - 1)
        f.write(b"\0")

    storage = torch.UntypedStorage.from_file(mmap_path, shared=True, size=nbytes)
    tensor = torch.empty(0, dtype=dtype).set_(storage, 0, shape)
    return tensor, mmap_path
