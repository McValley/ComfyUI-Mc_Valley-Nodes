import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "Mc_Valley.MiniMaxModelLoader",
    async nodeCreated(node) {
        if (node.comfyClass === "McValley_MiniMaxModelLoader") {
            node.color = "#002a3a";
            node.bgcolor = "#010e14";

            // Dimensiones con espacio suficiente para los dos VAEs y la marquesina
            const MIN_WIDTH = 330;
            const MIN_HEIGHT = 275;
            node.setSize([MIN_WIDTH, MIN_HEIGHT]);

            node.onResize = function (size) {
                if (size[0] < MIN_WIDTH) size[0] = MIN_WIDTH;
                if (size[1] < MIN_HEIGHT) size[1] = MIN_HEIGHT;
            };

                node.onExecuted = function (output) {
                    if (output && output.text) {
                        node.properties["neon_minimax_info"] = output.text[0];
                    }
                };

                const origDrawForeground = node.onDrawForeground;
                node.onDrawForeground = function (ctx) {
                    if (origDrawForeground) origDrawForeground.apply(this, arguments);

                    const infoText = this.properties["neon_minimax_info"] || "MINIMAX ALL-IN-ONE STANDBY";

                    ctx.save();
                    const margin = 10;
                    const boxHeight = 24;
                    const boxY = this.size[1] - boxHeight - 8;
                    const boxWidth = this.size[0] - (margin * 2);

                    // Caja oscura con borde cian neón
                    ctx.fillStyle = "#020b14";
                    ctx.strokeStyle = "#00d4ff";
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.roundRect(margin, boxY, boxWidth, boxHeight, 4);
                    ctx.fill();
                    ctx.stroke();

                    // Texto digital brillante
                    ctx.font = "bold 11px monospace";
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
