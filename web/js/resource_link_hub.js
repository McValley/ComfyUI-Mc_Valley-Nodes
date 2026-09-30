import { app } from "../../../scripts/app.js";

const linkId = "mcv-resource-link-theme";
if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = new URL("../css/resource_link_hub.css", import.meta.url).href;
    document.head.appendChild(link);
}

const ICONS = {
    link: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    external: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    folder: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
};

app.registerExtension({
    name: "Mc_Valley.ResourceLinkHub",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "McValley_ResourceLinkHub") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            const onConfigure = nodeType.prototype.onConfigure;
            const onSerialize = nodeType.prototype.onSerialize;

            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                const FIXED_WIDTH = 520;
                this.color = "#011a0c";
                this.bgcolor = "#000803";

                if (!this.properties) this.properties = {};
                if (!this.properties.resources || !Array.isArray(this.properties.resources)) {
                    this.properties.resources = [
                        {
                            label: "Main Checkpoint Model (e.g. Juggernaut XL)",
                      url: "",
                      target_path: "ComfyUI/models/checkpoints/"
                        }
                    ];
                }

                if (this.widgets) {
                    for (const w of this.widgets) {
                        w.type = "hidden";
                        w.computeSize = () => [0, -4];
                        w.draw = () => {};
                    }
                }

                const jsonWidget = this.widgets?.find(w => w.name === "resources_json");

                const syncState = () => {
                    if (jsonWidget) {
                        jsonWidget.value = JSON.stringify(this.properties.resources);
                        if (jsonWidget.callback) jsonWidget.callback(jsonWidget.value);
                    }
                    if (app.graph) app.graph.setDirtyCanvas(true, true);
                };

                    const main = document.createElement("div");
                    main.className = "mcv-rlh-container";

                    // Reactivity Bypass
                    const updateBypassState = () => {
                        const isBypassed = (this.mode === 4 || this.mode === 2);
                        if (isBypassed) main.classList.add("mcv-rlh-bypassed");
                        else main.classList.remove("mcv-rlh-bypassed");
                    };

                        const origOnDrawForeground = this.onDrawForeground;
                        this.onDrawForeground = function(ctx) {
                            if (origOnDrawForeground) origOnDrawForeground.apply(this, arguments);
                            updateBypassState();
                        };

                        // Header
                        const header = document.createElement("div");
                        header.className = "mcv-rlh-header";

                        const title = document.createElement("span");
                        title.className = "mcv-rlh-title";
                        title.innerHTML = `${ICONS.link} RESOURCE LINK HUB`;

                        const badge = document.createElement("span");
                        badge.className = "mcv-rlh-badge";
                        badge.textContent = `${this.properties.resources.length} RESOURCES`;

                        header.append(title, badge);
                        main.appendChild(header);

                        // Resource List
                        const list = document.createElement("div");
                        list.className = "mcv-rlh-list";
                        main.appendChild(list);

                        // Footer (Add button)
                        const footer = document.createElement("div");
                        footer.className = "mcv-rlh-footer";

                        const addBtn = document.createElement("button");
                        addBtn.className = "mcv-rlh-btn-add";
                        addBtn.innerHTML = "+ ADD NEW RESOURCE LINK";
                        footer.appendChild(addBtn);
                        main.appendChild(footer);

                        // Exact Mathematical Height Calculation
                        const calculateNodeHeight = () => {
                            const count = this.properties.resources.length;
                            // 108px per card + 115px for header, footer, margins, and node top bar
                            return 115 + (count * 108);
                        };

                        const adjustNodeHeight = () => {
                            const totalHeight = calculateNodeHeight();
                            this.size[0] = FIXED_WIDTH;
                            this.size[1] = totalHeight;
                            this.setSize([FIXED_WIDTH, totalHeight]);
                            if (app.graph) app.graph.setDirtyCanvas(true, true);
                        };

                            const renderRows = () => {
                                list.innerHTML = "";
                                badge.textContent = `${this.properties.resources.length} RESOURCES`;

                                this.properties.resources.forEach((res, idx) => {
                                    const item = document.createElement("div");
                                    item.className = "mcv-rlh-item";

                                    // 1. Description & Delete
                                    const itemHead = document.createElement("div");
                                    itemHead.className = "mcv-rlh-item-head";

                                    const descInput = document.createElement("input");
                                    descInput.type = "text";
                                    descInput.className = "mcv-rlh-input-desc";
                                    descInput.placeholder = "Resource Name / Purpose...";
                                    descInput.value = res.label || "";
                                    descInput.onchange = () => {
                                        res.label = descInput.value;
                                        syncState();
                                    };

                                    const delBtn = document.createElement("button");
                                    delBtn.className = "mcv-rlh-btn-del";
                                    delBtn.innerHTML = "✕ Delete";
                                    delBtn.title = "Delete this resource";
                                    delBtn.onclick = () => {
                                        this.properties.resources.splice(idx, 1);
                                        syncState();
                                        renderRows();
                                        adjustNodeHeight();
                                    };

                                    itemHead.append(descInput, delBtn);

                                    // 2. URL & Download Button
                                    const itemBody = document.createElement("div");
                                    itemBody.className = "mcv-rlh-item-body";

                                    const urlInput = document.createElement("input");
                                    urlInput.type = "text";
                                    urlInput.className = "mcv-rlh-input-url";
                                    urlInput.placeholder = "https://huggingface.co/... or download link";
                                    urlInput.value = res.url || "";
                                    urlInput.onchange = () => {
                                        res.url = urlInput.value.trim();
                                        syncState();
                                    };

                                    const openBtn = document.createElement("button");
                                    openBtn.className = "mcv-rlh-btn-open";
                                    openBtn.innerHTML = `Download ${ICONS.external}`;
                                    openBtn.title = "Open download link in a new tab";
                                    openBtn.onclick = () => {
                                        const targetUrl = (res.url || "").trim();
                                        if (!targetUrl) {
                                            alert("Please provide a valid download URL first.");
                                            return;
                                        }
                                        const validUrl = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;
                                        window.open(validUrl, "_blank", "noopener,noreferrer");
                                    };

                                    itemBody.append(urlInput, openBtn);

                                    // 3. Destination Directory / Paste Instructions
                                    const itemNotes = document.createElement("div");
                                    itemNotes.className = "mcv-rlh-item-notes";

                                    const notesIcon = document.createElement("span");
                                    notesIcon.className = "mcv-rlh-notes-icon";
                                    notesIcon.innerHTML = `${ICONS.folder} Paste into:`;

                                    const notesInput = document.createElement("input");
                                    notesInput.type = "text";
                                    notesInput.className = "mcv-rlh-input-notes";
                                    notesInput.placeholder = "e.g. ComfyUI/models/checkpoints/ (target folder)";
                                    notesInput.value = res.target_path || "";
                                    notesInput.onchange = () => {
                                        res.target_path = notesInput.value;
                                        syncState();
                                    };

                                    itemNotes.append(notesIcon, notesInput);
                                    item.append(itemHead, itemBody, itemNotes);
                                    list.appendChild(item);
                                });
                            };

                            addBtn.onclick = () => {
                                this.properties.resources.push({
                                    label: "",
                                    url: "",
                                    target_path: "ComfyUI/models/"
                                });
                                syncState();
                                renderRows();
                                adjustNodeHeight();
                            };

                            const domWidget = this.addDOMWidget("resource_links_ui", "custom", main, { serialize: false });
                            domWidget.computeSize = (w) => [w, calculateNodeHeight() - 40];

                            this.restoreState = () => {
                                renderRows();
                                adjustNodeHeight();
                            };

                            setTimeout(() => {
                                this.restoreState();
                            }, 50);
            };

            nodeType.prototype.onSerialize = function (info) {
                if (onSerialize) onSerialize.apply(this, arguments);
                info.properties = { ...this.properties };
            };

            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (info?.properties?.resources) {
                    this.properties.resources = info.properties.resources;
                }
                setTimeout(() => {
                    if (this.restoreState) this.restoreState();
                }, 80);
            };
        }
    }
});
