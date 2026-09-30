import folder_paths
import comfy.sd
import comfy.utils

class McValley_AnimaLoader:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        diff_list = folder_paths.get_filename_list("diffusion_models")
        if not diff_list:
            diff_list = folder_paths.get_filename_list("unet")

        clip_list = folder_paths.get_filename_list("clip")
        vae_list = folder_paths.get_filename_list("vae")

        clip_types = [
            "sdxl (Anima / SDXL)",
            "sd1 (SD 1.5)",
            "sd3 (SD 3 / 3.5)",
            "flux",
            "lumina2",
            "mochi",
            "ltxv",
            "pixart"
        ]

        return {
            "required": {
                "diffusion_model": (diff_list,),
                "clip_name": (clip_list,),
                "clip_type": (clip_types, {"default": "sdxl (Anima / SDXL)"}),
                "vae_name": (vae_list,),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    RETURN_NAMES = ("MODEL", "CLIP", "VAE")
    FUNCTION = "load_anima_stack"
    CATEGORY = "Mc_Valley Nodes/Loaders"

    def _get_clip_type(self, clip_type_str):
        clean = clip_type_str.split(" ")[0].lower()
        if clean in ["sdxl", "sd1"]:
            return comfy.sd.CLIPType.STABLE_DIFFUSION
        if clean == "sd3" and hasattr(comfy.sd.CLIPType, "SD3"):
            return comfy.sd.CLIPType.SD3
        if clean.startswith("flux") and hasattr(comfy.sd.CLIPType, "FLUX"):
            return comfy.sd.CLIPType.FLUX
        if clean == "lumina2":
            return getattr(comfy.sd.CLIPType, "LUMINA2", getattr(comfy.sd.CLIPType, "FLUX", comfy.sd.CLIPType.STABLE_DIFFUSION))
        if clean == "mochi" and hasattr(comfy.sd.CLIPType, "MOCHI"):
            return comfy.sd.CLIPType.MOCHI
        if clean == "ltxv" and hasattr(comfy.sd.CLIPType, "LTXV"):
            return comfy.sd.CLIPType.LTXV
        if clean == "pixart" and hasattr(comfy.sd.CLIPType, "PIXART"):
            return comfy.sd.CLIPType.PIXART
        return comfy.sd.CLIPType.STABLE_DIFFUSION

    def load_anima_stack(self, diffusion_model, clip_name, clip_type, vae_name):
        # 1. Cargar Diffusion Model / UNet
        model_path = folder_paths.get_full_path("diffusion_models", diffusion_model)
        if not model_path:
            model_path = folder_paths.get_full_path("unet", diffusion_model)
        if not model_path:
            raise FileNotFoundError(f"Modelo '{diffusion_model}' no encontrado en diffusion_models o unet.")

        model = comfy.sd.load_diffusion_model(model_path)

        # 2. Cargar CLIP
        clip_path = folder_paths.get_full_path("clip", clip_name)
        if not clip_path:
            raise FileNotFoundError(f"CLIP '{clip_name}' no encontrado en la carpeta clip.")

        clip = comfy.sd.load_clip(
            ckpt_paths=[clip_path],
            embedding_directory=folder_paths.get_folder_paths("embeddings"),
            clip_type=self._get_clip_type(clip_type)
        )

        # 3. Cargar VAE
        vae_path = folder_paths.get_full_path("vae", vae_name)
        if not vae_path:
            raise FileNotFoundError(f"VAE '{vae_name}' no encontrado en la carpeta vae.")

        sd_vae = comfy.utils.load_torch_file(vae_path)
        vae = comfy.sd.VAE(sd=sd_vae)

        # Formato de visualización para la barra de estado
        m_name = diffusion_model.split("/")[-1].split("\\")[-1]
        c_name = clip_name.split("/")[-1].split("\\")[-1]
        status = f"{m_name[:16]}.. | {c_name[:14]}.."

        return {
            "ui": {
                "info": [status]
            },
            "result": (model, clip, vae)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_AnimaLoader": McValley_AnimaLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_AnimaLoader": "Anima Loader"
}
