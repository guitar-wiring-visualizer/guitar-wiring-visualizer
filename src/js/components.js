/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 David W Martines
 */

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

    get pinIds() {
        return this._pins;
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
        this._subscribeToEvents(group);
        return group;
    }

    createOnLayer(layer, position) {
        // for adding new componenet to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        layer.add(group);
        this._nodeAttrs = group.attrs;
        this._subscribeToEvents(group);
        DiagramState.instance.notifyNodeChanged(group);
    }

    drawOnLayer(layer) {
        // for adding deserialized component to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        group.attrs = this._nodeAttrs;
        layer.add(group);
        this._subscribeToEvents(group);
    }

    _subscribeToEvents(group) {
        group.on("dragend transformend", (e) => {
            console.log(this.constructor.name, this.id, e.type);
            this._nodeAttrs = group.attrs;

            this._moveAttachedWires(group);
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

    removeFromDiagram(layer) {
        console.log("removeFromDiagram", this.id);
        const node = layer.findOne("#" + this.id.toString());
        node.destroy();
        DiagramState.instance.notifyNodeChanged(node);
        DiagramState.instance.removeComponentById(this.id);
    }

    _moveAttachedWires(node) {
        const layer = node.getLayer();
        this._pins.forEach(pinId => {
            //console.log("checking pin", pinId);
            const pinNode = layer.find("#" + pinId.toString()).at(0);
            const pinPos = pinNode.getAbsolutePosition();
            const wiresStartingOnPin = DiagramState.instance.findComponents((c) => {
                return c.constructor.name === "Wire" && c.startPinId === pinId
            });
            //console.log("wires starting on", wiresStartingOnPin);
            wiresStartingOnPin.forEach(oldWire => {
                const newWire = new Wire({
                    _startPoint: [pinPos.x, pinPos.y],
                    _midPoint: oldWire.midPoint,
                    _endPoint: oldWire.endPoint,
                    _startPinId: oldWire.startPinId,
                    _endPinId: oldWire.endPinId,
                    _color: oldWire.color
                });
                newWire.createOnLayer(layer);
                oldWire.removeFromDiagram(layer);
            });
            const wiresEndingOnPin = DiagramState.instance.findComponents((c) => {
                return c.constructor.name === "Wire" && c.endPinId === pinId
            });

            wiresEndingOnPin.forEach(oldWire => {
                const newWire = new Wire({
                    _startPoint: oldWire.startPoint,
                    _midPoint: oldWire.midPoint,
                    _endPoint: [pinPos.x, pinPos.y],
                    _startPinId: oldWire.startPinId,
                    _endPinId: oldWire.endPinId,
                    _color: oldWire.color
                });
                newWire.createOnLayer(layer);
                oldWire.removeFromDiagram(layer);
            });
        });
    }
}

export class Pickup extends Component {
    constructor(state) {
        super(state);
    }


}

export class Humbucker extends Pickup {
    constructor(state) {
        super(state);
    }

    static get ImageURL() {
        return "/img/pu-humbucker4.svg";
    }

    _populateGroup(group) {

        const topCoilEndPin = new Pin({});
        const topCoolEndPinNode = topCoilEndPin.createAsSubcomponent({
            x: 5,
            y: 165
        });
        group.add(topCoolEndPinNode);

        const topCoilStartPin = new Pin({});
        const topCoilStartPinNode = topCoilStartPin.createAsSubcomponent({
            x: 17,
            y: 180
        });
        group.add(topCoilStartPinNode);

        const bottomCoilEndPin = new Pin({});
        const bottomCoilEndPinNode = bottomCoilEndPin.createAsSubcomponent({
            x: 33,
            y: 182
        });
        group.add(bottomCoilEndPinNode);

        const bottomCoilStartPin = new Pin({});
        const bottomCoilStartPinNode = bottomCoilStartPin.createAsSubcomponent({
            x: 50,
            y: 173
        });
        group.add(bottomCoilStartPinNode);

        const groundPin = new Pin({});
        const groundPinNode = groundPin.createAsSubcomponent({
            x: 60,
            y: 158
        });
        group.add(groundPinNode);

        this._pins.push(topCoilEndPin.id, topCoilStartPin.id, bottomCoilEndPin.id, bottomCoilStartPin.id, groundPin.id);

        Konva.Image.fromURL(Humbucker.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
            [
                topCoolEndPinNode,
                topCoilStartPinNode,
                bottomCoilEndPinNode,
                bottomCoilStartPinNode,
                groundPinNode
            ].forEach((p) => {
                p.zIndex(componentNode.zIndex());
            })
        });
    }
}

export class StratPickup extends Pickup {
    constructor(state) {
        super(state);
    }

    static get ImageURL() {
        return "/img/pu-strat.svg";
    }

    _populateGroup(group) {
        const pin1 = new Pin({});
        const pinNode1 = pin1.createAsSubcomponent({
            x: 140,
            y: 105
        });
        group.add(pinNode1);

        const pin2 = new Pin({});
        const pinNode2 = pin2.createAsSubcomponent({
            x: 159,
            y: 105
        });
        group.add(pinNode2);

        this._pins.push(pin1.id, pin2.id);

        Konva.Image.fromURL(StratPickup.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
            [pinNode1, pinNode2].forEach((p) => {
                p.zIndex(componentNode.zIndex());
            });
        });
    }
}

export class Jack extends Component {
    constructor(state) {
        super(state);
    }


}

export class MonoJack extends Jack {
    constructor(state) {
        super(state);
    }

    static get ImageURL() {
        return "/img/jack-mono.svg";
    }

    _populateGroup(group) {
        const tipPin = new Pin({});
        const tipPinNode = tipPin.createAsSubcomponent({
            x: 47,
            y: 10
        });
        group.add(tipPinNode);

        const shieldPin = new Pin({});
        const shieldPinNode = shieldPin.createAsSubcomponent({
            x: 48,
            y: 31
        });
        group.add(shieldPinNode);

        this._pins.push(tipPin.id, shieldPin.id);

        Konva.Image.fromURL(MonoJack.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
            [tipPinNode, shieldPinNode].forEach((p) => {
                p.zIndex(componentNode.zIndex());
            });
        });
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
        this._midPoint = state._midPoint;
        this._startPinId = state._startPinId;
        this._endPinId = state._endPinId;
        this._color = state._color || DiagramState.instance.WIRE_COLOR_DEFAULT;
    }

    static get IsDraggable() { return false; }

    get startPinId() {
        return this._startPinId;
    }

    get endPinId() {
        return this._endPinId;
    }

    get startPoint() {
        return this._startPoint;
    }

    get midPoint() {
        return this._midPoint;
    }

    get endPoint() {
        return this._endPoint;
    }

    get color() {
        return this._color;
    }

    _createShapeGroup(position) {

        const wirePoints = [...this._startPoint, ...this._midPoint, ...this._endPoint];

        console.log("wire creating", this.id, wirePoints);

        const line = new Konva.Line({
            points: wirePoints,
            stroke: this._color,
            strokeWidth: 5,
            lineCap: 'butt',
            lineJoin: 'round',
            draggable: Wire.IsDraggable,
            tension: .7,
            id: this.id.toString(),
            name: this.constructor.name,
        });

        line.transformsEnabled("none");

        return line;
    }

    _populateGroup(group) {
        // noop
    }

    _applyGlobalStyling(node) {
        //noop
    }

    changeColor(node, color) {
        this._color = color;
        node.stroke(color);
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
