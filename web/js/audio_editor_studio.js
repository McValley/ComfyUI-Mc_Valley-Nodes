import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const COLOR_HEADER = "#072b35";
const COLOR_BODY = "#03171f";
const COLOR_CYAN = "#00f2ff";
const COLOR_MAGENTA = "#ff0077";
const COLOR_AMBER = "#ffaa00";
const COLOR_STANDBY = "#475569";

// Dimensiones fijas calibradas para contener todo el rack sin desbordes
const FIXED_WIDTH = 760;
const FIXED_HEIGHT = 770;

const STYLE_ID = "mcvalley-aes-matte-studio-css";
if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.innerHTML = `
    .mcv-aes-pro-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        background: linear-gradient(180deg, #071f2e 0%, #020b12 100%) !important;
        border: 1.5px solid rgba(0, 242, 255, 0.7) !important;
        border-radius: 10px !important;
        padding: 12px 14px !important;
        box-sizing: border-box !important;
        width: 100% !important;
        height: 100% !important;
        user-select: none !important;
        overflow: hidden !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
        font-family: "JetBrains Mono", "Courier New", monospace !important;
    }

    .mcv-aes-pro-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1.5px solid rgba(0, 242, 255, 0.3) !important;
        padding-bottom: 8px !important;
    }

    .mcv-aes-pro-title {
        color: ${COLOR_CYAN} !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        letter-spacing: 1px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        text-shadow: 0 0 10px rgba(0, 242, 255, 0.4) !important;
    }

    .mcv-aes-badge-top {
        font-size: 9.5px !important;
        font-weight: 800 !important;
        color: #10b981 !important;
        border: 1.2px solid #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
        padding: 2px 7px !important;
        border-radius: 4px !important;
        letter-spacing: 0.6px !important;
    }

    .mcv-tracks-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 9px !important;
    }

    .mcv-pro-channel {
        display: flex !important;
        flex-direction: column !important;
        gap: 7px !important;
        border-radius: 7px !important;
        padding: 9px 12px !important;
        box-sizing: border-box !important;
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.7) !important;
        transition: border-color 0.2s ease, background 0.2s ease !important;
        border-width: 1.5px !important;
        border-style: solid !important;
    }

    .mcv-pro-channel.online {
        background: linear-gradient(180deg, #082333 0%, #03131c 100%) !important;
    }

    .mcv-pro-channel.standby {
        background: #091018 !important;
        border-color: rgba(71, 85, 105, 0.4) !important;
        opacity: 0.55 !important;
    }

    .mcv-pro-channel.muted {
        opacity: 0.45 !important;
        filter: grayscale(0.8) !important;
    }

    .mcv-channel-top {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
    }

    .mcv-channel-left-controls {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
    }

    .mcv-btn-power {
        background: #08151f !important;
        border: 1.5px solid !important;
        border-radius: 4px !important;
        font-size: 9.5px !important;
        font-weight: 900 !important;
        padding: 2px 7px !important;
        cursor: pointer !important;
        letter-spacing: 0.6px !important;
        transition: all 0.15s ease !important;
    }

    .mcv-btn-power.active {
        box-shadow: 0 0 8px currentColor !important;
    }

    .mcv-channel-lbl {
        font-size: 11px !important;
        font-weight: 800 !important;
        letter-spacing: 0.7px !important;
    }

    .mcv-channel-range-badge {
        font-size: 10px !important;
        font-weight: 800 !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        letter-spacing: 0.5px !important;
    }

    .mcv-channel-middle {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
    }

    .mcv-pro-play-btn {
        background: #082130 !important;
        border-radius: 5px !important;
        font-size: 10.5px !important;
        font-weight: 800 !important;
        padding: 5px 12px !important;
        cursor: pointer !important;
        outline: none !important;
        min-width: 68px !important;
        transition: all 0.15s ease !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6) !important;
    }

    .mcv-pro-play-btn:hover {
        filter: brightness(1.25) !important;
    }

    .mcv-pro-track {
        flex-grow: 1 !important;
        height: 22px !important;
        background: #02070a !important;
        border-radius: 5px !important;
        position: relative !important;
        overflow: hidden !important;
        box-shadow: inset 0 2px 6px #000000 !important;
        cursor: pointer !important;
        border: 1.2px solid rgba(255, 255, 255, 0.15) !important;
    }

    .mcv-pro-region {
        position: absolute !important;
        height: 100% !important;
        box-sizing: border-box !important;
        border-left: 2.5px solid !important;
        border-right: 2.5px solid !important;
        pointer-events: none !important;
        opacity: 0.85 !important;
    }

    .mcv-pro-needle {
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 3px !important;
        background: #ffffff !important;
        box-shadow: 0 0 6px #ffffff !important;
        left: 0%;
        pointer-events: none !important;
        z-index: 5 !important;
        will-change: left !important;
    }

    .mcv-pro-time {
        font-size: 10px !important;
        font-weight: 800 !important;
        color: #f1f5f9 !important;
        min-width: 90px !important;
        text-align: right !important;
        letter-spacing: 0.5px !important;
    }

    .mcv-fader-console {
        display: grid !important;
        grid-template-columns: 1.15fr 1.15fr 0.9fr !important;
        gap: 12px !important;
        align-items: center !important;
        background: #02090e !important;
        padding: 7px 12px !important;
        border-radius: 5px !important;
        border: 1.2px solid rgba(255, 255, 255, 0.08) !important;
    }

    .mcv-fader-block {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
    }

    .mcv-fader-info {
        font-size: 9px !important;
        font-weight: 800 !important;
        color: #94a3b8 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        letter-spacing: 0.5px !important;
    }

    .mcv-number-input {
        width: 52px !important;
        background: #040d14 !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: #ffffff !important;
        font-size: 9.5px !important;
        font-family: inherit !important;
        font-weight: 700 !important;
        text-align: right !important;
        padding: 1px 4px !important;
        border-radius: 3px !important;
        outline: none !important;
        user-select: text !important;
    }

    .mcv-number-input:focus {
        border-color: ${COLOR_CYAN} !important;
        box-shadow: 0 0 5px rgba(0, 242, 255, 0.5) !important;
    }

    .mcv-hardware-slider {
        -webkit-appearance: none !important;
        appearance: none !important;
        width: 100% !important;
        height: 8px !important;
        border-radius: 4px !important;
        background: #020508 !important;
        box-shadow: inset 0 1px 4px rgba(0,0,0,0.9) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        outline: none !important;
        cursor: ew-resize !important;
    }

    .mcv-hardware-slider:disabled {
        cursor: not-allowed !important;
        opacity: 0.35 !important;
    }

    .mcv-hardware-slider::-webkit-slider-thumb {
        -webkit-appearance: none !important;
        appearance: none !important;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        background: currentColor !important;
        border: 2px solid #ffffff !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.9) !important;
        cursor: pointer !important;
    }

    .mcv-master-preview-strip {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        background: #041a13 !important;
        border: 1.5px solid rgba(16, 185, 129, 0.7) !important;
        border-radius: 7px !important;
        padding: 8px 12px !important;
        box-sizing: border-box !important;
    }

    .mcv-master-lbl {
        font-size: 10px !important;
        font-weight: 800 !important;
        color: #10b981 !important;
        letter-spacing: 0.8px !important;
        white-space: nowrap !important;
    }

    .mcv-bottom-bar {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 10px !important;
        margin-top: 2px !important;
    }

    .mcv-btn-action {
        flex: 1 !important;
        padding: 9px 14px !important;
        border-radius: 6px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
        letter-spacing: 1px !important;
        border: 1.2px solid rgba(255, 255, 255, 0.6) !important;
        transition: all 0.15s ease !important;
    }

    .mcv-btn-render {
        background: linear-gradient(180deg, #00b4d8 0%, #0077b6 100%) !important;
        color: #ffffff !important;
    }
    .mcv-btn-render:hover { filter: brightness(1.2) !important; }

    .mcv-btn-save {
        background: linear-gradient(180deg, #10b981 0%, #047857 100%) !important;
        color: #ffffff !important;
    }
    .mcv-btn-save:hover { filter: brightness(1.2) !important; }
    .mcv-btn-save:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
    `;
    document.head.appendChild(styleEl);
}

app.registerExtension({
    name: "McValley.AudioEditorStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "McValley_AudioEditorStudio") return;

        nodeData.color = COLOR_HEADER;
        nodeData.bgcolor = COLOR_BODY;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);

            const node = this;
            node.color = COLOR_HEADER;
            node.bgcolor = COLOR_BODY;
            if (window.LiteGraph) node.shape = window.LiteGraph.ROUND_SHAPE;

            if (node.widgets) {
                node.widgets.forEach(w => {
                    w.type = "hidden";
                    w.computeSize = () => [0, -4];
                    w.draw = () => {};
                    if (w.inputEl) w.inputEl.style.display = "none";
                });
            }

            node.properties = node.properties || {};

            this.resizable = false;
            this.size = [FIXED_WIDTH, FIXED_HEIGHT];
            this.setSize([FIXED_WIDTH, FIXED_HEIGHT]);
            this.onResize = () => {
                this.size[0] = FIXED_WIDTH;
                this.size[1] = FIXED_HEIGHT;
            };

            const container = document.createElement("div");
            container.className = "mcv-aes-pro-container";

            const header = document.createElement("div");
            header.className = "mcv-aes-pro-header";
            header.innerHTML = `
            <span class="mcv-aes-pro-title">🎛️ MULTI-TRACK AUDIO MASTERING STUDIO</span>
            <span class="mcv-aes-badge-top">STUDIO INSERT DIRECT</span>
            `;
            container.appendChild(header);

            const tracksList = document.createElement("div");
            tracksList.className = "mcv-tracks-list";
            container.appendChild(tracksList);

            // Regla temporal maestra gobernada por CH-1
            let globalMasterDuration = node.properties.global_master_dur || 10.0;

            const updateAllTracksGlobalScale = (newMasterDur) => {
                if (!newMasterDur || newMasterDur <= 0) return;
                globalMasterDuration = parseFloat(newMasterDur);
                node.properties.global_master_dur = globalMasterDuration;

                [1, 2, 3].forEach(id => {
                    const t = trackUI[id];
                    t.sIn.max = globalMasterDuration;
                    t.eIn.max = globalMasterDuration;
                    t.inStart.max = globalMasterDuration;
                    t.inEnd.max = globalMasterDuration;
                    t.syncRangeDisplay();
                });
            };

            // Fábrica unificada: Pistas 1, 2 y 3 comparten exactamente el mismo algoritmo
            const createProTrack = (id, label, accentColor, prefix) => {
                const track = document.createElement("div");
                track.className = "mcv-pro-channel standby";
                track.style.borderColor = "rgba(71, 85, 105, 0.4)";

                track.innerHTML = `
                <div class="mcv-channel-top">
                <div class="mcv-channel-left-controls">
                <button class="mcv-btn-power active" style="border-color:${COLOR_STANDBY}; color:${COLOR_STANDBY};">ON</button>
                <span class="mcv-channel-lbl" style="color:${COLOR_STANDBY};">${label}</span>
                </div>
                <span class="mcv-channel-range-badge" style="color:${COLOR_STANDBY}; border:1.2px solid ${COLOR_STANDBY}; background:rgba(71, 85, 105, 0.2);">UNPLUGGED / 0.00s</span>
                </div>
                <div class="mcv-channel-middle">
                <button class="mcv-pro-play-btn play-btn" style="border:1.2px solid ${COLOR_STANDBY}; color:${COLOR_STANDBY};">▶ PLAY</button>
                <div class="mcv-pro-track timeline-bar">
                <div class="mcv-pro-region range-fill" style="left:0%; width:100%; border-color:${COLOR_STANDBY}; background:${COLOR_STANDBY}33; color:${COLOR_STANDBY};"></div>
                <div class="mcv-pro-needle needle-bar"></div>
                </div>
                <span class="mcv-pro-time time-txt">0.00s / 0.00s</span>
                </div>
                <div class="mcv-fader-console">
                <div class="mcv-fader-block">
                <div class="mcv-fader-info">
                <span>START</span>
                <input type="number" step="0.01" min="0" class="mcv-number-input input-start" value="0.00">
                </div>
                <input type="range" class="mcv-hardware-slider slider-start" min="0" max="10" step="0.01" value="0" disabled style="color:${COLOR_STANDBY};">
                </div>
                <div class="mcv-fader-block">
                <div class="mcv-fader-info">
                <span>END</span>
                <input type="number" step="0.01" min="0" class="mcv-number-input input-end" value="10.00">
                </div>
                <input type="range" class="mcv-hardware-slider slider-end" min="0" max="10" step="0.01" value="10" disabled style="color:${COLOR_STANDBY};">
                </div>
                <div class="mcv-fader-block">
                <div class="mcv-fader-info">
                <span>GAIN</span>
                <span class="txt-gain">100%</span>
                </div>
                <input type="range" class="mcv-hardware-slider slider-gain" min="0" max="2" step="0.05" value="1" disabled style="color:${COLOR_STANDBY};">
                </div>
                </div>
                `;

                const audioEl = new Audio();
                const btnPower = track.querySelector(".mcv-btn-power");
                const playBtn = track.querySelector(".play-btn");
                const timeline = track.querySelector(".timeline-bar");
                const region = track.querySelector(".range-fill");
                const needle = track.querySelector(".needle-bar");
                const timeText = track.querySelector(".time-txt");
                const badge = track.querySelector(".mcv-channel-range-badge");
                const lbl = track.querySelector(".mcv-channel-lbl");

                const sIn = track.querySelector(".slider-start");
                const eIn = track.querySelector(".slider-end");
                const gIn = track.querySelector(".slider-gain");
                const inStart = track.querySelector(".input-start");
                const inEnd = track.querySelector(".input-end");
                const vGain = track.querySelector(".txt-gain");

                let isOnline = false;
                let isEnabled = true;
                let animFrame = null;
                let isUserDraggingTimeline = false;

                const getWidget = (suffix) => node.widgets?.find(w => w.name === `${prefix}_${suffix}`);

                const syncToComfyWidgets = () => {
                    const wEn = getWidget("enabled");
                    const wSt = getWidget("start");
                    const wEnSec = getWidget("end");
                    const wVol = getWidget("volume");

                    const stVal = parseFloat(sIn.value) || 0.0;
                    const enVal = parseFloat(eIn.value) || 0.0;
                    const gnVal = parseFloat(gIn.value) !== undefined ? parseFloat(gIn.value) : 1.0;

                    if (wEn) wEn.value = isEnabled;
                    if (wSt) wSt.value = stVal;
                    if (wEnSec) wEnSec.value = enVal;
                    if (wVol) wVol.value = gnVal;

                    node.properties[`ch${id}_enabled`] = isEnabled;
                    node.properties[`ch${id}_start`] = stVal;
                    node.properties[`ch${id}_end`] = enVal;
                    node.properties[`ch${id}_vol`] = gnVal;
                };

                const updateVisualState = () => {
                    const canRun = isOnline && isEnabled;
                    track.className = `mcv-pro-channel ${isOnline ? "online" : "standby"} ${!isEnabled ? "muted" : ""}`;
                    const useCol = canRun ? accentColor : COLOR_STANDBY;

                    track.style.borderColor = isOnline ? `${accentColor}77` : "rgba(71, 85, 105, 0.4)";
                    lbl.style.color = useCol;
                    badge.style.color = useCol;
                    badge.style.borderColor = useCol;
                    badge.style.background = `${useCol}22`;
                    playBtn.style.color = useCol;
                    playBtn.style.borderColor = useCol;
                    region.style.borderColor = useCol;
                    region.style.background = `${useCol}44`;
                    region.style.color = useCol;
                    sIn.style.color = useCol;
                    eIn.style.color = useCol;
                    gIn.style.color = useCol;

                    sIn.disabled = !isOnline;
                    eIn.disabled = !isOnline;
                    gIn.disabled = !isOnline;
                    inStart.disabled = !isOnline;
                    inEnd.disabled = !isOnline;

                    syncRangeDisplay();
                };

                const syncRangeDisplay = () => {
                    const st = parseFloat(sIn.value) || 0.0;
                    const en = parseFloat(eIn.value) || 0.0;
                    const gn = parseFloat(gIn.value) !== undefined ? parseFloat(gIn.value) : 1.0;

                    inStart.value = st.toFixed(2);
                    inEnd.value = en.toFixed(2);
                    vGain.innerText = `${Math.round(gn * 100)}%`;

                    const timelineDur = globalMasterDuration || 10.0;
                    timeText.innerText = `${st.toFixed(2)}s / ${timelineDur.toFixed(2)}s`;

                    if (!isOnline) {
                        badge.innerText = "UNPLUGGED / 0.00s";
                    } else {
                        badge.innerText = isEnabled ? `${st.toFixed(2)}s - ${en.toFixed(2)}s` : "MUTED / OFF";
                    }

                    region.style.left = `${(st / timelineDur) * 100}%`;
                    region.style.width = `${Math.max(0, ((en - st) / timelineDur) * 100)}%`;

                    syncToComfyWidgets();
                };

                btnPower.onclick = () => {
                    isEnabled = !isEnabled;
                    btnPower.innerText = isEnabled ? "ON" : "OFF";
                    btnPower.classList.toggle("active", isEnabled);
                    btnPower.style.borderColor = isEnabled ? accentColor : COLOR_STANDBY;
                    btnPower.style.color = isEnabled ? accentColor : COLOR_STANDBY;
                    updateVisualState();
                };

                sIn.oninput = () => {
                    if (parseFloat(sIn.value) >= parseFloat(eIn.value)) {
                        sIn.value = (parseFloat(eIn.value) - 0.05).toFixed(2);
                    }
                    syncRangeDisplay();
                };

                eIn.oninput = () => {
                    if (parseFloat(eIn.value) <= parseFloat(sIn.value)) {
                        eIn.value = (parseFloat(sIn.value) + 0.05).toFixed(2);
                    }
                    syncRangeDisplay();
                };

                inStart.onchange = () => {
                    let val = parseFloat(inStart.value) || 0.0;
                    val = Math.max(0, Math.min(val, globalMasterDuration));
                    if (val >= parseFloat(eIn.value)) val = Math.max(0, parseFloat(eIn.value) - 0.05);
                    sIn.value = val.toFixed(2);
                    syncRangeDisplay();
                };

                inEnd.onchange = () => {
                    let val = parseFloat(inEnd.value) || 0.0;
                    val = Math.max(0, Math.min(val, globalMasterDuration));
                    if (val <= parseFloat(sIn.value)) val = Math.min(globalMasterDuration, parseFloat(sIn.value) + 0.05);
                    eIn.value = val.toFixed(2);
                    syncRangeDisplay();
                };

                gIn.oninput = syncRangeDisplay;

                const smoothLoop = () => {
                    if (!audioEl.paused && !audioEl.ended && !isUserDraggingTimeline) {
                        const st = parseFloat(sIn.value);
                        const en = parseFloat(eIn.value);
                        const durTot = globalMasterDuration || 1;

                        let curAbs = st + (audioEl.currentTime || 0);
                        if (audioEl.duration && audioEl.duration >= durTot * 0.9) {
                            curAbs = audioEl.currentTime || 0;
                        }

                        needle.style.left = `${Math.min(100, (curAbs / durTot) * 100)}%`;
                        timeText.innerText = `${curAbs.toFixed(2)}s / ${durTot.toFixed(2)}s`;

                        if (curAbs >= en) {
                            audioEl.pause();
                            audioEl.currentTime = 0;
                            playBtn.innerText = "▶ PLAY";
                            needle.style.left = `${(st / durTot) * 100}%`;
                            cancelAnimationFrame(animFrame);
                            return;
                        }
                        animFrame = requestAnimationFrame(smoothLoop);
                    }
                };

                playBtn.onclick = () => {
                    if (!audioEl.src || !isOnline) return;
                    if (audioEl.paused) {
                        const st = parseFloat(sIn.value);
                        let startPos = st;
                        if (audioEl.duration && st >= audioEl.duration) {
                            startPos = 0;
                        }
                        audioEl.currentTime = startPos;
                        audioEl.play().then(() => {
                            playBtn.innerText = "❚❚ PAUSE";
                            cancelAnimationFrame(animFrame);
                            smoothLoop();
                        });
                    } else {
                        audioEl.pause();
                        playBtn.innerText = "▶ PLAY";
                        cancelAnimationFrame(animFrame);
                    }
                };

                audioEl.onended = () => {
                    playBtn.innerText = "▶ PLAY";
                    cancelAnimationFrame(animFrame);
                    needle.style.left = `${(parseFloat(sIn.value) / (globalMasterDuration || 1)) * 100}%`;
                };

                const updatePlayheadFromPointer = (clientX) => {
                    const rect = timeline.getBoundingClientRect();
                    const clickPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    const clickSec = clickPct * (globalMasterDuration || 1);

                    needle.style.left = `${clickPct * 100}%`;
                    timeText.innerText = `${clickSec.toFixed(2)}s / ${(globalMasterDuration || 1).toFixed(2)}s`;

                    if (audioEl.src && isOnline) {
                        const st = parseFloat(sIn.value);
                        if (audioEl.duration && audioEl.duration >= (globalMasterDuration || 1) * 0.9) {
                            audioEl.currentTime = clickSec;
                        } else {
                            audioEl.currentTime = Math.max(0, clickSec - st);
                        }
                    }
                };

                timeline.onpointerdown = (e) => {
                    isUserDraggingTimeline = true;
                    timeline.setPointerCapture(e.pointerId);
                    updatePlayheadFromPointer(e.clientX);

                    timeline.onpointermove = (ev) => {
                        if (isUserDraggingTimeline) updatePlayheadFromPointer(ev.clientX);
                    };

                        timeline.onpointerup = (ev) => {
                            isUserDraggingTimeline = false;
                            timeline.releasePointerCapture(ev.pointerId);
                            timeline.onpointermove = null;
                            timeline.onpointerup = null;
                            if (!audioEl.paused) smoothLoop();
                        };
                };

                return {
                    track, audioEl, sIn, eIn, gIn, inStart, inEnd, btnPower, timeText,
                    getOnline: () => isOnline,
                      setOnlineState: (online) => {
                          isOnline = Boolean(online);
                          updateVisualState();
                      },
                      syncRangeDisplay,
                      applyState: (en, st, end, vol) => {
                          isEnabled = en;
                          btnPower.innerText = en ? "ON" : "OFF";
                          btnPower.classList.toggle("active", en);

                          sIn.max = globalMasterDuration;
                          eIn.max = globalMasterDuration;
                          inStart.max = globalMasterDuration;
                          inEnd.max = globalMasterDuration;

                          sIn.value = st;
                          eIn.value = end;
                          gIn.value = vol;

                          updateVisualState();
                      }
                };
            };

            const trackUI = {
                1: createProTrack(1, "CH-1 // BASE AUDIO (MINIMAX / SOURCE)", COLOR_CYAN, "ch1"),
                      2: createProTrack(2, "CH-2 // INSERT OVERLAY (TTS / REEMPLAZO)", COLOR_MAGENTA, "ch2"),
                      3: createProTrack(3, "CH-3 // AUXILIARY TRACK (SFX / BGM)", COLOR_AMBER, "ch3")
            };

            tracksList.appendChild(trackUI[1].track);
            tracksList.appendChild(trackUI[2].track);
            tracksList.appendChild(trackUI[3].track);

            // Master Preview
            const masterConsole = document.createElement("div");
            masterConsole.className = "mcv-master-preview-strip";

            const masterLbl = document.createElement("span");
            masterLbl.className = "mcv-master-lbl";
            masterLbl.innerText = "MASTER MIX PREVIEW";

            const masterPlayBtn = document.createElement("button");
            masterPlayBtn.className = "mcv-pro-play-btn";
            masterPlayBtn.style.border = "1.2px solid #10b981";
            masterPlayBtn.style.color = "#10b981";
            masterPlayBtn.innerText = "▶ PLAY";

            const masterTrack = document.createElement("div");
            masterTrack.className = "mcv-pro-track";
            masterTrack.style.borderColor = "rgba(16, 185, 129, 0.5)";

            const masterFill = document.createElement("div");
            masterFill.style.height = "100%";
            masterFill.style.width = "0%";
            masterFill.style.background = "#10b981";
            masterTrack.appendChild(masterFill);

            const masterTime = document.createElement("span");
            masterTime.className = "mcv-pro-time";
            masterTime.style.color = "#10b981";
            masterTime.innerText = "0.00s / 0.00s";

            masterConsole.appendChild(masterLbl);
            masterConsole.appendChild(masterPlayBtn);
            masterConsole.appendChild(masterTrack);
            masterConsole.appendChild(masterTime);
            container.appendChild(masterConsole);

            const masterAudioEl = new Audio();
            let masterAnimFrame = null;
            let isUserDraggingMaster = false;

            const smoothMasterLoop = () => {
                if (!masterAudioEl.paused && !masterAudioEl.ended && !isUserDraggingMaster) {
                    const cur = masterAudioEl.currentTime || 0;
                    const dur = masterAudioEl.duration || globalMasterDuration || 1;
                    masterFill.style.width = `${(cur / dur) * 100}%`;
                    masterTime.innerText = `${cur.toFixed(2)}s / ${dur.toFixed(2)}s`;
                    masterAnimFrame = requestAnimationFrame(smoothMasterLoop);
                }
            };

            masterPlayBtn.onclick = () => {
                if (!masterAudioEl.src) return;
                if (masterAudioEl.paused) {
                    masterAudioEl.play().then(() => {
                        masterPlayBtn.innerText = "❚❚ PAUSE";
                        cancelAnimationFrame(masterAnimFrame);
                        smoothMasterLoop();
                    });
                } else {
                    masterAudioEl.pause();
                    masterPlayBtn.innerText = "▶ PLAY";
                    cancelAnimationFrame(masterAnimFrame);
                }
            };

            masterAudioEl.onended = () => {
                masterPlayBtn.innerText = "▶ PLAY";
                masterFill.style.width = "0%";
                cancelAnimationFrame(masterAnimFrame);
            };

            const updateMasterFromPointer = (clientX) => {
                const rect = masterTrack.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                masterFill.style.width = `${pos * 100}%`;
                const d = masterAudioEl.duration || globalMasterDuration || 1;
                masterTime.innerText = `${(pos * d).toFixed(2)}s / ${d.toFixed(2)}s`;
                if (masterAudioEl.src) masterAudioEl.currentTime = pos * d;
            };

                masterTrack.onpointerdown = (e) => {
                    isUserDraggingMaster = true;
                    masterTrack.setPointerCapture(e.pointerId);
                    updateMasterFromPointer(e.clientX);

                    masterTrack.onpointermove = (ev) => {
                        if (isUserDraggingMaster) updateMasterFromPointer(ev.clientX);
                    };

                        masterTrack.onpointerup = (ev) => {
                            isUserDraggingMaster = false;
                            masterTrack.releasePointerCapture(ev.pointerId);
                            masterTrack.onpointermove = null;
                            masterTrack.onpointerup = null;
                            if (!masterAudioEl.paused) smoothMasterLoop();
                        };
                };

                // Acciones inferiores
                const bottomBar = document.createElement("div");
                bottomBar.className = "mcv-bottom-bar";

                const renderBtn = document.createElement("button");
                renderBtn.className = "mcv-btn-action mcv-btn-render";
                renderBtn.innerText = "⚡ RENDER MASTER MIX";
                renderBtn.onclick = () => {
                    if (app.queuePrompt) app.queuePrompt(0);
                };

                    const saveBtn = document.createElement("button");
                    saveBtn.className = "mcv-btn-action mcv-btn-save";
                    saveBtn.innerText = "💾 GUARDAR AUDIO";
                    saveBtn.disabled = !node.properties.master_filename;

                    saveBtn.onclick = () => {
                        const filename = node.properties.master_filename;
                        const subfolder = "AudioEditorStudio";
                        if (!filename) return;

                        const downloadUrl = api.apiURL(`/view?filename=${encodeURIComponent(filename)}&type=output&subfolder=${encodeURIComponent(subfolder)}`);
                        const a = document.createElement("a");
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        const orig = saveBtn.innerText;
                        saveBtn.innerText = "✓ GUARDADO!";
                        setTimeout(() => { saveBtn.innerText = orig; }, 1500);
                    };

                    bottomBar.appendChild(renderBtn);
                    bottomBar.appendChild(saveBtn);
                    container.appendChild(bottomBar);

                    // Ajuste exacto del DOM Widget para que no se salga de los límites del nodo
                    const domWidget = node.addDOMWidget("audio_fixed_studio", "custom_rack", container, { serialize: false });
                    domWidget.computeSize = () => [FIXED_WIDTH, FIXED_HEIGHT - 30];

                    const refreshCableConnections = () => {
                        if (!node.inputs) return;
                        const checkPin = (name) => {
                            const inp = node.inputs.find(i => i.name === name);
                            return Boolean(inp && inp.link !== null && inp.link !== undefined);
                        };

                        const h1 = checkPin("audio_1");
                        const h2 = checkPin("audio_2");
                        const h3 = checkPin("audio_3");

                        if (trackUI[1].getOnline() !== h1) trackUI[1].setOnlineState(h1);
                        if (trackUI[2].getOnline() !== h2) trackUI[2].setOnlineState(h2);
                        if (trackUI[3].getOnline() !== h3) trackUI[3].setOnlineState(h3);
                    };

                        node.onConnectionsChange = function () {
                            setTimeout(refreshCableConnections, 20);
                        };

                        const origDrawForeground = node.onDrawForeground;
                        node.onDrawForeground = function (ctx) {
                            if (origDrawForeground) origDrawForeground.apply(this, arguments);
                            refreshCableConnections();
                        };

                        node.onSerialize = function (info) {
                            info.properties = info.properties || {};
                            info.properties.global_master_dur = globalMasterDuration;

                            info.widgets_values = [];
                            [1, 2, 3].forEach(id => {
                                const t = trackUI[id];
                                const en = t.btnPower.innerText === "ON";
                                const st = parseFloat(t.sIn.value) || 0.0;
                                const enSec = parseFloat(t.eIn.value) || 0.0;
                                const vol = parseFloat(t.gIn.value) !== undefined ? parseFloat(t.gIn.value) : 1.0;

                                info.properties[`ch${id}_enabled`] = en;
                                info.properties[`ch${id}_start`] = st;
                                info.properties[`ch${id}_end`] = enSec;
                                info.properties[`ch${id}_vol`] = vol;

                                info.widgets_values.push(en, st, enSec, vol);
                            });
                            info.properties.master_filename = node.properties.master_filename || "";
                        };

                        const restoreSavedWorkflowState = () => {
                            const p = node.properties || {};
                            if (p.global_master_dur) globalMasterDuration = p.global_master_dur;

                            const prefixes = ["ch1", "ch2", "ch3"];

                            [1, 2, 3].forEach(id => {
                                const t = trackUI[id];
                                const pref = prefixes[id - 1];

                                const wEn = node.widgets?.find(w => w.name === `${pref}_enabled`);
                                const wSt = node.widgets?.find(w => w.name === `${pref}_start`);
                                const wEnd = node.widgets?.find(w => w.name === `${pref}_end`);
                                const wVol = node.widgets?.find(w => w.name === `${pref}_volume`);

                                const en = (p[`ch${id}_enabled`] !== undefined) ? p[`ch${id}_enabled`] : (wEn ? Boolean(wEn.value) : true);
                                const st = (p[`ch${id}_start`] !== undefined) ? p[`ch${id}_start`] : (wSt ? parseFloat(wSt.value) : 0.0);
                                const end = (p[`ch${id}_end`] !== undefined) ? p[`ch${id}_end`] : (wEnd ? parseFloat(wEnd.value) : globalMasterDuration);
                                const vol = (p[`ch${id}_vol`] !== undefined) ? p[`ch${id}_vol`] : (wVol ? parseFloat(wVol.value) : 1.0);

                                t.applyState(en, st, end, vol);
                            });

                            updateAllTracksGlobalScale(globalMasterDuration);

                            if (p.master_url) masterAudioEl.src = p.master_url;
                            if (p.master_filename) saveBtn.disabled = false;

                            refreshCableConnections();
                        };

                        const origOnConfigure = node.onConfigure;
                        node.onConfigure = function (info) {
                            if (origOnConfigure) origOnConfigure.apply(this, arguments);
                            if (info && info.properties) {
                                node.properties = { ...node.properties, ...info.properties };
                            }
                            setTimeout(restoreSavedWorkflowState, 30);
                            setTimeout(restoreSavedWorkflowState, 150);
                        };

                        const onExecuted = node.onExecuted;
                        node.onExecuted = function (message) {
                            if (onExecuted) onExecuted.apply(this, arguments);

                            refreshCableConnections();

                            // 1. CH-1 define la regla maestra
                            if (message?.track_1?.[0]) {
                                const item1 = message.track_1[0];
                                const url1 = `/view?filename=${encodeURIComponent(item1.filename)}&type=${item1.type}&subfolder=${encodeURIComponent(item1.subfolder || "")}`;
                                const t1 = trackUI[1];
                                t1.audioEl.src = url1;
                                t1.audioEl.onloadedmetadata = () => {
                                    const baseDur = t1.audioEl.duration || 10.0;
                                    updateAllTracksGlobalScale(baseDur);
                                    if (parseFloat(t1.eIn.value) === 0 || parseFloat(t1.eIn.value) > baseDur) {
                                        t1.eIn.value = baseDur.toFixed(2);
                                    }
                                    t1.syncRangeDisplay();
                                };
                                t1.audioEl.load();
                            }

                            // 2. CH-2 (Roja) y CH-3 (Amarilla): Comportamiento 100% idéntico y simétrico
                            [2, 3].forEach(id => {
                                const key = `track_${id}`;
                                const t = trackUI[id];

                                if (message?.[key]?.[0]) {
                                    const item = message[key][0];
                                    const url = `/view?filename=${encodeURIComponent(item.filename)}&type=${item.type}&subfolder=${encodeURIComponent(item.subfolder || "")}`;
                                    t.audioEl.src = url;
                                    t.audioEl.onloadedmetadata = () => {
                                        t.sIn.max = globalMasterDuration;
                                        t.eIn.max = globalMasterDuration;
                                        t.inStart.max = globalMasterDuration;
                                        t.inEnd.max = globalMasterDuration;

                                        // Acople automático estricto al tamaño del clip secundario
                                        const clipDur = t.audioEl.duration;
                                        if (clipDur && clipDur > 0) {
                                            const curStart = parseFloat(t.sIn.value) || 0.0;
                                            t.eIn.value = Math.min(globalMasterDuration, curStart + clipDur).toFixed(2);
                                        }
                                        t.syncRangeDisplay();
                                    };
                                    t.audioEl.load();
                                }
                            });

                            if (message?.master_preview?.[0]) {
                                const mItem = message.master_preview[0];
                                const mUrl = `/view?filename=${encodeURIComponent(mItem.filename)}&type=${mItem.type}&subfolder=${encodeURIComponent(mItem.subfolder || "")}`;
                                node.properties.master_url = mUrl;
                                node.properties.master_filename = mItem.filename;

                                masterAudioEl.src = mUrl;
                                masterAudioEl.load();
                                saveBtn.disabled = false;
                            }

                            node.setDirtyCanvas(true, true);
                        };

                        setTimeout(restoreSavedWorkflowState, 40);
        };
    }
});
