import { app } from "../../../scripts/app.js";

const COLOR_HEADER = "#082833";
const COLOR_BODY = "#04151c";
const COLOR_BYPASS_HEADER = "#36163b";
const COLOR_BYPASS_BODY = "#1f0924";

// Dimensiones óptimas para alojar los 4 combos sin cortes ni desbordes
const DEFAULT_WIDTH = 450;
const DEFAULT_HEIGHT = 245;

app.registerExtension({
    name: "McValley.AnimaLoader",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_AnimaLoader") return;

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

            // Asignación de tamaño inicial holgado
            node.setSize([DEFAULT_WIDTH, DEFAULT_HEIGHT]);

            // Límites mínimos de seguridad: no permite encogerlo más allá del tamaño seguro
            node.onResize = function (size) {
                if (size[0] < 380) size[0] = 380;
                if (size[1] < DEFAULT_HEIGHT) size[1] = DEFAULT_HEIGHT;
            };

                // Reactividad al modo Bypass (Ctrl + B) y Mute
                const origDrawBackground = node.onDrawBackground;
                node.onDrawBackground = function (ctx) {
                    if (origDrawBackground) origDrawBackground.apply(this, arguments);
                    if (node.flags.collapsed) return;

                    const isBypassed = node.mode === 4 || node.mode === 2;
                    const targetHeader = isBypassed ? COLOR_BYPASS_HEADER : COLOR_HEADER;
                    const targetBody = isBypassed ? COLOR_BYPASS_BODY : COLOR_BODY;

                    if (node.color !== targetHeader || node.bgcolor !== targetBody) {
                        node.color = targetHeader;
                        node.bgcolor = targetBody;
                    }
                };
        };

        // Preserva el tamaño del usuario al recargar el flujo o cambiar de pestaña
        const origConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            if (origConfigure) origConfigure.apply(this, arguments);

            const node = this;
            node.color = COLOR_HEADER;
            node.bgcolor = COLOR_BODY;

            if (info?.size && Array.isArray(info.size)) {
                node.setSize([
                    Math.max(info.size[0], 380),
                             Math.max(info.size[1], DEFAULT_HEIGHT)
                ]);
            } else if (node.size && Array.isArray(node.size)) {
                node.setSize([
                    Math.max(node.size[0], 380),
                             Math.max(node.size[1], DEFAULT_HEIGHT)
                ]);
            }

            node.setDirtyCanvas(true, true);
        };
    }
});
