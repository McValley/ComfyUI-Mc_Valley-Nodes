import { app } from "../../../scripts/app.js";

const styleId = "mcv-hw-monitor-css";
let styleTag = document.getElementById(styleId);
if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
}
styleTag.textContent = `
.mcv-hw-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 7px !important;
    padding: 10px 12px !important;
    background: radial-gradient(circle at 50% 0%, #031726 0%, #02080d 100%) !important;
    border-radius: 8px !important;
    border: 1px solid rgba(0, 212, 255, 0.45) !important;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2), inset 0 0 16px rgba(0, 0, 0, 0.85) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    user-select: none !important;
    transition: opacity 0.25s ease, filter 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
}

.mcv-hw-bypassed {
    opacity: 0.35 !important;
    filter: grayscale(0.9) brightness(0.55) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: none !important;
    pointer-events: none !important;
}

.mcv-hw-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-bottom: 1px solid rgba(0, 212, 255, 0.25) !important;
    padding-bottom: 6px !important;
}

.mcv-hw-title {
    color: #00d4ff !important;
    font-size: 10.5px !important;
    font-weight: 800 !important;
    letter-spacing: 1.2px !important;
    text-transform: uppercase !important;
    display: flex !important;
    align-items: center !important;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.4) !important;
}

.mcv-hw-gpu-badge {
    color: #00ff88 !important;
    font-size: 9px !important;
    font-family: "JetBrains Mono", monospace !important;
    font-weight: bold !important;
    background: rgba(0, 255, 136, 0.1) !important;
    border: 1px solid rgba(0, 255, 136, 0.3) !important;
    padding: 2px 6px !important;
    border-radius: 3px !important;
    max-width: 190px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.mcv-hw-metric {
    background: rgba(4, 18, 29, 0.85) !important;
    border: 1px solid rgba(0, 212, 255, 0.2) !important;
    border-radius: 6px !important;
    padding: 6px 9px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
}

.mcv-hw-metric-head {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
}

.mcv-hw-label {
    font-size: 9px !important;
    font-weight: 700 !important;
    color: #8da4be !important;
    letter-spacing: 0.5px !important;
}

.mcv-hw-val {
    font-size: 10px !important;
    font-family: "JetBrains Mono", monospace !important;
    font-weight: 800 !important;
    color: #ffffff !important;
}

.mcv-hw-track {
    height: 5px !important;
    background: #01060a !important;
    border: 1px solid rgba(0, 212, 255, 0.25) !important;
    border-radius: 3px !important;
    overflow: hidden !important;
    position: relative !important;
}

.mcv-hw-fill {
    height: 100% !important;
    width: 0%;
    transition: width 0.4s ease, background 0.3s ease !important;
}

.mcv-hw-fill.cyan {
    background: linear-gradient(90deg, #0077b6, #00d4ff) !important;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.6) !important;
}

.mcv-hw-fill.green {
    background: linear-gradient(90deg, #058c42, #00ff88) !important;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.6) !important;
}

.mcv-hw-fill.alert {
    background: linear-gradient(90deg, #c1121f, #ff2e63) !important;
    box-shadow: 0 0 10px rgba(255, 46, 99, 0.8) !important;
}
`;

app.registerExtension({
    name: "Mc_Valley.HardwareMonitorStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "McValley_HardwareMonitorStudio") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;

            // Función centralizada reentrante
            nodeType.prototype.setupMonitorHUD = function () {
                const FIXED_SIZE = [420, 310];
                this.size = [FIXED_SIZE[0], FIXED_SIZE[1]];
                this.setSize(FIXED_SIZE);
                this.resizable = false;

                this.color = "#041421";
                this.bgcolor = "#020a10";

                // Evitar duplicar el widget si ya existe en este nodo
                if (this.domElementAttached) return;
                this.domElementAttached = true;

                const main = document.createElement("div");
                main.className = "mcv-hw-container";

                const updateBypassState = () => {
                    const isBypassed = (this.mode === 4 || this.mode === 2);
                    if (isBypassed) main.classList.add("mcv-hw-bypassed");
                    else main.classList.remove("mcv-hw-bypassed");
                };

                    const origOnDrawForeground = this.onDrawForeground;
                    this.onDrawForeground = function(ctx) {
                        if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                        updateBypassState();
                    };

                    const head = document.createElement("div");
                    head.className = "mcv-hw-header";
                    const title = document.createElement("span");
                    title.className = "mcv-hw-title";
                    title.textContent = "HARDWARE MONITOR HUD";
                    const gpuBadge = document.createElement("span");
                    gpuBadge.className = "mcv-hw-gpu-badge";
                    gpuBadge.textContent = "DETECTING...";
                    head.append(title, gpuBadge);
                    main.appendChild(head);

                    const createMetricRow = (labelText) => {
                        const box = document.createElement("div");
                        box.className = "mcv-hw-metric";

                        const row = document.createElement("div");
                        row.className = "mcv-hw-metric-head";

                        const lbl = document.createElement("span");
                        lbl.className = "mcv-hw-label";
                        lbl.textContent = labelText;

                        const val = document.createElement("span");
                        val.className = "mcv-hw-val";
                        val.textContent = "0.0%";

                        row.append(lbl, val);

                        const track = document.createElement("div");
                        track.className = "mcv-hw-track";

                        const fill = document.createElement("div");
                        fill.className = "mcv-hw-fill cyan";

                        track.appendChild(fill);
                        box.append(row, track);
                        main.appendChild(box);

                        return { val, fill };
                    };

                    const vramUI = createMetricRow("GPU VRAM USAGE");
                    const gpuUI = createMetricRow("GPU COMPUTE LOAD");
                    const ramUI = createMetricRow("SYSTEM RAM USAGE");
                    const cpuUI = createMetricRow("CPU UTILIZATION");

                    const domWidget = this.addDOMWidget("mcv_hw_ui", "custom", main, { serialize: false });
                    domWidget.computeSize = () => [FIXED_SIZE[0], 270];

                    if (this.pollInterval) clearInterval(this.pollInterval);

                    this.pollInterval = setInterval(async () => {
                        if (this.mode === 4 || this.mode === 2) return;

                        try {
                            const res = await fetch("/mcv/hw_telemetry");
                            if (!res.ok) return;
                            const d = await res.json();

                            gpuBadge.textContent = d.gpu_name;

                            vramUI.val.textContent = `${d.vram_used} / ${d.vram_total} GB (${d.vram_pct}%)`;
                            vramUI.fill.style.width = `${Math.min(100, d.vram_pct)}%`;
                            vramUI.fill.className = d.vram_pct > 88 ? "mcv-hw-fill alert" : "mcv-hw-fill green";

                            gpuUI.val.textContent = `${d.gpu_load}%`;
                            gpuUI.fill.style.width = `${Math.min(100, d.gpu_load)}%`;
                            gpuUI.fill.className = "mcv-hw-fill green";

                            ramUI.val.textContent = `${d.ram_used} / ${d.ram_total} GB (${d.ram_pct}%)`;
                            ramUI.fill.style.width = `${Math.min(100, d.ram_pct)}%`;
                            ramUI.fill.className = d.ram_pct > 85 ? "mcv-hw-fill alert" : "mcv-hw-fill cyan";

                            cpuUI.val.textContent = `${d.cpu_pct}%`;
                            cpuUI.fill.style.width = `${Math.min(100, d.cpu_pct)}%`;
                            cpuUI.fill.className = "mcv-hw-fill cyan";
                        } catch (e) {}
                    }, 1000);

                    this.onRemoved = () => {
                        if (this.pollInterval) clearInterval(this.pollInterval);
                    };
            };

            // Al crear nodo de cero
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                this.setupMonitorHUD();
            };

            // Al deserializar flujo o recargar página
            nodeType.prototype.onConfigure = function () {
                if (onConfigure) onConfigure.apply(this, arguments);
                setTimeout(() => {
                    this.setupMonitorHUD();
                    app.graph.setDirtyCanvas(true, true);
                }, 40);
            };
        }
    },
    async nodeCreated(node) {
        if (node.comfyClass === "McValley_HardwareMonitorStudio" && node.setupMonitorHUD) {
            node.setupMonitorHUD();
        }
    }
});
