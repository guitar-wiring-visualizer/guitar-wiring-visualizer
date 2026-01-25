import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";

export class Component {
    constructor(state = {}) {
        console.assert(state, "state is required");

        if (state._id) {
            this._id = state._id;
        } else {
            this._id = DiagramState.instance.getNewIdentity();
            DiagramState.instance.registerComponent(this);
        }

        this._nodeAttrs = state._nodeAttrs || {};

        this._pins = state._pins || [];
    }

    get id() {
        return this._id;
    }

    static get ImageURL() {
        throw new Error("abstract method call");
    }

    static get IsDraggable() {
        return true;
    }

    createAsSubcomponent(position) {
        // for add new subcomponent to a component group
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        this._nodeAttrs = group.attrs;
        this._wireupNodeEvents(group);
        return group;
    }

    createOnLayer(layer, position) {
        // for adding new componenet to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        layer.add(group);
        this._nodeAttrs = group.attrs;
        this._wireupNodeEvents(group);
    }

    drawOnLayer(layer) {
        // for adding deserialized component to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        group.attrs = this._nodeAttrs;
        layer.add(group);
        this._wireupNodeEvents(group);
    }

    _wireupNodeEvents(group) {
        group.on("dragend transformend", (e) => {
            console.log("updating attrs", e.type);
            this._nodeAttrs = group.attrs;
        });

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
            draggable: this.constructor.IsDraggable,
            name: this.constructor.name,
            id: this.id.toString()
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

export class Pin extends Component {
    constructor(state) {
        super(state);
    }

    static get IsDraggable() { return false; }

    _populateGroup(group) {
        const pinShape = new Konva.Circle({
            radius: 6,
            stroke: "red",
            opacity: DiagramState.instance.showConnectors ? 1 : 0,
            strokeWidth: 2
        });
        group.add(pinShape);
    }

    _applyGlobalStyling(node) {
        //noop
    }
}

export class Wire extends Component {
    constructor(state) {
        super(state);

        this._startPoint = state._startPoint;
        this._endPoint = state._endPoint;
        this._midPoint =  state._midPoint; 
    }

    static get IsDraggable() { return false; }

    _createShapeGroup(position) {

        const wirePoints = [...this._startPoint, ...this._midPoint, ...this._endPoint];

        console.log("wire creating", wirePoints);

        return new Konva.Line({
            points: wirePoints,
            stroke: 'blue',
            strokeWidth: 5,
            lineCap: 'butt',
            lineJoin: 'round',
            draggable: Wire.IsDraggable,
            tension: .7,
            id: this.id.toString(),
            name: this.constructor.name,
        });
    }

    _populateGroup(group) {
        // noop
    }

    _applyGlobalStyling(node) {
        //noop
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

                const pinComponent = new Pin({});
                this._pins.push(pinComponent.id);

                const pinNode = pinComponent.createAsSubcomponent({
                    x: DPDTSwitch._pinsStartAtX + (pc * 22),
                    y: DPDTSwitch._pinsStartAtY + (pr * 15)
                });

                pins[pr].push(pinNode);
                group.add(pinNode);
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

            const pinComponent = new Pin({});
            this._pins.push(pinComponent.id);

            const pinNode = pinComponent.createAsSubcomponent({
                x: Potentiometer._pinsStartAtX + (p * 24),
                y: Potentiometer._pinsStartAtY,
            });
            pins.push(pinNode);
            group.add(pinNode);
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
