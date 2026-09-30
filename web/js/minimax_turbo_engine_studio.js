import { app } from "/scripts/app.js";

const TEAL_HEADER = "#063b40";
const TEAL_BODY   = "#03171a";
const CYAN_ACCENT = "#00e5ff";

const PURPLE_BYPASS_HEADER = "#2a0845";
const PURPLE_BYPASS_BODY   = "#120324";

const DEFAULT_WIDTH  = 380;
const DEFAULT_HEIGHT = 160;

app.registerExtension({
    name: "McValley.MiniMaxTurboEngineStudio",

    async nodeCreated(node) {
        // Detectar por comfyClass o por type
        const className = node.comfyClass || node.type;
        if (className !== "McValley_MiniMaxTurboEngine") return;

        // 1. Asignar colores de la suite Mc_Valley
        node.color = TEAL_HEADER;
        node.bgcolor = TEAL_BODY;
        node.title_color = CYAN_ACCENT;

        if (window.LiteGraph) {
            node.shape = window.LiteGraph.ROUND_SHAPE;
        }

        // 2. Fijar tamaño inicial holgado
        node.setSize([DEFAULT_WIDTH, DEFAULT_HEIGHT]);

        // Evitar que el usuario lo deforme al moverlo
        node.onResize = function (size) {
            if (size[0] < 340) size[0] = 340;
            if (size[1] < DEFAULT_HEIGHT) size[1] = DEFAULT_HEIGHT;
        };

            // 3. Reactividad para Bypass (Ctrl + B) y Mute
            node.applyTheme = function () {
                const isBypassed = (this.mode === 4 || this.mode === 2);
                if (isBypassed) {
                    this.color = PURPLE_BYPASS_HEADER;
                    this.bgcolor = PURPLE_BYPASS_BODY;
                } else {
                    this.color = TEAL_HEADER;
                    this.bgcolor = TEAL_BODY;
                }
                this.setDirtyCanvas(true, true);
            };

            const origOnModeChange = node.onModeChange;
            node.onModeChange = function () {
                if (origOnModeChange) origOnModeChange.apply(this, arguments);
                this.applyTheme();
            };

            // 4. Forzar que siempre pinte los colores en cada cuadro del canvas
            const origDrawForeground = node.onDrawForeground;
            node.onDrawForeground = function (ctx) {
                if (origDrawForeground) origDrawForeground.apply(this, arguments);
                if (this.flags?.collapsed) return;

                const isBypassed = (this.mode === 4 || this.mode === 2);
                const targetHeader = isBypassed ? PURPLE_BYPASS_HEADER : TEAL_HEADER;
                const targetBody   = isBypassed ? PURPLE_BYPASS_BODY : TEAL_BODY;

                if (this.color !== targetHeader || this.bgcolor !== targetBody) {
                    this.color = targetHeader;
                    this.bgcolor = targetBody;
                    this.setDirtyCanvas(true, true);
                }
            };

            // 5. Preservar al recargar workflows guardados
            const origOnConfigure = node.onConfigure;
            node.onConfigure = function () {
                if (origOnConfigure) origOnConfigure.apply(this, arguments);
                this.color = TEAL_HEADER;
                this.bgcolor = TEAL_BODY;
                this.title_color = CYAN_ACCENT;
                if (!this.size || this.size[0] < DEFAULT_WIDTH) {
                    this.setSize([DEFAULT_WIDTH, DEFAULT_HEIGHT]);
                }
                this.setDirtyCanvas(true, true);
            };

            node.applyTheme();
    },

    // Asegurar que pinte el color si el flujo se carga desde un JSON ya guardado
    async loadedGraphNode(node) {
        const className = node.comfyClass || node.type;
        if (className === "McValley_MiniMaxTurboEngine") {
            node.color = TEAL_HEADER;
            node.bgcolor = TEAL_BODY;
            node.title_color = CYAN_ACCENT;
            if (node.setSize && (!node.size || node.size[0] < DEFAULT_WIDTH)) {
                node.setSize([DEFAULT_WIDTH, DEFAULT_HEIGHT]);
            }
            node.setDirtyCanvas(true, true);
        }
    }
});
