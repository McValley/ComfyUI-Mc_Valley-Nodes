import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const linkId = "mcv-rdna-upscaler-css";
if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = new URL("../css/amd_upscaler_theme.css", import.meta.url).href;
    document.head.appendChild(link);
}

const ICONS = {
    chip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`
};

app.registerExtension({
    name: "Mc_Valley.AMDRDNANeuralFrameRefiner",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "McValley_AMDAIUpscalerRefiner") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;
            const onSerialize = nodeType.prototype.onSerialize;

            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                const FIXED_SIZE = [450, 525];
                this.size = [FIXED_SIZE[0], FIXED_SIZE[1]];
                this.setSize(FIXED_SIZE);

                this.color = "#17040b";
                this.bgcolor = "#080104";

                if (!this.properties) this.properties = {};
                const defProps = {
                    denoise: true,
                    denoise_quality: "Ultra",
                    deblur: true,
                    deblur_quality: "Ultra",
                    upscale: "RDNA-VSR (Neural)",
                      resize_type: "Scale",
                      scale: 2.0,
                      width: 1920,
                      height: 1080,
                      divisible_by: "8",
                      telemetry_dims: "0 × 0",
                      telemetry_prev: "0 × 0",
                      telemetry_meta: "P1: -- | P2: -- | VSR: --",
                      telemetry_factor: "0.00x",
                      telemetry_ready: false
                };
                for (const k in defProps) {
                    if (this.properties[k] === undefined) this.properties[k] = defProps[k];
                }

                const hideList = [
                    "denoise", "denoise_quality", "deblur", "deblur_quality",
                    "upscale", "scale", "resize_type", "width", "height",
                    "divisible_by", "device_id", "use_mmap", "auto_unload_models"
                ];
                if (this.widgets) {
                    for (const w of this.widgets) {
                        if (hideList.includes(w.name)) {
                            w.type = "hidden";
                            w.computeSize = () => [0, -4];
                            w.draw = () => {};
                        }
                    }
                }

                const findW = (n) => this.widgets?.find(w => w.name === n);
                const syncWidget = (name, val) => {
                    const w = findW(name);
                    if (w) {
                        w.value = val;
                        if (w.callback) w.callback(val);
                    }
                };

                const snapToDivisible = (val, div) => {
                    return Math.max(div, Math.round(val / div) * div);
                };

                const main = document.createElement("div");
                main.className = "mcv-rdna-container";

                // DETECTOR REACTIVO DE BYPASS / MUTE
                const updateBypassState = () => {
                    const isBypassed = (this.mode === 4 || this.mode === 2);
                    if (isBypassed) {
                        main.classList.add("mcv-rdna-bypassed");
                    } else {
                        main.classList.remove("mcv-rdna-bypassed");
                    }
                };

                const origOnDrawForeground = this.onDrawForeground;
                this.onDrawForeground = function(ctx) {
                    if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                    updateBypassState();
                };

                // Header
                const header = document.createElement("div");
                header.className = "mcv-rdna-header";

                const title = document.createElement("span");
                title.className = "mcv-rdna-title";
                title.innerHTML = `${ICONS.chip} RDNA™ UPSCALE REFINER`;

                const badge = document.createElement("span");
                badge.className = "mcv-rdna-badge";
                badge.textContent = "● RDNA 4 ROCm";

                header.append(title, badge);
                main.appendChild(header);

                const grid = document.createElement("div");
                grid.className = "mcv-rdna-grid";

                const QUALITIES = ["Low", "Medium", "High", "Ultra"];

                // 1. Denoise
                const denoiseCard = document.createElement("div");
                denoiseCard.className = "mcv-rdna-card";
                const dHead = document.createElement("div");
                dHead.className = "mcv-rdna-card-head";
                const dLabel = document.createElement("span");
                dLabel.className = "mcv-rdna-card-label";
                dLabel.textContent = "Pass 1: Bilateral Denoise";

                const dToggleWrap = document.createElement("div");
                dToggleWrap.className = "mcv-rdna-toggle";
                const dSwitch = document.createElement("div");
                dSwitch.className = `mcv-rdna-switch ${this.properties.denoise ? 'active' : ''}`;
                dToggleWrap.append(dSwitch);
                dHead.append(dLabel, dToggleWrap);

                const dRow = document.createElement("div");
                dRow.className = "mcv-rdna-ctrl-row";
                const dQualityLbl = document.createElement("span");
                dQualityLbl.textContent = "Refinement Quality:";
                dQualityLbl.style.fontSize = "9.5px";
                dQualityLbl.style.color = "#8da4be";

                const dSelect = document.createElement("select");
                dSelect.className = "mcv-rdna-select";
                dSelect.innerHTML = "";
                QUALITIES.forEach(q => {
                    const opt = document.createElement("option");
                    opt.value = q; opt.textContent = q;
                    if (q === this.properties.denoise_quality) opt.selected = true;
                    dSelect.appendChild(opt);
                });

                dSwitch.onclick = () => {
                    this.properties.denoise = !this.properties.denoise;
                    dSwitch.className = `mcv-rdna-switch ${this.properties.denoise ? 'active' : ''}`;
                    syncWidget("denoise", this.properties.denoise);
                };

                dSelect.onchange = () => {
                    this.properties.denoise_quality = dSelect.value;
                    syncWidget("denoise_quality", dSelect.value);
                };

                dRow.append(dQualityLbl, dSelect);
                denoiseCard.append(dHead, dRow);
                grid.appendChild(denoiseCard);

                // 2. Deblur
                const deblurCard = document.createElement("div");
                deblurCard.className = "mcv-rdna-card";
                const bHead = document.createElement("div");
                bHead.className = "mcv-rdna-card-head";
                const bLabel = document.createElement("span");
                bLabel.className = "mcv-rdna-card-label";
                bLabel.textContent = "Pass 2: High-Freq Deblur";

                const bToggleWrap = document.createElement("div");
                bToggleWrap.className = "mcv-rdna-toggle";
                const bSwitch = document.createElement("div");
                bSwitch.className = `mcv-rdna-switch ${this.properties.deblur ? 'active' : ''}`;
                bToggleWrap.append(bSwitch);
                bHead.append(bLabel, bToggleWrap);

                const bRow = document.createElement("div");
                bRow.className = "mcv-rdna-ctrl-row";
                const bQualityLbl = document.createElement("span");
                bQualityLbl.textContent = "Unsharp Recovery:";
                bQualityLbl.style.fontSize = "9.5px";
                bQualityLbl.style.color = "#8da4be";

                const bSelect = document.createElement("select");
                bSelect.className = "mcv-rdna-select";
                bSelect.innerHTML = "";
                QUALITIES.forEach(q => {
                    const opt = document.createElement("option");
                    opt.value = q; opt.textContent = q;
                    if (q === this.properties.deblur_quality) opt.selected = true;
                    bSelect.appendChild(opt);
                });

                bSwitch.onclick = () => {
                    this.properties.deblur = !this.properties.deblur;
                    bSwitch.className = `mcv-rdna-switch ${this.properties.deblur ? 'active' : ''}`;
                    syncWidget("deblur", this.properties.deblur);
                };

                bSelect.onchange = () => {
                    this.properties.deblur_quality = bSelect.value;
                    syncWidget("deblur_quality", bSelect.value);
                };

                bRow.append(bQualityLbl, bSelect);
                deblurCard.append(bHead, bRow);
                grid.appendChild(deblurCard);

                // 3. Super Resolution / VSR
                const scaleCard = document.createElement("div");
                scaleCard.className = "mcv-rdna-card";
                const sHead = document.createElement("div");
                sHead.className = "mcv-rdna-card-head";
                const sLabel = document.createElement("span");
                sLabel.className = "mcv-rdna-card-label";
                sLabel.textContent = "Pass 3: Neural Super Resolution (VSR)";

                const sModeSelect = document.createElement("select");
                sModeSelect.className = "mcv-rdna-select";
                sModeSelect.innerHTML = "";
                ["Off", "RDNA-VSR (Neural)", "High Bitrate (Smooth)"].forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = m; opt.textContent = m;
                    if (m === this.properties.upscale) opt.selected = true;
                    sModeSelect.appendChild(opt);
                });

                sModeSelect.onchange = () => {
                    this.properties.upscale = sModeSelect.value;
                    syncWidget("upscale", sModeSelect.value);
                };

                sHead.append(sLabel, sModeSelect);
                scaleCard.appendChild(sHead);

                // Opciones de Target Type y Divisible By
                const resConfigRow = document.createElement("div");
                resConfigRow.className = "mcv-rdna-ctrl-row";
                resConfigRow.style.marginTop = "2px";

                const resizeTypeBox = document.createElement("div");
                Object.assign(resizeTypeBox.style, { display: "flex", alignItems: "center", gap: "6px" });
                const rtLbl = document.createElement("span");
                rtLbl.textContent = "Target Type:";
                rtLbl.style.fontSize = "9.5px";
                rtLbl.style.color = "#8da4be";

                const rtSelect = document.createElement("select");
                rtSelect.className = "mcv-rdna-select";
                rtSelect.innerHTML = "";
                ["Scale", "Manual"].forEach(rt => {
                    const opt = document.createElement("option");
                    opt.value = rt; opt.textContent = rt;
                    if (rt === this.properties.resize_type) opt.selected = true;
                    rtSelect.appendChild(opt);
                });
                resizeTypeBox.append(rtLbl, rtSelect);

                const divBox = document.createElement("div");
                Object.assign(divBox.style, { display: "flex", alignItems: "center", gap: "6px" });
                const divLbl = document.createElement("span");
                divLbl.textContent = "Divisible By:";
                divLbl.style.fontSize = "9.5px";
                divLbl.style.color = "#8da4be";

                const divSelect = document.createElement("select");
                divSelect.className = "mcv-rdna-select";
                divSelect.innerHTML = "";
                ["8", "16", "32"].forEach(d => {
                    const opt = document.createElement("option");
                    opt.value = d; opt.textContent = d;
                    if (d === this.properties.divisible_by) opt.selected = true;
                    divSelect.appendChild(opt);
                });
                divBox.append(divLbl, divSelect);

                resConfigRow.append(resizeTypeBox, divBox);
                scaleCard.appendChild(resConfigRow);

                // Slider
                const sRow = document.createElement("div");
                sRow.className = "mcv-rdna-ctrl-row";
                const sWrap = document.createElement("div");
                sWrap.className = "mcv-rdna-slider-wrap";

                const sSlider = document.createElement("input");
                sSlider.type = "range";
                sSlider.min = "1.0";
                sSlider.max = "4.0";
                sSlider.step = "0.05";
                sSlider.value = this.properties.scale;
                sSlider.className = "mcv-rdna-slider";

                const sVal = document.createElement("span");
                sVal.className = "mcv-rdna-slider-val";
                sVal.textContent = `${parseFloat(this.properties.scale).toFixed(2)}x`;

                sSlider.oninput = () => {
                    const val = parseFloat(sSlider.value);
                    this.properties.scale = val;
                    sVal.textContent = `${val.toFixed(2)}x`;
                    syncWidget("scale", val);
                };

                sWrap.append(sSlider, sVal);
                sRow.appendChild(sWrap);
                scaleCard.appendChild(sRow);

                // Inputs Manuales
                const manualRow = document.createElement("div");
                manualRow.className = "mcv-rdna-ctrl-row";

                const currentDiv = parseInt(this.properties.divisible_by) || 8;

                const wBox = document.createElement("div");
                Object.assign(wBox.style, { display: "flex", alignItems: "center", gap: "6px" });
                const wLbl = document.createElement("span");
                wLbl.textContent = "Width:";
                wLbl.style.fontSize = "9.5px";
                wLbl.style.color = "#8da4be";
                const wInput = document.createElement("input");
                wInput.type = "number";
                wInput.min = "64";
                wInput.max = "8192";
                wInput.step = currentDiv;
                wInput.value = this.properties.width || 1920;
                wInput.className = "mcv-rdna-num-input";
                wInput.onchange = () => {
                    const div = parseInt(this.properties.divisible_by) || 8;
                    const snapped = snapToDivisible(parseInt(wInput.value) || 1920, div);
                    wInput.value = snapped;
                    this.properties.width = snapped;
                    syncWidget("width", snapped);
                };
                wBox.append(wLbl, wInput);

                const hBox = document.createElement("div");
                Object.assign(hBox.style, { display: "flex", alignItems: "center", gap: "6px" });
                const hLbl = document.createElement("span");
                hLbl.textContent = "Height:";
                hLbl.style.fontSize = "9.5px";
                hLbl.style.color = "#8da4be";
                const hInput = document.createElement("input");
                hInput.type = "number";
                hInput.min = "64";
                hInput.max = "8192";
                hInput.step = currentDiv;
                hInput.value = this.properties.height || 1080;
                hInput.className = "mcv-rdna-num-input";
                hInput.onchange = () => {
                    const div = parseInt(this.properties.divisible_by) || 8;
                    const snapped = snapToDivisible(parseInt(hInput.value) || 1080, div);
                    hInput.value = snapped;
                    this.properties.height = snapped;
                    syncWidget("height", snapped);
                };
                hBox.append(hLbl, hInput);

                manualRow.append(wBox, hBox);
                scaleCard.appendChild(manualRow);

                const updateStateControls = () => {
                    const isManual = this.properties.resize_type === "Manual";
                    if (isManual) {
                        sSlider.disabled = true;
                        sWrap.classList.add("mcv-rdna-disabled");
                        wInput.disabled = false;
                        hInput.disabled = false;
                        manualRow.classList.remove("mcv-rdna-disabled");
                    } else {
                        sSlider.disabled = false;
                        sWrap.classList.remove("mcv-rdna-disabled");
                        wInput.disabled = true;
                        hInput.disabled = true;
                        manualRow.classList.add("mcv-rdna-disabled");
                    }
                };

                rtSelect.onchange = () => {
                    this.properties.resize_type = rtSelect.value;
                    syncWidget("resize_type", rtSelect.value);
                    updateStateControls();
                };

                divSelect.onchange = () => {
                    const divVal = parseInt(divSelect.value);
                    this.properties.divisible_by = divSelect.value;
                    syncWidget("divisible_by", divSelect.value);

                    wInput.step = divVal;
                    hInput.step = divVal;

                    const snappedW = snapToDivisible(parseInt(wInput.value) || 1920, divVal);
                    const snappedH = snapToDivisible(parseInt(hInput.value) || 1080, divVal);
                    wInput.value = snappedW;
                    hInput.value = snappedH;
                    this.properties.width = snappedW;
                    this.properties.height = snappedH;
                    syncWidget("width", snappedW);
                    syncWidget("height", snappedH);
                };

                updateStateControls();
                grid.appendChild(scaleCard);

                // 4. Panel HUD de Telemetría
                const hudPanel = document.createElement("div");
                hudPanel.className = "mcv-rdna-hud";

                const hudHead = document.createElement("div");
                hudHead.className = "mcv-rdna-hud-head";
                const hudLabel = document.createElement("span");
                hudLabel.className = "mcv-rdna-hud-label";
                hudLabel.textContent = "PIPELINE RESOLUTION & TELEMETRY";
                const hudStatus = document.createElement("span");
                hudStatus.className = `mcv-rdna-hud-status ${this.properties.telemetry_ready ? 'ready' : ''}`;
                hudStatus.textContent = this.properties.telemetry_ready ? "● EXECUTED" : "○ WAITING RUN (0 × 0)";
                hudHead.append(hudLabel, hudStatus);

                const hudMain = document.createElement("div");
                hudMain.className = "mcv-rdna-hud-main";
                const hudDims = document.createElement("div");
                hudDims.className = "mcv-rdna-hud-dims";
                hudDims.innerHTML = `<span>${this.properties.telemetry_dims}</span> PX`;
                const hudRatio = document.createElement("span");
                hudRatio.className = "mcv-rdna-hud-ratio";
                hudRatio.textContent = this.properties.telemetry_factor;
                hudMain.append(hudDims, hudRatio);

                const hudMeta = document.createElement("div");
                hudMeta.className = "mcv-rdna-hud-meta";
                hudMeta.innerHTML = `<span>SRC: <b>${this.properties.telemetry_prev}</b></span><span>${this.properties.telemetry_meta}</span>`;

                hudPanel.append(hudHead, hudMain, hudMeta);
                grid.appendChild(hudPanel);

                main.appendChild(grid);
                this.addDOMWidget("rdna_refiner_ui", "custom", main, { serialize: false });

                const handleTelemetry = (event) => {
                    const d = event.detail;
                    if (String(d.node_id) === String(this.id)) {
                        this.properties.telemetry_dims = `${d.out_w} × ${d.out_h}`;
                        this.properties.telemetry_prev = `${d.src_w} × ${d.src_h}`;
                        this.properties.telemetry_meta = `P1: ${d.denoise} | P2: ${d.deblur} | ${d.vsr_mode}`;
                        this.properties.telemetry_factor = d.scale_factor;
                        this.properties.telemetry_ready = true;

                        hudStatus.textContent = `● EXECUTED (${d.frames} frames | Div: ${d.divisible})`;
                        hudStatus.className = "mcv-rdna-hud-status ready";
                        hudDims.innerHTML = `<span>${d.out_w} × ${d.out_h}</span> PX`;
                        hudRatio.textContent = d.scale_factor;
                        hudMeta.innerHTML = `<span>SRC: <b>${d.src_w} × ${d.src_h}</b></span><span>P1: ${d.denoise} | P2: ${d.deblur} | ${d.vsr_mode}</span>`;
                    }
                };

                api.addEventListener("mcv_rdna_telemetry", handleTelemetry);

                this.restoreState = () => {
                    dSwitch.className = `mcv-rdna-switch ${this.properties.denoise ? 'active' : ''}`;
                    bSwitch.className = `mcv-rdna-switch ${this.properties.deblur ? 'active' : ''}`;
                    dSelect.value = this.properties.denoise_quality || "Ultra";
                    bSelect.value = this.properties.deblur_quality || "Ultra";
                    sModeSelect.value = this.properties.upscale || "RDNA-VSR (Neural)";
                    rtSelect.value = this.properties.resize_type || "Scale";
                    divSelect.value = this.properties.divisible_by || "8";
                    sSlider.value = this.properties.scale || 2.0;
                    sVal.textContent = `${parseFloat(sSlider.value).toFixed(2)}x`;

                    const divVal = parseInt(this.properties.divisible_by) || 8;
                    wInput.step = divVal;
                    hInput.step = divVal;

                    const snappedW = snapToDivisible(parseInt(this.properties.width) || 1920, divVal);
                    const snappedH = snapToDivisible(parseInt(this.properties.height) || 1080, divVal);
                    wInput.value = snappedW;
                    hInput.value = snappedH;

                    hudStatus.textContent = this.properties.telemetry_ready ? "● EXECUTED" : "○ WAITING RUN (0 × 0)";
                    hudStatus.className = `mcv-rdna-hud-status ${this.properties.telemetry_ready ? 'ready' : ''}`;
                    hudDims.innerHTML = `<span>${this.properties.telemetry_dims}</span> PX`;
                    hudRatio.textContent = this.properties.telemetry_factor;
                    hudMeta.innerHTML = `<span>SRC: <b>${this.properties.telemetry_prev}</b></span><span>${this.properties.telemetry_meta}</span>`;

                    updateStateControls();

                    syncWidget("denoise", this.properties.denoise);
                    syncWidget("denoise_quality", this.properties.denoise_quality);
                    syncWidget("deblur", this.properties.deblur);
                    syncWidget("deblur_quality", this.properties.deblur_quality);
                    syncWidget("upscale", this.properties.upscale);
                    syncWidget("resize_type", this.properties.resize_type);
                    syncWidget("scale", this.properties.scale);
                    syncWidget("width", snappedW);
                    syncWidget("height", snappedH);
                    syncWidget("divisible_by", this.properties.divisible_by);
                };

                this.restoreState();
            };

            nodeType.prototype.onSerialize = function (info) {
                if (onSerialize) onSerialize.apply(this, arguments);
                info.properties = { ...this.properties };
            };

            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (info?.properties) {
                    this.properties = { ...this.properties, ...info.properties };
                }
                if (this.restoreState) this.restoreState();
            };
        }
    }
});
