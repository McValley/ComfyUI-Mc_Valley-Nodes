import { app } from "../../../scripts/app.js";

const styleId = "mcv-video-prompt-director-css";
if (!document.getElementById(styleId)) {
    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.textContent = `
    .mcv-vpd-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 14px !important;
        padding: 16px 18px 18px 18px !important;
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
        contain: paint !important;
        transition: opacity 0.25s ease, filter 0.25s ease !important;
    }

    .mcv-vpd-bypassed {
        opacity: 0.45 !important;
        filter: grayscale(0.5) brightness(0.65) !important;
        pointer-events: none !important;
    }

    .mcv-vpd-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1px solid rgba(0, 212, 255, 0.25) !important;
        padding-bottom: 10px !important;
        flex-shrink: 0 !important;
    }

    .mcv-vpd-title {
        color: #00d4ff !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
    }

    .mcv-vpd-status-badge {
        font-family: "JetBrains Mono", monospace !important;
        font-size: 10.5px !important;
        font-weight: bold !important;
        padding: 4px 10px !important;
        border-radius: 4px !important;
        background: rgba(0, 212, 255, 0.1) !important;
        border: 1px solid rgba(0, 212, 255, 0.3) !important;
        color: #00ff88 !important;
    }

    .mcv-vpd-columns {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 14px !important;
        flex: 1 !important;
        min-height: 0 !important;
        height: calc(100% - 52px) !important;
    }

    .mcv-vpd-col {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        background: rgba(2, 16, 26, 0.85) !important;
        border: 1.2px solid rgba(0, 212, 255, 0.25) !important;
        border-radius: 8px !important;
        padding: 12px !important;
        box-sizing: border-box !important;
        transition: all 0.2s ease !important;
        min-height: 0 !important;
    }

    .mcv-vpd-col.disabled {
        opacity: 0.35 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .mcv-vpd-col-head {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-shrink: 0 !important;
    }

    .mcv-vpd-col-title {
        font-family: "JetBrains Mono", monospace !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        color: #00d4ff !important;
    }

    .mcv-vpd-toggle-btn {
        font-family: "JetBrains Mono", monospace !important;
        font-size: 10px !important;
        font-weight: bold !important;
        padding: 3px 10px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        outline: none !important;
        transition: all 0.15s ease !important;
    }

    .mcv-vpd-toggle-btn.active {
        background: rgba(0, 255, 136, 0.2) !important;
        border: 1px solid #00ff88 !important;
        color: #00ff88 !important;
    }

    .mcv-vpd-toggle-btn.off {
        background: rgba(255, 77, 77, 0.15) !important;
        border: 1px solid #ff4d4d !important;
        color: #ff4d4d !important;
    }

    .mcv-vpd-textarea {
        width: 100% !important;
        flex: 1 !important;
        background: #01060a !important;
        border: 1px solid rgba(0, 212, 255, 0.2) !important;
        border-radius: 6px !important;
        color: #ffffff !important;
        font-size: 12px !important;
        font-family: "JetBrains Mono", monospace !important;
        line-height: 1.5 !important;
        padding: 10px 12px !important;
        box-sizing: border-box !important;
        resize: none !important;
        outline: none !important;
    }
    .mcv-vpd-textarea:focus {
        border-color: #00d4ff !important;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.35) !important;
    }

    .mcv-vpd-col.disabled .mcv-vpd-textarea {
        pointer-events: none !important;
    }
    `;
    document.head.appendChild(styleTag);
}

const ICONS = {
    clapper: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m4 4 3 4"/><path d="m9 4 3 4"/><path d="m14 4 3 4"/><path d="m19 4 3 4"/></svg>`
};

app.registerExtension({
    name: "Mc_Valley.VideoPromptDirector",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "McValley_VideoPromptDirector") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;
            const onSerialize = nodeType.prototype.onSerialize;

            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                const STUDIO_SIZE = [1240, 880];
                this.size = [STUDIO_SIZE[0], STUDIO_SIZE[1]];
                this.setSize(STUDIO_SIZE);

                this.resizable = true;
                this.min_width = 900;
                this.min_height = 500;

                this.color = "#01121c";
                this.bgcolor = "#00070c";

                if (!this.properties) this.properties = {};

                const findW = (n) => this.widgets?.find(w => w.name === n);

                // Migrar o inicializar en el nuevo orden I2V -> T2V -> FL2VA
                if (this.properties.i2v_active === undefined) this.properties.i2v_active = findW("i2v_active")?.value ?? true;
                if (this.properties.i2v_prompt === undefined) this.properties.i2v_prompt = findW("i2v_prompt")?.value ?? "";

                if (this.properties.t2v_active === undefined) this.properties.t2v_active = findW("t2v_active")?.value ?? false;
                if (this.properties.t2v_prompt === undefined) this.properties.t2v_prompt = findW("t2v_prompt")?.value ?? "";

                // Soporte retrospectivo para flujos previos con clave fla
                const oldFlaActive = this.properties.fla_active;
                const oldFlaPrompt = this.properties.fla_prompt;
                if (this.properties.fl2va_active === undefined) this.properties.fl2va_active = oldFlaActive ?? findW("fl2va_active")?.value ?? false;
                if (this.properties.fl2va_prompt === undefined) this.properties.fl2va_prompt = oldFlaPrompt ?? findW("fl2va_prompt")?.value ?? "";

                if (this.widgets) {
                    for (const w of this.widgets) {
                        w.type = "hidden";
                        w.computeSize = () => [0, -4];
                        w.computedHeight = 0;
                        w.draw = () => {};
                        if (w.inputEl) {
                            w.inputEl.style.display = "none";
                            w.inputEl.style.pointerEvents = "none";
                            w.inputEl.remove();
                        }
                    }
                }

                const syncState = () => {
                    const i2vActW = findW("i2v_active");
                    const i2vTxtW = findW("i2v_prompt");
                    const t2vActW = findW("t2v_active");
                    const t2vTxtW = findW("t2v_prompt");
                    const fl2vaActW = findW("fl2va_active");
                    const fl2vaTxtW = findW("fl2va_prompt");

                    if (i2vActW) i2vActW.value = this.properties.i2v_active;
                    if (i2vTxtW) i2vTxtW.value = this.properties.i2v_prompt;
                    if (t2vActW) t2vActW.value = this.properties.t2v_active;
                    if (t2vTxtW) t2vTxtW.value = this.properties.t2v_prompt;
                    if (fl2vaActW) fl2vaActW.value = this.properties.fl2va_active;
                    if (fl2vaTxtW) fl2vaTxtW.value = this.properties.fl2va_prompt;

                    updateBadge();
                    if (app.graph) app.graph.setDirtyCanvas(true, true);
                };

                    const main = document.createElement("div");
                    main.className = "mcv-vpd-container";

                    const updateBypassState = () => {
                        const isBypassed = (this.mode === 4 || this.mode === 2);
                        if (isBypassed) main.classList.add("mcv-vpd-bypassed");
                        else main.classList.remove("mcv-vpd-bypassed");
                    };

                        const origOnDrawForeground = this.onDrawForeground;
                        this.onDrawForeground = function(ctx) {
                            if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                            updateBypassState();
                        };

                        // Header
                        const header = document.createElement("div");
                        header.className = "mcv-vpd-header";

                        const title = document.createElement("span");
                        title.className = "mcv-vpd-title";
                        title.innerHTML = `${ICONS.clapper} VIDEO PROMPT DIRECTOR STUDIO`;

                        const badge = document.createElement("span");
                        badge.className = "mcv-vpd-status-badge";
                        header.append(title, badge);
                        main.appendChild(header);

                        const updateBadge = () => {
                            const activeCount = [this.properties.i2v_active, this.properties.t2v_active, this.properties.fl2va_active].filter(Boolean).length;
                            badge.textContent = `${activeCount} CHANNEL${activeCount !== 1 ? "S" : ""} ACTIVE`;
                            badge.style.color = activeCount > 0 ? "#00ff88" : "#ff4d4d";
                        };

                        // Columnas
                        const cols = document.createElement("div");
                        cols.className = "mcv-vpd-columns";

                        this.domColumns = {};

                        const createColumn = (key, label, placeholderText) => {
                            const col = document.createElement("div");
                            col.className = `mcv-vpd-col ${!this.properties[`${key}_active`] ? "disabled" : ""}`;

                            const head = document.createElement("div");
                            head.className = "mcv-vpd-col-head";

                            const colTitle = document.createElement("span");
                            colTitle.className = "mcv-vpd-col-title";
                            colTitle.textContent = label;

                            const toggleBtn = document.createElement("button");
                            const isActive = !!this.properties[`${key}_active`];
                            toggleBtn.className = `mcv-vpd-toggle-btn ${isActive ? "active" : "off"}`;
                            toggleBtn.textContent = isActive ? "ON" : "OFF";

                            toggleBtn.onclick = () => {
                                this.properties[`${key}_active`] = !this.properties[`${key}_active`];
                                const nowActive = !!this.properties[`${key}_active`];
                                toggleBtn.className = `mcv-vpd-toggle-btn ${nowActive ? "active" : "off"}`;
                                toggleBtn.textContent = nowActive ? "ON" : "OFF";
                                if (nowActive) col.classList.remove("disabled");
                                else col.classList.add("disabled");
                                syncState();
                            };

                            head.append(colTitle, toggleBtn);

                            const textarea = document.createElement("textarea");
                            textarea.className = "mcv-vpd-textarea";
                            textarea.placeholder = placeholderText;
                            textarea.value = this.properties[`${key}_prompt`] || "";

                            textarea.oninput = () => {
                                this.properties[`${key}_prompt`] = textarea.value;
                                syncState();
                            };

                            col.append(head, textarea);

                            this.domColumns[key] = { col, textarea, toggleBtn };
                            return col;
                        };

                        // Nuevo orden: 1. I2V, 2. T2V, 3. FL2VA
                        cols.append(
                            createColumn("i2v", "1. I2V (Image to Video)", "Describe character actions, dynamic motion, and temporal changes here..."),
                                    createColumn("t2v", "2. T2V (Text to Video)", "Enter Text-to-Video prompt, scene description, and camera motion here..."),
                                    createColumn("fl2va", "3. FL2VA (First & Last Frame to Video)", "Enter transition instructions and seamless keyframe morphing details here...")
                        );
                        main.appendChild(cols);

                        const domWidget = this.addDOMWidget("video_prompt_director_ui", "custom", main, { serialize: false });
                        domWidget.computeSize = (w) => [w, Math.max(450, this.size[1] - 50)];

                        this.onResize = function (size) {
                            if (size[0] < this.min_width) size[0] = this.min_width;
                            if (size[1] < this.min_height) size[1] = this.min_height;
                            const calculatedHeight = `${size[1] - 50}px`;
                            main.style.height = calculatedHeight;
                            main.style.maxHeight = calculatedHeight;
                        };

                        this.refreshUIFromProperties = () => {
                            ["i2v", "t2v", "fl2va"].forEach(key => {
                                const colData = this.domColumns?.[key];
                                if (colData) {
                                    const val = this.properties[`${key}_prompt`] || "";
                                    const active = !!this.properties[`${key}_active`];
                                    colData.textarea.value = val;
                                    colData.toggleBtn.className = `mcv-vpd-toggle-btn ${active ? "active" : "off"}`;
                                    colData.toggleBtn.textContent = active ? "ON" : "OFF";
                                    if (active) colData.col.classList.remove("disabled");
                                    else colData.col.classList.add("disabled");
                                }
                            });
                            syncState();
                        };

                        setTimeout(() => {
                            this.refreshUIFromProperties();
                            const calculatedHeight = `${this.size[1] - 50}px`;
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

                if (info?.properties) {
                    this.properties = { ...this.properties, ...info.properties };
                    // Soporte retrospectivo
                    if (this.properties.fla_active !== undefined && this.properties.fl2va_active === undefined) {
                        this.properties.fl2va_active = this.properties.fla_active;
                    }
                    if (this.properties.fla_prompt !== undefined && this.properties.fl2va_prompt === undefined) {
                        this.properties.fl2va_prompt = this.properties.fla_prompt;
                    }
                }

                if (info?.widgets_values && Array.isArray(info.widgets_values)) {
                    const wv = info.widgets_values;
                    if (wv[0] !== undefined) this.properties.i2v_active = wv[0];
                    if (wv[1] !== undefined) this.properties.i2v_prompt = wv[1];
                    if (wv[2] !== undefined) this.properties.t2v_active = wv[2];
                    if (wv[3] !== undefined) this.properties.t2v_prompt = wv[3];
                    if (wv[4] !== undefined) this.properties.fl2va_active = wv[4];
                    if (wv[5] !== undefined) this.properties.fl2va_prompt = wv[5];
                }

                setTimeout(() => {
                    if (this.refreshUIFromProperties) {
                        this.refreshUIFromProperties();
                    }
                }, 50);
            };
        }
    }
});
