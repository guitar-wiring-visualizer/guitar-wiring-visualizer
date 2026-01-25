const setupApp = () => {

    window.GWVDiagramState = new DiagramState();

    const diagramLayer = createDiagramLayer();

    enableDragDropFromLibrary(diagramLayer);

    const transformer = enableSelectComponent(diagramLayer);

    enableComponentKeyCommands(transformer);
    enableClearDiagram(diagramLayer);
    enableConnectorVisibilityToggle(diagramLayer);
    enableToolbar(transformer);
    enableDrawWire(diagramLayer);
}

let toolMode = "select";

function enableToolbar(transformer) {
    const defaultCursor = document.getElementById("diagram").style.cursor;

    const selectButton = document.getElementById("select-tool");
    const wireButton = document.getElementById("wire-tool");

    selectButton.addEventListener("click", (e) => {
        toolMode = "select";
        document.getElementById("diagram").style.cursor = defaultCursor;
    });

    wireButton.addEventListener("click", (e) => {
        toolMode = "wire";
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

        if (toolMode === "select") {
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

        if (toolMode === "select") {
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

    let componentImageURL = "";
    let componentClassName = "";
    let componentDataset = {};
    document
        .getElementById("library-items")
        .addEventListener("dragstart", function (e) {
            componentImageURL = e.target.src;
            componentDataset = e.target.dataset;
            componentClassName = componentDataset.className;
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

        const component = new componentClassMap[componentClassName](componentImageURL, componentDataset);
        component.createOnLayer(layer, creationPosition);
    });
}

class DiagramState {

    constructor() {
        if (DiagramState.instance) {
            return DiagramState.instance;
        }
        this._lastIssuedId = 0;

        this._componenetMap = {};

        DiagramState.instance = this;
    }

    registerComponent(componentInstance, konvaNode) {
        this._assignAutoIncrementIdentity(konvaNode);
        this._addToComponentMap(konvaNode.id(), componentInstance);
    }

    getComponent(id) {
        return this._componenetMap[id];
    }

    _assignAutoIncrementIdentity(konvaNode) {
        konvaNode.id((++this._lastIssuedId).toString());
    }

    _addToComponentMap(id, componentInstance) {
        this._componenetMap[id] = componentInstance;
    }
}

class Component {
    constructor(imageURL, dataset) {
        console.assert(imageURL);
        this._imageURL = imageURL;
    }

    createOnLayer(layer, position) {
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        layer.add(group);
        DiagramState.instance.registerComponent(this, group);

        group.on("dragstart", (e) => {
            if (toolMode === "wire") {
                group.stopDrag();
            }
        });
    }

    _applyShadow(node) {
        node.shadowColor("black");
        node.shadowBlur(6);
        node.shadowOffset({ x: 3, y: 3 });
        node.shadowOpacity(0.4);
    }

    _createShapeGroup(position) {
        return new Konva.Group({
            x: position.x,
            y: position.y,
            draggable: true,
            name: this.constructor.name
        });
    }

    _populateGroup(group) {
        //abstract
    }
}

class Switch extends Component {

    constructor(imageURL, dataset) {
        super(imageURL, dataset);
    }

    flip(shapeGroup) {
        this._flipActuator(shapeGroup);
    }

    _flipActuator() {
        //abstract
    }

    _addActuator(group) {
        //abstract
    }
}

class DPDTSwitch extends Switch {
    constructor(imageURL, dataset) {
        super(imageURL, dataset);

        console.assert(dataset.pinsX, "data-pins-x not set");
        console.assert(dataset.pinsY, "data-pins-y not set");

        this._pinsStartAtX = parseInt(dataset.pinsX, 10);
        this._pinsStartAtY = parseInt(dataset.pinsY, 10);
    }

    _populateGroup(group) {
        const pinRows = 3;
        const pinCols = 2;
        const pins = [[]];

        for (let pr = 0; pr < pinRows; pr++) {
            pins.push([]);
            for (let pc = 0; pc < pinCols; pc++) {
                const pin = new Konva.Circle({
                    x: this._pinsStartAtX + (pc * 22),
                    y: this._pinsStartAtY + (pr * 15),
                    radius: 6,
                    stroke: "red",
                    opacity: showConnectors ? 1 : 0,
                    strokeWidth: 2
                });
                pins[pr].push(pin);
                group.add(pin);
            }
        }

        Konva.Image.fromURL(this._imageURL, (componentNode) => {
            this._applyShadow(componentNode);
            group.add(componentNode);
            pins.forEach((pr) => {
                pr.forEach((p) => {
                    p.zIndex(componentNode.zIndex());
                });
            });
        });

        this._addActuator(group);
    }
}

class DPDTOnOn extends DPDTSwitch {

    constructor(imageURL, dataset) {
        super(imageURL, dataset);

        this._actuatorState = 0;
    }

    _getImageURLForState() {
        return this._actuatorState === 0 ? "/img/bat-small-left.svg" : "/img/bat-small-right.svg";
    }

    _addActuator(group) {
        Konva.Image.fromURL(this._getImageURLForState(), (componentNode) => {
            componentNode.position({ x: 0, y: -35 });
            componentNode.name("switch-actuator");
            this._applyShadow(componentNode);
            group.add(componentNode);
        });
    }

    _flipActuator(shapeGroup) {

        this._actuatorState = this._actuatorState === 0 ? 1 : 0;

        const actuatorNode = shapeGroup.getChildren().filter(c => c.name() === "switch-actuator")[0];

        const pos = actuatorNode.position();

        actuatorNode.destroy();

        Konva.Image.fromURL(this._getImageURLForState(), (componentNode) => {
            componentNode.position(pos);
            this._applyShadow(componentNode);
            componentNode.name("switch-actuator");
            shapeGroup.add(componentNode);
        });

        //TODO: Update pins state
    }

}

class DPDTOnOffOn extends DPDTSwitch {

}

class DPDTOnOnOn extends DPDTSwitch {

}

class Potentiometer extends Component {

    constructor(imageURL, dataset) {
        super(imageURL, dataset);

        console.assert(dataset.pinsX, "data-pins-x not set");
        console.assert(dataset.pinsY, "data-pins-y not set");

        this._pinsStartAtX = parseInt(dataset.pinsX, 10);
        this._pinsStartAtY = parseInt(dataset.pinsY, 10);
    }

    _populateGroup(group) {
        const pinCount = 3;
        const pins = [];

        for (let p = 0; p < pinCount; p++) {
            const pin = new Konva.Circle({
                x: this._pinsStartAtX + (p * 24),
                y: this._pinsStartAtY,
                radius: 10,
                stroke: "red",
                opacity: showConnectors ? 1 : 0,
                strokeWidth: 2
            });
            pins.push(pin);
            group.add(pin);
        }

        Konva.Image.fromURL(this._imageURL, (componentNode) => {
            this._applyShadow(componentNode);
            group.add(componentNode);
            pins.forEach((p) => {
                p.zIndex(componentNode.zIndex());
            })
        });
    }
}

const componentClassMap = { Potentiometer, DPDTOnOn, DPDTOnOffOn, DPDTOnOnOn };

function enableSelectComponent(layer) {
    const transformer = new Konva.Transformer();
    layer.add(transformer);

    const stage = layer.getStage();

    stage.on("click tap", function (e) {

        if (toolMode === "wire") {
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

    return transformer;
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

let showConnectors = false;

function enableConnectorVisibilityToggle(layer) {
    const checkbox = document.getElementById('checkShowConnectors');
    checkbox.addEventListener('change', function (event) {
        showConnectors = event.currentTarget.checked;
        var newOpacity = showConnectors ? 1 : 0;
        layer.find('Circle').forEach((node) => {
            node.opacity(newOpacity);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});