import { app } from "../../../scripts/app.js";

const styleId = "mcv-prompt-translator-local-css";
if (!document.getElementById(styleId)) {
    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.textContent = `
    .mcv-trans-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        padding: 14px 16px !important;
        background: radial-gradient(circle at 50% 0%, #031c26 0%, #01080d 100%) !important;
        border-radius: 10px !important;
        border: 1.5px solid rgba(0, 212, 255, 0.45) !important;
        box-shadow: 0 0 24px rgba(0, 212, 255, 0.16), inset 0 0 16px rgba(0, 0, 0, 0.9) !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        box-sizing: border-box !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        user-select: none !important;
        overflow: hidden !important;
        transition: opacity 0.25s ease, filter 0.25s ease !important;
    }

    .mcv-trans-bypassed {
        opacity: 0.45 !important;
        filter: grayscale(0.7) brightness(0.60) !important;
    }

    /* Bloquea solo la edición de campos, nunca la cabecera ni el botón */
    .mcv-trans-bypassed .mcv-trans-body,
    .mcv-trans-bypassed .mcv-trans-controls {
        pointer-events: none !important;
        user-select: none !important;
    }

    .mcv-trans-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1px solid rgba(0, 212, 255, 0.25) !important;
        padding-bottom: 8px !important;
        flex-shrink: 0 !important;
        pointer-events: auto !important;
    }

    .mcv-trans-title {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: #00d4ff !important;
        font-size: 11.5px !important;
        font-weight: 800 !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
    }

    .mcv-trans-btn-power {
        position: relative !important;
        z-index: 10 !important;
        pointer-events: auto !important;
        background: rgba(0, 255, 136, 0.12) !important;
        border: 1px solid #00ff88 !important;
        border-radius: 4px !important;
        color: #00ff88 !important;
        font-family: "JetBrains Mono", monospace !important;
        font-size: 9.5px !important;
        font-weight: bold !important;
        padding: 3px 9px !important;
        cursor: pointer !important;
        outline: none !important;
        transition: all 0.2s ease !important;
    }

    .mcv-trans-btn-power:hover {
        filter: brightness(1.25) !important;
    }

    .mcv-trans-btn-power.off {
        background: rgba(255, 68, 68, 0.15) !important;
        border-color: #ff4444 !important;
        color: #ff4444 !important;
    }

    .mcv-trans-controls {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
    }

    .mcv-trans-select {
        height: 26px !important;
        background: #020e17 !important;
        border: 1.2px solid rgba(0, 212, 255, 0.45) !important;
        border-radius: 5px !important;
        color: #00ff88 !important;
        font-size: 10.5px !important;
        font-weight: bold !important;
        font-family: "JetBrains Mono", monospace !important;
        padding: 0 8px !important;
        outline: none !important;
        cursor: pointer !important;
    }

    .mcv-trans-body {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        flex: 1 !important;
        min-height: 0 !important;
        height: 100% !important;
    }

    .mcv-trans-panel {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        flex: 1 !important;
        min-height: 0 !important;
        background: rgba(2, 16, 26, 0.85) !important;
        border: 1.2px solid rgba(0, 212, 255, 0.25) !important;
        border-radius: 7px !important;
        padding: 8px 10px !important;
        box-sizing: border-box !important;
    }

    .mcv-trans-panel-head {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        font-size: 10px !important;
        font-weight: 800 !important;
        font-family: "JetBrains Mono", monospace !important;
        color: #8da4be !important;
        flex-shrink: 0 !important;
    }

    .mcv-trans-textarea {
        width: 100% !important;
        flex: 1 !important;
        background: #01060a !important;
        border: 1px solid rgba(0, 212, 255, 0.2) !important;
        border-radius: 5px !important;
        color: #ffffff !important;
        font-size: 11.5px !important;
        font-family: "JetBrains Mono", monospace !important;
        line-height: 1.4 !important;
        padding: 8px 10px !important;
        box-sizing: border-box !important;
        resize: none !important;
        outline: none !important;
    }
    .mcv-trans-textarea:focus {
        border-color: #00d4ff !important;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.35) !important;
    }

    .mcv-trans-btn-copy {
        background: rgba(0, 212, 255, 0.15) !important;
        border: 1px solid #00d4ff !important;
        border-radius: 4px !important;
        color: #00d4ff !important;
        font-size: 10px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        padding: 2px 8px !important;
        outline: none !important;
        transition: all 0.15s ease !important;
    }
    .mcv-trans-btn-copy:hover {
        background: rgba(0, 212, 255, 0.35) !important;
        filter: brightness(1.2) !important;
    }
    `;
    document.head.appendChild(styleTag);
}

const ICONS = {
    cpu: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    copy: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
};

app.registerExtension({
    name: "Mc_Valley.PromptTranslatorLocal",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "McValley_PromptTranslatorLocal") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;
            const onSerialize = nodeType.prototype.onSerialize;

            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                const STUDIO_SIZE = [700, 460];
                this.size = [STUDIO_SIZE[0], STUDIO_SIZE[1]];
                this.setSize(STUDIO_SIZE);

                this.resizable = true;
                this.min_width = 480;
                this.min_height = 360;

                this.color = "#01121c";
                this.bgcolor = "#00070c";

                if (!this.properties) this.properties = {};
                if (this.properties.enabled === undefined) this.properties.enabled = true;
                if (this.properties.source_text === undefined) this.properties.source_text = "";
                if (this.properties.translated_text === undefined) this.properties.translated_text = "";
                if (this.properties.direction === undefined) this.properties.direction = "Spanish ➔ English";
                if (this.properties.model_engine === undefined) this.properties.model_engine = "Helsinki OPUS-MT (Neural Local)";

                if (this.widgets) {
                    for (const w of this.widgets) {
                        w.type = "hidden";
                        w.computeSize = () => [0, -4];
                        w.computedHeight = 0;
                        w.draw = () => {};
                        if (w.inputEl) {
                            w.inputEl.style.display = "none";
                            w.inputEl.remove();
                        }
                    }
                }

                const findW = (n) => this.widgets?.find(w => w.name === n);
                const enWidget = findW("enabled");
                const srcWidget = findW("source_text");
                const dirWidget = findW("direction");
                const engineWidget = findW("model_engine");

                const syncState = () => {
                    if (enWidget) enWidget.value = this.properties.enabled;
                    if (srcWidget) srcWidget.value = this.properties.source_text;
                    if (dirWidget) dirWidget.value = this.properties.direction;
                    if (engineWidget) engineWidget.value = this.properties.model_engine;
                    if (app.graph) app.graph.setDirtyCanvas(true, true);
                };

                    const main = document.createElement("div");
                    main.className = "mcv-trans-container";

                    const updateBypassState = () => {
                        const isGraphBypassed = (this.mode === 4 || this.mode === 2);
                        const isMuted = isGraphBypassed || !this.properties.enabled;
                        if (isMuted) main.classList.add("mcv-trans-bypassed");
                        else main.classList.remove("mcv-trans-bypassed");
                    };

                        const origOnDrawForeground = this.onDrawForeground;
                        this.onDrawForeground = function(ctx) {
                            if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                            updateBypassState();
                        };

                        // Header
                        const header = document.createElement("div");
                        header.className = "mcv-trans-header";

                        const titleBox = document.createElement("div");
                        titleBox.style.display = "flex";
                        titleBox.style.alignItems = "center";
                        titleBox.style.gap = "8px";

                        const title = document.createElement("span");
                        title.className = "mcv-trans-title";
                        title.innerHTML = `${ICONS.cpu} PROMPT TRANSLATOR`;

                        const powerBtn = document.createElement("button");
                        powerBtn.className = `mcv-trans-btn-power ${this.properties.enabled ? "" : "off"}`;
                        powerBtn.textContent = this.properties.enabled ? "ACTIVE" : "BYPASSED";
                        powerBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.properties.enabled = !this.properties.enabled;
                            powerBtn.textContent = this.properties.enabled ? "ACTIVE" : "BYPASSED";
                            powerBtn.className = `mcv-trans-btn-power ${this.properties.enabled ? "" : "off"}`;
                            syncState();
                            updateBypassState();
                        };

                        titleBox.append(title, powerBtn);

                        const controls = document.createElement("div");
                        controls.className = "mcv-trans-controls";

                        const modelSelect = document.createElement("select");
                        modelSelect.className = "mcv-trans-select";
                        ["Helsinki OPUS-MT (Neural Local)"].forEach(m => {
                            const opt = document.createElement("option");
                            opt.value = m; opt.textContent = m;
                            if (m === this.properties.model_engine) opt.selected = true;
                            modelSelect.appendChild(opt);
                        });
                        modelSelect.onchange = () => {
                            this.properties.model_engine = modelSelect.value;
                            syncState();
                        };

                        const dirSelect = document.createElement("select");
                        dirSelect.className = "mcv-trans-select";
                        ["Spanish ➔ English", "English ➔ Spanish"].forEach(d => {
                            const opt = document.createElement("option");
                            opt.value = d; opt.textContent = d;
                            if (d === this.properties.direction) opt.selected = true;
                            dirSelect.appendChild(opt);
                        });
                        dirSelect.onchange = () => {
                            this.properties.direction = dirSelect.value;
                            syncState();
                            updateHeaders();
                        };

                        controls.append(modelSelect, dirSelect);
                        header.append(titleBox, controls);
                        main.appendChild(header);

                        // Body
                        const body = document.createElement("div");
                        body.className = "mcv-trans-body";

                        const srcPanel = document.createElement("div");
                        srcPanel.className = "mcv-trans-panel";

                        const srcHead = document.createElement("div");
                        srcHead.className = "mcv-trans-panel-head";
                        const srcLabel = document.createElement("span");
                        srcLabel.textContent = "SOURCE PROMPT (SPANISH)";
                        const charCounter = document.createElement("span");
                        charCounter.textContent = "0 chars";
                        srcHead.append(srcLabel, charCounter);

                        const srcText = document.createElement("textarea");
                        srcText.className = "mcv-trans-textarea";
                        srcText.placeholder = "Escribe tu prompt aquí (traducción local sin censura)...";
                        srcText.value = this.properties.source_text || "";
                        srcText.oninput = () => {
                            this.properties.source_text = srcText.value;
                            charCounter.textContent = `${srcText.value.length} chars`;
                            syncState();
                        };

                        srcPanel.append(srcHead, srcText);
                        body.appendChild(srcPanel);

                        const tgtPanel = document.createElement("div");
                        tgtPanel.className = "mcv-trans-panel";

                        const tgtHead = document.createElement("div");
                        tgtHead.className = "mcv-trans-panel-head";
                        const tgtLabel = document.createElement("span");
                        tgtLabel.textContent = "TRANSLATED RESULT (ENGLISH)";
                        tgtLabel.style.color = "#00ff88";

                        const copyBtn = document.createElement("button");
                        copyBtn.className = "mcv-trans-btn-copy";
                        copyBtn.innerHTML = `${ICONS.copy} Copy`;

                        const showCopiedFeedback = () => {
                            copyBtn.textContent = "✓ Copied!";
                            copyBtn.style.borderColor = "#00ff88";
                            copyBtn.style.color = "#00ff88";
                            setTimeout(() => {
                                copyBtn.innerHTML = `${ICONS.copy} Copy`;
                                copyBtn.style.borderColor = "#00d4ff";
                                copyBtn.style.color = "#00d4ff";
                            }, 1200);
                        };

                        copyBtn.onclick = () => {
                            const text = tgtText.value;
                            if (!text) return;
                            if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(text).then(() => showCopiedFeedback());
                            } else {
                                tgtText.removeAttribute("readonly");
                                tgtText.select();
                                document.execCommand("copy");
                                tgtText.setAttribute("readonly", true);
                                showCopiedFeedback();
                            }
                        };

                        tgtHead.append(tgtLabel, copyBtn);

                        const tgtText = document.createElement("textarea");
                        tgtText.className = "mcv-trans-textarea";
                        tgtText.style.color = "#00ff88";
                        tgtText.readOnly = true;
                        tgtText.placeholder = "Queue prompt to execute local offline translation...";
                        tgtText.value = this.properties.translated_text || "";

                        tgtPanel.append(tgtHead, tgtText);
                        body.appendChild(tgtPanel);
                        main.appendChild(body);

                        const updateHeaders = () => {
                            const isEsToEn = this.properties.direction.startsWith("Spanish");
                            srcLabel.textContent = isEsToEn ? "SOURCE PROMPT (SPANISH)" : "SOURCE PROMPT (ENGLISH)";
                            tgtLabel.textContent = isEsToEn ? "TRANSLATED RESULT (ENGLISH)" : "TRANSLATED RESULT (SPANISH)";
                        };

                        const domWidget = this.addDOMWidget("prompt_translator_local_ui", "custom", main, { serialize: false });
                        domWidget.computeSize = (w) => [w, this.size[1] - 40];

                        this.onResize = function (size) {
                            if (size[0] < this.min_width) size[0] = this.min_width;
                            if (size[1] < this.min_height) size[1] = this.min_height;
                            const calculatedHeight = `${size[1] - 40}px`;
                            main.style.height = calculatedHeight;
                            main.style.maxHeight = calculatedHeight;
                        };

                        const origOnExecuted = this.onExecuted;
                        this.onExecuted = function (message) {
                            if (origOnExecuted) origOnExecuted.apply(this, arguments);
                            if (message?.payload?.[0]) {
                                const p = message.payload[0];
                                if (p.translated !== undefined) {
                                    tgtText.value = p.translated;
                                    this.properties.translated_text = p.translated;
                                }
                            }
                        };

                        this.restoreState = () => {
                            this.properties.enabled = this.properties.enabled ?? true;
                            powerBtn.textContent = this.properties.enabled ? "ACTIVE" : "BYPASSED";
                            powerBtn.className = `mcv-trans-btn-power ${this.properties.enabled ? "" : "off"}`;
                            srcText.value = this.properties.source_text || "";
                            tgtText.value = this.properties.translated_text || "";
                            dirSelect.value = this.properties.direction || "Spanish ➔ English";
                            modelSelect.value = this.properties.model_engine || "Helsinki OPUS-MT (Neural Local)";
                            charCounter.textContent = `${(this.properties.source_text || "").length} chars`;
                            updateHeaders();
                            updateBypassState();
                        };

                        setTimeout(() => {
                            this.restoreState();
                            const calculatedHeight = `${this.size[1] - 40}px`;
                            main.style.height = calculatedHeight;
                            main.style.maxHeight = calculatedHeight;
                        }, 60);
            };

            nodeType.prototype.onSerialize = function (info) {
                if (onSerialize) onSerialize.apply(this, arguments);
                info.properties = { ...this.properties };
            };

            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (info?.properties) this.properties = { ...this.properties, ...info.properties };
                setTimeout(() => { if (this.restoreState) this.restoreState(); }, 80);
            };
        }
    }
});
