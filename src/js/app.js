const setupApp = () => {
    const diagramLayer = createDiagramLayer();

    enableDragDropFromLibrary(diagramLayer);

    const transformer = enableSelectComponent(diagramLayer);

    enableDeleteComponent(transformer);
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

class Component {
    constructor(imageURL, dataset) {
        console.assert(imageURL);
        this._imageURL = imageURL;
    }

    createOnLayer(layer, position) {
        throw new Error('abstract "createOnLayer" method call');
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

    createOnLayer(layer, position) {
        const group = new Konva.Group({
            x: position.x,
            y: position.y,
            draggable: true
        });

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

        layer.add(group);
    }
}

class DPDTOnOn extends DPDTSwitch {

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

    createOnLayer(layer, position) {
        const group = new Konva.Group({
            x: position.x,
            y: position.y,
            draggable: true
        });

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

        layer.add(group);
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

function enableDeleteComponent(transformer) {
    const stage = transformer.getStage();

    stage.container().tabIndex = 1;
    //stage.container().focus();

    stage.container().addEventListener("keydown", (e) => {

        if (transformer.nodes().length === 0)
            return;

        if (e.keyCode === 46 || e.keyCode === 8) {
            if (confirm("Delete selected component?")) {
                const nodeToDelete = transformer.nodes()[0];
                nodeToDelete.destroy();
                transformer.nodes([]);
            }
        }
    });
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