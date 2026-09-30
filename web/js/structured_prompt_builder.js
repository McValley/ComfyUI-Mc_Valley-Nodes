import { app } from "../../../scripts/app.js";

const STYLE_ID = "mcvalley-prompt-builder-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .mcv-prompt-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        background: radial-gradient(circle at 50% 0%, #062334 0%, #020a11 100%) !important;
        border: 1.2px solid #00e5ff !important;
        box-shadow: 0 0 16px rgba(0, 229, 255, 0.25), inset 0 0 18px rgba(0, 0, 0, 0.9) !important;
        border-radius: 8px !important;
        padding: 10px 12px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        width: 100% !important;
        user-select: none !important;
    }

    .mcv-prompt-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        width: 100% !important;
    }

    .mcv-prompt-card {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        background: #03131c !important;
        border: 1px solid rgba(0, 229, 255, 0.35) !important;
        border-radius: 6px !important;
        padding: 8px 10px !important;
        box-sizing: border-box !important;
        width: 100% !important;
    }

    .mcv-prompt-card-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
    }

    .mcv-card-title-input {
        background: #01080d !important;
        border: 1px solid rgba(0, 229, 255, 0.45) !important;
        border-radius: 4px !important;
        color: #00f0ff !important;
        font-family: monospace !important;
        font-size: 11px !important;
        font-weight: bold !important;
        padding: 5px 8px !important;
        flex-grow: 1 !important;
        outline: none !important;
        box-sizing: border-box !important;
    }

    .mcv-card-title-input:focus {
        border-color: #00f0ff !important;
        box-shadow: 0 0 8px rgba(0, 240, 255, 0.6) !important;
    }

    .mcv-card-delete-btn {
        background: rgba(255, 0, 85, 0.15) !important;
        border: 1px solid rgba(255, 0, 85, 0.6) !important;
        color: #ff3377 !important;
        font-family: monospace !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        padding: 4px 10px !important;
        transition: background 0.15s ease !important;
    }

    .mcv-card-delete-btn:hover {
        background: rgba(255, 0, 85, 0.5) !important;
        color: #ffffff !important;
    }

    /* Casillas amplias para escribir con holgura */
    .mcv-card-textarea {
        background: #01080d !important;
        border: 1px solid rgba(0, 229, 255, 0.25) !important;
        border-radius: 4px !important;
        color: #d8f5ff !important;
        font-family: monospace !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
        padding: 8px 10px !important;
        height: 95px !important;
        min-height: 95px !important;
        resize: vertical !important;
        outline: none !important;
        box-sizing: border-box !important;
        width: 100% !important;
    }

    .mcv-card-textarea:focus {
        border-color: #00e5ff !important;
        box-shadow: 0 0 8px rgba(0, 229, 255, 0.3) !important;
    }

    .mcv-add-btn {
        background: #00e5ff !important;
        border: none !important;
        border-radius: 5px !important;
        color: #01131a !important;
        font-family: monospace !important;
        font-size: 11px !important;
        font-weight: 900 !important;
        letter-spacing: 1.2px !important;
        cursor: pointer !important;
        padding: 9px 0 !important;
        text-align: center !important;
        box-shadow: 0 0 12px rgba(0, 229, 255, 0.4) !important;
        transition: background 0.2s ease, transform 0.1s ease !important;
        width: 100% !important;
    }

    .mcv-add-btn:hover {
        background: #5cf0ff !important;
    }

    .mcv-add-btn:active {
        transform: scale(0.98) !important;
    }

    /* Bypass mode (Ctrl + B) */
    .mcv-prompt-container.mcv-bypassed {
        background: radial-gradient(circle at 50% 0%, #1e0a24 0%, #09020d 100%) !important;
        border: 1px solid #9333ea !important;
        box-shadow: 0 0 16px rgba(147, 51, 234, 0.3) !important;
    }

    .mcv-prompt-container.mcv-bypassed .mcv-card-title-input {
        color: #d8b4fe !important;
        border-color: rgba(168, 85, 247, 0.4) !important;
    }

    .mcv-prompt-container.mcv-bypassed .mcv-add-btn {
        background: #9333ea !important;
        color: #ffffff !important;
        box-shadow: 0 0 10px rgba(147, 51, 234, 0.5) !important;
    }
    `;
    document.head.appendChild(style);
}

app.registerExtension({
    name: "McValley.StructuredPromptBuilder",
    async nodeCreated(node) {
        if (node.comfyClass !== "McValley_StructuredPromptBuilder") return;

        injectStyles();

        const NODE_WIDTH = 480;
        node.color = "#072b38";
        node.bgcolor = "#051b24";

        // Desactivamos el redimensionado manual para que el cálculo matemático tenga el control total
        node.resizable = false;

        // Ocultar widget nativo de serialización
        const rawWidget = node.widgets?.find(w => w.name === "prompt_blocks");
        if (rawWidget) {
            rawWidget.type = "hidden";
            rawWidget.computeSize = () => [0, -4];
            rawWidget.computedHeight = 0;
            rawWidget.draw = () => {};
            if (rawWidget.element) rawWidget.element.style.display = "none";
        }

        const container = document.createElement("div");
        container.className = "mcv-prompt-container";

        const listContainer = document.createElement("div");
        listContainer.className = "mcv-prompt-list";
        container.appendChild(listContainer);

        const addBtn = document.createElement("button");
        addBtn.className = "mcv-add-btn";
        addBtn.innerText = "+ ADD PROMPT";
        container.appendChild(addBtn);

        let blocksData = [];
        try {
            blocksData = JSON.parse(rawWidget?.value || "[]");
        } catch (e) {
            blocksData = [];
        }

        // Fórmula matemática exacta: cabecera del nodo + margen + (bloques * altura unitaria) + botón
        const calculateExactHeight = () => {
            const baseHeaderOffset = 115;
            const singleBlockHeight = 160; // tarjeta con textarea amplio (95px) + padding + título
            return baseHeaderOffset + (blocksData.length * singleBlockHeight);
        };

        const updateNodeDimensions = () => {
            requestAnimationFrame(() => {
                const targetH = calculateExactHeight();
                node.setSize([NODE_WIDTH, targetH]);
                node.setDirtyCanvas(true, true);
            });
        };

        // Bloqueo de tamaño en onResize
        node.onResize = function (size) {
            size[0] = NODE_WIDTH;
            size[1] = calculateExactHeight();
        };

        const syncToWidget = () => {
            if (rawWidget) {
                rawWidget.value = JSON.stringify(blocksData);
            }
            updateNodeDimensions();
        };

        const renderBlock = (dataItem, index) => {
            const card = document.createElement("div");
            card.className = "mcv-prompt-card";

            const header = document.createElement("div");
            header.className = "mcv-prompt-card-header";

            const titleInput = document.createElement("input");
            titleInput.className = "mcv-card-title-input";
            titleInput.placeholder = "Block title (Subject, Lighting, Camera, LoRA)...";
            titleInput.value = dataItem.title || "";
            titleInput.oninput = (e) => {
                blocksData[index].title = e.target.value;
                if (rawWidget) rawWidget.value = JSON.stringify(blocksData);
            };

                const delBtn = document.createElement("button");
                delBtn.className = "mcv-card-delete-btn";
                delBtn.innerText = "✕";
                delBtn.onclick = () => {
                    blocksData.splice(index, 1);
                    refreshDOM();
                    syncToWidget(); // Al borrar, recalcula y encoge el nodo de inmediato
                };

                header.appendChild(titleInput);
                header.appendChild(delBtn);

                const textArea = document.createElement("textarea");
                textArea.className = "mcv-card-textarea";
                textArea.placeholder = "Write detailed prompt tags here...";
                textArea.value = dataItem.text || "";
                textArea.oninput = (e) => {
                    blocksData[index].text = e.target.value;
                    if (rawWidget) rawWidget.value = JSON.stringify(blocksData);
                };

                    card.appendChild(header);
                    card.appendChild(textArea);
                    return card;
        };

        const refreshDOM = () => {
            listContainer.innerHTML = "";
            blocksData.forEach((item, idx) => {
                listContainer.appendChild(renderBlock(item, idx));
            });
        };

        addBtn.onclick = () => {
            blocksData.push({ title: "", text: "" });
            refreshDOM();
            syncToWidget();
        };

        if (blocksData.length === 0) {
            blocksData.push({ title: "", text: "" });
        }

        node.addDOMWidget("prompt_builder_ui", "custom_ui", container, { serialize: false });
        refreshDOM();
        syncToWidget();

        // Persistencia al cambiar de flujo o pestaña
        const origOnConfigure = node.onConfigure;
        node.onConfigure = function() {
            if (origOnConfigure) origOnConfigure.apply(this, arguments);
            try {
                blocksData = JSON.parse(rawWidget?.value || "[]");
            } catch (e) {
                blocksData = [];
            }
            refreshDOM();
            syncToWidget();
        };

        // Soporte Bypass en vivo
        const origDrawForeground = node.onDrawForeground;
        node.onDrawForeground = function(ctx) {
            if (origDrawForeground) origDrawForeground.apply(this, arguments);
            const isBypassed = this.mode === 4 || this.mode === 2;
            container.classList.toggle("mcv-bypassed", isBypassed);
        };
    }
});
