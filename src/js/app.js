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

    const stage = layer.getParent();
    const container = stage.container();

    container.addEventListener("dragover", function (e) {
        e.preventDefault();
    });

    container.addEventListener("drop", function (e) {
        e.preventDefault();

        stage.setPointersPositions(e);

        Konva.Image.fromURL(itemURL, function (componentNode) {
            const POINTER_COMP = 40;
            const x = stage.getPointerPosition().x -POINTER_COMP;
            const y = stage.getPointerPosition().y -POINTER_COMP;
            componentNode.position({x, y});
            componentNode.draggable("true");
            layer.add(componentNode);
        });
    });
}

function enableSelectComponent(layer) {
    const transformer = new Konva.Transformer();
    layer.add(transformer);

    const stage = layer.getParent();

    stage.on("click tap", function (e) {

        if (e.target === stage) {
            transformer.nodes([]);
            return;
        }
        const isAlreadySelected = transformer.nodes().indexOf(e.target) >= 0;
        if (!isAlreadySelected) {
            transformer.nodes([e.target]);
        }

        console.log("selected node", transformer.nodes()[0]);
    });

    return transformer;
}

function enableDeleteComponent(transformer) {
    const layer = transformer.getParent();
    const stage = layer.getParent();

    stage.container().tabIndex = 1;
    //stage.container().focus();

    stage.container().addEventListener("keydown", (e) => {

        if (transformer.nodes().length === 0)
            return;

        if (e.keyCode === 46 || e.keyCode === 8) {
            const nodeToDelete = transformer.nodes()[0];
            nodeToDelete.destroy();
            transformer.nodes([]);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});