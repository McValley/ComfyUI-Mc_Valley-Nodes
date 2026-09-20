import folder_paths
import comfy.sd
import comfy.utils

class McValley_MiniMaxModelLoader:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        clip_types = [
            "minimax",
            "qwen_image",
            "cosmos",
            "sdxl",
            "sd3",
            "flux",
            "flux_schnell",
            "krea2",
            "lumina2",
            "hunyuan_video",
            "mochi",
            "ltxv",
            "pixart",
            "anima",
            "stable_diffusion",
            "stable_cascade"
        ]

        return {
            "required": {
                # 1. Diffusion Model (UNet / DiT de MiniMax)
                "unet_name": (folder_paths.get_filename_list("diffusion_models"),),

                # 2. CLIP / Text Encoder (Qwen-VL)
                "clip_name": (folder_paths.get_filename_list("clip"),),
                "clip_type": (clip_types, {"default": "minimax"}),
                "clip_device": (["default", "cpu"], {"default": "cpu"}),

                # 3. VAE de Video
                "video_vae_name": (folder_paths.get_filename_list("vae"),),

                # 4. VAE de Audio
                "audio_vae_name": (folder_paths.get_filename_list("vae"),),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE", "VAE")
    RETURN_NAMES = ("MODEL", "CLIP", "VAE_VIDEO", "VAE_AUDIO")
    FUNCTION = "load_all"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def load_all(self, unet_name, clip_name, clip_type, clip_device, video_vae_name, audio_vae_name):
        # 1. Cargar Diffusion Model
        unet_path = folder_paths.get_full_path("diffusion_models", unet_name)
        model = comfy.sd.load_diffusion_model(unet_path)

        # 2. Mapear y cargar CLIP / Text Encoder
        clip_path = folder_paths.get_full_path("clip", clip_name)
        clip_type_key = clip_type.upper()

        if clip_type == "minimax":
            if hasattr(comfy.sd.CLIPType, "MINIMAX"):
                clip_type_enum = comfy.sd.CLIPType.MINIMAX
            elif hasattr(comfy.sd.CLIPType, "QWEN2_VL"):
                clip_type_enum = comfy.sd.CLIPType.QWEN2_VL
            elif hasattr(comfy.sd.CLIPType, "QWEN"):
                clip_type_enum = comfy.sd.CLIPType.QWEN
            else:
                clip_type_enum = comfy.sd.CLIPType.STABLE_DIFFUSION
        elif clip_type in ["cosmos", "qwen_image"]:
            if hasattr(comfy.sd.CLIPType, "QWEN2_VL"):
                clip_type_enum = comfy.sd.CLIPType.QWEN2_VL
            elif hasattr(comfy.sd.CLIPType, "QWEN"):
                clip_type_enum = comfy.sd.CLIPType.QWEN
            else:
                clip_type_enum = comfy.sd.CLIPType.STABLE_DIFFUSION
        elif hasattr(comfy.sd.CLIPType, clip_type_key):
            clip_type_enum = getattr(comfy.sd.CLIPType, clip_type_key)
        elif clip_type in ["sdxl", "krea2"]:
            clip_type_enum = comfy.sd.CLIPType.STABLE_DIFFUSION
        elif clip_type in ["lumina2", "flux_schnell"]:
            clip_type_enum = getattr(comfy.sd.CLIPType, "FLUX", comfy.sd.CLIPType.STABLE_DIFFUSION)
        else:
            clip_type_enum = comfy.sd.CLIPType.STABLE_DIFFUSION

        clip = comfy.sd.load_clip(
            ckpt_paths=[clip_path],
            embedding_directory=folder_paths.get_folder_paths("embeddings"),
            clip_type=clip_type_enum
        )

        if clip_device == "cpu" and hasattr(clip, "cond_stage_model"):
            clip.cond_stage_model.to("cpu")

        # 3. Cargar VAE de Video
        video_vae_path = folder_paths.get_full_path("vae", video_vae_name)
        sd_video_vae = comfy.utils.load_torch_file(video_vae_path)
        vae_video = comfy.sd.VAE(sd=sd_video_vae)

        # 4. Cargar VAE de Audio
        audio_vae_path = folder_paths.get_full_path("vae", audio_vae_name)
        sd_audio_vae = comfy.utils.load_torch_file(audio_vae_path)
        vae_audio = comfy.sd.VAE(sd=sd_audio_vae)

        # Texto para el visor neón
        unet_short = unet_name.split("/")[-1].split("\\")[-1]
        if len(unet_short) > 20:
            unet_short = unet_short[:17] + "..."

        return {
            "ui": {
                "text": [f"MINIMAX: {unet_short} | 2x VAE ACTIVE"]
            },
            "result": (model, clip, vae_video, vae_audio)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxModelLoader": McValley_MiniMaxModelLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxModelLoader": "MiniMax Model Loader (All-In-One)"
}
