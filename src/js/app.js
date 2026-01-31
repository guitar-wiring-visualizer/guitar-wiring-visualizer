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
import { Visualizer } from "./visualizer.js";

const wireColors = [
    WIRE_COLOR_BLACK,
    WIRE_COLOR_RED,
    WIRE_COLOR_YELLOW,
    WIRE_COLOR_GREEN,
    WIRE_COLOR_BLUE,
];

const SERIALIZED_DIAGRAM_STATE_PARAM = "d";

const setupApp = async () => {

    window.GWVDiagramState = new DiagramState();

    initializeComponentLibrary();

    const diagramLayer = createDiagramLayer();

    window.GWVVisualizer = new Visualizer(diagramLayer);

    enableDragDropFromLibrary(diagramLayer);

    const transformer = addTransformer(diagramLayer);

    enableSelectComponent(transformer);
    enableKeyboardCommands(transformer);
    enableClearDiagram(diagramLayer);
    enableConnectorVisibilityToggle(diagramLayer);
    enableToolbar(transformer);
    enableDrawWire(diagramLayer);
    enableFlipSwitchButton(transformer);
    enableVisualizerButton();

    enableExportToUrl();
    enableImportFromUrl(diagramLayer);

    await enableTestScript(diagramLayer);
}

function enableExportToUrl() {
    document.getElementById("update-url").addEventListener("click", (e) => {
        const serializedState = DiagramState.instance.serializeState();
        const url = new URL(window.location);
        url.searchParams.set(SERIALIZED_DIAGRAM_STATE_PARAM, serializedState);
        window.history.replaceState({}, '', url);
        alert("The state of the diagram has been captured. Copy the current window URL to keep this diagram.");
    });
}

function enableImportFromUrl(diagramLayer) {
    const params = new URLSearchParams(window.location.search);
    if (params.has(SERIALIZED_DIAGRAM_STATE_PARAM)) {
        const serializedState = params.get(SERIALIZED_DIAGRAM_STATE_PARAM);
        DiagramState.instance.loadState(serializedState);
        DiagramState.instance.drawAll(diagramLayer);
    }
}

async function enableTestScript(diagramLayer) {
    const params = new URLSearchParams(window.location.search);
    if (params.has("script")) {
        const { default: testScripts } = await import('./testScripts.js');
        const script = params.get("script");
        if (script in testScripts)
            testScripts[script](diagramLayer);
        else
            throw new Error(`${script} is not a known test script`);
    }
}

function findAllPickups() {
    return DiagramState.instance.findComponents((c) => {
        return typeof c.pickUp === 'function';
    });
}

function simulateGuitar() {
    findAllPickups().forEach(pickup => pickup.pickUp());
}

function stopSimulatingGuitar() {
    findAllPickups().forEach(pickup => pickup.stopPickingUp());
}

function enableVisualizerButton() {
    const visButton = document.getElementById("vis-button");
    const originalText = visButton.textContent;
    visButton.addEventListener("click", e => {
        if (Visualizer.instance.isActive) {
            visButton.textContent = originalText;
            stopSimulatingGuitar();
            Visualizer.instance.stop();
        } else {
            visButton.textContent = "Stop Visualizer";
            simulateGuitar();
            Visualizer.instance.start();
        }
        console.log("visualizer", Visualizer.instance.isActive);
    });
}

function enableFlipSwitchButton(transformer) {
    const flipButton = document.getElementById("flip-button");
    flipButton.addEventListener("click", (e) => {
        if (transformer.nodes().length === 0)
            return;
        const selectedNode = transformer.nodes()[0];
        flipSelectedSwitch(selectedNode);
    });
}

function initializeComponentLibrary() {
    document.querySelectorAll('[data-component-class]')
        .forEach(element => {
            const componentClassName = element.dataset.componentClass;
            console.assert(componentClassName, "element data-component-class not set.");
            console.assert(componentClassMap[componentClassName], "'%s' is not in the component class map.", componentClassName);
            console.assert(componentClassMap[componentClassName].ImageURL, "%s has no ImageURL", componentClassName);
            element.src = componentClassMap[componentClassName].ImageURL;
        });
}

function enableToolbar(transformer) {
    const defaultCursor = document.getElementById("diagram").style.cursor;

    const selectButton = document.getElementById("select-tool");
    const wireButton = document.getElementById("wire-tool");

    selectButton.addEventListener("click", (e) => {
        DiagramState.instance.toolMode = TOOL_MODE_SELECT;
        document.getElementById("diagram").style.cursor = defaultCursor;
    });

    wireButton.addEventListener("click", (e) => {
        DiagramState.instance.toolMode = TOOL_MODE_WIRE;
        document.getElementById("diagram").style.cursor = "crosshair";
        clearSelection(transformer);
    });

    wireColors.forEach(color => {
        const colorButton = document.getElementById("wire-color-" + color);
        colorButton.addEventListener("click", (e) => {
            DiagramState.instance.wireToolColor = color;

            if (transformer.nodes().length === 0)
                return;

            const selectedNode = transformer.nodes()[0];
            changeColor(selectedNode);
        });
    });

}

function enterSelectMode() {
    document.getElementById("select-tool").click();
}

function enterWireMode() {
    document.getElementById("wire-tool").click();
}

function enableDrawWire(layer) {

    let lastLine;
    let isPaint = false;

    const stage = layer.getStage();

    let startPin;

    /**
     * begin drawing line
     */
    stage.on("mousedown touchstart", (e) => {
        if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
            isPaint = false;
            return;
        }
        isPaint = true;
        const drawStartPos = stage.getPointerPosition();

        console.log("drawStartPos", drawStartPos);

        // see if we are on or close to a pin
        const startRect = new Konva.Rect({
            x: drawStartPos.x - 5,
            y: drawStartPos.y - 5,
            width: 15,
            height: 15,
            strokeWidth: 1,
            stroke: DiagramState.instance.wireToolColor,
        });

        layer.add(startRect);

        const closePins = findPinsInRect(layer, startRect);

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
            strokeWidth: 5,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            lineJoin: 'round',
            points: [startPinPos.x, startPinPos.y],
        });
        layer.add(lastLine);
    });

    /**
     * while drawing line, add points
     */
    stage.on('mousemove touchmove', function (e) {
        if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
            isPaint = false;
            return;
        }

        if (!isPaint) {
            return;
        }

        // prevent scrolling on touch devices
        e.evt.preventDefault();

        const pos = stage.getPointerPosition();
        const newPoints = lastLine.points().concat([pos.x, pos.y]);
        lastLine.points(newPoints);
    });

    /**
     * Done drawing line, convert to a wire
     */
    stage.on('mouseup touchend', function () {

        if (!isPaint) {
            return;
        }

        isPaint = false;

        const linePoints = lastLine.points();

        // add nearest pin to lastLine points, or don't create wire

        const endRect = new Konva.Rect({
            x: linePoints.at(-2) - 5,
            y: linePoints.at(-1) - 5,
            width: 15,
            height: 15,
            strokeWidth: 1,
            stroke: DiagramState.instance.wireToolColor,
        });
        layer.add(endRect);

        const closePins = findPinsInRect(layer, endRect);

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

        const wireStart = [linePoints.at(0), linePoints.at(1)];
        const wireEnd = [linePoints.at(-2), linePoints.at(-1)];

        let wireMid = [
            linePoints.at((linePoints.length / 2) - 1),
            linePoints.at((linePoints.length / 2))
        ];

        if ((wireStart[0] > wireStart[1] && wireMid[0] < wireMid[1]) || (wireStart[0] < wireStart[1] && wireMid[0] > wireMid[1])) {
            console.log("correcting midpoint");
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

        setTimeout(() => {
            wire.draw(layer);
            lastLine.destroy();
        }, 200);

        enterSelectMode();
    });
}

function findPinsInRect(layer, targetRect) {
    const foundPins = layer.find(".Pin").filter((pin) => {
        const pinRectAttrs = pin.getClientRect();
        const pinRect = new Konva.Rect({
            x: pinRectAttrs.x,
            y: pinRectAttrs.y,
            width: pinRectAttrs.width,
            height: pinRectAttrs.height
        });
        const intersects = rectanglesOverlap(targetRect, pinRect);
        return intersects;
    });
    return foundPins;
}

function rectanglesOverlap(rect1, rect2) {
    return rect1.x() < rect2.x() + rect2.width() &&
        rect1.x() + rect1.width() > rect2.x() &&
        rect1.y() < rect2.y() + rect2.height() &&
        rect1.y() + rect1.height() > rect2.y();
}

function createDiagramLayer() {

    const containerElementId = "diagram";
    const diagramContainer = document.getElementById(containerElementId);

    const stage = new Konva.Stage({
        container: containerElementId,
        width: diagramContainer.clientWidth,
        height: 1000
    });

    const layer = new Konva.Layer();
    stage.add(layer);
    return layer;
}

function enableDragDropFromLibrary(layer) {

    let componentClassName = "";
    document
        .getElementById("library-items")
        .addEventListener("dragstart", function (e) {
            componentClassName = e.target.dataset.componentClass;
        });

    const stage = layer.getStage();
    const container = stage.container();

    container.addEventListener("dragover", function (e) {
        e.preventDefault();
    });

    container.addEventListener("drop", function (e) {
        e.preventDefault();

        stage.setPointersPositions(e);

        const pointerPos = stage.getPointerPosition();

        const POINTER_COMP = 40;
        const x = pointerPos.x - POINTER_COMP;
        const y = pointerPos.y - POINTER_COMP;
        const creationPosition = { x, y };

        const component = new componentClassMap[componentClassName]();
        component.moveTo(creationPosition);
        component.draw(layer);
    });
}

function addTransformer(layer) {
    const transformer = new Konva.Transformer();
    layer.add(transformer);
    return transformer;
}

function enableSelectComponent(transformer) {

    const layer = transformer.getLayer();
    const stage = layer.getStage();

    stage.on("click tap", function (e) {

        if (DiagramState.instance.toolMode === TOOL_MODE_WIRE) {
            return;
        }

        if (e.target === stage) {
            clearSelection(transformer);
            return;
        }

        const node = e.target;

        let selectableNode;
        if (node.getClassName() === "Line") {
            selectableNode = node;
        } else {
            selectableNode = e.target.getParent();
            while (selectableNode.getParent().getClassName() !== "Layer") {
                selectableNode = selectableNode.getParent();
            }
        }

        const isAlreadySelected = transformer.nodes().indexOf(selectableNode) >= 0;
        if (!isAlreadySelected) {
            transformer.nodes([selectableNode]);
        }

        //if (isSwitch) {
        document.getElementById("flip-button").disabled = false;
        //}

        console.log("selected component", transformer.nodes()[0].id(), transformer.nodes()[0].name(), transformer.nodes()[0]);
    });
}

function enableKeyboardCommands(transformer) {
    const stage = transformer.getStage();

    stage.container().tabIndex = 1;
    //stage.container().focus();

    stage.container().addEventListener("keydown", (e) => {
        console.log(e.code);
        handleGlobalKeyCode(e);
        handleSelectionKeyCode(transformer, e.code);
        handleToolbarKeyCode(transformer, e.code);
    });
}

function handleGlobalKeyCode(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById("vis-button").click();
        e.preventDefault();
    }
}

function handleSelectionKeyCode(transformer, code) {
    if (transformer.nodes().length === 0)
        return;

    const selectedNode = transformer.nodes()[0];

    if (code === "Delete" || code === "Backspace") {
        deleteSelectedComponent(selectedNode, transformer);
    } else if (code === "KeyF") {
        flipSelectedSwitch(selectedNode);
    } else if (code === "Escape") {
        clearSelection(transformer);
    } else if (code === "KeyC") {
        cycleWireColors();
        changeColor(selectedNode);
    }
}

function handleToolbarKeyCode(transformer, code) {
    if (transformer.nodes().length > 0)
        return;

    if (code === "KeyW") {
        enterWireMode();
    } else if (code === "KeyS") {
        enterSelectMode();
    } else if (code === "KeyC") {
        cycleWireColors();
    }
}

let lastWireColor = 0;

function cycleWireColors() {
    lastWireColor++;
    if (lastWireColor > wireColors.length - 1) {
        lastWireColor = 0;
    }
    const newColor = wireColors.at(lastWireColor);
    const colorButton = document.getElementById("wire-color-" + newColor);
    colorButton.click();
    console.log("new color", DiagramState.instance.wireToolColor);
}

function changeColor(selectedNode) {
    const component = DiagramState.instance.getComponent(selectedNode.id());
    if (component.changeColor) {
        console.log("change color", component);
        component.changeColor(selectedNode, DiagramState.instance.wireToolColor);
    }
}

function clearSelection(transformer) {
    document.getElementById("flip-button").disabled = true;
    transformer.nodes([]);
}

function flipSelectedSwitch(switchGroup) {

    const switchComponent = DiagramState.instance.getComponent(switchGroup.id());

    if (!switchComponent.flip)
        return;

    switchComponent.flip(switchGroup);
}

function deleteSelectedComponent(nodeToDelete, transformer) {
    if (confirm("Delete selected component?")) {
        nodeToDelete.destroy();
        DiagramState.instance.removeComponentById(nodeToDelete.id());
        clearSelection(transformer);
    }
}

function enableClearDiagram(layer) {
    document.getElementById('clear-button').onclick = function () {
        if (confirm("Clear the diagram? Are you sure?  This cannot be undone!")) {
            layer.getChildren()
                .filter(child => child.getClassName() !== "Transformer")
                .forEach(child => {
                    child.destroy();
                    DiagramState.instance.notifyNodeChanged(child);
                    DiagramState.instance.removeComponentById(child.id());
                });

            const url = new URL(window.location);
            url.searchParams.delete(SERIALIZED_DIAGRAM_STATE_PARAM);
            window.history.replaceState({}, '', url);
        }
    };
}

function enableConnectorVisibilityToggle(layer) {
    const checkbox = document.getElementById('check-show-connectors');
    checkbox.addEventListener('change', (event) => {
        DiagramState.instance.showConnectors = event.currentTarget.checked;
        var newOpacity = DiagramState.instance.showConnectors ? 1 : 0;
        layer.find('Circle').forEach((node) => {
            node.opacity(newOpacity);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});