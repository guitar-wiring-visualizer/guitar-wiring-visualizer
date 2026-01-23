const setupApp = () => {

    const diagramStage = setupDiagram();
    const libraryStage = setupLibrary();
}



const runDemo = () => {

    // first we need to create a stage
    var stage = new Konva.Stage({
        container: 'app-root', // id of container <div>
        width: 500,
        height: 500,
    });

    // then create layer
    var layer = new Konva.Layer();

    // create our shape
    var circle = new Konva.Circle({
        x: stage.width() / 2,
        y: stage.height() / 2,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
    });

    circle.draggable('true');

    // add the shape to the layer
    layer.add(circle);

    // add the layer to the stage
    stage.add(layer);
}





function setupDiagram() {
    const diagramStage = new Konva.Stage({
        container: 'diagram',
        width: 1000,
        height: 1000,
    });

    const diagramLayer = new Konva.Layer();

    // create our sample shape
    const circle = new Konva.Circle({
        x: diagramStage.width() / 2,
        y: diagramStage.height() / 2,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
    });
    circle.draggable('true');
    diagramLayer.add(circle);

    diagramStage.add(diagramLayer);

    return diagramLayer;
}

function setupLibrary() {
    const libraryStage = new Konva.Stage({
        container: 'library',
        width: 200,
        height: 1000,
    });

    const libraryLayer = new Konva.Layer();

    // create our sample shape
    const circle = new Konva.Circle({
        x: libraryStage.width() / 2,
        y: libraryStage.height() / 2,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
    });
    circle.draggable('true');
    libraryLayer.add(circle);

    libraryStage.add(libraryLayer);

    return libraryStage;
}


document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("loader").hidden = true;
    setupApp();
});