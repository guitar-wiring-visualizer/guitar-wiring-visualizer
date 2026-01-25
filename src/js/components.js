import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";

export class Component {
    constructor(state = {}) {
        console.assert(state);
    }

    static get ImageURL() {
        throw new Error("abstract method call");
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

    _createShapeGroup(position) {
        return new Konva.Group({
            x: position.x,
            y: position.y,
            draggable: true,
            name: this.constructor.name
        });
    }

    _populateGroup(group) {
        throw new Error("abstract method call");
    }

    _applyGlobalStyling(node) {
        node.shadowColor("black");
        node.shadowBlur(6);
        node.shadowOffset({ x: 3, y: 3 });
        node.shadowOpacity(0.4);
    }
}

export class Switch extends Component {

    constructor(state) {
        super(state);
    }

    flip(shapeGroup) {
        this._flipActuator(shapeGroup);
    }

    _flipActuator() {
        throw new Error("abstract method call");
    }

    _addActuator(group) {
        console.warn("_addActuator not implemented");
    }
}

export class DPDTSwitch extends Switch {

    constructor(state) {
        super(state);
    }

    static get _pinsStartAtX() {
        return 10;
    }

    static get _pinsStartAtY() {
        return 9;
    }

    _populateGroup(group) {
        const pinRows = 3;
        const pinCols = 2;
        const pins = [[]];

        for (let pr = 0; pr < pinRows; pr++) {
            pins.push([]);
            for (let pc = 0; pc < pinCols; pc++) {
                const pin = new Konva.Circle({
                    x: DPDTSwitch._pinsStartAtX + (pc * 22),
                    y: DPDTSwitch._pinsStartAtY + (pr * 15),
                    radius: 6,
                    stroke: "red",
                    opacity: DiagramState.instance.showConnectors ? 1 : 0,
                    strokeWidth: 2
                });
                pins[pr].push(pin);
                group.add(pin);
            }
        }

        Konva.Image.fromURL(this.constructor.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
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

    constructor(state) {
        super(state);

        this._actuatorState = 0;
    }

    static get ImageURL() {
        return "/img/dpdt-blue.svg";
    }

    _getActuatorImageURLForState() {
        return this._actuatorState === 0 ? "/img/bat-small-left.svg" : "/img/bat-small-right.svg";
    }

    _addActuator(group) {
        Konva.Image.fromURL(this._getActuatorImageURLForState(), (componentNode) => {
            componentNode.position({ x: 0, y: -35 });
            componentNode.name("switch-actuator");
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
        });
    }

    _flipActuator(shapeGroup) {

        this._actuatorState = this._actuatorState === 0 ? 1 : 0;

        const actuatorNode = shapeGroup.getChildren().filter(c => c.name() === "switch-actuator")[0];

        const pos = actuatorNode.position();

        actuatorNode.destroy();

        Konva.Image.fromURL(this._getActuatorImageURLForState(), (componentNode) => {
            componentNode.position(pos);
            this._applyGlobalStyling(componentNode);
            componentNode.name("switch-actuator");
            shapeGroup.add(componentNode);
        });

        //TODO: Update pins state
    }

}

export class DPDTOnOffOn extends DPDTSwitch {
    constructor(state) {
        super(state);

        this._actuatorState = 0;
    }

    static get ImageURL() {
        return "/img/dpdt-purple.svg";
    }

}

export class DPDTOnOnOn extends DPDTSwitch {
    constructor(state) {
        super(state);

        this._actuatorState = 0;
    }

    static get ImageURL() {
        return "/img/dpdt-red.svg";
    }
}

export class Potentiometer extends Component {

    constructor(state) {
        super(state);
    }

    static get ImageURL() {
        return "/img/pot1.svg";
    }

    static get _pinsStartAtX() {
        return 25;
    }

    static get _pinsStartAtY() {
        return 110;
    }

    _populateGroup(group) {

        const pinCount = 3;
        const pins = [];

        for (let p = 0; p < pinCount; p++) {
            const pin = new Konva.Circle({
                x: Potentiometer._pinsStartAtX + (p * 24),
                y: Potentiometer._pinsStartAtY,
                radius: 10,
                stroke: "red",
                opacity: DiagramState.instance.showConnectors ? 1 : 0,
                strokeWidth: 2
            });
            pins.push(pin);
            group.add(pin);
        }

        Konva.Image.fromURL(Potentiometer.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
            pins.forEach((p) => {
                p.zIndex(componentNode.zIndex());
            })
        });
    }
}
