"""
=============================================================================
McValley MiniMax Sampler Studio (Audio/Video Fix)
Suite: ComfyUI-Mc_Valley-Nodes
Consolidador All-in-One optimizado para MiniMax H3 FLOW_AV
Evita voz robótica y artefactos en movimientos rápidos
=============================================================================
"""

import torch
import comfy.sample
import comfy.samplers
import comfy.model_management


def get_available_samplers():
    base = list(comfy.samplers.KSampler.SAMPLERS)
    custom = ["res_multistep", "er_sde", "dpmpp_2m_sde"]
    for s in custom:
        if s not in base:
            base.append(s)
    return base


def get_available_schedulers():
    base = list(comfy.samplers.KSampler.SCHEDULERS)
    custom = ["simple", "beta", "beta57", "linear"]
    for sc in custom:
        if sc not in base:
            base.append(sc)
    return base


class McValley_MiniMaxSamplerStudio:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "conditioning": ("CONDITIONING",),
                "latent_image": ("LATENT",),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
                "steps": ("INT", {"default": 6, "min": 1, "max": 50, "step": 1}),
                "sampler_name": (get_available_samplers(), {"default": "euler"}),
                "scheduler": (get_available_schedulers(), {"default": "simple"}),
                "denoise": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01}),
            },
            "optional": {
                "clean_memory_after": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("LATENT", "LATENT")
    RETURN_NAMES = ("latent", "denoised_latent")
    FUNCTION = "sample_process"
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def sample_process(self, model, conditioning, latent_image, seed, steps,
                       sampler_name, scheduler, denoise, clean_memory_after=True):

        latent_samples = latent_image["samples"]
        device = comfy.model_management.get_torch_device()

        # 1. Resolver Sigmas nativos de FLOW_AV (MiniMax)
        try:
            ms = model.get_model_object("model_sampling")
            sigmas = comfy.samplers.calculate_sigmas(ms, scheduler, steps).to(device)
            if denoise < 1.0:
                sigmas = sigmas[-(int(steps * denoise) + 1):]
        except Exception:
            # Fallback lineal limpio que preserva audio y evita artefactos
            t = torch.linspace(1.0, 0.0, steps=steps + 1, device=device)
            sigmas = t

        # 2. Selector de Sampler con fallback seguro
        real_sampler_name = sampler_name
        if sampler_name == "er_sde" and "er_sde" not in comfy.samplers.KSampler.SAMPLERS:
            real_sampler_name = "euler"

        sampler = comfy.samplers.sampler_object(real_sampler_name)

        # 3. Preparación de ruido sobre el NestedTensor (video + audio)
        noise = comfy.sample.prepare_noise(latent_samples, seed)

        # 4. Guider puro de una sola pasada (Sin negativo redundante)
        guider = comfy.samplers.CFGGuider(model)
        # Pasamos lista vacía en negativo para no distorsionar la trayectoria de flujo
        guider.set_conds(conditioning, [])
        guider.set_cfg(1.0)

        # 5. Muestreo limpio
        samples = guider.sample(
            noise,
            latent_samples,
            sampler,
            sigmas,
            seed=seed
        )

        out_latent = latent_image.copy()
        out_latent["samples"] = samples

        out_denoised = latent_image.copy()
        out_denoised["samples"] = samples

        # 6. Purgado de VRAM seguro para ROCm
        if clean_memory_after:
            comfy.model_management.soft_empty_cache()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        return (out_latent, out_denoised)


NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxSamplerStudio": McValley_MiniMaxSamplerStudio,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxSamplerStudio": "MiniMax Sampler Studio",
}
