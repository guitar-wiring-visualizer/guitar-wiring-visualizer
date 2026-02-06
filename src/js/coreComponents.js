/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import EventEmitter from "./eventEmitter.js";
import { DiagramState, TOOL_MODE_WIRE } from "./diagram.js";
import Geometry from "./geometry.js";

/**
 * Base class for all components.
 * All component instances are tracked in the DiagramState.
 * Each compoment stores its persistable state in an internal state object.  All other instance fields will be transient.
 * Each component renders itself as a Konva.Node.
 * @abstract
 */
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

    get fullName() {
        if (this.state.label) {
            return `${this.state.label} ${this.constructor.name} (${this.id})`;
        } else {
            return `${this.constructor.name} (${this.id})`;
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

        const rootNode = this._createRootNode();
        containerNode.add(rootNode);
        this._drawChildNodes(rootNode);

        if (DiagramState.instance.debugMode)
            this._drawIDLabel(rootNode);

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
                fill: 'yellow',
                pointerDirection: 'down',
                pointerWidth: 10,
                pointerHeight: 10,
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
        } else if (rootNode.getClassName() === "Line") {
            simpleLabel.x(rootNode.points().at(2));
            simpleLabel.y(rootNode.points().at(3));
            rootNode.getLayer().add(simpleLabel);
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

        this._removeAttachedWires(layer);

        const node = this.findNode(layer);
        node.destroy();

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
            console.debug("onevent", e);
            if (DiagramState.instance.toolMode === TOOL_MODE_WIRE) {
                return;
            }
            this.state.nodeAttrs = e.target.attrs;
            this._moveAttachedWires(componentNode);
        });

        componentNode.on("dragstart", (e) => {
            console.debug("onevent", e);
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
            rotation: this.nodeAttrs.rotation,
            scaleX: this.nodeAttrs.scaleX,
            scaleY: this.nodeAttrs.scaleY,
            skewX: this.nodeAttrs.skewX,
            skewY: this.nodeAttrs.skewY,
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
        console.debug("remove attached wires");
        const layer = node.getLayer();
        this.pinIds.forEach(pinId => {
            const pin = DiagramState.instance.getComponent(pinId);
            const pinNode = pin.findNode(layer);
            const pinPos = pinNode.getAbsolutePosition();
            const wiresStartingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.startPinId === pinId
            });
            wiresStartingOnPin.forEach(wire => {
                wire.updateStartPoint([pinPos.x, pinPos.y]);
                wire.reDraw(layer);
            });
            const wiresEndingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.endPinId === pinId
            });
            wiresEndingOnPin.forEach(wire => {
                wire.updateEndPoint([pinPos.x, pinPos.y]);
                wire.reDraw(layer);
            });
        });
    }

    _removeAttachedWires(layer) {
        console.debug("remove attached wires");
        this.pinIds.forEach(pinId => {
            const wiresStartingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.startPinId === pinId
            });
            wiresStartingOnPin.forEach(wire => {
                wire.removeFromDiagram(layer);
            });
            const wiresEndingOnPin = DiagramState.instance.findComponentsOfType(Wire, (w) => {
                return w.endPinId === pinId
            });
            wiresEndingOnPin.forEach(wire => {
                wire.removeFromDiagram(layer);
            });
        });
    }
}

/**
 * Pin. Represents a connection point on a component.
 * Pins are created as child components on other components.
 * Can be connected to 0-* wires.
 * Can also be connected to 0-1 other pin.
 */
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
        console.info(`${this.fullName} received voltage ${value} from wire ${DiagramState.instance.getComponent(fromWireId)?.fullName}, from pin ${DiagramState.instance.getComponent(fromPinId)?.fullName}`);

        if (this.voltage === value) {
            // avoid infinite loop
            console.debug(`${this.fullName} already has voltage ${value}. Not propagating`);
            return;
        }

        if (this.voltage < 0 && value > 0) {
            console.debug(`${this.fullName} grounded. Not propagating.`);
            return;
        }

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

/**
 * Wire Component.
 * Connects to exactly 2 pins, for passing voltage between pins.
 * Renders as a Konva.Line with 6 points representing start, middle and end coordinates.
 */
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
        console.debug("moved startpoint", this.startPoint);
        this._updateMidPoint();
    }

    /**
     * Updates the end point of the wire.
     * @param {[]} newPoint a flat array of the x and y integers.
     */
    updateEndPoint(newPoint) {
        console.assert(newPoint, "newPoint is required");
        console.assert(Array.isArray(newPoint) && newPoint.length === 2, "newPoint must be a flat array of two values");
        this.state.endPoint = newPoint;
        console.debug("moved endpoint", this.endPoint);
        this._updateMidPoint();
    }

    /**
     * Updates the midpoint to a reasonable position, preserving the spline.
     * This needs to be called AFTER moving the start or end points.
     */
    _updateMidPoint() {
        const trueMidpoint = Geometry.midPoint(this.startPoint, this.endPoint);
        console.debug("trueMidpoint", trueMidpoint);
        const midPointVector = Geometry.translationVector(this.midPoint, trueMidpoint);
        const reductionFactor = this._getMidPointVectorReduction(this.startPoint, this.endPoint);
        console.debug({ reductionFactor });
        const reducedVector = Geometry.reduceVector(midPointVector, reductionFactor);
        this.state.midPoint = Geometry.applyVector(reducedVector, this.midPoint);
        console.debug("moved midpoint", this.state.midPoint);
    }

    /**
     * Gets a number for midpoint translation vector reduction based on the distance from startpoint to endpoint.
     *
     * This is so we can move a midpoint to almost where it would normally move to based on the vector, but slightly less
     * in order to approximate/preserve the curve of the original spline.
     *
     * The greater the distance, the more reduction.
     * Longer lines should keep more of their curve, and short lines get less curvy.
     */
    _getMidPointVectorReduction(startPoint, endPoint) {
        const distance = Geometry.distance(startPoint, endPoint);
        console.debug({ distance });

        let amount;
        if (distance > 300)
            amount = 2;
        else if (distance > 100)
            amount = 1.5;
        else
            amount = 1.25;

        return amount;
    }

    moveTo(position) {
        console.warn("_moveTo called on a Wire.  You probably want to call updateStartPoint or updateEndpoint instead.");
        super.moveTo(position);
    }

    get voltage() { return this._voltage };

    _setVoltage(val) { this._voltage = val; }

    resetVoltage() {
        this._setVoltage(0);
    }

    receiveVoltage(fromId, value) {
        console.info(`${this.fullName} received voltage ${value} from pin ${DiagramState.instance.getComponent(fromId)?.fullName}`);
        if (this.voltage === value) {
            console.debug(`${this.fullName} already has voltage ${value}. not propagating`);
            return;
        }

        this._setVoltage(value);
        this._pinVoltageIsFrom = DiagramState.instance.getComponent(fromId);
        const targetPinId = this.startPinId === fromId ? this.endPinId : this.startPinId;
        const targetPin = DiagramState.instance.getComponent(targetPinId);
        targetPin.receiveVoltage(this.id, value, fromId);
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
    _createRootNode() {

        const wirePoints = [...this.startPoint, ...this.midPoint, ...this.endPoint];

        console.debug("wire creating", this.id, wirePoints);

        const line = new Konva.Line({
            points: wirePoints,
            stroke: this.color,
            strokeWidth: 5,
            lineCap: 'butt',
            lineJoin: 'round',
            draggable: Wire.IsDraggable,
            tension: .7, // higher tension == more curvy
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
        this.state.color = color;
        node.stroke(color);
        DiagramState.instance.notifyNodeChanged(node);
    }
}

/**
 * Base class for components that have exactly two pins
 * and have behavior for passing voltage between the pins.
 * @abstract
 */
export class TwoPinComponenet extends Component {
    constructor(state) {
        super(state);
        this._setupPinConnections();
    }

    static get _pin1Position() { throw new Error("abstract method call"); }
    static get _pin2Position() { throw new Error("abstract method call"); }

    get pin1() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get pin2() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    _createChildComponents() {
        const pin1 = new Pin();
        pin1.moveTo(this.constructor._pin1Position);
        this.pinIds.push(pin1.id);
        const pin2 = new Pin();
        pin2.moveTo(this.constructor._pin2Position);
        this.pinIds.push(pin2.id);
    }

    _drawChildNodes(parentNode) {
        this.pin1.draw(parentNode);
        this.pin2.draw(parentNode);
        Konva.Image.fromURL(this.constructor.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
        });
    }

    /**
     * Allows concrete Component type to set up how to pass voltage between pins.
     */
    _setupPinConnections() {
    }
}

/**
 * Base class for two-pin components that only allow positive voltage to pass through them.
 * @abstract
 */
export class TwoPinPositivePassThroughComponent extends TwoPinComponenet {
    constructor(state) {
        super(state);
        this._setupPinConnections();
    }

    _setupPinConnections() {
        this.pin1.on("voltageChanged", (val) => {
            console.info(`${this.fullName} received voltageChanged event with value ${val} from ${this.pin1.fullName}`);
            if (val > 0) {
                if (!this.pin2.hasVoltage())
                    this.pin2.receiveVoltage(null, val, this.pin1.id);
            }
        });
        this.pin2.on("voltageChanged", (val) => {
            console.info(`${this.fullName} received voltageChanged event with value ${val} from ${this.pin2.fullName}`);
            if (val > 0) {
                if (!this.pin1.hasVoltage())
                    this.pin1.receiveVoltage(null, val, this.pin2.id);
            }
        });
    }
}

