import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

// Paleta visual Cyberpunk / Mc_Valley Suite
const COLOR_HEADER = "#063b40";
const COLOR_BODY = "#03171a";
const COLOR_CYAN = "#00e5ff";

// Bypass / Mute (Ctrl + B)
const COLOR_BYPASS_HEADER = "#36163b";
const COLOR_BYPASS_BODY = "#1f0924";

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 680;

app.registerExtension({
    name: "McValley.MiniMaxVideoSaverStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_MiniMaxVideoSaverStudio") return;

        nodeData.color = COLOR_HEADER;
        nodeData.bgcolor = COLOR_BODY;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);

            const node = this;
            node.color = COLOR_HEADER;
            node.bgcolor = COLOR_BODY;

            if (window.LiteGraph) {
                node.shape = window.LiteGraph.ROUND_SHAPE;
            }

            node.resizable = true;

            if (!node.size || node.size[0] < 200 || node.size[1] < 200) {
                node.setSize([DEFAULT_WIDTH, DEFAULT_HEIGHT]);
            }

            if (!node.properties) node.properties = {};

            // Contenedor elástico con captura de eventos aislada
            const previewContainer = document.createElement("div");
            Object.assign(previewContainer.style, {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "96%",
                margin: "4px auto 6px auto",
                background: "#020f12",
                border: `1.2px solid ${COLOR_CYAN}`,
                borderRadius: "8px",
                padding: "2px",
                boxSizing: "border-box",
                boxShadow: "0 0 16px rgba(0, 229, 255, 0.22), inset 0 0 14px rgba(0, 0, 0, 0.95)",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                          overflow: "hidden",
                          position: "relative",
                          zIndex: "10",
                          pointerEvents: "auto"
            });

            // Blindaje de eventos de ratón para que no los intercepte LiteGraph
            ["pointerdown", "mousedown", "click", "dblclick", "wheel"].forEach(evtName => {
                previewContainer.addEventListener(evtName, (e) => {
                    e.stopPropagation();
                }, { passive: false });
            });

            const videoEl = document.createElement("video");
            Object.assign(videoEl.style, {
                width: "100%",
                height: "100%",
                maxHeight: "none",
                objectFit: "contain",
                borderRadius: "6px",
                backgroundColor: "#000",
                outline: "none",
                display: "none",
                pointerEvents: "auto",
                cursor: "pointer"
            });
            videoEl.controls = true;
            videoEl.autoplay = false;
            videoEl.loop = true;
            videoEl.preload = "auto";
            videoEl.playsInline = true;
            videoEl.muted = false;
            videoEl.volume = 1.0;
            previewContainer.appendChild(videoEl);

            const placeholder = document.createElement("div");
            placeholder.innerText = "⚡ AWAITING MINIMAX RENDER ⚡";
            Object.assign(placeholder.style, {
                color: COLOR_CYAN,
                fontFamily: "monospace",
                fontSize: "12px",
                fontWeight: "bold",
                padding: "40px 0",
                letterSpacing: "1.2px",
                textAlign: "center",
                userSelect: "none",
                pointerEvents: "none"
            });
            previewContainer.appendChild(placeholder);

            const updateVisualLayout = () => {
                const headerAndWidgetsOffset = 215;
                const dynamicHeight = Math.max(node.size[1] - headerAndWidgetsOffset, 200);
                previewContainer.style.height = `${dynamicHeight}px`;
                if (node.setDirtyCanvas) {
                    node.setDirtyCanvas(true, true);
                }
            };

            node.onResize = function (size) {
                if (size[0] < 420) size[0] = 420;
                if (size[1] < 420) size[1] = 420;
                updateVisualLayout();
            };

            const domWidget = node.addDOMWidget("minimax_saver_preview", "custom_preview", previewContainer, { serialize: false });

            domWidget.computeSize = function (width) {
                const headerAndWidgetsOffset = 215;
                const h = Math.max(node.size[1] - headerAndWidgetsOffset, 200);
                return [width, h];
            };

            const loadVideoSource = (videoData) => {
                if (!videoData || !videoData.filename) return;
                const cacheBust = `&t=${Date.now()}`;
                const videoUrl = api.apiURL(
                    `/view?filename=${encodeURIComponent(videoData.filename)}&subfolder=${encodeURIComponent(videoData.subfolder || "")}&type=${encodeURIComponent(videoData.type || "output")}${cacheBust}`
                );

                videoEl.src = videoUrl;
                placeholder.style.display = "none";
                videoEl.style.display = "block";

                // Escuchar eventos para garantizar la reactividad inmediata del botón Play
                videoEl.onloadedmetadata = () => {
                    updateVisualLayout();
                    if (app.graph) {
                        app.graph.setDirtyCanvas(true, true);
                    }
                };

                videoEl.load();
                updateVisualLayout();

                // Forzar resincronización de coordenadas con LiteGraph
                requestAnimationFrame(() => {
                    updateVisualLayout();
                    if (node.onResize) node.onResize(node.size);
                });
            };

            const onExecuted = node.onExecuted;
            node.onExecuted = function (output) {
                if (onExecuted) onExecuted.apply(this, arguments);

                const videoData = output?.videos?.[0];
                if (videoData) {
                    node.properties["persisted_video"] = videoData;
                    loadVideoSource(videoData);
                }
            };

            const origConfigure = node.onConfigure;
            node.onConfigure = function (info) {
                if (origConfigure) origConfigure.apply(this, arguments);
                node.color = COLOR_HEADER;
                node.bgcolor = COLOR_BODY;

                if (node.properties?.["persisted_video"]) {
                    loadVideoSource(node.properties["persisted_video"]);
                }

                if (info?.size && Array.isArray(info.size)) {
                    node.setSize([Math.max(info.size[0], 420), Math.max(info.size[1], 420)]);
                }
                setTimeout(() => {
                    updateVisualLayout();
                    node.setDirtyCanvas(true, true);
                }, 40);
            };

            const origDrawBackground = node.onDrawBackground;
            node.onDrawBackground = function (ctx) {
                if (origDrawBackground) origDrawBackground.apply(this, arguments);
                if (node.flags?.collapsed) return;

                const isBypassed = node.mode === 4 || node.mode === 2;
                const targetHeader = isBypassed ? COLOR_BYPASS_HEADER : COLOR_HEADER;
                const targetBody = isBypassed ? COLOR_BYPASS_BODY : COLOR_BODY;

                if (node.color !== targetHeader || node.bgcolor !== targetBody) {
                    node.color = targetHeader;
                    node.bgcolor = targetBody;
                }

                if (previewContainer) {
                    previewContainer.style.borderColor = isBypassed ? "#9333ea" : COLOR_CYAN;
                    previewContainer.style.boxShadow = isBypassed
                    ? "0 0 14px rgba(147, 51, 234, 0.35), inset 0 0 12px rgba(0,0,0,0.95)"
                    : "0 0 16px rgba(0, 229, 255, 0.22), inset 0 0 14px rgba(0,0,0,0.95)";
                }
            };

            setTimeout(() => {
                updateVisualLayout();
                node.setDirtyCanvas(true, true);
            }, 60);
        };
    }
});
