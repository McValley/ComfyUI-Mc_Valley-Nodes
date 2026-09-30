import { app } from "../../../scripts/app.js";

const TEAL_HEADER = "#063b40";
const TEAL_BODY   = "#03171a";
const CYAN_ACCENT = "#00e5ff";

const PURPLE_BYPASS_HEADER = "#2a0845";
const PURPLE_BYPASS_BODY   = "#120324";

app.registerExtension({
    name: "McValley.MiniMaxSamplerStudio",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "McValley_MiniMaxSamplerStudio") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

                this.color = TEAL_HEADER;
                this.bgcolor = TEAL_BODY;
                if (this.title_color !== undefined) {
                    this.title_color = CYAN_ACCENT;
                }

                this.applyTheme = function () {
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

                const origOnModeChange = this.onModeChange;
                this.onModeChange = function () {
                    if (origOnModeChange) origOnModeChange.apply(this, arguments);
                    this.applyTheme();
                };

                if (!this.size || this.size[0] < 280) {
                    this.size = [300, 260];
                }

                this.applyTheme();
                return r;
            };

            const origConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function () {
                if (origConfigure) origConfigure.apply(this, arguments);
                this.color = TEAL_HEADER;
                this.bgcolor = TEAL_BODY;
                if (this.applyTheme) this.applyTheme();
            };

                const onDrawForeground = nodeType.prototype.onDrawForeground;
                nodeType.prototype.onDrawForeground = function (ctx) {
                    const r = onDrawForeground ? onDrawForeground.apply(this, arguments) : undefined;

                    if (this.flags?.collapsed) return r;

                    const isBypassed = (this.mode === 4 || this.mode === 2);

                    ctx.save();
                    ctx.strokeStyle = isBypassed ? "rgba(147, 51, 234, 0.4)" : "rgba(0, 229, 255, 0.35)";
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(10, this.size[1] - 6);
                    ctx.lineTo(this.size[0] - 10, this.size[1] - 6);
                    ctx.stroke();

                    ctx.fillStyle = isBypassed ? "rgba(216, 180, 254, 0.4)" : "rgba(0, 229, 255, 0.45)";
                    ctx.font = "9.5px sans-serif";
                    ctx.textAlign = "right";
                    ctx.fillText("Mc_Valley Suite", this.size[0] - 12, this.size[1] - 9);

                    ctx.restore();
                    return r;
                };
        }
    }
});
