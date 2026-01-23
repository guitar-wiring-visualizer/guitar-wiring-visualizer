const setupApp = () => {

    setupDiagram();
    setupLibrary();
}

function setupDiagram() {
    const stage = new Konva.Stage({
        container: "diagram",
        width: 1000,
        height: 1000,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    let itemURL = '';
    document
        .getElementById('library-items')
        .addEventListener('dragstart', function (e) {
            itemURL = e.target.src;
        });

    const container = stage.container();

    container.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    container.addEventListener('drop', function (e) {
        e.preventDefault();

        stage.setPointersPositions(e);

        Konva.Image.fromURL(itemURL, function (componentNode) {
            componentNode.position(stage.getPointerPosition());
            componentNode.draggable("true");
            layer.add(componentNode);
        });
    });
}

function setupLibrary() {
}


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});