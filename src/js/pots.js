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
        });
    }
}