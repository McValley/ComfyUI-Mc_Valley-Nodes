import { app } from "/scripts/app.js";

app.registerExtension({
    name: "McValley.MiniMaxDirectLora",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "McValleyMiniMaxDirectLora") return;

        const origNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (origNodeCreated) origNodeCreated.apply(this, arguments);

            this.color = "#063b40";
            this.bgcolor = "#03171a";

            const node = this;

            // Reorganiza y renumera correlativamente (1, 2, 3...)
            node.reindexLoraSlots = function () {
                const addBtn = node.widgets.find(w => w.name === "+ Add LoRA");
                const modeWidget = node.widgets.find(w => w.name === "mode");

                const groups = [];
                let currentGroup = [];

                for (const w of node.widgets) {
                    if (w === addBtn || w === modeWidget) continue;

                    if (w.name.startsWith("lora_name_")) {
                        if (currentGroup.length > 0) groups.push(currentGroup);
                        currentGroup = [w];
                    } else if (currentGroup.length > 0) {
                        currentGroup.push(w);
                    }
                }
                if (currentGroup.length > 0) groups.push(currentGroup);

                groups.forEach((grp, idx) => {
                    const slotNum = idx + 1;
                    for (const w of grp) {
                        w.slotGroup = slotNum;
                        if (w.name.startsWith("lora_name_")) {
                            w.name = `lora_name_${slotNum}`;
                        } else if (w.name.startsWith("strength_model_")) {
                            w.name = `strength_model_${slotNum}`;
                        } else if (w.name.startsWith("✕ Remove LoRA")) {
                            w.name = `✕ Remove LoRA ${slotNum}`;
                            w.callback = () => node.removeLoraSlot(slotNum);
                        }
                    }
                });

                const orderedWidgets = [];
                if (modeWidget) orderedWidgets.push(modeWidget);
                groups.forEach(grp => orderedWidgets.push(...grp));
                if (addBtn) orderedWidgets.push(addBtn);

                node.widgets = orderedWidgets;
                node.setSize([Math.max(node.size[0], 360), node.computeSize()[1] + 12]);
                node.setDirtyCanvas(true, true);
            };

            // Eliminar slot seleccionado
            node.removeLoraSlot = function (slotIndex) {
                node.widgets = node.widgets.filter(w => w.slotGroup !== slotIndex);
                node.reindexLoraSlots();
            };

            // Agregar nueva ranura de LoRA
            node.addLoraSlot = function (defaultName = null, defaultStrength = 0.60) {
                const baseLoraWidget = node.widgets.find(w => w.name.startsWith("lora_name_"));
                const loraList = baseLoraWidget && baseLoraWidget.options ? baseLoraWidget.options.values : ["None"];

                const chosenName = defaultName || loraList[0];
                const tempId = Date.now() + Math.floor(Math.random() * 1000);

                const wName = node.addWidget("combo", `lora_name_${tempId}`, chosenName, (v) => {}, { values: loraList });
                const wModel = node.addWidget("number", `strength_model_${tempId}`, defaultStrength, (v) => {}, { min: -10, max: 10, step: 0.05, precision: 2 });
                const wDel = node.addWidget("button", "✕ Remove LoRA", null, () => {});
                wDel.serialize = false;

                wName.slotGroup = tempId;
                wModel.slotGroup = tempId;
                wDel.slotGroup = tempId;

                node.reindexLoraSlots();
            };

            // Slot base 1
            const baseLora = node.widgets.find(w => w.name === "lora_name_1");
            const baseStrength = node.widgets.find(w => w.name === "strength_model_1");
            if (baseLora) baseLora.slotGroup = 1;
            if (baseStrength) baseStrength.slotGroup = 1;

            // Botón "+ Add LoRA" al final
            if (!node.widgets.find(w => w.name === "+ Add LoRA")) {
                const addBtn = node.addWidget("button", "+ Add LoRA", null, () => {
                    node.addLoraSlot();
                });
                addBtn.serialize = false;
            }

            node.reindexLoraSlots();
        };

        // 1. Guardar todos los LoRAs dinámicos en el JSON del workflow
        const origOnSerialize = nodeType.prototype.onSerialize;
        nodeType.prototype.onSerialize = function (o) {
            if (origOnSerialize) origOnSerialize.apply(this, arguments);

            const extraLoras = [];
            let i = 2;
            while (true) {
                const nameW = this.widgets?.find(w => w.name === `lora_name_${i}`);
                const strengthW = this.widgets?.find(w => w.name === `strength_model_${i}`);
                if (nameW && strengthW) {
                    extraLoras.push({
                        name: nameW.value,
                        strength: strengthW.value
                    });
                    i++;
                } else {
                    break;
                }
            }
            o.extra_lora_slots = extraLoras;
        };

        // 2. Restaurar los LoRAs dinámicos cuando se abre o cambia de workflow
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (o) {
            if (origOnConfigure) origOnConfigure.apply(this, arguments);

            if (o.extra_lora_slots && Array.isArray(o.extra_lora_slots)) {
                for (const item of o.extra_lora_slots) {
                    this.addLoraSlot(item.name, item.strength);
                }
            }
        };
    }
});
