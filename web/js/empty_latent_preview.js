import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "Mc_Valley.EmptyLatentDiv32",
    async nodeCreated(node) {
        if (node.comfyClass === "McValley_EmptyLatentDiv32") {
            node.color = "#001f3f";
            node.bgcolor = "#000a14";

            // Dimensiones compactas para los 3 controles + el cartel inferior
            const MIN_WIDTH = 265;
            const MIN_HEIGHT = 175;
            node.setSize([MIN_WIDTH, MIN_HEIGHT]);

            node.onResize = function (size) {
                if (size[0] < MIN_WIDTH) size[0] = MIN_WIDTH;
                if (size[1] < MIN_HEIGHT) size[1] = MIN_HEIGHT;
            };

                // Cálculo reactivo continuo con base fija de 32
                function computeLiveResolution() {
                    const ratioWidget = node.widgets?.find(w => w.name === "aspect_ratio");
                    const mpWidget = node.widgets?.find(w => w.name === "megapixels");

                    if (!ratioWidget || !mpWidget) return;

                    const rawRatio = String(ratioWidget.value).split(" ")[0];
                    const parts = rawRatio.split(":");
                    const rw = parseFloat(parts[0]) || 1.0;
                    const rh = parseFloat(parts[1]) || 1.0;

                    const mp = parseFloat(mpWidget.value) || 1.0;
                    const targetPixels = mp * 1000000.0;

                    let w = Math.sqrt(targetPixels * (rw / rh));
                    let h = w * (rh / rw);

                    w = Math.round(w / 32.0) * 32;
                    h = Math.round(h / 32.0) * 32;

                    node.properties["neon_info"] = `${w} × ${h} px | ${mp.toFixed(1)} MP (Div 32)`;
                    node.setDirtyCanvas(true, false);
                }

                // Enlazar la reactividad al mover los controles
                if (node.widgets) {
                    for (const w of node.widgets) {
                        const origCallback = w.callback;
                        w.callback = function () {
                            if (origCallback) origCallback.apply(this, arguments);
                            computeLiveResolution();
                        };
                    }
                }

                setTimeout(computeLiveResolution, 40);

                node.onExecuted = function (output) {
                    if (output && output.text) {
                        node.properties["neon_info"] = output.text[0];
                    }
                };

                const origDrawForeground = node.onDrawForeground;
                node.onDrawForeground = function (ctx) {
                    if (origDrawForeground) origDrawForeground.apply(this, arguments);

                    const infoText = this.properties["neon_info"] || "READY (DIV 32)";

                    ctx.save();
                    const margin = 10;
                    const boxHeight = 25;
                    const boxY = this.size[1] - boxHeight - 8;
                    const boxWidth = this.size[0] - (margin * 2);

                    // Marco Neón Azul / Cian
                    ctx.fillStyle = "#020b14";
                    ctx.strokeStyle = "#00d4ff";
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.roundRect(margin, boxY, boxWidth, boxHeight, 4);
                    ctx.fill();
                    ctx.stroke();

                    // Tipografía digital
                    ctx.font = "bold 10.5px monospace";
                    ctx.fillStyle = "#00d4ff";
                    ctx.shadowColor = "#00d4ff";
                    ctx.shadowBlur = 8;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.fillText(infoText, this.size[0] / 2, boxY + (boxHeight / 2));
                    ctx.restore();
                };
        }
    }
});
