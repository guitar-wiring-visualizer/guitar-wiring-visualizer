/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";
import EventEmitter from "./eventEmitter.js";

export class Component extends EventEmitter {
    constructor(state) {
        super()

        console.assert(state, "state is required");

        this._state = state

        if (isNewComponent()) {
            state.id = DiagramState.instance.getNewIdentity();
            state.className = this.constructor.name;
            DiagramState.instance.registerComponent(this);

            state.nodeAttrs = state.nodeAttrs || {};
            state.pinIds = state.pinIds || [];

            this._createChildComponents();
        }

        function isNewComponent() {
            return !state.id;
        }
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
        console.assert(val, "val is required");
        this._state.nodeAttrs = val;
    }

    static get ImageURL() {
        throw new Error("abstract method call");
    }

    static get IsDraggable() {
        return true;
    }

    /**
     * Sets the X,Y position of this component, relative to its container.
     * @param {x, y} position 
     */
    moveTo(position) {
        console.assert(position, "position is required");
        this.nodeAttrs.x = position.x;
        this.nodeAttrs.y = position.y;
    }

    /**
     * Render this component in the container.
     * This function can be called on a newly created component or one
     * that was restored from persisted state.
     * 
     * For newly created components, you probably want to call moveTo first,
     * or else it will draw at 0,0.
     * 
     * From the app perspective, the container will typically be a Konva.Layer.
     * @param {Konva.Node} containerNode 
     */
    draw(containerNode) {
        console.assert(containerNode, "containerNode is required");
        const positionInContainer = this._getPosition();
        const rootNode = this._createRootNode(positionInContainer);

        containerNode.add(rootNode);

        this._drawChildNodes(rootNode);

        //this._drawIDLabel(rootNode);

        this.nodeAttrs = rootNode.attrs;
        this._subscribeToEvents(rootNode);
        DiagramState.instance.notifyNodeChanged(rootNode);
    }

    _drawIDLabel(rootNode) {
        const simpleLabel = new Konva.Label({
            x: 0,
            y: 0,
            opacity: 0.75
        });

        simpleLabel.add(
            new Konva.Tag({
                fill: 'yellow'
            })
        );

        simpleLabel.add(
            new Konva.Text({
                text: this.id.toString(),
                fontFamily: 'Calibri',
                fontSize: 18,
                padding: 5,
                fill: 'black'
            })
        );

        if (rootNode.getClassName() === "Group") {
            rootNode.add(simpleLabel);
        }
    }

    /**
     * Render this component in the container, replacing the existing node.
     * Usually not necessary.
     * This is to be used after changing the state of a component and you want to force re-render.
     * Delegates to the normal draw method after destroying any existing node.
     * @param {Konva.Node} containerNode 
     */
    reDraw(containerNode) {
        console.assert(containerNode, "containerNode is required");
        this._unDrawIfNeeded(containerNode);
        this.draw(containerNode);
    }

    _unDrawIfNeeded(containerNode) {
        console.assert(containerNode, "containerNode is required");
        const node = this.findNode(containerNode);
        if (node) {
            console.debug("undraw node", node.id());
            node.destroy();
        }
    }

    /**
     * Removes this component from the diagram
     * (both visually and from persisted state).
     * @param {Konva.Node} layer 
     */
    removeFromDiagram(layer) {
        console.assert(layer, "layer is required");
        console.debug("removeFromDiagram", this.id);
        const node = this.findNode(layer);
        node.destroy();
        DiagramState.instance.notifyNodeChanged(node);
        DiagramState.instance.removeComponentById(this.id);
    }

    /**
     * Gets a reference to the root Konva.node for this component.
     * @param {Konva.Node} containerNode 
     * @returns Konva.node
     */
    findNode(containerNode) {
        console.assert(containerNode, "containerNode is required");
        return containerNode.findOne("#" + this.id.toString())
    }

    /**
     * Utility function to get the x,y position based on the node attrs.
     * @returns {x,y}
     */
    _getPosition() {
        return { x: this.nodeAttrs.x, y: this.nodeAttrs.y };
    }

    /**
     * Utility function to get a list of nodes of the component.
     * @param {Konva.Node} container 
     * @returns [{Konva.Node}]
     */
    _getPinNodes(container) {
        console.assert(container, "container is required");
        return this.pinIds.map(id => {
            const pin = DiagramState.instance.getComponent(id);
            return pin.findNode(container);
        });
    }

    _subscribeToEvents(componentNode) {
        componentNode.on("dragend transformend", (e) => {
            console.debug(this.constructor.name, this.id, e.type);
            this.state.nodeAttrs = componentNode.attrs;

            this._moveAttachedWires(componentNode);
        });

        componentNode.on("dragstart", (e) => {
            if (DiagramState.instance.toolMode === TOOL_MODE_WIRE) {
                componentNode.stopDrag();
            }
        });
    }

    /**
     * Allows a component to create child components such as pins, actuators, etc.
     * @virtual
     */
    _createChildComponents() {
    }


    /**
     * Creates the root node of the component.
     * In most cases this is a {Konva.Group} to which child elements can be added.
     * Can be overridden in special cases, such as for Wires which are not groups.
     * @virtual
     * @returns {Konva.Node}
     */
    _createRootNode() {
        return new Konva.Group({
            x: this.nodeAttrs.x,
            y: this.nodeAttrs.y,
            draggable: this.constructor.IsDraggable,
            name: this.constructor.name,
            id: this.id.toString()
        });
    }

    /**
     * Renders all child nodes into the parentNode.
     * @param {Konva.Node} parentNode.
     * @virtual
     */
    _drawChildNodes(parentNode) {
    }

    /**
     * Applies common styling to the node.  This is called automatically during drawing.
     * Can be overridden.
     * @param {Konva.Node} node
     * @virtual
     */
    _applyGlobalStyling(node) {
        node.shadowColor("black");
        node.shadowBlur(6);
        node.shadowOffset({ x: 3, y: 3 });
        node.shadowOpacity(0.4);
    }

    _moveAttachedWires(node) {
        const layer = node.getLayer();
        this.pinIds.forEach(pinId => {
            console.debug("checking pin", pinId);
            const pin = DiagramState.instance.getComponent(pinId);
            const pinNode = pin.findNode(layer);
            const pinPos = pinNode.getAbsolutePosition();
            const wiresStartingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.startPinId === pinId
            });
            wiresStartingOnPin.forEach(oldWire => {
                oldWire.updateStartPoint([pinPos.x, pinPos.y]);
                oldWire.reDraw(layer);
            });
            const wiresEndingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.endPinId === pinId
            });
            wiresEndingOnPin.forEach(oldWire => {
                oldWire.updateEndPoint([pinPos.x, pinPos.y]);
                oldWire.reDraw(layer);
            });
        });
    }
}

export class Pin extends Component {
    constructor(state = {}) {
        super(state);

        this._voltage = 0;
        this.state.connectedPinId = null;
        this.state.isConnectedPinSource = false;
    }

    static get IsDraggable() { return false; }

    get connectedPinId() {
        return this.state.connectedPinId;
    }
    _setConnectedPinId(otherPinId) {
        console.assert(typeof otherPinId !== 'undefined', "otherPinId is required");
        this.state.connectedPinId = otherPinId;
    }

    /**
     * Inidicates if this was the pin that initiated the connection to the other pin.
     * This does not affect voltage flow - it is only used for drawing.
     */
    get isConnectedPinSource() {
        return this.state.isConnectedPinSource;
    }
    _setIsConnectedPinSource(val) {
        this.state.isConnectedPinSource = val;
    }

    connectToOtherPin(otherPin) {
        console.assert(otherPin, "otherPin is required");
        this._setIsConnectedPinSource(true);
        this._setConnectedPinId(otherPin.id);
        otherPin._setConnectedPinId(this.id);
        otherPin._setIsConnectedPinSource(false);
    }

    disconnectFromOtherPin() {
        if (this.connectedPinId !== null) {
            const otherPin = DiagramState.instance.getComponent(this.connectedPinId);
            otherPin._setConnectedPinId(null);
            otherPin._setIsConnectedPinSource(false);
        }
        this._setConnectedPinId(null);
        this._setIsConnectedPinSource(false);
    }

    get voltage() { return this._voltage };

    _setVoltage(val) { this._voltage = val; }

    resetVoltage() {
        this._setVoltage(0);
    }

    _drawChildNodes(parentNode) {
        const pinShape = new Konva.Circle({
            radius: 6,
            stroke: "red",
            opacity: DiagramState.instance.showConnectors ? 1 : 0,
            strokeWidth: 2
        });
        parentNode.add(pinShape);
    }

    _applyGlobalStyling(node) {
        //noop
    }

    receiveVoltage(fromWireId, value, fromPinId = null) {
        console.info(`pin ${this.id} received voltage ${value} from wire ${fromWireId}, from pin ${fromPinId}`);
        this._setVoltage(value);

        const connectedWires = DiagramState.instance.findComponentsOfType(Wire, wire => {
            return wire.id !== fromWireId
                && (wire.endPinId == this.id || wire.startPinId == this.id)
        });
        console.debug("send to connected wires", connectedWires);
        connectedWires.forEach(wire => wire.receiveVoltage(this.id, value));

        if (this.connectedPinId !== null && fromPinId !== this.connectedPinId) {
            console.debug("send to connected pin", this.connectedPinId);
            const connectedPin = DiagramState.instance.getComponent(this.connectedPinId);
            connectedPin.receiveVoltage(fromWireId, value, this.id);
        }

        this._emit("voltageChanged", this.voltage);
    }

    hasVoltage() {
        console.debug(`checking voltage on pin ${this.id}: ${this.voltage}`);
        return this.voltage !== 0;
    }
}

export class Wire extends Component {
    constructor(state = {}) {
        super(state);

        this.state.color = state.color || DiagramState.instance.WIRE_COLOR_DEFAULT;
        this._voltage = 0;
        this._pinVoltageIsFrom = null;
    }

    static get IsDraggable() { return false; }

    get startPinId() {
        return this.state.startPinId;
    }

    get endPinId() {
        return this.state.endPinId;
    }

    get startPoint() {
        return this.state.startPoint;
    }

    get midPoint() {
        return this.state.midPoint;
    }

    get endPoint() {
        return this.state.endPoint;
    }

    get color() {
        return this.state.color;
    }

    /**
     * Updates the start point of the wire.
     * @param {[]} newPoint a flat array of the x and y integers.
     */
    updateStartPoint(newPoint) {
        console.assert(newPoint, "newPoint is required");
        console.assert(Array.isArray(newPoint) && newPoint.length === 2, "newPoint must be a flat array of two values");
        this.state.startPoint = newPoint;
    }

    /**
     * Updates the end point of the wire.
     * @param {[]} newPoint a flat array of the x and y integers.
     */
    updateEndPoint(newPoint) {
        console.assert(newPoint, "newPoint is required");
        console.assert(Array.isArray(newPoint) && newPoint.length === 2, "newPoint must be a flat array of two values");
        this.state.endPoint = newPoint;
    }

    moveTo(position) {
        console.warn("_moveTo called on a Wire.  You probably want to set the startPoint, midPoint, and endPoint instead.");
        super.moveTo(position);
    }

    get voltage() { return this._voltage };

    _setVoltage(val) { this._voltage = val; }

    resetVoltage() {
        this._setVoltage(0);
    }

    receiveVoltage(fromId, value) {
        console.info(`wire ${this.id} received voltage ${value} from pin ${fromId}`);
        this._setVoltage(value);
        this._pinVoltageIsFrom = DiagramState.instance.getComponent(fromId);
        const targetPinId = this.startPinId === fromId ? this.endPinId : this.startPinId;
        const targetPin = DiagramState.instance.getComponent(targetPinId);
        targetPin.receiveVoltage(this.id, value);
    }

    get pinVoltageIsFrom() {
        return this._pinVoltageIsFrom;
    }

    hasVoltage() {
        console.debug(`checking voltage on wire ${this.id}: ${this.voltage}`);
        return this.voltage !== 0;
    }

    /**
     * Special root node creation for Wire.
     * No position arg is needed since it draws based on start/mid/endpoints.
     * This just creates a Line node, not a group, since no child nodes are used.
     */
    _createRootNode(_) {

        const wirePoints = [...this.startPoint, ...this.midPoint, ...this.endPoint];

        console.debug("wire creating", this.id, wirePoints);

        const line = new Konva.Line({
            points: wirePoints,
            stroke: this.color,
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

    _drawChildNodes(group) {
        // noop
    }

    _applyGlobalStyling(node) {
        //noop
    }

    changeColor(node, color) {
        this.color = color;
        node.stroke(color);
    }
}

class InductionCoil {

    constructor(startPin, endPin) {
        this._startPin = startPin;
        this._endPin = endPin;
    }

    induct() {
        console.info(this.constructor.name, "received induct message");
        if (this._startPin.hasVoltage())
            this._endPin.receiveVoltage(this._startPin.id, -this._startPin.voltage);
        else if (this._endPin.hasVoltage())
            this._startPin.receiveVoltage(this._endPin.id, -this._endPin.voltage);
        else
            this._endPin.receiveVoltage(this._startPin.id, 1);
    }

    stopInducting() {
        console.info("coil received stopInducting message");
        if (this._endPin.hasVoltage())
            this._endPin.receiveVoltage(this._startPin, 0);
    }
}

export class Pickup extends Component {
    constructor(state = {}) {
        super(state);
    }

    startPickingUp() {
        throw new Error("Abstract method call")
    }

    stopPickingUp() {
        throw new Error("Abstract method call")
    }
}

export class Humbucker extends Pickup {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/pu-humbucker4.svg";
    }

    startPickingUp() {
        console.warn("Humbuker startPickingUp not yet implemented");
    }

    stopPickingUp() {
        console.warn("Humbuker stopPickingUp not yet implemented");
    }

    get topCoilStartPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get topCoilEndPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get bottomCoilEndPin() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get bottomCoilStartPin() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }
    get groundPin() { return DiagramState.instance.getComponent(this.pinIds.at(4)); }

    _createChildComponents() {
        const topCoilStartPin = new Pin();
        const topCoilEndPin = new Pin();
        const bottomCoilEndPin = new Pin();
        const bottomCoilStartPin = new Pin();
        const groundPin = new Pin();
        this.pinIds.push(topCoilEndPin.id, topCoilStartPin.id, bottomCoilEndPin.id, bottomCoilStartPin.id, groundPin.id);
    }

    _drawChildNodes(parentNode) {

        this.topCoilEndPin.moveTo({
            x: 5,
            y: 165
        });
        this.topCoilEndPin.draw(parentNode);

        this.topCoilStartPin.moveTo({
            x: 17,
            y: 180
        });
        this.topCoilStartPin.draw(parentNode);

        this.bottomCoilEndPin.moveTo({
            x: 33,
            y: 182
        });
        this.bottomCoilEndPin.draw(parentNode);

        this.bottomCoilStartPin.moveTo({
            x: 50,
            y: 173
        });
        this.bottomCoilStartPin.draw(parentNode);

        this.groundPin.moveTo({
            x: 60,
            y: 158
        });
        this.groundPin.draw(parentNode);

        Konva.Image.fromURL(Humbucker.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
        });
    }
}

export class StratPickup extends Pickup {
    constructor(state = {}) {
        super(state);
        this._coil = null;
    }

    static get ImageURL() {
        return "/img/pu-strat.svg";
    }

    get startPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    get endPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    pickUp() {
        console.info(this.constructor.name, this.id, "received pickUp message");
        this._coil = new InductionCoil(this.startPin, this.endPin);
        this._coil.induct();
    }

    stopPickingUp() {
        console.info(this.constructor.name, this.id, "received stopPickingUp message");
        if (this._coil)
            this._coil.stopInducting();
    }

    _createChildComponents() {
        const pin1 = new Pin();
        const pin2 = new Pin();
        this.pinIds.push(pin1.id, pin2.id);
    }

    _drawChildNodes(parentNode) {
        this.endPin.moveTo({
            x: 140,
            y: 105
        });
        this.endPin.draw(parentNode);

        this.startPin.moveTo({
            x: 159,
            y: 105
        });
        this.startPin.draw(parentNode);

        Konva.Image.fromURL(StratPickup.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
        });
    }
}

export class Jack extends Component {
    constructor(state = {}) {
        super(state);
    }
}

export class MonoJack extends Jack {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/jack-mono.svg";
    }

    get tipPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    get sleevePin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    _createChildComponents() {
        const tipPin = new Pin();
        const sleevePin = new Pin();

        this.pinIds.push(tipPin.id, sleevePin.id);

        tipPin.on("voltageChanged", (value) => {
            console.debug(this.constructor.name, "got vc event from tip pin", tipPin.id, value)
            if (!sleevePin.hasVoltage())
                sleevePin.receiveVoltage(this.id, -value);
        });
        sleevePin.on("voltageChanged", (value) => {
            console.debug(this.constructor.name, "got vc event from sleevePin", sleevePin.id, value)
            if (!tipPin.hasVoltage())
                tipPin.receiveVoltage(this.id, -value);
        });
    }

    _drawChildNodes(parentNode) {
        this.tipPin.moveTo({
            x: 47,
            y: 10
        });
        this.tipPin.draw(parentNode);

        this.sleevePin.moveTo({
            x: 48,
            y: 31
        });
        this.sleevePin.draw(parentNode);

        Konva.Image.fromURL(MonoJack.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
        });
    }
}

export class Switch extends Component {

    constructor(state = {}) {
        super(state);
        this.state.actuatorState = this.state.actuatorState || 0;
        this._updatePinConnections();
    }

    static get actuatorNodeName() { return "switch-actuator"; }
    static get pinConnectionNodeName() { return "switch-pin-connection"; }

    get actuatorState() {
        return this.state.actuatorState;
    }

    _setActuatorState(val) {
        console.assert(val !== null, "val is required");
        this.state.actuatorState = val;
    }

    flip(componentNode) {
        console.assert(componentNode, "componentNode is required");
        this._flipActuatorAndSetState();
        this._reDrawActuator(componentNode);
        this._updatePinConnections();
        this._reDrawPinConnections(componentNode);
        DiagramState.instance.notifyNodeChanged(componentNode);
    }

    _flipActuatorAndSetState() {
        throw new Error("abstract method call");
    }

    _drawActuator(parentNode) {
        console.warn("_drawActuator not implemented");
    }

    _reDrawActuator(componentNode) {
        console.assert(componentNode, "componentNode is required");
        const actuatorNode = componentNode.findOne("." + Switch.actuatorNodeName);
        actuatorNode.destroy();
        this._drawActuator(componentNode);
    }

    _updatePinConnections() {
        console.warn("_updatePinConnections not implemented");
    }

    _drawPinConnections(componentNode) {
        console.warn("_drawPinConnections not implemented");
    }

    _getAllPins() {
        return [];
    }

    _reDrawPinConnections(componentNode) {
        componentNode.find("." + Switch.pinConnectionNodeName).forEach(connectionNode => {
            connectionNode.destroy();
        });

        this._drawPinConnections(componentNode);
    }
}

export class DPDTSwitch extends Switch {

    constructor(state = {}) {
        super(state);
    }

    static get _pinsStartAtX() {
        return 10;
    }

    static get _pinsStartAtY() {
        return 9;
    }

    get pin6() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get pin3() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get pin5() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get pin2() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }
    get pin4() { return DiagramState.instance.getComponent(this.pinIds.at(4)); }
    get pin1() { return DiagramState.instance.getComponent(this.pinIds.at(5)); }

    _createChildComponents() {
        const pinRows = 3;
        const pinCols = 2;
        for (let pr = 0; pr < pinRows; pr++) {
            for (let pc = 0; pc < pinCols; pc++) {

                const pinComponent = new Pin();
                this.pinIds.push(pinComponent.id);

                pinComponent.moveTo({
                    x: DPDTSwitch._pinsStartAtX + (pc * 22),
                    y: DPDTSwitch._pinsStartAtY + (pr * 15)
                });
            }
        }
    }

    _drawChildNodes(parentNode) {

        this.pin1.draw(parentNode);
        this.pin2.draw(parentNode);
        this.pin3.draw(parentNode);
        this.pin4.draw(parentNode);
        this.pin5.draw(parentNode);
        this.pin6.draw(parentNode);

        Konva.Image.fromURL(this.constructor.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
            this._drawActuator(parentNode);
            this._drawPinConnections(parentNode);
        });
    }

    _getAllPins() {
        return [this.pin1, this.pin2, this.pin3, this.pin4, this.pin5, this.pin6];
    }

    _drawPinConnections(parentNode) {
        this._getAllPins().forEach(pin => {
            if (pin.connectedPinId !== null && pin.isConnectedPinSource) {
                const pinShape = pin.findNode(parentNode);
                const pinPos = pinShape.position();
                const otherPin = DiagramState.instance.getComponent(pin.connectedPinId);
                const otherPinNode = otherPin.findNode(parentNode);
                const otherPinPos = otherPinNode.position();
                const connector = new Konva.Line({
                    name: Switch.pinConnectionNodeName,
                    strokeWidth: 5,
                    stroke: "#696969",
                    draggable: false,
                    points: [pinPos.x, pinPos.y, otherPinPos.x, otherPinPos.y],
                });
                parentNode.add(connector);
            }
        });
    }
}

export class DPDTOnOn extends DPDTSwitch {

    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/dpdt-blue.svg";
    }

    _getActuatorImageURLForState() {
        return this.actuatorState === 0 ? "/img/bat-small-left.svg" : "/img/bat-small-right.svg";
    }

    _drawActuator(parentNode) {
        Konva.Image.fromURL(this._getActuatorImageURLForState(), (actuatorNode) => {
            actuatorNode.position({ x: 0, y: -35 });
            actuatorNode.name(Switch.actuatorNodeName);
            this._applyGlobalStyling(actuatorNode);
            parentNode.add(actuatorNode);
        });
    }

    _flipActuatorAndSetState() {
        this._setActuatorState(this.actuatorState === 0 ? 1 : 0);
    }

    _updatePinConnections() {
        if (this.actuatorState === 0) {
            this.pin2.disconnectFromOtherPin(this.pin3);
            this.pin5.disconnectFromOtherPin(this.pin6);

            this.pin2.connectToOtherPin(this.pin1);
            this.pin5.connectToOtherPin(this.pin4);
        } else {
            this.pin2.disconnectFromOtherPin(this.pin1);
            this.pin5.disconnectFromOtherPin(this.pin4);

            this.pin2.connectToOtherPin(this.pin3);
            this.pin5.connectToOtherPin(this.pin6);
        }
    }
}

export class DPDTOnOffOn extends DPDTSwitch {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/dpdt-purple.svg";
    }
}

export class DPDTOnOnOn extends DPDTSwitch {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/dpdt-red.svg";
    }
}

export class Potentiometer extends Component {

    constructor(state = {}) {
        super(state);
        this._setupPinConnections();
    }

    static get ImageURL() {
        return "/img/pot-gr.svg";
    }

    static get _pinsStartAtX() {
        return 25;
    }

    static get _pinsStartAtY() {
        return 110;
    }

    get startPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get endPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get wiperPin() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get groundPin() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }

    _createChildComponents() {

        const pinCount = 3;

        for (let p = 0; p < pinCount; p++) {

            const pinComponent = new Pin();
            this.pinIds.push(pinComponent.id);

            pinComponent.moveTo({
                x: Potentiometer._pinsStartAtX + (p * 24),
                y: Potentiometer._pinsStartAtY,
            });
        }

        const groundPin = new Pin();
        this.pinIds.push(groundPin.id);
        groundPin.moveTo({
            x: 77, y: 64
        });
    }

    _setupPinConnections() {
        this.startPin.connectToOtherPin(this.wiperPin);
        this.wiperPin.connectToOtherPin(this.endPin);
    }

    _drawChildNodes(parentNode) {
        this.startPin.draw(parentNode);
        this.endPin.draw(parentNode);
        this.wiperPin.draw(parentNode);
        this.groundPin.draw(parentNode);
        Konva.Image.fromURL(Potentiometer.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
        });
    }
}

/**
 * Map of components for dynamic creation.
 */
export const componentClassMap = { Potentiometer, DPDTOnOn, DPDTOnOffOn, DPDTOnOnOn, Humbucker, StratPickup, MonoJack, Wire, Pin };