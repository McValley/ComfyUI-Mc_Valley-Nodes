import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const CYAN_NEON = "#00e5ff";
const CYAN_BG = "#072b38";
const CYAN_DARK = "#051b24";

const PURPLE_BYPASS = "#9333ea";
const PURPLE_BG = "#2a0845";
const PURPLE_DARK = "#120324";

app.registerExtension({
    name: "McValley.FrameInspectorTrimmer",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_FrameInspectorTrimmer") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);

            const node = this;

            // Chasis Cian Mc_Valley
            this.color = CYAN_BG;
            this.bgcolor = CYAN_DARK;
            this.properties = this.properties || {};
            this.spriteImg = new Image();
            this.spriteMeta = this.properties["mcv_sprite_meta"] || null;

            // Habilitar redimensionamiento libre en el lienzo
            this.resizable = true;

            // Contenedor principal que llena el nodo
            const container = document.createElement("div");
            container.id = "mcv-inspector-wrap";
            Object.assign(container.style, {
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "10px 12px",
                background: "radial-gradient(circle at 50% 0%, #062334 0%, #020a11 100%)",
                          border: `1.5px solid ${CYAN_NEON}`,
                          boxShadow: `0 0 18px rgba(0, 229, 255, 0.28), inset 0 0 20px rgba(0, 0, 0, 0.95)`,
                          borderRadius: "8px",
                          boxSizing: "border-box",
                          width: "100%",
                          height: "100%",
                          userSelect: "none",
                          transition: "border 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease"
            });

            // Encabezado con tipografía más visible
            const header = document.createElement("div");
            Object.assign(header.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: "0"
            });
            header.innerHTML = `
            <span id="mcv-title" style="color: ${CYAN_NEON}; font-size: 11.5px; font-weight: 900; letter-spacing: 1.5px; text-shadow: 0 0 10px rgba(0, 229, 255, 0.8);">FRAME INSPECTOR</span>
            <span id="mcv-trim-badge" style="color: #02060c; background: ${CYAN_NEON}; font-size: 9.5px; font-weight: bold; border-radius: 4px; padding: 2px 8px; letter-spacing: 0.5px; box-shadow: 0 0 8px rgba(0, 229, 255, 0.4);">READY</span>
            `;
            container.appendChild(header);

            // Marco del visor: flex: 1 para ocupar todo el espacio vertical sobrante
            const previewBox = document.createElement("div");
            Object.assign(previewBox.style, {
                width: "100%",
                flex: "1",
                minHeight: "180px",
                background: "#01060a",
                border: "1px solid rgba(0, 229, 255, 0.4)",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                          boxShadow: "inset 0 0 14px rgba(0,0,0,0.8)"
            });

            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 320;
            Object.assign(canvas.style, {
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "none"
            });
            const ctx = canvas.getContext("2d");
            previewBox.appendChild(canvas);

            const placeholder = document.createElement("span");
            Object.assign(placeholder.style, {
                color: "#1e5361",
                fontSize: "11px",
                fontFamily: "monospace",
                textAlign: "center",
                letterSpacing: "1px",
                padding: "10px"
            });
            placeholder.textContent = "QUEUE PROMPT TO LOAD FRAMES";
            previewBox.appendChild(placeholder);

            container.appendChild(previewBox);

            // Renderizado en vivo del fotograma
            node.renderCurrentFrame = function () {
                const targetWidget = node.widgets?.find(w => w.name === "preview_target_frame");
                const targetVal = targetWidget ? parseInt(targetWidget.value, 10) : 0;
                const badge = container.querySelector("#mcv-trim-badge");

                if (!node.spriteMeta || !node.spriteImg.complete || node.spriteImg.naturalWidth === 0) {
                    if (badge) badge.textContent = `FRAME #${targetVal}`;
                    return;
                }

                const meta = node.spriteMeta;
                const idx = Math.max(0, Math.min(targetVal, meta.total_frames - 1));
                const sx = idx * meta.thumb_w;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(node.spriteImg, sx, 0, meta.thumb_w, meta.thumb_h, 0, 0, canvas.width, canvas.height);

                if (badge) {
                    const isTrimmed = (idx < meta.start_idx || idx >= meta.end_idx);
                    badge.textContent = `F: ${idx} / ${meta.total_frames - 1} ${isTrimmed ? '[CUT]' : '[KEEP]'}`;
                    badge.style.background = isTrimmed ? "#ff3366" : CYAN_NEON;
                    badge.style.boxShadow = isTrimmed ? "0 0 8px rgba(255, 51, 102, 0.6)" : "0 0 8px rgba(0, 229, 255, 0.4)";
                }

                placeholder.style.display = "none";
                canvas.style.display = "block";
            };

            // Reactividad al arrastrar el slider
            const targetWidget = this.widgets?.find(w => w.name === "preview_target_frame");
            if (targetWidget) {
                const origCallback = targetWidget.callback;
                targetWidget.callback = function (value) {
                    if (origCallback) origCallback.apply(this, arguments);
                    node.renderCurrentFrame();
                    app.graph.setDirtyCanvas(true, true);
                };
            }

            // Sincronización con modo Bypass (Ctrl + B)
            node.applyBypassTheme = function () {
                const isBypassed = node.mode === 4 || node.mode === 2;
                const title = container.querySelector("#mcv-title");
                const badge = container.querySelector("#mcv-trim-badge");

                if (isBypassed) {
                    node.color = PURPLE_BG;
                    node.bgcolor = PURPLE_DARK;
                    container.style.background = "radial-gradient(circle at 50% 0%, #1e0533 0%, #08010f 100%)";
                    container.style.border = `1.5px solid ${PURPLE_BYPASS}`;
                    container.style.boxShadow = `0 0 16px rgba(147, 51, 234, 0.35), inset 0 0 16px rgba(0, 0, 0, 0.95)`;
                    previewBox.style.border = "1px solid rgba(147, 51, 234, 0.4)";
                    container.style.opacity = "0.45";
                    container.style.pointerEvents = "none";

                    if (title) {
                        title.style.color = PURPLE_BYPASS;
                        title.style.textShadow = `0 0 8px rgba(147, 51, 234, 0.8)`;
                    }
                    if (badge) {
                        badge.textContent = "BYPASS";
                        badge.style.background = PURPLE_BYPASS;
                        badge.style.color = "#ffffff";
                    }
                } else {
                    node.color = CYAN_BG;
                    node.bgcolor = CYAN_DARK;
                    container.style.background = "radial-gradient(circle at 50% 0%, #062334 0%, #020a11 100%)";
                    container.style.border = `1.5px solid ${CYAN_NEON}`;
                    container.style.boxShadow = `0 0 18px rgba(0, 229, 255, 0.28), inset 0 0 20px rgba(0, 0, 0, 0.95)`;
                    previewBox.style.border = "1px solid rgba(0, 229, 255, 0.4)";
                    container.style.opacity = "1.0";
                    container.style.pointerEvents = "auto";

                    if (title) {
                        title.style.color = CYAN_NEON;
                        title.style.textShadow = `0 0 10px rgba(0, 229, 255, 0.8)`;
                    }
                    node.renderCurrentFrame();
                }
            };

            const origOnModeChange = this.onModeChange;
            this.onModeChange = function () {
                if (origOnModeChange) origOnModeChange.apply(this, arguments);
                node.applyBypassTheme();
            };

            const origDrawBackground = this.onDrawBackground;
            this.onDrawBackground = function () {
                if (origDrawBackground) origDrawBackground.apply(this, arguments);
                const currentBypassed = (this.mode === 4 || this.mode === 2);
                if (this._lastBypassedState !== currentBypassed) {
                    this._lastBypassedState = currentBypassed;
                    node.applyBypassTheme();
                }
            };

            // Inyectar el widget DOM auto-escalable
            const domWidget = this.addDOMWidget("mcv_frame_inspector_ui", "custom", container, { serialize: false });

            // computeSize dinámico: toma el ancho total y descuenta el espacio de los 3 widgets nativos superiores
            domWidget.computeSize = (w) => {
                const currentH = node.size ? node.size[1] : 490;
                return [w, Math.max(220, currentH - 125)];
            };

            // Ajuste dinámico en vivo al estirar el nodo
            this.onResize = function (size) {
                // Límites mínimos para no colapsar los controles
                if (size[0] < 360) size[0] = 360;
                if (size[1] < 420) size[1] = 420;

                // Forzar redibujado de la previsualización al cambiar dimensiones
                if (node.renderCurrentFrame) {
                    node.renderCurrentFrame();
                }
            };

            // Carga de metadatos persistentes
            node.loadSpriteFromMeta = function (meta) {
                if (!meta || !meta.filename) return;
                node.spriteMeta = meta;
                node.properties["mcv_sprite_meta"] = meta;

                if (targetWidget) {
                    targetWidget.options.max = meta.total_frames - 1;
                }

                const url = api.apiURL(`/view?filename=${encodeURIComponent(meta.filename)}&type=${meta.type}&subfolder=${encodeURIComponent(meta.subfolder || '')}`);
                node.spriteImg.src = url;
                node.spriteImg.onload = () => {
                    node.renderCurrentFrame();
                    app.graph.setDirtyCanvas(true, true);
                };
            };

            // Recibir respuesta del backend
            const onExecuted = nodeType.prototype.onExecuted;
            this.onExecuted = function (message) {
                if (onExecuted) onExecuted.apply(this, arguments);
                if (message?.sprite_meta && message.sprite_meta.length > 0) {
                    node.loadSpriteFromMeta(message.sprite_meta[0]);
                }
            };

            // Dimensiones por defecto más amplias y proporcionadas
            this.setSize([430, 520]);
            this.applyBypassTheme();

            if (this.properties["mcv_sprite_meta"]) {
                setTimeout(() => {
                    node.loadSpriteFromMeta(node.properties["mcv_sprite_meta"]);
                }, 100);
            }
        };

        // Rehidratación al cambiar de workflow o recargar pestaña
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            if (origOnConfigure) origOnConfigure.apply(this, arguments);
            const savedMeta = info?.properties?.["mcv_sprite_meta"] || this.properties?.["mcv_sprite_meta"];
            if (savedMeta) {
                setTimeout(() => {
                    if (this.loadSpriteFromMeta) {
                        this.loadSpriteFromMeta(savedMeta);
                    }
                }, 100);
            }
        };
    }
});
