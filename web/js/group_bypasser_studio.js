import { app } from "/scripts/app.js";

const THEME = {
    header: "#072b38",
    body: "#051b24",
    cyan: "#00e5ff",
    red: "#ff3366",
    gray: "#203038",
    textLight: "#d0f0ff"
};

app.registerExtension({
    name: "Mc_Valley.GroupBypasserStudio",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "McValley_GroupBypasserStudio") {
            nodeData.color = THEME.header;
            nodeData.bgcolor = THEME.body;

            const origOnNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = origOnNodeCreated ? origOnNodeCreated.apply(this, arguments) : undefined;

                this.color = THEME.header;
                this.bgcolor = THEME.body;
                if (this.title_color !== undefined) this.title_color = THEME.cyan;

                if (!this.properties) this.properties = {};
                if (!this.properties.groupsConfig) this.properties.groupsConfig = {};

                this.size = [360, 180];

                // 1. Obtener nodos dentro del grupo + soporte recursivo para Subgraphs
                this.getNodesInGroup = function (group) {
                    if (!app.graph || !app.graph._nodes) return [];
                    const gTitleY = 30;
                    const gx = group._pos[0];
                    const gy = group._pos[1] + gTitleY;
                    const gw = group._size[0];
                    const gh = group._size[1] - gTitleY;

                    const matchedNodes = [];

                    const checkInside = (node) => {
                        const nx = node.pos[0];
                        const ny = node.pos[1];
                        return (nx >= gx && nx <= gx + gw && ny >= gy && ny <= gy + gh);
                    };

                    const collectRecursive = (nodeList) => {
                        for (const n of nodeList) {
                            if (n === this) continue;
                            matchedNodes.push(n);

                            const innerGraph = n.subgraph || n.inner_graph;
                            if (innerGraph && innerGraph._nodes) {
                                collectRecursive(innerGraph._nodes);
                            }
                        }
                    };

                    const topNodes = app.graph._nodes.filter(n => n !== this && checkInside(n));
                    collectRecursive(topNodes);

                    return matchedNodes;
                };

                // 2. Evaluar el estado real de los nodos adentro del grupo
                this.isGroupCurrentlyActive = function (group) {
                    const nodes = this.getNodesInGroup(group);
                    if (nodes.length === 0) return true;
                    // Si la mayoría o todos están en Bypass (mode 4), el grupo está desactivado
                    const activeNodes = nodes.filter(n => n.mode === 0);
                    return activeNodes.length > 0;
                };

                // 3. Sincronizar estados (Active = 0, Bypass = 4) y notificar a otros nodos
                this.syncGroupNodes = function (groupTitle, isActive) {
                    if (!app.graph || !app.graph._groups) return;
                    const group = app.graph._groups.find(g => g.title === groupTitle);
                    if (!group) return;

                    const targetMode = isActive ? 0 : 4;
                    const nodes = this.getNodesInGroup(group);

                    for (const n of nodes) {
                        n.mode = targetMode;
                        if (n.onModeChange) n.onModeChange();

                        const innerGraph = n.subgraph || n.inner_graph;
                        if (innerGraph && innerGraph._nodes) {
                            for (const subNode of innerGraph._nodes) {
                                subNode.mode = targetMode;
                                if (subNode.onModeChange) subNode.onModeChange();
                            }
                        }
                    }

                    // Sincronizar todos los demás nodos McValley_GroupBypasserStudio del canvas
                    if (app.graph._nodes) {
                        for (const otherNode of app.graph._nodes) {
                            if (otherNode !== this && otherNode.comfyClass === "McValley_GroupBypasserStudio") {
                                if (otherNode.properties && otherNode.properties.groupsConfig && otherNode.properties.groupsConfig[groupTitle]) {
                                    otherNode.properties.groupsConfig[groupTitle].active = isActive;
                                }
                            }
                        }
                    }

                    if (app.graph.setDirtyCanvas) {
                        app.graph.setDirtyCanvas(true, true);
                    }
                };

                // 4. Limpieza de grupos borrados, coherencia de estado y detección de nuevos
                this.refreshGroupsList = function () {
                    if (!app.graph || !app.graph._groups) return;

                    const currentCanvasGroupTitles = new Set(
                        app.graph._groups.map(g => g.title || "Untitled Group")
                    );

                    // Eliminar del nodo cualquier grupo que haya sido borrado manualmente
                    for (const title in this.properties.groupsConfig) {
                        if (!currentCanvasGroupTitles.has(title)) {
                            delete this.properties.groupsConfig[title];
                        }
                    }

                    // Agregar o inspeccionar grupos existentes
                    for (const g of app.graph._groups) {
                        const title = g.title || "Untitled Group";
                        const realActiveState = this.isGroupCurrentlyActive(g);

                        if (!this.properties.groupsConfig[title]) {
                            // Al nacer el nodo, hereda el estado real que ya tienen los nodos
                            this.properties.groupsConfig[title] = {
                                active: realActiveState,
                                excluded: false
                            };
                        } else {
                            // Si los nodos cambiaron de estado externamente, actualizar coherencia
                            this.properties.groupsConfig[title].active = realActiveState;
                        }
                    }

                    const visibleCount = Object.keys(this.properties.groupsConfig).filter(
                        k => !this.properties.groupsConfig[k].excluded
                    ).length;

                    const newHeight = Math.max(160, 70 + (visibleCount * 36) + 30);
                    this.size[1] = newHeight;
                };

                this.onDrawForeground = function (ctx) {
                    this.refreshGroupsList();

                    const visibleGroups = Object.keys(this.properties.groupsConfig).filter(
                        k => !this.properties.groupsConfig[k].excluded
                    );

                    let y = 65;
                    const rowHeight = 30;
                    const btnWidth = 75;
                    const remWidth = 24;

                    ctx.save();

                    if (visibleGroups.length === 0) {
                        ctx.fillStyle = "#668899";
                        ctx.font = "italic 11px sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText("Sin grupos vinculados.", this.size[0] / 2, y + 20);
                        ctx.restore();
                        return;
                    }

                    for (const title of visibleGroups) {
                        const conf = this.properties.groupsConfig[title];
                        const isActive = conf.active;

                        // Fondo de fila
                        ctx.fillStyle = "#020f17";
                        ctx.strokeStyle = THEME.gray;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(12, y - 18, this.size[0] - 24, rowHeight, 4);
                        ctx.fill();
                        ctx.stroke();

                        // Nombre del grupo
                        ctx.fillStyle = isActive ? THEME.textLight : "#607d8b";
                        ctx.font = "bold 11px sans-serif";
                        ctx.textAlign = "left";
                        ctx.textBaseline = "middle";
                        ctx.fillText(title.length > 22 ? title.substring(0, 20) + ".." : title, 20, y - 3);

                        // Botón ACTIVE / BYPASS
                        const btnX = this.size[0] - 12 - btnWidth - remWidth - 8;
                        ctx.fillStyle = isActive ? THEME.cyan : THEME.gray;
                        ctx.beginPath();
                        ctx.roundRect(btnX, y - 15, btnWidth, 24, 3);
                        ctx.fill();

                        ctx.fillStyle = isActive ? "#001a24" : "#b0bec5";
                        ctx.font = "bold 10px monospace";
                        ctx.textAlign = "center";
                        ctx.fillText(isActive ? "ACTIVE" : "BYPASS", btnX + (btnWidth / 2), y - 3);

                        // Botón Remover [✕]
                        const remX = this.size[0] - 12 - remWidth - 2;
                        ctx.fillStyle = "#1a080c";
                        ctx.strokeStyle = THEME.red;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(remX, y - 15, remWidth, 24, 3);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = THEME.red;
                        ctx.font = "bold 11px monospace";
                        ctx.textAlign = "center";
                        ctx.fillText("✕", remX + (remWidth / 2), y - 3);

                        y += 36;
                    }

                    ctx.restore();
                };

                this.onMouseDown = function (e, localPos) {
                    const visibleGroups = Object.keys(this.properties.groupsConfig).filter(
                        k => !this.properties.groupsConfig[k].excluded
                    );

                    let y = 65;
                    const btnWidth = 75;
                    const remWidth = 24;

                    for (const title of visibleGroups) {
                        const conf = this.properties.groupsConfig[title];
                        const btnX = this.size[0] - 12 - btnWidth - remWidth - 8;
                        const remX = this.size[0] - 12 - remWidth - 2;

                        if (localPos[0] >= btnX && localPos[0] <= btnX + btnWidth &&
                            localPos[1] >= y - 15 && localPos[1] <= y + 9) {
                            conf.active = !conf.active;
                        this.syncGroupNodes(title, conf.active);
                        return true;
                            }

                            if (localPos[0] >= remX && localPos[0] <= remX + remWidth &&
                                localPos[1] >= y - 15 && localPos[1] <= y + 9) {
                                conf.excluded = true;
                            this.refreshGroupsList();
                            if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                            return true;
                                }

                                y += 36;
                    }
                };

                const origGetExtraMenuOptions = this.getExtraMenuOptions;
                this.getExtraMenuOptions = function (_, options) {
                    if (origGetExtraMenuOptions) origGetExtraMenuOptions.apply(this, arguments);

                    const self = this;
                    const excludedGroups = Object.keys(this.properties.groupsConfig).filter(
                        k => this.properties.groupsConfig[k].excluded
                    );

                    if (excludedGroups.length > 0) {
                        options.push({
                            content: "🔄 Re-vincular Grupo Excluido",
                            submenu: {
                                options: excludedGroups.map(title => ({
                                    content: title,
                                    callback: () => {
                                        self.properties.groupsConfig[title].excluded = false;
                                        self.refreshGroupsList();
                                        if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                                    }
                                }))
                            }
                        });
                    }

                    options.push({
                        content: "⚡ Encender Todos (ACTIVE)",
                                 callback: () => {
                                     for (const k in self.properties.groupsConfig) {
                                         if (!self.properties.groupsConfig[k].excluded) {
                                             self.properties.groupsConfig[k].active = true;
                                             self.syncGroupNodes(k, true);
                                         }
                                     }
                                 }
                    });

                    options.push({
                        content: "🛑 Apagar Todos (BYPASS)",
                                 callback: () => {
                                     for (const k in self.properties.groupsConfig) {
                                         if (!self.properties.groupsConfig[k].excluded) {
                                             self.properties.groupsConfig[k].active = false;
                                             self.syncGroupNodes(k, false);
                                         }
                                     }
                                 }
                    });
                };

                return r;
            };
        }
    }
});
