import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";

export class Component {
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
            if (DiagramState.instance.toolMode === TOOL_MODE_WIRE) {
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

export class Switch extends Component {

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

export class DPDTSwitch extends Switch {
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
                    opacity: DiagramState.instance.showConnectors ? 1 : 0,
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

export class DPDTOnOn extends DPDTSwitch {

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

export class DPDTOnOffOn extends DPDTSwitch {

}

export class DPDTOnOnOn extends DPDTSwitch {

}

export class Potentiometer extends Component {

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
                opacity: DiagramState.instance.showConnectors ? 1 : 0,
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
