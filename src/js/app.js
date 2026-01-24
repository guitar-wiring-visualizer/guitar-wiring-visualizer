const setupApp = () => {

    window.GWVDiagramState = new DiagramState();

    const diagramLayer = createDiagramLayer();

    enableDragDropFromLibrary(diagramLayer);

    const transformer = enableSelectComponent(diagramLayer);

    enableComponentKeyCommands(transformer);
    enableClearDiagram(diagramLayer);

    enableConnectorVisibilityToggle(diagramLayer);
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

    registerComponent(konvaNode) {
        konvaNode.id((++this._lastIssuedId).toString());
        this._componenetMap[konvaNode.id()] = konvaNode;
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
        DiagramState.instance.registerComponent(group);
    }

    _createShapeGroup(position) {
        return new Konva.Group({
            x: position.x,
            y: position.y,
            draggable: true,
            name: this.constructor.name
        });
    }

    _populateGroup(group){
        //abstract
    }
}

class DPDTSwitch extends Component {
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

        Konva.Image.fromURL(this._imageURL, function (componentNode) {
            group.add(componentNode);
            pins.forEach((pr) => {
                pr.forEach((p) => {
                    p.zIndex(componentNode.zIndex());
                });
            });
        });

        this.addActuator(group);
    }

    addActuator(group) {

    }
}

class DPDTOnOn extends DPDTSwitch {

    addActuator(group) {
        Konva.Image.fromURL("/img/bat-small-left.svg", function (componentNode) {
            componentNode.position({ x: 0, y: -32 });
            componentNode.name("switch-actuator");
            group.add(componentNode);
        });
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

        Konva.Image.fromURL(this._imageURL, function (componentNode) {
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

        if (e.target === stage) {
            transformer.nodes([]);
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
    const actuators = switchGroup.getChildren().filter(child => child.name() === "switch-actuator");
    if (actuators.length === 0)
        return;
    const actuator = actuators[0];
    console.log("flipping switch", switchGroup.id());
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