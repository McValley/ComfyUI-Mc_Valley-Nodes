import { app } from "../../../scripts/app.js";

const CYAN_THEME = {
    color: "#00363a",        // Fondo del header azul cian profundo
    bgcolor: "#00171a",      // Fondo del cuerpo del nodo
    title_color: "#00f0ff",  // Título cian neón brillante
    boxcolor: "#00e5ff"      // Acento de selección / borde
};

function applyCyanStyle(node) {
    node.color = CYAN_THEME.color;
    node.bgcolor = CYAN_THEME.bgcolor;
    if (node.title_color !== undefined) {
        node.title_color = CYAN_THEME.title_color;
    }
    node.boxcolor = CYAN_THEME.boxcolor;
}

app.registerExtension({
    name: "McValley.MiniMaxSuite",

    async nodeCreated(node) {
        // 1. Estilo para el Time Director
        if (node.comfyClass === "McValley_MiniMaxTimeDirector") {
            applyCyanStyle(node);
            return;
        }

        // 2. Control persistente y estilo para el generador I2V
        if (node.comfyClass === "MiniMaxH3ImageToVideoFast" || node.comfyClass === "McValley_MiniMaxH3ImageToVideo") {
            applyCyanStyle(node);

            const guidanceWidget = node.widgets?.find(w => w.name === "guidance_mode");
            const earlyStepsWidget = node.widgets?.find(w => w.name === "early_guidance_steps");

            if (guidanceWidget && earlyStepsWidget) {
                // Preservamos el calculador original de tamaño sin corromper el widget
                if (!earlyStepsWidget._origComputeSize) {
                    earlyStepsWidget._origComputeSize = earlyStepsWidget.computeSize || ((w) => [w, 20]);
                }

                const refreshWidgetVisibility = () => {
                    const isHybrid = guidanceWidget.value === "Hybrid (Early Guidance)";

                    if (isHybrid) {
                        earlyStepsWidget.computeSize = earlyStepsWidget._origComputeSize;
                        earlyStepsWidget.hidden = false;
                        if (earlyStepsWidget.element) {
                            earlyStepsWidget.element.hidden = false;
                            earlyStepsWidget.element.style.display = "";
                        }
                    } else {
                        // Ocultamiento no destructivo: no altera la serialización de LiteGraph
                        earlyStepsWidget.computeSize = () => [0, -4];
                        earlyStepsWidget.hidden = true;
                        if (earlyStepsWidget.element) {
                            earlyStepsWidget.element.hidden = true;
                            earlyStepsWidget.element.style.display = "none";
                        }
                    }

                    const sz = node.computeSize();
                    node.setSize([Math.max(node.size[0], sz[0]), sz[1]]);
                    node.setDirtyCanvas(true, true);
                };

                // Enganchar el callback del usuario preservando el anterior
                const prevCallback = guidanceWidget.callback;
                guidanceWidget.callback = function (value) {
                    if (prevCallback) prevCallback.apply(this, arguments);
                    refreshWidgetVisibility();
                };

                // Preservación estricta al cambiar de workflow (onConfigure)
                const origOnConfigure = node.onConfigure;
                node.onConfigure = function (info) {
                    if (origOnConfigure) origOnConfigure.apply(this, arguments);
                    applyCyanStyle(this);
                    setTimeout(refreshWidgetVisibility, 10);
                };

                // Sincronización inicial diferida
                setTimeout(refreshWidgetVisibility, 20);
            }
        }
    },

    // Asegura el estilo y restauración al cargar cualquier workflow guardado
    async loadedGraphNode(node) {
        if (node.comfyClass === "McValley_MiniMaxTimeDirector" ||
            node.comfyClass === "MiniMaxH3ImageToVideoFast" ||
            node.comfyClass === "McValley_MiniMaxH3ImageToVideo") {
            applyCyanStyle(node);
            }
    }
});
