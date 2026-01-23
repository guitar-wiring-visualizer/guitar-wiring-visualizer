const setupApp = () => {

    const diagramStage = setupDiagram();
    const libraryStage = setupLibrary();
}

function setupDiagram() {
    const diagramStage = new Konva.Stage({
        container: "diagram",
        width: 1000,
        height: 1000,
    });

    const diagramLayer = new Konva.Layer();

    // // create our sample shape
    // const circle = new Konva.Circle({
    //     x: diagramStage.width() / 2,
    //     y: diagramStage.height() / 2,
    //     radius: 70,
    //     fill: "red",
    //     stroke: "black",
    //     strokeWidth: 4,
    // });
    // circle.draggable("true");
    // diagramLayer.add(circle);

    diagramStage.add(diagramLayer);

    return diagramLayer;
}

function setupLibrary() {
    const libraryStage = new Konva.Stage({
        container: "library",
        width: 200,
        height: 1000,
    });

    const libraryLayer = new Konva.Layer();

    Konva.Image.fromURL("/img/pot.svg", function (potNode) {
        potNode.setAttrs({
            x: 100,
            y: 100,
        });
        potNode.draggable("true")
        libraryLayer.add(potNode);
    });

    libraryStage.add(libraryLayer);

    return libraryStage;
}


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});