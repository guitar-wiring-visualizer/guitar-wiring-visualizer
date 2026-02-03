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