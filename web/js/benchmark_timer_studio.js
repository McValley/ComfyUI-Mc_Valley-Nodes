import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const styleId = "mcv-benchmark-timer-css";
let styleTag = document.getElementById(styleId);
if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
}
styleTag.textContent = `
.mcv-timer-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    padding: 10px 12px !important;
    background: radial-gradient(circle at 50% 0%, #031726 0%, #02080d 100%) !important;
    border-radius: 10px !important;
    border: 1px solid rgba(0, 212, 255, 0.45) !important;
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.2), inset 0 0 16px rgba(0, 0, 0, 0.85) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    user-select: none !important;
    overflow: hidden !important;
    transition: opacity 0.25s ease, filter 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
}

.mcv-timer-bypassed {
    opacity: 0.35 !important;
    filter: grayscale(0.9) brightness(0.55) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: none !important;
    pointer-events: none !important;
}

.mcv-timer-bypassed .mcv-timer-title,
.mcv-timer-bypassed .mcv-timer-digits {
    text-shadow: none !important;
}

.mcv-timer-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-bottom: 1px solid rgba(0, 212, 255, 0.25) !important;
    padding-bottom: 6px !important;
}

.mcv-timer-title {
    color: #00d4ff !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 1.2px !important;
    text-transform: uppercase !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.4) !important;
}

.mcv-timer-status {
    color: #8da4be !important;
    font-size: 9px !important;
    font-family: "JetBrains Mono", monospace !important;
    background: rgba(0, 212, 255, 0.08) !important;
    padding: 2px 6px !important;
    border-radius: 3px !important;
    border: 1px solid rgba(0, 212, 255, 0.2) !important;
    font-weight: bold !important;
}

.mcv-timer-card {
    background: rgba(4, 18, 29, 0.85) !important;
    border: 1px solid rgba(0, 212, 255, 0.25) !important;
    border-radius: 8px !important;
    padding: 8px 10px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    position: relative !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
    box-sizing: border-box !important;
    transition: border-color 0.2s ease, opacity 0.2s ease !important;
}

.mcv-timer-card.locked {
    border-color: rgba(255, 255, 255, 0.15) !important;
    opacity: 0.65 !important;
}

.mcv-timer-card-head {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 6px !important;
}

.mcv-timer-title-input {
    background: #020c14 !important;
    border: 1px solid rgba(0, 212, 255, 0.35) !important;
    border-radius: 4px !important;
    color: #00d4ff !important;
    font-size: 10px !important;
    font-weight: bold !important;
    padding: 3px 6px !important;
    flex: 1 !important;
    outline: none !important;
}
.mcv-timer-title-input:focus {
    border-color: #00d4ff !important;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
}

.mcv-timer-badge {
    font-size: 9px !important;
    font-family: "JetBrains Mono", monospace !important;
    font-weight: bold !important;
    padding: 2px 7px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.mcv-timer-badge.active {
    color: #00ff88 !important;
    background: rgba(0, 255, 136, 0.12) !important;
    border: 1px solid rgba(0, 255, 136, 0.4) !important;
}

.mcv-timer-badge.off {
    color: #ff4444 !important;
    background: rgba(255, 68, 68, 0.12) !important;
    border: 1px solid rgba(255, 68, 68, 0.4) !important;
}

.mcv-timer-delete {
    color: #4b6379 !important;
    cursor: pointer !important;
    font-size: 11px !important;
    padding: 2px 5px !important;
}
.mcv-timer-delete:hover {
    color: #ff4444 !important;
}

.mcv-timer-screen {
    background: #01060a !important;
    border: 1.5px solid rgba(0, 255, 136, 0.35) !important;
    box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.95), 0 0 14px rgba(0, 255, 136, 0.15) !important;
    border-radius: 6px !important;
    padding: 6px 4px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
}

.mcv-timer-screen.locked {
    border-color: rgba(255, 255, 255, 0.15) !important;
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.95) !important;
}

.mcv-timer-digits {
    font-family: "JetBrains Mono", monospace !important;
    font-size: 24px !important;
    font-weight: 900 !important;
    color: #00ff88 !important;
    letter-spacing: 2px !important;
    text-shadow: 0 0 12px rgba(0, 255, 136, 0.6) !important;
}

.mcv-timer-digits.locked {
    color: #8da4be !important;
    text-shadow: none !important;
}

.mcv-timer-notes {
    background: #020c14 !important;
    border: 1px solid rgba(0, 212, 255, 0.25) !important;
    border-radius: 4px !important;
    color: #f1f5f9 !important;
    font-size: 9.5px !important;
    padding: 5px 7px !important;
    resize: none !important;
    height: 42px !important;
    outline: none !important;
    font-family: inherit !important;
    box-sizing: border-box !important;
    width: 100% !important;
}
.mcv-timer-notes:focus {
    border-color: #00d4ff !important;
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.3) !important;
}

.mcv-timer-add-btn {
    background: rgba(0, 212, 255, 0.12) !important;
    border: 1px dashed rgba(0, 212, 255, 0.45) !important;
    color: #00d4ff !important;
    padding: 8px !important;
    border-radius: 6px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    letter-spacing: 1px !important;
    cursor: pointer !important;
    text-align: center !important;
    text-transform: uppercase !important;
    transition: all 0.2s ease !important;
}
.mcv-timer-add-btn:hover {
    background: rgba(0, 212, 255, 0.25) !important;
    border-color: #00d4ff !important;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.35) !important;
}
`;

// Variables de sincronización global
let isWorkflowRunning = false;
let globalStartTime = 0;
let timerTicker = null;
const activeStudioInstances = new Set();

function formatTime(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function startGlobalTimer() {
    if (isWorkflowRunning) return;
    isWorkflowRunning = true;
    globalStartTime = performance.now();

    activeStudioInstances.forEach(inst => {
        inst.onWorkflowStart?.();
    });

    if (timerTicker) clearInterval(timerTicker);
    timerTicker = setInterval(() => {
        if (!isWorkflowRunning) return;
        const elapsed = performance.now() - globalStartTime;
        const timeStr = formatTime(elapsed);

        activeStudioInstances.forEach(inst => {
            inst.updateActiveTimers?.(timeStr, elapsed);
        });
    }, 33); // Actualización fluida a 30 FPS garantizada
}

function stopGlobalTimer(statusText = "IDLE") {
    if (!isWorkflowRunning) return;
    isWorkflowRunning = false;
    if (timerTicker) {
        clearInterval(timerTicker);
        timerTicker = null;
    }

    const elapsed = performance.now() - globalStartTime;
    const finalStr = formatTime(elapsed);

    activeStudioInstances.forEach(inst => {
        inst.onWorkflowFinish?.(finalStr, elapsed, statusText);
    });
}

function cancelGlobalTimer() {
    isWorkflowRunning = false;
    if (timerTicker) {
        clearInterval(timerTicker);
        timerTicker = null;
    }

    activeStudioInstances.forEach(inst => {
        inst.onWorkflowCancel?.();
    });
}

// Disparadores robustos de ComfyUI
api.addEventListener("execution_start", () => {
    startGlobalTimer();
});

api.addEventListener("executing", (ev) => {
    if (ev.detail !== null) {
        // Si hay un nodo ejecutándose y el timer aún no arrancó, iniciarlo de inmediato
        if (!isWorkflowRunning) startGlobalTimer();
    } else if (isWorkflowRunning) {
        // Node null indica finalización de la cola
        stopGlobalTimer("FINISHED");
    }
});

api.addEventListener("execution_interrupted", () => {
    cancelGlobalTimer();
});

api.addEventListener("execution_error", () => {
    stopGlobalTimer("ERROR");
});

app.registerExtension({
    name: "Mc_Valley.BenchmarkTimerStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "McValley_BenchmarkTimerStudio") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;
            const onSerialize = nodeType.prototype.onSerialize;

            nodeType.prototype.setupTimerHUD = function () {
                const FIXED_WIDTH = 420;
                const BASE_HEIGHT = 115;
                const CARD_HEIGHT = 158;

                const calcNodeHeight = (count) => BASE_HEIGHT + (Math.max(1, count) * CARD_HEIGHT);

                this.resizable = false;
                this.color = "#041421";
                this.bgcolor = "#020a10";

                if (!this.properties) this.properties = {};
                if (!this.properties.cards || !this.properties.cards.length) {
                    this.properties.cards = [
                        {
                            id: "t_" + Date.now(),
                      title: "Run 1 (Baseline)",
                      timeStr: "00:00.00",
                      elapsedMs: 0,
                      notes: "",
                      active: true
                        }
                    ];
                }

                if (this.domElementAttached) {
                    this.renderCards?.();
                    this.updateFixedSize?.();
                    return;
                }
                this.domElementAttached = true;

                const main = document.createElement("div");
                main.className = "mcv-timer-container";

                const updateBypassState = () => {
                    const isBypassed = (this.mode === 4 || this.mode === 2);
                    if (isBypassed) main.classList.add("mcv-timer-bypassed");
                    else main.classList.remove("mcv-timer-bypassed");
                };

                    const origOnDrawForeground = this.onDrawForeground;
                    this.onDrawForeground = function(ctx) {
                        if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                        updateBypassState();
                    };

                    const head = document.createElement("div");
                    head.className = "mcv-timer-header";
                    const title = document.createElement("span");
                    title.className = "mcv-timer-title";
                    title.innerHTML = `⏱️ BENCHMARK TIMER STUDIO`;
                    this.statusBadge = document.createElement("span");
                    this.statusBadge.className = "mcv-timer-status";
                    this.statusBadge.textContent = "READY";
                    head.append(title, this.statusBadge);
                    main.appendChild(head);

                    const cardsBox = document.createElement("div");
                    cardsBox.style.display = "flex";
                    cardsBox.style.flexDirection = "column";
                    cardsBox.style.gap = "8px";
                    main.appendChild(cardsBox);

                    const updateFixedSize = () => {
                        const count = this.properties.cards ? this.properties.cards.length : 1;
                        const h = calcNodeHeight(count);
                        this.size = [FIXED_WIDTH, h];
                        this.setSize([FIXED_WIDTH, h]);
                        if (app.graph) app.graph.setDirtyCanvas(true, true);
                    };

                        const renderCards = () => {
                            cardsBox.innerHTML = "";

                            this.properties.cards.forEach((c, idx) => {
                                const card = document.createElement("div");
                                card.className = `mcv-timer-card ${c.active ? '' : 'locked'}`;

                                const cHead = document.createElement("div");
                                cHead.className = "mcv-timer-card-head";

                                const titleInp = document.createElement("input");
                                titleInp.type = "text";
                                titleInp.className = "mcv-timer-title-input";
                                titleInp.placeholder = "Benchmark Title / Setup...";
                                titleInp.value = c.title;
                                titleInp.oninput = () => {
                                    c.title = titleInp.value;
                                };

                                const toggleBadge = document.createElement("span");
                                toggleBadge.className = `mcv-timer-badge ${c.active ? 'active' : 'off'}`;
                                toggleBadge.textContent = c.active ? "● ACTIVE" : "🔒 LOCKED";
                                toggleBadge.onclick = () => {
                                    c.active = !c.active;
                                    renderCards();
                                };

                                cHead.append(titleInp, toggleBadge);

                                if (this.properties.cards.length > 1) {
                                    const delBtn = document.createElement("span");
                                    delBtn.className = "mcv-timer-delete";
                                    delBtn.textContent = "✕";
                                    delBtn.title = "Remove timer entry";
                                    delBtn.onclick = () => {
                                        this.properties.cards.splice(idx, 1);
                                        renderCards();
                                        updateFixedSize();
                                    };
                                    cHead.appendChild(delBtn);
                                }

                                const screen = document.createElement("div");
                                screen.className = `mcv-timer-screen ${c.active ? '' : 'locked'}`;

                                const digits = document.createElement("div");
                                digits.className = `mcv-timer-digits ${c.active ? '' : 'locked'}`;
                                digits.textContent = c.timeStr || "00:00.00";

                                // Guardar la referencia directa al elemento en el objeto de datos
                                c.digitsEl = digits;
                                screen.appendChild(digits);

                                const notesArea = document.createElement("textarea");
                                notesArea.className = "mcv-timer-notes";
                                notesArea.placeholder = "Benchmark notes (steps, model, hardware, observed time)...";
                                notesArea.value = c.notes;
                                notesArea.oninput = () => {
                                    c.notes = notesArea.value;
                                };

                                card.append(cHead, screen, notesArea);
                                cardsBox.appendChild(card);
                            });
                        };

                        const addBtn = document.createElement("div");
                        addBtn.className = "mcv-timer-add-btn";
                        addBtn.textContent = "+ ADD BENCHMARK TIMER";
                        addBtn.onclick = () => {
                            this.properties.cards.push({
                                id: "t_" + Date.now(),
                                                       title: `Run ${this.properties.cards.length + 1}`,
                                                       timeStr: "00:00.00",
                                                       elapsedMs: 0,
                                                       notes: "",
                                                       active: true
                            });
                            renderCards();
                            updateFixedSize();
                        };
                        main.appendChild(addBtn);

                        const domWidget = this.addDOMWidget("mcv_benchmark_ui", "custom", main, { serialize: false });
                        domWidget.computeSize = () => {
                            const count = this.properties?.cards ? this.properties.cards.length : 1;
                            return [FIXED_WIDTH, calcNodeHeight(count) - 32];
                        };

                        this.onWorkflowStart = () => {
                            if (this.mode === 4 || this.mode === 2) return;
                            if (this.statusBadge) {
                                this.statusBadge.textContent = "RECORDING...";
                                this.statusBadge.style.color = "#00ff88";
                            }
                            this.properties.cards.forEach(c => {
                                if (c.active) {
                                    c.timeStr = "00:00.00";
                                    if (c.digitsEl) c.digitsEl.textContent = "00:00.00";
                                }
                            });
                        };

                        this.updateActiveTimers = (timeStr, elapsedMs) => {
                            if (this.mode === 4 || this.mode === 2) return;
                            this.properties.cards.forEach(c => {
                                if (c.active) {
                                    c.timeStr = timeStr;
                                    c.elapsedMs = elapsedMs;
                                    // Actualización directa sin consultar document.getElementById
                                    if (c.digitsEl) c.digitsEl.textContent = timeStr;
                                }
                            });
                        };

                        this.onWorkflowFinish = (finalStr, elapsedMs, status) => {
                            if (this.mode === 4 || this.mode === 2) return;
                            if (this.statusBadge) {
                                this.statusBadge.textContent = status;
                                this.statusBadge.style.color = status === "FINISHED" ? "#00ff88" : "#ff4444";
                            }
                            this.properties.cards.forEach(c => {
                                if (c.active) {
                                    c.timeStr = finalStr;
                                    c.elapsedMs = elapsedMs;
                                    if (c.digitsEl) c.digitsEl.textContent = finalStr;
                                }
                            });
                        };

                        this.onWorkflowCancel = () => {
                            if (this.mode === 4 || this.mode === 2) return;
                            if (this.statusBadge) {
                                this.statusBadge.textContent = "CANCELED";
                                this.statusBadge.style.color = "#ff4444";
                            }
                        };

                        activeStudioInstances.add(this);

                        this.onRemoved = () => {
                            activeStudioInstances.delete(this);
                        };

                        this.renderCards = renderCards;
                        this.updateFixedSize = updateFixedSize;

                        renderCards();
                        updateFixedSize();
            };

            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                this.setupTimerHUD();
            };

            nodeType.prototype.onSerialize = function (info) {
                if (onSerialize) onSerialize.apply(this, arguments);
                info.properties = { ...this.properties };
            };

            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (info?.properties) {
                    this.properties = { ...this.properties, ...info.properties };
                }
                setTimeout(() => {
                    this.setupTimerHUD();
                    app.graph.setDirtyCanvas(true, true);
                }, 40);
            };
        }
    },
    async nodeCreated(node) {
        if (node.comfyClass === "McValley_BenchmarkTimerStudio" && node.setupTimerHUD) {
            node.setupTimerHUD();
        }
    }
});
