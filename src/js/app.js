const setupApp = () => {
    const diagramLayer = createDiagramLayer();
    enableDragDropFromLibrary(diagramLayer);
    enableSelectComponent(diagramLayer);
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
            componentNode.position(stage.getPointerPosition());
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
    });


}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});