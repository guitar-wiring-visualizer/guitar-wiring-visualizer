/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";

import { Component, Pin } from "./coreComponents.js";

/**
 * Base class for switches.
 * @abstract
 */
class Switch extends Component {

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

    _getValidActuatorStates() {
        return [0, 1];
    }

    _setActuatorState(val) {
        console.assert(val !== null, "val is required");
        if (!this._getValidActuatorStates().includes(val))
            throw new Error(`invalid actuator state ${val}`);
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
/**
 * Base class for 8-pin blade switches
 * @abstract
 */
export class EightPinBladeSwitch extends Switch {
    constructor(state = {}) {
        super(state);
    }

    get pinA1() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get pinA2() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get pinA3() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get pinA0() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }
    get pinB0() { return DiagramState.instance.getComponent(this.pinIds.at(4)); }
    get pinB1() { return DiagramState.instance.getComponent(this.pinIds.at(5)); }
    get pinB2() { return DiagramState.instance.getComponent(this.pinIds.at(6)); }
    get pinB3() { return DiagramState.instance.getComponent(this.pinIds.at(7)); }

    static get ImageURL() {
        return "/img/blade-switch.svg";
    }

    _getAllPins() {
        return [this.pinA0, this.pinA1, this.pinA2, this.pinA3, this.pinB0, this.pinB1, this.pinB2, this.pinB3];
    }

    _createChildComponents() {
        const pina1 = new Pin();
        this.pinIds.push(pina1.id);
        pina1.moveTo({
            x: 10, y: 30
        });

        const pina2 = new Pin();
        this.pinIds.push(pina2.id);
        pina2.moveTo({
            x: 9, y: 70
        });

        const pina3 = new Pin();
        this.pinIds.push(pina3.id);
        pina3.moveTo({
            x: 9, y: 110
        });

        const pina0 = new Pin();
        this.pinIds.push(pina0.id);
        pina0.moveTo({
            x: 9, y: 149
        });

        const pinb0 = new Pin();
        this.pinIds.push(pinb0.id);
        pinb0.moveTo({
            x: 49, y: 16
        });

        const pinb1 = new Pin();
        this.pinIds.push(pinb1.id);
        pinb1.moveTo({
            x: 49, y: 56
        });

        const pinb2 = new Pin();
        this.pinIds.push(pinb2.id);
        pinb2.moveTo({
            x: 49, y: 95
        });

        const pinb3 = new Pin();
        this.pinIds.push(pinb3.id);
        pinb3.moveTo({
            x: 49, y: 134
        });
    }

    async _drawChildNodes(parentNode) {
        this.pinA0.draw(parentNode);
        this.pinA1.draw(parentNode);
        this.pinA2.draw(parentNode);
        this.pinA3.draw(parentNode);
        this.pinB0.draw(parentNode);
        this.pinB1.draw(parentNode);
        this.pinB2.draw(parentNode);
        this.pinB3.draw(parentNode);

        Konva.Image.fromURL(this.constructor.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
            this._drawActuator(parentNode);
            this._drawPinConnections(parentNode);
            return Promise.resolve();
        });
    }

    _drawConnectedPinMarker(pinPosition, fill, parentNode) {
        const marker = new Konva.Rect({
            name: Switch.pinConnectionNodeName,
            opacity: DiagramState.instance.showInternals ? .60 : 0,
            width: 16,
            height: 16,
            x: pinPosition.x - 8,
            y: pinPosition.y - 8,
            fill: fill,
            draggable: false,
            perfectDrawEnable: false,
        });
        parentNode.add(marker);
    }

    _calculateLabelDrawPosition(rootNode) {
        return { x: 0, y: -20 };
    }
}

export class ThreeWayBlade extends EightPinBladeSwitch {
    constructor(state = {}) {
        super(state);
    }

    _getValidActuatorStates() {
        return [-1, 0, 1];
    }

    _flipActuatorAndSetState() {
        let nextState;

        if (this.actuatorState === -1) {
            nextState = 0;
        } else if (this.actuatorState === 0) {
            if (this._prevActuatorState === -1)
                nextState = 1
            else
                nextState = -1
        }
        else if (this.actuatorState === 1) {
            nextState = 0;
        }

        this._prevActuatorState = this.actuatorState;
        this._setActuatorState(nextState);
    }

    _drawActuator(parentNode) {
        Konva.Image.fromURL(this._getActuatorImageURLForState(), (actuatorNode) => {
            actuatorNode.position({ x: 70, y: -30 });
            actuatorNode.name(Switch.actuatorNodeName);
            actuatorNode.opacity(DiagramState.instance.showActuators ? 1 : 0);
            this._applyGlobalStyling(actuatorNode);
            parentNode.add(actuatorNode);
        });
    }

    _getActuatorImageURLForState() {
        if (this.actuatorState === -1)
            return "/img/blade-3-up.svg"
        else if (this.actuatorState === 0)
            return "/img/blade-3-center.svg"
        else if (this.actuatorState === 1)
            return "/img/blade-3-down.svg";
    }

    _updatePinConnections() {
        this.pinA0.disconnectFromOtherPin();
        this.pinB0.disconnectFromOtherPin();
        if (this.actuatorState === -1) {
            this.pinA0.connectToOtherPin(this.pinA3);
            this.pinB0.connectToOtherPin(this.pinB3);
        } else if (this.actuatorState === 0) {
            this.pinA0.connectToOtherPin(this.pinA2);
            this.pinB0.connectToOtherPin(this.pinB2);
        } else if (this.actuatorState === 1) {
            this.pinA0.connectToOtherPin(this.pinA1);
            this.pinB0.connectToOtherPin(this.pinB1);
        }
    }

    _drawPinConnections(parentNode) {
        this._drawMakersForPin(this.pinA0, "#6d87ce", parentNode);
        this._drawMakersForPin(this.pinB0, "#cbc25c", parentNode);
    }

    _drawMakersForPin(pin, fill, parentNode){
        if (pin.connectedPinId !== null) {
            const pinShape = pin.findNode(parentNode);
            const pinPos = pinShape.position();
            this._drawConnectedPinMarker(pinPos, fill, parentNode);

            const otherPin = DiagramState.instance.getComponent(pin.connectedPinId);
            const otherPinNode = otherPin.findNode(parentNode);
            const otherPinPos = otherPinNode.position();
            this._drawConnectedPinMarker(otherPinPos, fill, parentNode);
        }
    }
}

export class ThreeWayToggle extends Switch {

    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/toggle-switch-back.svg";
    }

    get pin1() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get pin2() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get pin3() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get pin4() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }
    get groundPin() { return DiagramState.instance.getComponent(this.pinIds.at(4)); }


    _getValidActuatorStates() {
        return [-1, 0, 1];
    }

    _createChildComponents() {

        const pin1 = new Pin();
        this.pinIds.push(pin1.id);
        pin1.moveTo({
            x: 2, y: 14
        });

        const pin2 = new Pin();
        this.pinIds.push(pin2.id);
        pin2.moveTo({
            x: 2, y: 44
        });

        const pin3 = new Pin();
        this.pinIds.push(pin3.id);
        pin3.moveTo({
            x: 122, y: 20
        });

        const pin4 = new Pin();
        this.pinIds.push(pin4.id);
        pin4.moveTo({
            x: 122, y: 38
        });

        const groundPin = new Pin();
        this.pinIds.push(groundPin.id);
        groundPin.moveTo({
            x: 17, y: 29
        });

    }

    async _drawChildNodes(parentNode) {
        this.pin1.draw(parentNode);
        this.pin2.draw(parentNode);
        this.pin3.draw(parentNode);
        this.pin4.draw(parentNode);
        this.groundPin.draw(parentNode);

        Konva.Image.fromURL(this.constructor.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
            this._drawActuator(parentNode);
            this._drawPinConnections(parentNode);
            return Promise.resolve();
        });
    }

    _updatePinConnections() {
        this.pin1.disconnectFromOtherPin();
        this.pin2.disconnectFromOtherPin();
        if (this.actuatorState === -1) {
            this.pin1.connectToOtherPin(this.pin3);
        } else if (this.actuatorState === 0) {
            this.pin1.connectToOtherPin(this.pin3);
            this.pin2.connectToOtherPin(this.pin4);
        } else if (this.actuatorState === 1) {
            this.pin2.connectToOtherPin(this.pin4);
        }
    }

    _getActuatorImageURLForState() {
        if (this.actuatorState === -1)
            return "/img/bat-small-left.svg"
        else if (this.actuatorState === 0)
            return "/img/bat-small-center.svg"
        else if (this.actuatorState === 1)
            return "/img/bat-small-right.svg";
    }

    _flipActuatorAndSetState() {
        let nextState;

        if (this.actuatorState === -1) {
            nextState = 0;
        } else if (this.actuatorState === 0) {
            if (this._prevActuatorState === -1)
                nextState = 1
            else
                nextState = -1
        }
        else if (this.actuatorState === 1) {
            nextState = 0;
        }

        this._prevActuatorState = this.actuatorState;
        this._setActuatorState(nextState);
    }

    _drawActuator(parentNode) {
        Konva.Image.fromURL(this._getActuatorImageURLForState(), (actuatorNode) => {
            actuatorNode.position({ x: 43, y: -35 });
            actuatorNode.name(Switch.actuatorNodeName);
            actuatorNode.opacity(DiagramState.instance.showActuators ? 1 : 0);
            this._applyGlobalStyling(actuatorNode);
            parentNode.add(actuatorNode);
        });
    }

    _getAllPins() {
        return [this.pin1, this.pin2, this.pin3, this.pin4, this.groundPin];
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
                    opacity: DiagramState.instance.showInternals ? 1 : 0,
                    strokeWidth: 2,
                    stroke: "#a6a6a6",
                    draggable: false,
                    perfectDrawEnable: false,
                    points: [pinPos.x, pinPos.y, otherPinPos.x, otherPinPos.y],
                });
                parentNode.add(connector);
            }
        });
    }

    _calculateLabelDrawPosition(rootNode) {
        return { x: 25, y: 70 };
    }

}

/**
 * Base class for DPDT switches
 * @abstract
 */
class DPDTSwitch extends Switch {

    constructor(state = {}) {
        super(state);
    }

    static get _pinsStartAtX() {
        return 10;
    }

    static get _pinsStartAtY() {
        return 9;
    }

    _calculateLabelDrawPosition(rootNode) {
        return { x: 50, y: 20 };
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

    async _drawChildNodes(parentNode) {

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
            return Promise.resolve();
        });
    }

    _getActuatorImageURLForState() {
        throw new Error("abstract method call");
    }

    _drawActuator(parentNode) {
        Konva.Image.fromURL(this._getActuatorImageURLForState(), (actuatorNode) => {
            actuatorNode.position({ x: 0, y: -35 });
            actuatorNode.name(Switch.actuatorNodeName);
            actuatorNode.opacity(DiagramState.instance.showActuators ? 1 : 0);
            this._applyGlobalStyling(actuatorNode);
            parentNode.add(actuatorNode);
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
                    opacity: DiagramState.instance.showInternals ? 1 : 0,
                    strokeWidth: 5,
                    stroke: "#696969",
                    draggable: false,
                    perfectDrawEnable: false,
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

    _flipActuatorAndSetState() {
        this._setActuatorState(this.actuatorState === 0 ? 1 : 0);
    }

    _updatePinConnections() {
        if (this.actuatorState === 0) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();

            this.pin2.connectToOtherPin(this.pin1);
            this.pin5.connectToOtherPin(this.pin4);
        } else {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();

            this.pin2.connectToOtherPin(this.pin3);
            this.pin5.connectToOtherPin(this.pin6);
        }
    }
}

/**
 * Base class for 3-position DPDT switches.
 * @abstract
 */
class DPDT3Position extends DPDTSwitch {
    constructor(state = {}) {
        super(state);

        this._prevActuatorState = this.actuatorState === -1 ? 0 : this.actuatorState === 1 ? 0 : -1;
    }

    _getValidActuatorStates() {
        return [-1, 0, 1];
    }

    _getActuatorImageURLForState() {
        if (this.actuatorState === -1)
            return "/img/bat-small-left.svg"
        else if (this.actuatorState === 0)
            return "/img/bat-small-center.svg"
        else if (this.actuatorState === 1)
            return "/img/bat-small-right.svg";
    }

    _flipActuatorAndSetState() {
        let nextState;

        if (this.actuatorState === -1) {
            nextState = 0;
        } else if (this.actuatorState === 0) {
            if (this._prevActuatorState === -1)
                nextState = 1
            else
                nextState = -1
        }
        else if (this.actuatorState === 1) {
            nextState = 0;
        }

        this._prevActuatorState = this.actuatorState;
        this._setActuatorState(nextState);
    }
}

export class DPDTOnOffOn extends DPDT3Position {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/dpdt-purple.svg";
    }

    _updatePinConnections() {
        if (this.actuatorState === -1) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
            this.pin2.connectToOtherPin(this.pin3);
            this.pin5.connectToOtherPin(this.pin6)
        } else if (this.actuatorState === 0) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
        } else if (this.actuatorState === 1) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
            this.pin2.connectToOtherPin(this.pin1);
            this.pin5.connectToOtherPin(this.pin4);
        }
    }
}

export class DPDTOnOnOn extends DPDT3Position {
    constructor(state = {}) {
        super(state);
    }

    static get ImageURL() {
        return "/img/dpdt-red.svg";
    }

    _updatePinConnections() {
        if (this.actuatorState === -1) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
            this.pin2.connectToOtherPin(this.pin3);
            this.pin5.connectToOtherPin(this.pin6)
        } else if (this.actuatorState === 0) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
            this.pin2.connectToOtherPin(this.pin3);
            this.pin5.connectToOtherPin(this.pin4)
        } else if (this.actuatorState === 1) {
            this.pin2.disconnectFromOtherPin();
            this.pin5.disconnectFromOtherPin();
            this.pin2.connectToOtherPin(this.pin1);
            this.pin5.connectToOtherPin(this.pin4);
        }
    }
}