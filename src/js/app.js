/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import {
    DiagramState,
    TOOL_MODE_SELECT,
    TOOL_MODE_WIRE,
    WIRE_COLOR_BLACK,
    WIRE_COLOR_GREEN,
    WIRE_COLOR_YELLOW,
    WIRE_COLOR_RED,
    WIRE_COLOR_BLUE
} from "./diagram.js"
import { componentClassMap, Wire } from "./components.js";
import { Visualizer, VISUALIZER_WIRE_LINE_NAME, VISUALIZER_SIGNAL_PATH_NAME } from "./visualizer.js";
import Geometry from "./geometry.js";

const wireColors = [
    WIRE_COLOR_BLACK,
    WIRE_COLOR_RED,
    WIRE_COLOR_YELLOW,
    WIRE_COLOR_GREEN,
    WIRE_COLOR_BLUE,
];

const SERIALIZED_DIAGRAM_STATE_PARAM = "d";
const DEBUG_MODE_PARAM = "debug";

class App {

    constructor(theWindow) {
        console.assert(typeof theWindow === 'object', "the window is required");
        this.window = theWindow;
        this.document = theWindow.document;

        this.document.addEventListener("DOMContentLoaded", async () => {
            this.document.getElementById("loader").hidden = true;
            await this.setupApp();
        });
    }

    async setupApp() {
        this.initDiagramState();
        this.initComponentLibrary();
        this.initDiagramLayer();
        this.visualizer = new Visualizer(this.diagramLayer);
        this.enableDragDropFromLibrary();
        this.addTransformer();
        this.enableSelectComponent();
        this.enableKeyboardCommands();
        this.enableClearDiagram();
        this.enableHideShowPins();
        this.enableToolbar();
        this.enableDrawWire();
        this.enableFlipSwitchButton();
        this.enableRotatePotButton();
        this.enablePropertiesButton();
        this.enableVisualizerButton();
        this.enableSave();
        await this.tryImportFromURL();
        await this.tryLoadTestScript();
    }

    initDiagramState() {
        const diagramOptions = {};

        const params = new URLSearchParams(this.window.location.search);
        if (params.has(DEBUG_MODE_PARAM))
            diagramOptions.debugMode = params.get(DEBUG_MODE_PARAM).toLowerCase() === 'true';

        this.diagramState = new DiagramState(diagramOptions);
    }

    initComponentLibrary() {
        this.document.querySelectorAll('[data-component-class]')
            .forEach(element => {
                const componentClassName = element.dataset.componentClass;
                console.assert(componentClassName, "element data-component-class not set.");
                console.assert(componentClassMap[componentClassName], "'%s' is not in the component class map.", componentClassName);
                console.assert(componentClassMap[componentClassName].ImageURL, "%s has no ImageURL", componentClassName);
                element.src = componentClassMap[componentClassName].ImageURL;
            });
    }

    initDiagramLayer() {
        const containerElementId = "diagram";
        const diagramContainer = this.document.getElementById(containerElementId);

        this.stage = new Konva.Stage({
            container: containerElementId,
            width: diagramContainer.clientWidth,
            height: 1000
        });

        const layer = new Konva.Layer();
        this.stage.add(layer);
        this.diagramLayer = layer;
    }

    enableDragDropFromLibrary() {
        let componentClassName = "";

        document
            .getElementById("library-items")
            .addEventListener("dragstart", (e) => {
                componentClassName = e.target.dataset.componentClass;
            });

        const container = this.stage.container();

        container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        container.addEventListener("drop", (e) => {
            e.preventDefault();

            this.stage.setPointersPositions(e);

            const pointerPos = this.stage.getPointerPosition();

            const POINTER_COMP = 40;
            const x = pointerPos.x - POINTER_COMP;
            const y = pointerPos.y - POINTER_COMP;
            const creationPosition = { x, y };

            const component = new componentClassMap[componentClassName]();
            component.moveTo(creationPosition);
            component.draw(this.diagramLayer);
        });
    }

    addTransformer() {
        this.transformer = new Konva.Transformer();
        this.diagramLayer.add(this.transformer);
    }

    enableSelectComponent() {
        this.stage.on("click tap", (e) => {
            console.debug("onevent", e);

            if (DiagramState.instance.toolMode === TOOL_MODE_WIRE) {
                return;
            }

            if (e.target === this.stage) {
                this.clearSelection();
                return;
            }

            const node = e.target;

            let selectableNode;
            if (node.name() === "Wire") {
                selectableNode = node;
            }
            else if ([VISUALIZER_WIRE_LINE_NAME, VISUALIZER_SIGNAL_PATH_NAME].includes(node.name())) {
                const wireNodeId = node.id()
                    .replace(VISUALIZER_WIRE_LINE_NAME + ".", "")
                    .replace(VISUALIZER_SIGNAL_PATH_NAME + ".", "");
                console.debug({ wireNodeId });
                selectableNode = this.diagramLayer.findOne("#" + wireNodeId);
            } else {
                selectableNode = e.target.getParent();
                while (selectableNode.getParent().getClassName() !== "Layer") {
                    selectableNode = selectableNode.getParent();
                }
            }

            const isAlreadySelected = this.transformer.nodes().indexOf(selectableNode) >= 0;
            if (!isAlreadySelected) {
                this.transformer.nodes([selectableNode]);
            }

            const component = DiagramState.instance.getComponent(selectableNode.id());

            this.document.getElementById("flip-button").disabled = true;
            this.document.getElementById("rotate-button").disabled = true;
            if (component.can("flip"))
                this.document.getElementById("flip-button").disabled = false;
            else if (component.can("rotate")) {
                this.document.getElementById("rotate-button").disabled = false;
            }
            this.document.getElementById("properties-button").disabled = false;

            console.debug("selected component", this.transformer.nodes()[0].id(), this.transformer.nodes()[0].name(), this.transformer.nodes()[0]);
        });
    }

    enableKeyboardCommands() {
        this.stage.container().tabIndex = 1;
        this.stage.container().focus({ preventScroll: true });

        this.stage.container().addEventListener("keydown", (e) => {
            console.debug(e.code);
            this.handleGlobalKeyCode(e);
            this.handleSelectionKeyCode(e.code);
            this.handleToolbarKeyCode(e.code);
        });
    }

    enableClearDiagram() {
        this.document.getElementById('clear-button').onclick = () => {
            if (confirm("Clear the diagram? Are you sure?  This cannot be undone!")) {
                this.diagramLayer.getChildren()
                    .filter(child => child.getClassName() !== "Transformer")
                    .forEach(child => {
                        child.destroy();
                        DiagramState.instance.removeAllComponents();
                    });

                if (Visualizer.instance.isActive)
                    this.document.getElementById("vis-button").click();

                const url = new URL(this.window.location);
                url.searchParams.delete(SERIALIZED_DIAGRAM_STATE_PARAM);
                this.window.history.replaceState({}, '', url);
            }
        };
    }

    enableHideShowPins() {
        const checkbox = this.document.getElementById('check-show-connectors');
        checkbox.addEventListener('change', (event) => {
            DiagramState.instance.showConnectors = event.currentTarget.checked;
            var newOpacity = DiagramState.instance.showConnectors ? 1 : 0;
            //TODO: use name of pin nodes instead of Circle
            this.diagramLayer.find('Circle').forEach((node) => {
                node.opacity(newOpacity);
            });
        });
    }

    enableToolbar() {

        this.lastWireColor = 0;

        const defaultCursor = this.document.getElementById("diagram").style.cursor;

        const selectButton = this.document.getElementById("select-tool");
        const wireButton = this.document.getElementById("wire-tool");

        selectButton.addEventListener("click", (e) => {
            DiagramState.instance.toolMode = TOOL_MODE_SELECT;
            this.document.getElementById("diagram").style.cursor = defaultCursor;
        });

        wireButton.addEventListener("click", (e) => {
            DiagramState.instance.toolMode = TOOL_MODE_WIRE;
            this.document.getElementById("diagram").style.cursor = "crosshair";
            this.clearSelection();
        });

        wireColors.forEach(color => {
            const colorButton = this.document.getElementById("wire-color-" + color);
            colorButton.addEventListener("click", (e) => {
                DiagramState.instance.wireToolColor = color;

                if (this.transformer.nodes().length === 0)
                    return;

                const selectedNode = this.transformer.nodes()[0];
                changeColor(selectedNode);
            });
        });

    }

    enableDrawWire() {

        let lastLine;
        let isPaint = false;
        let startPin;

        /**
         * begin drawing line
         */
        this.stage.on("mousedown touchstart", (e) => {
            console.debug("onevent", e);
            if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
                isPaint = false;
                return;
            }
            isPaint = true;
            const drawStartPos = this.stage.getPointerPosition();

            console.debug("drawStartPos", drawStartPos);

            // see if we are on or close to a pin
            const startRect = new Konva.Rect({
                x: drawStartPos.x - 5,
                y: drawStartPos.y - 5,
                width: 15,
                height: 15,
                strokeWidth: 1,
                stroke: DiagramState.instance.wireToolColor,
            });

            this.diagramLayer.add(startRect);

            const closePins = this.findPinsInRect(startRect);

            startRect.destroy();

            if (closePins.length === 0) {
                console.warn("no starting pin found");
                isPaint = false;
                return;
            }

            startPin = closePins[0];

            const startPinPos = startPin.getAbsolutePosition();

            lastLine = new Konva.Line({
                stroke: DiagramState.instance.wireToolColor,
                strokeWidth: 2,
                globalCompositeOperation: 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [startPinPos.x, startPinPos.y],
            });
            this.diagramLayer.add(lastLine);

            // while drawing line, add points
            this.stage.on('mousemove touchmove', (moveEvent) => {
                console.debug("onevent", moveEvent);
                if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
                    isPaint = false;
                    return;
                }

                if (!isPaint) {
                    return;
                }

                // prevent scrolling on touch devices
                moveEvent.evt.preventDefault();

                const pos = this.stage.getPointerPosition();
                const newPoints = lastLine.points().concat([pos.x, pos.y]);
                lastLine.points(newPoints);
            });
        });

        /**
         * Done drawing line, convert to a wire
         */
        this.stage.on('mouseup touchend', (upEvent) => {
            console.debug("onevent", upEvent);

            // unwire events
            this.stage.off('mousemove touchmove');

            if (!isPaint) {
                return;
            }

            isPaint = false;

            let linePoints = lastLine.points();

            // add nearest pin to lastLine points, or don't create wire

            const endRect = new Konva.Rect({
                x: linePoints.at(-2) - 5,
                y: linePoints.at(-1) - 5,
                width: 15,
                height: 15,
                strokeWidth: 1,
                stroke: DiagramState.instance.wireToolColor,
            });
            this.diagramLayer.add(endRect);

            const closePins = this.findPinsInRect(endRect);

            endRect.destroy();

            if (closePins.length === 0) {
                console.warn("no ending pin found");
                isPaint = false;
                lastLine.destroy();
                return;
            }

            const endPin = closePins[0];

            const endPinPos = endPin.getAbsolutePosition();
            const newPoints = lastLine.points().concat([endPinPos.x, endPinPos.y]);
            lastLine.points(newPoints);

            linePoints = lastLine.points();

            lastLine.destroy();

            const wireStart = [linePoints.at(0), linePoints.at(1)];
            const wireEnd = [linePoints.at(-2), linePoints.at(-1)];

            let wireMid = [
                linePoints.at((linePoints.length / 2) - 1),
                linePoints.at((linePoints.length / 2))
            ];

            if ((wireStart[0] > wireStart[1] && wireMid[0] < wireMid[1]) || (wireStart[0] < wireStart[1] && wireMid[0] > wireMid[1])) {
                console.debug("correcting midpoint");
                wireMid = [wireMid[1], wireMid[0]];
            }

            const wire = new Wire({
                startPoint: wireStart,
                midPoint: wireMid,
                endPoint: wireEnd,
                startPinId: parseInt(startPin.id(), 10),
                endPinId: parseInt(endPin.id(), 10),
                color: DiagramState.instance.wireToolColor
            });

            wire.draw(this.diagramLayer);

            this.enterSelectMode();
        });
    }

    enableFlipSwitchButton() {
        const flipButton = this.document.getElementById("flip-button");
        flipButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.transformer.nodes().length === 0)
                return;
            const selectedNode = this.transformer.nodes().at(0);
            this.flipSelectedSwitch(selectedNode);
            this.stage.container().focus({ preventScroll: true });
        });
    }

    enableRotatePotButton() {
        const rotateButton = this.document.getElementById("rotate-button");
        rotateButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.transformer.nodes().length === 0)
                return;
            const selectedNode = this.transformer.nodes().at(0);
            this.rotateSelectedPot(selectedNode);
            this.stage.container().focus({ preventScroll: true });
        });
    }

    enablePropertiesButton() {
        const propertiesButton = this.document.getElementById("properties-button");
        const propertiesPanel = this.document.getElementById("properties")
        const propertiesOffCanvas = new bootstrap.Offcanvas("#properties");

        propertiesButton.addEventListener("click", (e) => {
            const component = this.getSelectedComponent();
            if (!component)
                return;

            this.document.getElementById("input-component-id").value = component.id.toString();
            this.document.getElementById("input-component-type").value = component.constructor.name;
            this.document.getElementById("input-component-label").value = component.label;

            // why doesn't this work?
            //document.getElementById("input-component-label").focus();

            propertiesOffCanvas.show();
        });

        propertiesPanel.addEventListener('hidden.bs.offcanvas', async () => {
            const component = this.getSelectedComponent();
            if (component) {
                component.updateLabel(this.document.getElementById("input-component-label").value.trim(), this.diagramLayer);
            }
            this.stage.container().focus({ preventScroll: true });
        });
    }

    enableVisualizerButton() {
        const visButton = this.document.getElementById("vis-button");
        const originalText = visButton.textContent;

        visButton.addEventListener("click", e => {
            if (Visualizer.instance.isActive) {
                visButton.textContent = originalText;
                DiagramState.instance.stop();
                Visualizer.instance.stop();
            } else {
                visButton.textContent = "Stop Visualizer";
                DiagramState.instance.start();
                Visualizer.instance.start();
            }
            console.debug("visualizer", Visualizer.instance.isActive);
            this.stage.container().focus({ preventScroll: true });
        });
    }

    enableSave() {
        this.document.getElementById("save-url").addEventListener("click", async (e) => {
            const url = await this.saveStateToURL();
            if (url) {
                if (this.document.getElementById("check-copy-to-clipboard").checked) {
                    await this.copyToClipboard(url);
                }
            }
        });
    }

    async saveStateToURL() {
        const serializedState = await DiagramState.instance.serializeState();
        if (serializedState === "") {
            console.warn("no state to save");
            return "";
        }

        const practicalSizeLimit = 2000;

        if (serializedState.length > practicalSizeLimit) {
            this.window.alert("Uh Oh! This diagram may be too large to be saved. The link generated may not work in all browsers. Consider removing some components. The practical limit is around 40 items, including wires. Please submit an issue if this limits your ability to use the app.  You might want to take a screenshot of the diagram.")
        }

        const url = new URL(this.window.location);
        url.searchParams.set(SERIALIZED_DIAGRAM_STATE_PARAM, serializedState);
        this.window.history.replaceState({}, '', url);
        return url;
    }

    async copyToClipboard(str) {
        await this.window.navigator.clipboard.writeText(str);
    }

    async tryImportFromURL() {
        const params = new URLSearchParams(this.window.location.search);
        if (params.has(SERIALIZED_DIAGRAM_STATE_PARAM)) {
            const serializedState = params.get(SERIALIZED_DIAGRAM_STATE_PARAM);
            await DiagramState.instance.loadState(serializedState);
            DiagramState.instance.drawAll(this.diagramLayer);
        }
        return Promise.resolve();
    }

    async tryLoadTestScript() {
        const params = new URLSearchParams(this.window.location.search);
        if (params.has("script")) {
            const { default: testScripts } = await import('./testScripts.js');
            const script = params.get("script");
            if (script in testScripts)
                testScripts[script](this.diagramLayer);
            else
                throw new Error(`${script} is not a known test script`);
        }
        return Promise.resolve();

    }

    getSelectedComponent() {
        if (this.transformer.nodes().length === 0)
            return null;
        const selectedNode = this.transformer.nodes().at(0);
        const component = DiagramState.instance.getComponent(selectedNode.id());
        return component;
    }

    openPropertiesPanel() {
        this.document.getElementById("properties-button").click();
    }

    enterSelectMode() {
        this.document.getElementById("select-tool").click();
    }

    enterWireMode() {
        this.document.getElementById("wire-tool").click();
    }

    findPinsInRect(targetRect) {
        const foundPins = this.diagramLayer.find(".Pin").filter((pin) => {
            const pinRectAttrs = pin.getClientRect();
            const pinRect = new Konva.Rect({
                x: pinRectAttrs.x,
                y: pinRectAttrs.y,
                width: pinRectAttrs.width,
                height: pinRectAttrs.height
            });
            const intersects = Geometry.rectanglesOverlap(targetRect, pinRect);
            return intersects;
        });
        return foundPins;
    }

    handleGlobalKeyCode(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            this.document.getElementById("vis-button").click();
            e.preventDefault();
        }
    }

    handleSelectionKeyCode(code) {

        if (this.transformer.nodes().length === 0)
            return;

        const selectedNode = this.transformer.nodes().at(0);

        if (code === "Delete" || code === "Backspace") {
            this.deleteSelectedComponent(selectedNode);
        } else if (code === "KeyF") {
            this.flipSelectedSwitch(selectedNode);
        } else if (code === "KeyR") {
            this.rotateSelectedPot(selectedNode);
        } else if (code === "KeyP") {
            this.openPropertiesPanel();
        } else if (code === "Escape") {
            this.clearSelection();
        } else if (code === "KeyC") {
            this.cycleWireColors();
            this.changeColor(selectedNode);
        }
    }

    handleToolbarKeyCode(code) {
        if (this.transformer.nodes().length > 0)
            return;

        if (code === "KeyW") {
            this.enterWireMode();
        } else if (code === "KeyS") {
            this.enterSelectMode();
        } else if (code === "KeyC") {
            this.cycleWireColors();
        }
    }

    cycleWireColors() {
        this.lastWireColor++;
        if (this.lastWireColor > wireColors.length - 1) {
            this.lastWireColor = 0;
        }
        const newColor = wireColors.at(this.lastWireColor);
        const colorButton = this.document.getElementById("wire-color-" + newColor);
        colorButton.click();
        console.debug("new color", DiagramState.instance.wireToolColor);
    }

    changeColor(selectedNode) {
        const component = DiagramState.instance.getComponent(selectedNode.id());
        if (component.changeColor) {
            console.debug("change color", component);
            component.changeColor(selectedNode, DiagramState.instance.wireToolColor);
        }
    }

    clearSelection() {
        this.document.getElementById("flip-button").disabled = true;
        this.document.getElementById("rotate-button").disabled = true;
        this.document.getElementById("properties-button").disabled = true;
        this.transformer.nodes([]);
    }

    flipSelectedSwitch(selectedNode) {
        const component = DiagramState.instance.getComponent(selectedNode.id());
        if (component.can("flip"))
            component.flip(selectedNode);
    }

    rotateSelectedPot(selectedNode) {
        const component = DiagramState.instance.getComponent(selectedNode.id());
        if (component.can("rotate"))
            component.rotate(selectedNode);
    }

    deleteSelectedComponent(nodeToDelete) {
        if (confirm("Delete selected component?")) {
            const component = DiagramState.instance.getComponent(nodeToDelete.id());
            const layer = this.transformer.getLayer();
            component.removeFromDiagram(layer);
            this.clearSelection();
        }
    }
}

// Create app instance.
// Add to window so it can be inspected through the console.
window.GuitarWireVisualizer = new App(window);
