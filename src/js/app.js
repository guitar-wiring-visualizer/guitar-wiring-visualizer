import { DiagramState, TOOL_MODE_SELECT, TOOL_MODE_WIRE } from "./diagram.js"
import { DPDTOnOn, DPDTOnOffOn, DPDTOnOnOn, Potentiometer } from "./components.js";

const componentClassMap = { Potentiometer, DPDTOnOn, DPDTOnOffOn, DPDTOnOnOn };

const setupApp = () => {

    window.GWVDiagramState = new DiagramState();

    const diagramLayer = createDiagramLayer();

    enableDragDropFromLibrary(diagramLayer);

    const transformer = addTransformer(diagramLayer);

    enableSelectComponent(transformer);
    enableComponentKeyCommands(transformer);
    enableClearDiagram(diagramLayer);
    enableConnectorVisibilityToggle(diagramLayer);
    enableToolbar(transformer);
    enableDrawWire(diagramLayer);
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

    stage.on("mousedown touchstart", (e) => {

        if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
            return;
        }
        isPaint = true;
        const pos = stage.getPointerPosition();
        lastLine = new Konva.Line({
            stroke: '#df4b26',
            strokeWidth: 5,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            lineJoin: 'round',
            points: [pos.x, pos.y],
        });
        layer.add(lastLine);
    });

    stage.on('mouseup touchend', function () {
        isPaint = false;
        enterSelectMode();
    });

    stage.on('mousemove touchmove', function (e) {

        if (DiagramState.instance.toolMode === TOOL_MODE_SELECT) {
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
}

function createDiagramLayer() {
    const stage = new Konva.Stage({
        container: "diagram",
        width: 1000,
        height: 1000,
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
            componentClassName = e.target.dataset.className;
            console.assert(componentClassName, "component data-class-name not set.");
            console.assert(componentClassMap[componentClassName], "'%s' is not in the component class map.", componentClassName);
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

        const state = {};

        const component = new componentClassMap[componentClassName](state);
        component.createOnLayer(layer, creationPosition);
    });
}

function addTransformer(layer){
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

        const componentGroup = e.target.getParent();

        const isAlreadySelected = transformer.nodes().indexOf(componentGroup) >= 0;
        if (!isAlreadySelected) {
            transformer.nodes([componentGroup]);
        }

        console.log("selected node", transformer.nodes()[0]);
    });
}

function enableComponentKeyCommands(transformer) {
    const stage = transformer.getStage();

    stage.container().tabIndex = 1;
    //stage.container().focus();

    stage.container().addEventListener("keydown", (e) => {

        console.log(e.code);

        if (transformer.nodes().length === 0)
            return;

        const selectedNode = transformer.nodes()[0];

        if (e.code === "Delete" || e.code === "Backspace") {
            deleteSelectedComponent(selectedNode, transformer);
        } else if (e.code === "KeyF") {
            flipSelectedSwitch(selectedNode);
        } else if (e.code === "Escape") {
            clearSelection(transformer);
        }
    });
}

function clearSelection(transformer) {
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
        clearSelection(transformer);
    }
}

function enableClearDiagram(layer) {
    document.getElementById('clear-button').onclick = function () {
        if (confirm("Clear the diagram? Are you sure?  This cannot be undone!")) {
            layer.getChildren()
                .filter(child => child.getClassName() !== "Transformer")
                .forEach(child => child.destroy());
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