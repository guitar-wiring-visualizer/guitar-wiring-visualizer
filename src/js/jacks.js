/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";
import { Component, Pin } from "./coreComponents.js";

/**
 * Base class for jacks.
 * @abstract
 */
class Jack extends Component {
    constructor(state = {}) {
        super(state);
    }
}

export class MonoJack extends Jack {
    constructor(state = {}) {
        super(state);

        this.tipPin.on("voltageChanged", (value) => {
            console.debug(this.fullName, "got voltageChanged event from tip pin", this.tipPin.id, value)
            if (!this.sleevePin.hasVoltage())
                this.sleevePin.receiveVoltage(null, -value, this.tipPin.id);
        });
        this.sleevePin.on("voltageChanged", (value) => {
            console.debug(this.fullName, "got voltageChanged event from sleevePin", this.sleevePin.id, value)
            if (!this.tipPin.hasVoltage())
                this.tipPin.receiveVoltage(null, -value, this.sleevePin.id);
        });
    }

    static get ImageURL() {
        return "/img/jack-mono.svg";
    }

    get tipPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }

    get sleevePin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }

    _createChildComponents() {
        const tipPin = new Pin({ label: `${this.fullName} tip` });
        const sleevePin = new Pin({ label: `${this.fullName} sleeve` });

        this.pinIds.push(tipPin.id, sleevePin.id);
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