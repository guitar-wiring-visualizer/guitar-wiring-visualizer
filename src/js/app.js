const setupApp = () => {
    const diagramLayer = createDiagramLayer();

    enableDragDropFromLibrary(diagramLayer);

    const transformer = enableSelectComponent(diagramLayer);

    enableDeleteComponent(transformer);
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

    let itemURL = "";
    document
        .getElementById("library-items")
        .addEventListener("dragstart", function (e) {
            itemURL = e.target.src;
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

        const pot = new Potentiometer(itemURL);
        pot.createOnLayer(layer, creationPosition);
    });
}

class Potentiometer {

    constructor(imageURL) {

        this._imageURL = imageURL;
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
                x: 25 + (p * 24),
                y: 110,
                radius: 10,
                stroke: "red",
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




document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});