# ComfyUI-Mc_Valley-Nodes

A modular, self-contained suite of custom nodes for ComfyUI tailored for production video generation, prompt engineering, model pipeline loading, AMD ROCm acceleration, and real-time execution telemetry.

All interactive nodes feature responsive Cyberpunk canvas styling, locked UI dimensions to prevent canvas distortion, and native reaction to ComfyUI's **Bypass** (`Ctrl + B`) mode.

---

## 📦 Active Suite Architecture & Included Nodes

### 🎬 Video Production & MiniMax Tools
* **MiniMax Turbo Engine Studio:** Consolidated Turbo-LoRA engine and multi-step (4/6/8 steps) diffusion driver with dual-schedule clock synchronization and frugal memory management.
* **MiniMax Sampler Studio:** All-in-one consolidated sampler for MiniMax H3 FLOW_AV with native sigmas resolution, pure single-pass CFGGuider, noise injection over NestedTensors, and automated ROCm VRAM purges.
* **MiniMax Video Saver Studio:** High-performance video export module featuring integrated directory isolation (`output/MiniMax_Videos/`), clean metadata injection, native 16-bit PCM to AAC 192k audio multiplexing, and a fully elastic HTML5 in-canvas previewer with volume controls.
* **Fast MiniMax I2V:** Optimized high-throughput Image-to-Video generation pipeline with dynamic parameter switching and Vision Encoder bypass.
* **MiniMax Direct LoRA:** On-canvas dynamic LoRA stacker and conditioning injector.
* **MiniMax Latent Upscaler Studio:** Native high-resolution latent video enhancer and temporal scaler.
* **MiniMax Video Time Director:** Frame-rate and temporal sequence duration calculator with alignment guarantees.
* **Frame Range Inspector & Trimmer:** Visual frame navigator, thumbnail sprite inspector, and sample range trimmer.
* **Empty Latent Div32:** Latent canvas generator strictly constrained to 32-pixel mathematical alignment with live HUD preview.

### ✍️ Prompt Engineering & Hub
* **Structured Prompt Builder Studio:** Modular prompt architect allowing users to dynamically spawn, label, and delete structured text blocks (`+ ADD PROMPT`) with automatic token sanitation and unified concatenated output.
* **Prompt Layer Stacker:** Vertical layer-based prompt architect with dynamic canvas scaling and automatic token cleaning.
* **Video Prompt Director:** Multi-slot temporal prompt director and shot sequencer for video flows.
* **Prompt Translator Studio (Local Offline):** Zero-cloud local neural translator powered by Helsinki-NLP MarianMT.
* **Resource Link Hub:** Integrated canvas reference index for workflow documentation, models, and community links.

### 📥 Loaders & Model Pipeline
* **Anima Loader:** Comprehensive stack loader for Anima, Qwen, and SDXL architectures that unifies Diffusion models, VAEs, and Text Encoders with automatic CLIP type resolution.
* **MiniMax Model Loader:** Dedicated loader pipeline for MiniMax UNet/DiT, Qwen-VL CLIP, Video VAE, and Audio VAE.

### ⚡ Hardware Acceleration & Telemetry
* **RDNA Upscale Refiner:** 3-pass GPU-accelerated frame post-processing rack (Bilateral Denoise, High-Freq Deblur, and Neural VSR upscaling) with real-time HUD telemetry.
* **Hardware Monitor Studio:** Real-time on-canvas monitor for GPU VRAM, System RAM, and GPU load.
* **Benchmark Timer Studio:** Step-by-step latency, bottleneck, and queue execution profiler.

---

## 🚀 Installation

1. Open a terminal inside your ComfyUI custom nodes directory:
   ```bash
   cd ComfyUI/custom_nodes
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/McValley/ComfyUI-Mc_Valley-Nodes.git
   ```

3. Install package requirements:
   ```bash
   cd ComfyUI-Mc_Valley-Nodes
   pip install -r requirements.txt
   ```

4. Restart ComfyUI and refresh your browser (Ctrl + F5).
