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
import { componentClassMap, Wire, Pin, ThreeWayToggle, Potentiometer } from "./components.js";
import { Visualizer, VISUALIZER_WIRE_LINE_NAME, VISUALIZER_SIGNAL_PATH_NAME } from "./visualizer.js";
import Geometry from "./geometry.js";

class App {

    constructor(theWindow) {
        console.assert(typeof theWindow === 'object', "the window is required");
        this.window = theWindow;
        this.document = theWindow.document;

        this.wireColors = [
            WIRE_COLOR_BLACK,
            WIRE_COLOR_RED,
            WIRE_COLOR_YELLOW,
            WIRE_COLOR_GREEN,
            WIRE_COLOR_BLUE,
        ];

        this.serializedDiagramStateParam = "d";
        this.debugModeParam = "debug";

        this.document.addEventListener("DOMContentLoaded", async () => {
            this.document.getElementById("loader").hidden = true;
            await this.setupApp();
        });
    }

    async setupApp() {
        this.initDomElements();
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
        this.enableHideShowActuators();
        this.enableHideShowInternals();
        this.enableHideShowLabels();
        this.enableToolbar();
        this.enableDrawWire();
        this.enableFlipSwitchButton();
        this.enableRotatePotButton();
        this.enablePropertiesButton();
        this.enableVisualizerButton();
        this.enableSaveButton();
        this.enableCopyUrlButton();
        await this.tryImportFromURL();
        await this.tryLoadTestScript();
    }

    initDomElements() {

        const getElem = (id) => {
            const elem = this.document.getElementById(id);
            if (!elem)
                throw new Error(`Element by id '${id}' null`);
            return elem;
        }

        this.elements = {
            libraryItems: getElem("library-items"),
            flipButton: getElem("flip-button"),
            rotateButton: getElem("rotate-button"),
            propertiesButton: getElem("properties-button"),
            propertiesPanel: getElem("properties"),
            clearButton: getElem("clear-button"),
            visButton: getElem("vis-button"),
            checkShowConnectors: getElem("check-show-connectors"),
            cheeckShowActuators: getElem("check-show-actuators"),
            checkShowInternals: getElem("check-show-internals"),
            checkShowLabels: getElem("check-show-labels"),
            diagramContainer: getElem("diagram"),
            selectToolButton: getElem("select-tool-button"),
            wireToolButton: getElem("wire-tool-button"),
            inputComponentId: getElem("input-component-id"),
            inputComponentType: getElem("input-component-type"),
            inputComponentLabel: getElem("input-component-label"),
            saveButton: getElem("save-button"),
            copyUrlButton: getElem("copy-url-button")
        };
    }

    initDiagramState() {
        const diagramOptions = {};

        const params = new URLSearchParams(this.window.location.search);
        if (params.has(this.debugModeParam))
            diagramOptions.debugMode = params.get(this.debugModeParam).toLowerCase() === 'true';

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
        const diagramContainer = this.elements.diagramContainer;

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

        this.elements.libraryItems
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
            this.focusStage();
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

            this.elements.flipButton.disabled = true;
            this.elements.rotateButton.disabled = true;
            if (component.can("flip"))
                this.elements.flipButton.disabled = false;
            else if (component.can("rotate")) {
                this.elements.rotateButton.disabled = false;
            }
            this.elements.propertiesButton.disabled = false;

            console.debug("selected component", this.transformer.nodes()[0].id(), this.transformer.nodes()[0].name(), this.transformer.nodes()[0]);
        });
    }

    enableKeyboardCommands() {
        this.stage.container().tabIndex = 1;
        this.focusStage();

        this.stage.container().addEventListener("keydown", (e) => {
            console.debug(e.code);
            this.handleGlobalKeyCode(e);
            this.handleSelectionKeyCode(e.code);
            this.handleToolbarKeyCode(e.code);
        });
    }

    enableClearDiagram() {
        this.elements.clearButton.onclick = () => {
            if (confirm("Clear the diagram? Are you sure?  This cannot be undone!")) {
                this.diagramLayer.getChildren()
                    .filter(child => child.getClassName() !== "Transformer")
                    .forEach(child => {
                        child.destroy();
                        DiagramState.instance.removeAllComponents();
                    });

                if (Visualizer.instance.isActive)
                    this.elements.visButton.click();

                const url = new URL(this.window.location);
                url.searchParams.delete(this.serializedDiagramStateParam);
                this.window.history.replaceState({}, '', url);
            }
        };
    }

    enableHideShowPins() {
        const targetNodesName = '.' + Pin.pinCircleNodeName;
        this.elements.checkShowConnectors.addEventListener('change', (event) => {
            DiagramState.instance.showConnectors = event.currentTarget.checked;
            var newOpacity = DiagramState.instance.showConnectors ? 1 : 0;
            this.diagramLayer.find(targetNodesName).forEach((node) => {
                node.opacity(newOpacity);
            });
            this.focusStage();
        });
    }

    enableHideShowActuators() {
        // use actuator node name from any switch class
        const targetNodesName = '.' + ThreeWayToggle.actuatorNodeName;
        this.elements.cheeckShowActuators.addEventListener('change', (event) => {
            DiagramState.instance.showActuators = event.currentTarget.checked;
            var newOpacity = DiagramState.instance.showActuators ? 1 : 0;
            this.diagramLayer.find(targetNodesName).forEach((node) => {
                node.opacity(newOpacity);
            });
            this.focusStage();
        });
    }

    enableHideShowInternals() {
        // select internal connector nodes for both both switches and pots
        const targetNodesName = '.' + ThreeWayToggle.pinConnectionNodeName + ', .' + Potentiometer.pinConnectionNodeName;
        this.elements.checkShowInternals.addEventListener('change', (event) => {
            DiagramState.instance.showInternals = event.currentTarget.checked;
            var newOpacity = DiagramState.instance.showInternals ? 1 : 0;
            this.diagramLayer.find(targetNodesName).forEach((node) => {
                node.opacity(newOpacity);
            });
            this.focusStage();
        });
    }

    enableHideShowLabels() {
        // use label node name from any component
        const targetNodesName = '.' + Wire.labelNodeName;
        this.elements.checkShowLabels.addEventListener('change', (event) => {
            DiagramState.instance.showLabels = event.currentTarget.checked;
            var newOpacity = DiagramState.instance.showLabels ? 1 : 0;
            this.diagramLayer.find(targetNodesName).forEach((node) => {
                node.opacity(newOpacity);
            });
            this.focusStage();
        });
    }

    enableToolbar() {

        this.lastWireColor = 0;

        const defaultCursor = this.elements.diagramContainer.style.cursor;

        const selectButton = this.elements.selectToolButton;
        const wireButton = this.elements.wireToolButton;

        selectButton.addEventListener("click", (e) => {
            DiagramState.instance.toolMode = TOOL_MODE_SELECT;
            this.elements.diagramContainer.style.cursor = defaultCursor;
            this.focusStage();
        });

        wireButton.addEventListener("click", (e) => {
            DiagramState.instance.toolMode = TOOL_MODE_WIRE;
            this.elements.diagramContainer.style.cursor = "crosshair";
            this.clearSelection();
            this.focusStage();
        });

        this.wireColors.forEach(color => {
            const colorButton = this.document.getElementById("wire-color-" + color);
            colorButton.addEventListener("click", (e) => {
                DiagramState.instance.wireToolColor = color;

                if (this.transformer.nodes().length === 0)
                    return;

                const selectedNode = this.transformer.nodes()[0];
                this.changeColor(selectedNode);
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
        this.elements.flipButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.transformer.nodes().length === 0)
                return;
            const selectedNode = this.transformer.nodes().at(0);
            this.flipSelectedSwitch(selectedNode);
            this.focusStage();
        });
    }

    enableRotatePotButton() {
        this.elements.rotateButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.transformer.nodes().length === 0)
                return;
            const selectedNode = this.transformer.nodes().at(0);
            this.rotateSelectedPot(selectedNode);
            this.focusStage();
        });
    }

    enablePropertiesButton() {

        const propertiesPanel = this.elements.propertiesPanel;
        const propertiesOffCanvas = new bootstrap.Offcanvas("#properties");

        this.elements.propertiesButton.addEventListener("click", (e) => {
            const component = this.getSelectedComponent();
            if (!component)
                return;

            this.elements.inputComponentId.value = component.id.toString();
            this.elements.inputComponentType.value = component.constructor.name;
            this.elements.inputComponentLabel.value = component.label;

            // why doesn't this work?
            //document.getElementById("input-component-label").focus();

            propertiesOffCanvas.show();
        });

        propertiesPanel.addEventListener('hidden.bs.offcanvas', async () => {
            const component = this.getSelectedComponent();
            if (component) {
                component.updateLabel(this.elements.inputComponentLabel.value.trim(), this.diagramLayer);
            }
            this.focusStage();
        });
    }

    enableVisualizerButton() {
        const visButton = this.elements.visButton;
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
            this.focusStage();
        });
    }

    enableSaveButton() {
        this.elements.saveButton.addEventListener("click", async (e) => {
            await this.saveStateToURL();
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
        url.searchParams.set(this.serializedDiagramStateParam, serializedState);
        this.window.history.replaceState({}, '', url);
    }

    enableCopyUrlButton() {
        this.elements.copyUrlButton.addEventListener("click", async (e) => {
            await this.window.navigator.clipboard.writeText(this.window.location);
            console.debug("copied url to clipboard");
        });
    }

    async tryImportFromURL() {
        const params = new URLSearchParams(this.window.location.search);
        if (params.has(this.serializedDiagramStateParam)) {
            const serializedState = params.get(this.serializedDiagramStateParam);
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
        this.elements.propertiesButton.click();
    }

    enterSelectMode() {
        this.elements.selectToolButton.click();
    }

    enterWireMode() {
        this.elements.wireToolButton.click();
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
            this.elements.visButton.click();
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
        if (this.lastWireColor > this.wireColors.length - 1) {
            this.lastWireColor = 0;
        }
        const newColor = this.wireColors.at(this.lastWireColor);
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
        this.elements.flipButton.disabled = true;
        this.elements.rotateButton.disabled = true;
        this.elements.propertiesButton.disabled = true;
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

    focusStage() {
        this.stage.container().focus({ preventScroll: true });
    }
}

// Create app instance.
// Add to window so it can be inspected through the console.
window.GuitarWiringVisualizer = new App(window);
