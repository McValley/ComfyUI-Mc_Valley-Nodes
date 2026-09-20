import { app } from "/scripts/app.js";

app.registerExtension({
    name: "McValley.MiniMaxH3FastI2V",
    async nodeCreated(node) {
        if (node.comfyClass !== "MiniMaxH3ImageToVideoFast") return;

        // Estilo visual Neón Cian Mc_Valley
        node.color = "#00363a";
        node.bgcolor = "#00171a";
        if (node.title_color) node.title_color = "#00f0ff";

        const guidanceWidget = node.widgets?.find(w => w.name === "guidance_mode");
        const earlyStepsWidget = node.widgets?.find(w => w.name === "early_guidance_steps");

        if (guidanceWidget && earlyStepsWidget) {
            earlyStepsWidget.origType = earlyStepsWidget.type;
            earlyStepsWidget.origComputeSize = earlyStepsWidget.computeSize;

            const updateVisibility = () => {
                const isHybrid = guidanceWidget.value === "Hybrid (Early Guidance)";

                if (isHybrid) {
                    earlyStepsWidget.type = earlyStepsWidget.origType || "number";
                    earlyStepsWidget.computeSize = earlyStepsWidget.origComputeSize;
                    if (earlyStepsWidget.element) {
                        earlyStepsWidget.element.hidden = false;
                        earlyStepsWidget.element.style.display = "";
                    }
                } else {
                    earlyStepsWidget.type = "converted-widget";
                    earlyStepsWidget.computeSize = () => [0, -4];
                    if (earlyStepsWidget.element) {
                        earlyStepsWidget.element.hidden = true;
                        earlyStepsWidget.element.style.display = "none";
                    }
                }

                const sz = node.computeSize();
                node.setSize([Math.max(node.size[0], sz[0]), sz[1]]);
                node.setDirtyCanvas(true, true);
            };

            const origCallback = guidanceWidget.callback;
            guidanceWidget.callback = function (value) {
                if (origCallback) origCallback.apply(this, arguments);
                updateVisibility();
            };

            setTimeout(updateVisibility, 20);
        }
    }
});
