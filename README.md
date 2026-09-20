# ComfyUI-Mc_Valley-Nodes

A modular, self-contained suite of custom nodes for ComfyUI tailored for production video generation, prompt engineering, AMD ROCm acceleration, and real-time execution telemetry.

All interactive nodes feature responsive Cyberpunk canvas styling, locked UI dimensions to prevent canvas distortion, and native reaction to ComfyUI's **Bypass** (`Ctrl + B`) mode.

---

## 📦 Active Suite Architecture & Included Nodes

### 🎬 Video Production & MiniMax Tools
* **Fast MiniMax I2V:** Optimized high-throughput Image-to-Video generation pipeline with dynamic parameter switching.
* **MiniMax Direct LoRA:** On-canvas dynamic LoRA stacker and conditioning injector.
* **MiniMax Latent Upscaler Studio:** Native high-resolution latent video enhancer and temporal scaler.
* **MiniMax Video Time Director:** Frame-rate and temporal sequence duration calculator with alignment guarantees.
* **Frame Range Inspector & Trimmer:** Visual frame navigator, thumbnail sprite inspector, and sample range trimmer.
* **Empty Latent Div32:** Latent canvas generator strictly constrained to 32-pixel mathematical alignment with live HUD preview.

### ✍️ Prompt Engineering & Hub
* **Prompt Layer Stacker:** Vertical layer-based prompt architect with dynamic canvas scaling and automatic token cleaning.
* **Video Prompt Director:** Multi-slot temporal prompt director and shot sequencer for video flows.
* **Prompt Translator Studio (Local Offline):** Zero-cloud local neural translator powered by Helsinki-NLP MarianMT.
* **Resource Link Hub:** Integrated canvas reference index for workflow documentation, models, and community links.

### ⚡ Hardware Acceleration & Telemetry
* **RDNA Upscale Refiner:** 3-pass GPU-accelerated frame post-processing rack (Bilateral Denoise, High-Freq Deblur, and Neural VSR upscaling) with real-time HUD telemetry.
* **Hardware Monitor Studio:** Real-time on-canvas monitor for GPU VRAM, System RAM, and GPU load.
* **Benchmark Timer Studio:** Step-by-step latency, bottleneck, and queue execution profiler.

---

Markdown
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

4. Restart ComfyUI and refresh your browser (`Ctrl + F5`).
