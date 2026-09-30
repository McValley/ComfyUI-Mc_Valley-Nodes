import { app } from "../../../scripts/app.js";

const CYAN_HEADER = "#072b38";
const CYAN_BODY = "#051b24";
const CYAN_NEON = "#00d4ff";

const PURPLE_BYPASS_HEADER = "#2a0845";
const PURPLE_BYPASS_BODY = "#120324";
const PURPLE_BYPASS = "#9333ea";

app.registerExtension({
    name: "McValley.MiniMaxLatentUpscalerStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_MiniMaxLatentUpscalerStudio") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);

            const node = this;
            this.color = CYAN_HEADER;
            this.bgcolor = CYAN_BODY;

            const MIN_WIDTH = 310;
            const MIN_HEIGHT = 175;
            this.setSize([MIN_WIDTH, MIN_HEIGHT]);

            this.properties = this.properties || {};

            this.onResize = function (size) {
                if (size[0] < MIN_WIDTH) size[0] = MIN_WIDTH;
                if (size[1] < MIN_HEIGHT) size[1] = MIN_HEIGHT;
            };

                // Detección reactiva de Bypass / Mute (Ctrl + B)
                node.applyBypassTheme = function () {
                    const isBypassed = node.mode === 4 || node.mode === 2;
                    if (isBypassed) {
                        node.color = PURPLE_BYPASS_HEADER;
                        node.bgcolor = PURPLE_BYPASS_BODY;
                    } else {
                        node.color = CYAN_HEADER;
                        node.bgcolor = CYAN_BODY;
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

                // Recepción del texto desde Python tras procesar
                const origOnExecuted = this.onExecuted;
                this.onExecuted = function (output) {
                    if (origOnExecuted) origOnExecuted.apply(this, arguments);
                    if (output && output.text) {
                        this.properties["mcv_upscale_info"] = output.text[0];
                    }
                };

                // Marquesina Cian Neón inferior
                const origDrawForeground = this.onDrawForeground;
                this.onDrawForeground = function (ctx) {
                    if (origDrawForeground) origDrawForeground.apply(this, arguments);

                    const isBypassed = this.mode === 4 || this.mode === 2;
                    const activeColor = isBypassed ? PURPLE_BYPASS : CYAN_NEON;
                    const activeBg = isBypassed ? "#11021c" : "#020b14";

                    const mpWidget = this.widgets?.find(w => w.name === "target_megapixels");
                    const currentMp = mpWidget ? parseFloat(mpWidget.value).toFixed(2).replace(/\.?0+$/, '') : "0.8";

                    const displayText = this.properties["mcv_upscale_info"] || `SCALE TARGET: ${currentMp} MP (READY)`;

                    ctx.save();
                    const margin = 10;
                    const boxHeight = 26;
                    const boxY = this.size[1] - boxHeight - 8;
                    const boxWidth = this.size[0] - (margin * 2);

                    // Caja inferior de acento
                    ctx.fillStyle = activeBg;
                    ctx.strokeStyle = activeColor;
                    ctx.lineWidth = 1.3;
                    ctx.beginPath();
                    ctx.roundRect(margin, boxY, boxWidth, boxHeight, 4);
                    ctx.fill();
                    ctx.stroke();

                    // Tipografía digital con Glow Neón
                    ctx.font = "bold 11px monospace";
                    ctx.fillStyle = activeColor;
                    ctx.shadowColor = activeColor;
                    ctx.shadowBlur = isBypassed ? 4 : 9;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.fillText(displayText, this.size[0] / 2, boxY + (boxHeight / 2));
                    ctx.restore();
                };

                this.applyBypassTheme();
        };
    }
});
