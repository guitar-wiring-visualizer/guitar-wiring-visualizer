/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";
import { Component, Pin } from "./coreComponents.js";

export class Potentiometer extends Component {

    constructor(state = {}) {
        super(state);

        this.state.rotation = this.state.rotation || -1;
        this._updatePinConnections();
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

    static get _centerPoint() {
        return [50, 50];
    }

    static get pinConnectionNodeName() { return "pot-pin-connection"; }

    get rotation() { return this.state.rotation; }
    set rotation(val) {
        console.assert(val, "val is required.");
        this.state.rotation = val;
        this._updatePinConnections();
    }

    get pin3() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    get wiperPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    get pin1() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }

    get groundPin() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }

    rotate(componentNode) {
        console.assert(componentNode, "componentNode is required");
        this.rotation = -this.rotation;
        console.debug(`${this.fullName} changed rotation to ${this.rotation}`);
        this._updatePinConnections();
        this._reDrawPinConnections(componentNode);
        DiagramState.instance.notifyNodeChanged(componentNode);
    }

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

    _updatePinConnections() {
        this.wiperPin.disconnectFromOtherPin();

        if (this.rotation === -1) {
            this.wiperPin.connectToOtherPin(this.pin3);
        } else if (this.rotation === 1) {
            this.wiperPin.connectToOtherPin(this.pin1);
        } else {
            console.warn(`${this.fullName}: invalid rotation ${this.rotation}`);
        }

    }

    _drawChildNodes(parentNode) {
        this.pin1.draw(parentNode);
        this.pin3.draw(parentNode);
        this.wiperPin.draw(parentNode);
        this.groundPin.draw(parentNode);
        Konva.Image.fromURL(Potentiometer.ImageURL, (componentNode) => {
            this._applyGlobalStyling(componentNode);
            parentNode.add(componentNode);
            this._getPinNodes(parentNode).forEach(n => n.zIndex(componentNode.zIndex()));
            this._drawPinConnections(parentNode);
        });
    }

    _reDrawPinConnections(componentNode) {
        componentNode.find("." + Potentiometer.pinConnectionNodeName).forEach(connectionNode => {
            connectionNode.destroy();
        });
        this._drawPinConnections(componentNode);
    }

    _getOuterPinById(id) {
        if (id === this.pin1.id)
            return this.pin1;
        else if (id === this.pin3.id);
        return this.pin3;
    }

    _drawPinConnections(parentNode) {

        const wiperPos = this.wiperPin.findNode(parentNode).position();
        const connectedPin = this._getOuterPinById(this.wiperPin.connectedPinId)
        const connectedPinPos = connectedPin.findNode(parentNode).position();

        const wiperOffset = 16
        const outerPinOffset = wiperOffset + 7;

        const linePoints = [
            wiperPos.x,
            wiperPos.y - wiperOffset,
            ...this.constructor._centerPoint,
            connectedPinPos.x,
            connectedPinPos.y - outerPinOffset
        ];

        const connector = new Konva.Line({
            name: Potentiometer.pinConnectionNodeName,
            strokeWidth: 5,
            stroke: "#939393",
            lineJoin: 'round',
            lineCap: 'round',
            points: linePoints
        });

        parentNode.add(connector);

    }
}