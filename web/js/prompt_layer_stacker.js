import { app } from "../../../scripts/app.js";

const CSS_ID = "mcvalley-stacker-injected-style";
if (!document.getElementById(CSS_ID)) {
    const styleEl = document.createElement("style");
    styleEl.id = CSS_ID;
    styleEl.textContent = `
    .mcvalley-stacker-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        background: radial-gradient(circle at 50% 0%, #062334 0%, #020a11 100%) !important;
        border: 1px solid #00e5ff !important;
        box-shadow: 0 0 16px rgba(0, 229, 255, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.9) !important;
        border-radius: 9px !important;
        padding: 12px !important;
        margin: 4px auto 8px auto !important;
        user-select: none !important;
        box-sizing: border-box !important;
        width: 430px !important;
        transition: all 0.25s ease !important;
    }
    .mcvalley-stacker-header {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        padding-bottom: 6px !important;
        border-bottom: 1px solid rgba(0, 229, 255, 0.25) !important;
        width: 100% !important;
    }
    .mcvalley-stacker-header-row {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
    }
    .mcvalley-stacker-title {
        font-family: 'Segoe UI', monospace, sans-serif !important;
        font-size: 11px !important;
        font-weight: 900 !important;
        color: #00e5ff !important;
        letter-spacing: 1.5px !important;
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.8) !important;
    }
    .mcvalley-clear-all-btn {
        background: rgba(255, 0, 85, 0.12) !important;
        border: 1px solid #ff0055 !important;
        color: #ff3377 !important;
        border-radius: 4px !important;
        padding: 3px 10px !important;
        font-family: monospace !important;
        font-size: 8.5px !important;
        font-weight: bold !important;
        letter-spacing: 0.8px !important;
        cursor: pointer !important;
    }
    .mcvalley-clear-all-btn:hover {
        background: #ff0055 !important;
        color: #ffffff !important;
        box-shadow: 0 0 8px rgba(255, 0, 85, 0.8) !important;
    }
    .mcvalley-stacker-bypass-banner {
        display: none;
        width: 100% !important;
        padding: 3px 0 !important;
        margin-top: 2px !important;
        border-radius: 4px !important;
        font-family: monospace !important;
        font-size: 8.5px !important;
        font-weight: bold !important;
        letter-spacing: 1px !important;
        text-align: center !important;
    }
    .mcvalley-layers-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 9px !important;
        width: 100% !important;
    }
    .mcvalley-empty-state {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 26px 10px !important;
        gap: 4px !important;
        color: #4a7788 !important;
        font-family: monospace !important;
        font-size: 9.5px !important;
        font-weight: bold !important;
        letter-spacing: 1px !important;
        border: 1px dashed rgba(0, 229, 255, 0.2) !important;
        border-radius: 6px !important;
        background: rgba(0, 0, 0, 0.25) !important;
    }
    .mcvalley-empty-state small {
        font-size: 8px !important;
        color: #2b5563 !important;
    }
    .mcvalley-layer-card {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        background: rgba(3, 15, 23, 0.85) !important;
        border: 1px solid rgba(0, 229, 255, 0.3) !important;
        border-radius: 6px !important;
        padding: 8px 10px !important;
        box-sizing: border-box !important;
    }
    .mcvalley-layer-topbar {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        width: 100% !important;
    }
    .mcvalley-layer-index {
        font-family: monospace !important;
        font-size: 9.5px !important;
        font-weight: bold !important;
        color: #00e5ff !important;
        min-width: 24px !important;
    }
    .mcvalley-layer-title-input {
        flex: 1 !important;
        background: #02070c !important;
        border: 1px solid rgba(0, 229, 255, 0.35) !important;
        border-radius: 4px !important;
        padding: 4px 8px !important;
        font-family: 'Segoe UI', monospace, sans-serif !important;
        font-size: 10px !important;
        font-weight: bold !important;
        color: #90ebff !important;
        outline: none !important;
        box-sizing: border-box !important;
    }
    .mcvalley-layer-del-btn {
        background: #140507 !important;
        border: 1px solid #ff0055 !important;
        color: #ff0055 !important;
        border-radius: 4px !important;
        width: 22px !important;
        height: 22px !important;
        cursor: pointer !important;
        font-weight: bold !important;
        font-size: 12px !important;
        line-height: 20px !important;
        text-align: center !important;
    }
    .mcvalley-layer-textarea {
        width: 100% !important;
        height: 70px !important;
        background: #010408 !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 4px !important;
        padding: 8px !important;
        font-family: monospace !important;
        font-size: 10.5px !important;
        line-height: 1.4 !important;
        color: #e0faff !important;
        resize: none !important;
        outline: none !important;
        box-sizing: border-box !important;
    }
    .mcvalley-add-layer-btn {
        width: 100% !important;
        padding: 9px 0 !important;
        margin-top: 2px !important;
        background: #04121a !important;
        border: 1px dashed #00e5ff !important;
        border-radius: 6px !important;
        color: #00e5ff !important;
        font-family: monospace !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        letter-spacing: 1.5px !important;
        cursor: pointer !important;
        text-align: center !important;
        box-sizing: border-box !important;
    }
    .mcvalley-stacker-container.mcvalley-bypassed {
        background: radial-gradient(circle at 50% 0%, #1e0a24 0%, #09020d 100%) !important;
        border: 1px solid #9333ea !important;
        box-shadow: 0 0 16px rgba(147, 51, 234, 0.35), inset 0 0 20px rgba(0, 0, 0, 0.95) !important;
    }
    .mcvalley-stacker-container.mcvalley-bypassed .mcvalley-stacker-title {
        color: #d8b4fe !important;
        text-shadow: 0 0 10px rgba(192, 132, 252, 0.7) !important;
    }
    .mcvalley-stacker-container.mcvalley-bypassed .mcvalley-clear-all-btn {
        opacity: 0.3 !important;
        pointer-events: none !important;
    }
    .mcvalley-stacker-container.mcvalley-bypassed .mcvalley-stacker-bypass-banner {
        display: block !important;
        background: rgba(147, 51, 234, 0.2) !important;
        border: 1px solid #a855f7 !important;
        color: #f3e8ff !important;
        box-shadow: 0 0 10px rgba(168, 85, 247, 0.4) !important;
    }
    .mcvalley-stacker-container.mcvalley-bypassed .mcvalley-layers-list,
    .mcvalley-stacker-container.mcvalley-bypassed .mcvalley-add-layer-btn {
        opacity: 0.25 !important;
        pointer-events: none !important;
    }
    `;
    document.head.appendChild(styleEl);
}

const NODE_ACTIVE_HEADER = "#072b38";
const NODE_ACTIVE_BODY = "#051b24";
const NODE_BYPASS_HEADER = "#36163b";
const NODE_BYPASS_BODY = "#240e28";

app.registerExtension({
    name: "McValley.PromptLayerStacker",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_PromptLayerStacker") return;

        nodeType.prototype.color = NODE_ACTIVE_HEADER;
        nodeType.prototype.bgcolor = NODE_ACTIVE_BODY;

        // 1. Desactivar redimensionamiento a nivel de prototipo
        nodeType.prototype.resizable = false;

        const origConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            if (origConfigure) origConfigure.apply(this, arguments);

            // 2. Bloquear redimensionamiento al cargar flujos guardados
            this.resizable = false;
            this.flags = this.flags || {};
            this.flags.resizable = false;

            if (info?.properties?.layers) {
                this.layers = info.properties.layers;
            }
            if (this.rebuildUI) this.rebuildUI();
            if (this.updateBypassState) this.updateBypassState();
        };

            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                const node = this;
                this.color = NODE_ACTIVE_HEADER;
                this.bgcolor = NODE_ACTIVE_BODY;

                // 3. Bloquear tirador manual en la instancia
                this.resizable = false;
                this.flags = this.flags || {};
                this.flags.resizable = false;

                this.properties = this.properties || {};
                this.layers = this.properties.layers || [
                    { title: "Layer 1", text: "" },
                    { title: "Layer 2", text: "" },
                    { title: "Layer 3", text: "" },
                    { title: "Layer 4", text: "" }
                ];

                const getCalculatedHeight = () => {
                    const count = node.layers ? node.layers.length : 0;
                    if (count === 0) return 220;
                    return 165 + (count * 138);
                };

                // Interceptar cualquier intento de arrastre del usuario
                this.onResize = function (size) {
                    const targetH = getCalculatedHeight();
                    if (size) {
                        size[0] = 460;
                        size[1] = targetH;
                    }
                    return [460, targetH];
                };

                const dataWidget = this.widgets ? this.widgets.find(w => w.name === "layer_data") : null;
                if (dataWidget) {
                    dataWidget.computeSize = () => [0, -4];
                    dataWidget.draw = () => {};
                    if (dataWidget.element) dataWidget.element.style.display = "none";
                }

                const container = document.createElement("div");
                container.className = "mcvalley-stacker-container";

                const header = document.createElement("div");
                header.className = "mcvalley-stacker-header";
                header.innerHTML = `
                <div class="mcvalley-stacker-header-row">
                <span class="mcvalley-stacker-title">PROMPT LAYER STACKER</span>
                <button type="button" class="mcvalley-clear-all-btn" title="Remove all prompt layers">CLEAR ALL</button>
                </div>
                <div class="mcvalley-stacker-bypass-banner">⚡ BYPASS MODE ACTIVE (PASSTHROUGH)</div>
                `;
                container.appendChild(header);

                const clearBtn = header.querySelector(".mcvalley-clear-all-btn");
                clearBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    node.layers = [];
                    node.rebuildUI();
                    syncData();
                });

                const listWrap = document.createElement("div");
                listWrap.className = "mcvalley-layers-list";
                container.appendChild(listWrap);

                const addBtn = document.createElement("div");
                addBtn.className = "mcvalley-add-layer-btn";
                addBtn.innerHTML = "+ ADD PROMPT LAYER";
                container.appendChild(addBtn);

                const syncData = () => {
                    node.properties.layers = node.layers;
                    if (dataWidget) {
                        dataWidget.value = JSON.stringify(node.layers);
                        if (dataWidget.callback) dataWidget.callback(dataWidget.value);
                    }
                    if (app.graph) app.graph.setDirtyCanvas(true, true);
                };

                    const autoResizeNode = () => {
                        const totalH = getCalculatedHeight();
                        node.size = [460, totalH];
                        node.setSize([460, totalH]);
                        if (domWidget) {
                            domWidget.computeSize = () => [430, totalH - 65];
                        }
                        if (app.graph) app.graph.setDirtyCanvas(true, true);
                    };

                        this.rebuildUI = () => {
                            listWrap.innerHTML = "";

                            if (node.layers.length === 0) {
                                const emptyState = document.createElement("div");
                                emptyState.className = "mcvalley-empty-state";
                                emptyState.innerHTML = `
                                <span>NO ACTIVE PROMPT LAYERS</span>
                                <small>CLICK "+ ADD PROMPT LAYER" TO BEGIN</small>
                                `;
                                listWrap.appendChild(emptyState);
                            } else {
                                node.layers.forEach((layer, idx) => {
                                    const card = document.createElement("div");
                                    card.className = "mcvalley-layer-card";

                                    const topbar = document.createElement("div");
                                    topbar.className = "mcvalley-layer-topbar";

                                    const indexLabel = document.createElement("span");
                                    indexLabel.className = "mcvalley-layer-index";
                                    indexLabel.textContent = `#${idx + 1}`;

                                    const titleInput = document.createElement("input");
                                    titleInput.className = "mcvalley-layer-title-input";
                                    titleInput.type = "text";
                                    titleInput.placeholder = "Layer Title (e.g. Details, Lighting)";
                                    titleInput.value = layer.title || "";
                                    titleInput.addEventListener("input", (e) => {
                                        layer.title = e.target.value;
                                        syncData();
                                    });

                                    const delBtn = document.createElement("div");
                                    delBtn.className = "mcvalley-layer-del-btn";
                                    delBtn.innerHTML = "×";
                                    delBtn.title = "Delete this layer";
                                    delBtn.addEventListener("click", () => {
                                        node.layers.splice(idx, 1);
                                        node.rebuildUI();
                                        syncData();
                                    });

                                    topbar.appendChild(indexLabel);
                                    topbar.appendChild(titleInput);
                                    topbar.appendChild(delBtn);

                                    const textarea = document.createElement("textarea");
                                    textarea.className = "mcvalley-layer-textarea";
                                    textarea.placeholder = "Enter keywords here...";
                                    textarea.value = layer.text || "";
                                    textarea.addEventListener("input", (e) => {
                                        layer.text = e.target.value;
                                        syncData();
                                    });

                                    card.appendChild(topbar);
                                    card.appendChild(textarea);
                                    listWrap.appendChild(card);
                                });
                            }

                            autoResizeNode();
                        };

                        addBtn.addEventListener("click", () => {
                            node.layers.push({
                                title: `Layer ${node.layers.length + 1}`,
                                text: ""
                            });
                            node.rebuildUI();
                            syncData();
                        });

                        this.updateBypassState = () => {
                            const isNativeBypassed = (node.mode === 4 || node.mode === 2);
                            if (isNativeBypassed) {
                                container.classList.add("mcvalley-bypassed");
                                node.color = NODE_BYPASS_HEADER;
                                node.bgcolor = NODE_BYPASS_BODY;
                            } else {
                                container.classList.remove("mcvalley-bypassed");
                                node.color = NODE_ACTIVE_HEADER;
                                node.bgcolor = NODE_ACTIVE_BODY;
                            }
                            if (app.graph) app.graph.setDirtyCanvas(true, true);
                        };

                            const origOnModeChange = this.onModeChange;
                            this.onModeChange = function (mode) {
                                if (origOnModeChange) origOnModeChange.apply(this, arguments);
                                node.updateBypassState();
                            };

                            const origDrawForeground = this.onDrawForeground;
                            this.onDrawForeground = function (c) {
                                if (origDrawForeground) origDrawForeground.apply(this, arguments);
                                node.updateBypassState();
                            };

                            const domWidget = this.addDOMWidget("interactive_stacker_view", "btn", container, {
                                serialize: false
                            });

                            setTimeout(() => {
                                node.rebuildUI();
                                syncData();
                                node.updateBypassState();
                            }, 70);
            };
    }
});
