/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";
import EventEmitter from "./eventEmitter.js";

export class Component extends EventEmitter {
    constructor(state = {}) {
        super()

        console.assert(state, "state is required");
        
        this._state = state

        if (!state.id) {
            state.id = DiagramState.instance.getNewIdentity();
            DiagramState.instance.registerComponent(this);
        }
        state.nodeAttrs = state.nodeAttrs || {};
        state.pinIds = state.pinIds || [];
    }

    get id() {
        return this._state.id;
    }

    get state() {
        return this._state
    }

    get pinIds() {
        return this._state.pinIds;
    }

    get nodeAttrs() {
        return this._state.nodeAttrs;
    }

    set nodeAttrs(val) {
        this._state.nodeAttrs = val;
    }

    static get ImageURL() {
        throw new Error("abstract method call");
    }

    static get IsDraggable() {
        return true;
    }

    findNode(containerNode) {
        return containerNode.findOne("#" + this.id.toString())
    }

    createAsSubcomponent(position) {
        // for add new subcomponent to a component group
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        this.nodeAttrs = group.attrs;
        this._subscribeToEvents(group);
        return group;
    }

    createOnLayer(layer, position) {
        // for adding new componenet to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        layer.add(group);
        this.nodeAttrs = group.attrs;
        this._subscribeToEvents(group);
        DiagramState.instance.notifyNodeChanged(group);
    }

    drawOnLayer(layer) {
        // for adding deserialized component to diagram
        const group = this._createShapeGroup(position);
        this._populateGroup(group);
        group.attrs = this.nodeAttrs;
        layer.add(group);
        this._subscribeToEvents(group);
    }

    _subscribeToEvents(group) {
        group.on("dragend transformend", (e) => {
            console.log(this.constructor.name, this.id, e.type);
            this.nodeAttrs = group.attrs;

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
        const node = this.findNode(layer);
        node.destroy();
        DiagramState.instance.notifyNodeChanged(node);
        DiagramState.instance.removeComponentById(this.id);
    }

    _moveAttachedWires(node) {
        const layer = node.getLayer();
        this.pinIds.forEach(pinId => {
            //console.log("checking pin", pinId);
            const pin = DiagramState.instance.getComponent(pinId);
            const pinNode = pin.findNode(layer);
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
                    _color: oldWire.color,
                    _voltage: oldWire.voltage
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
                    _color: oldWire.color,
                    _voltage: oldWire.voltage
                });
                newWire.createOnLayer(layer);
                oldWire.removeFromDiagram(layer);
            });
        });
    }
}

export class Pin extends Component {
    constructor(state) {
        super(state);

        this._voltage = 0;
    }

    static get IsDraggable() { return false; }

    get voltage() { return this._voltage };

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

    receiveVoltage(fromId, value) {
        console.log(this.id, "pin received voltage", fromId, value);
        this._voltage = value;

        const connectedWires = DiagramState.instance.findComponents(wire => {
            return wire.constructor.name == "Wire"
                && wire.id !== fromId
                && (wire.endPinId == this.id || wire.startPinId == this.id)
        });
        console.log("send to connected wires", connectedWires);
        connectedWires.forEach(wire => wire.receiveVoltage(this.id, value));

        this._emit("voltageChanged", this.voltage);

        //TODO: emit event so visulizer refreshes nodes
    }

    hasVoltage() {
        console.log("checking voltage on pin", this.id, this._voltage);
        return this._voltage !== 0;
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

        this._voltage = state._voltage || 0;
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

    receiveVoltage(fromId, value) {
        console.log(this.id, "wire received voltage", fromId, value);
        this._voltage = value;
        const targetPinId = this._startPinId === fromId ? this.endPinId : this.startPinId;
        const targetPin = DiagramState.instance.getComponent(targetPinId);
        targetPin.receiveVoltage(this.id, value);
    }

    hasVoltage() {
        console.log("checking voltage on wire", this.id);
        return this._voltage !== 0;
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

class InductionCoil {

    constructor(startPin, endPin) {
        this._startPin = startPin;
        this._endPin = endPin;
    }

    induct() {
        console.log(this.constructor.name, "received induct message");
        if (this._startPin.hasVoltage())
            this._endPin.receiveVoltage(this._startPin.id, -this._startPin.voltage);
        else if (this._endPin.hasVoltage())
            this._startPin.receiveVoltage(this._endPin.id, -this._endPin.voltage);
        else
            this._endPin.receiveVoltage(this._startPin.id, 1);

    }
}

export class Pickup extends Component {
    constructor(state) {
        super(state);
    }

    induct() {
        throw new Error("Abstract method call")
    }
}

export class Humbucker extends Pickup {
    constructor(state) {
        super(state);
    }

    static get ImageURL() {
        return "/img/pu-humbucker4.svg";
    }

    induct() {
        console.warn("Humbuker induct not yet implemented");
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

        this.pinIds.push(topCoilEndPin.id, topCoilStartPin.id, bottomCoilEndPin.id, bottomCoilStartPin.id, groundPin.id);

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

    get startPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    get endPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    induct() {
        console.log(this.constructor.name, this.id, "received induct message");
        var coil = new InductionCoil(this.startPin, this.endPin);
        coil.induct();
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

        this.pinIds.push(pin1.id, pin2.id);

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

        const tipPin = new Pin({});
        const sleevePin = new Pin({});

        this.pinIds.push(tipPin.id, sleevePin.id);

        tipPin.on("voltageChanged", (value) => {
            console.log(this.constructor.name, "got vc event from tip pin", tipPin.id, value)
            if (!sleevePin.hasVoltage())
                sleevePin.receiveVoltage(this.id, -value);
        });
        sleevePin.on("voltageChanged", (value) => {
            console.log(this.constructor.name, "got vc event from sleevePin", sleevePin.id, value)
            if (!tipPin.hasVoltage())
                tipPin.receiveVoltage(this.id, -value);
        });

    }

    static get ImageURL() {
        return "/img/jack-mono.svg";
    }

    get tipPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    get sleevePin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }


    _populateGroup(group) {

        const tipPin = this.tipPin;
        const sleevePin = this.sleevePin;

        const tipPinNode = tipPin.createAsSubcomponent({
            x: 47,
            y: 10
        });
        group.add(tipPinNode);

        const sleevePinNode = sleevePin.createAsSubcomponent({
            x: 48,
            y: 31
        });
        group.add(sleevePinNode);

        Konva.Image.fromURL(MonoJack.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            group.add(componentNode);
            [tipPinNode, sleevePinNode].forEach((p) => {
                p.zIndex(componentNode.zIndex());
            });
        });
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
                this.pinIds.push(pinComponent.id);

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
            this.pinIds.push(pinComponent.id);

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
