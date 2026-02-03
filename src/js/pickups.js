/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";
import { Component, Pin } from "./coreComponents.js";

class InductionCoil {

    constructor(name, startPin, endPin) {
        this._startPin = startPin;
        this._endPin = endPin;
        this._name = name;
    }

    induct() {
        console.info(`${this._name} received induct message`);

        //TODO: Fix this.
        // It should not send voltage if it is not grounded.
        // The current design relies on negative voltage coming back from the jack shield pin.
        // but the jack only sends negative voltage from the shield pin if it is receiving
        // positive voltage on the tip pin.
        // One idea is for the inductor to check if any of its pins "could" receive (-) voltage,
        // and then send the opposite (+) from the other pin.  Similar to the current design, but
        // instead of checking for actual voltage, check that it "could", by tracing the connections
        // to a ground (-) pin.
        // Alternatively, we can assume a jack is grounded on its shield pin, and always send (-) voltage
        // from it when we start the simulation.

        if (this._startPin.hasVoltage())
            this._endPin.receiveVoltage(null, -this._startPin.voltage, this._startPin.id);
        else if (this._endPin.hasVoltage())
            this._startPin.receiveVoltage(null, -this._endPin.voltage, this._endPin.id);
        else
            this._endPin.receiveVoltage(null, 1, this._startPin.id); // this is a hack to get things going
    }

    stopInducting() {
        console.info(`${this.fullName} received stopInducting message`);
        if (this._endPin.hasVoltage())
            this._endPin.receiveVoltage(this._startPin, 0);
    }
}

class Pickup extends Component {
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
        this._northCoil = null;
        this._southCoil = null;
    }

    static get ImageURL() {
        return "/img/pu-humbucker.svg";
    }

    pickUp() {

        console.info(`${this.fullName} received pickUp message`);
        this._northCoil = new InductionCoil(`${this.fullName}, North Coil`, this.northCoilFinishPin, this.northCoilStartPin);
        this._southCoil = new InductionCoil(`${this.fullName}, South Coil`, this.southCoilStartPin, this.southCoilFinishPin);
        this._northCoil.induct();
        this._southCoil.induct();
    }

    stopPickingUp() {
    }

    get northCoilStartPin() { return DiagramState.instance.getComponent(this.pinIds.at(0)); }
    get northCoilFinishPin() { return DiagramState.instance.getComponent(this.pinIds.at(1)); }
    get southCoilFinishPin() { return DiagramState.instance.getComponent(this.pinIds.at(2)); }
    get southCoilStartPin() { return DiagramState.instance.getComponent(this.pinIds.at(3)); }
    get groundPin() { return DiagramState.instance.getComponent(this.pinIds.at(4)); }

    _createChildComponents() {
        const northCoilStartPin = new Pin({ label: `${this.fullName} north coil start` });
        const northCoilFinishPin = new Pin({ label: `${this.fullName} north coil finish` });
        const southCoilFinishPin = new Pin({ label: `${this.fullName} south coil finish` });
        const southCoilStartPin = new Pin({ label: `${this.fullName} south coil start` });
        const groundPin = new Pin({ label: `${this.fullName} ground` });
        this.pinIds.push(northCoilStartPin.id, northCoilFinishPin.id, southCoilFinishPin.id, southCoilStartPin.id, groundPin.id);
    }

    _drawChildNodes(parentNode) {

        this.northCoilStartPin.moveTo({
            x: 6,
            y: 164
        });
        this.northCoilStartPin.draw(parentNode);

        this.northCoilFinishPin.moveTo({
            x: 19,
            y: 181
        });
        this.northCoilFinishPin.draw(parentNode);

        this.southCoilFinishPin.moveTo({
            x: 38,
            y: 182
        });
        this.southCoilFinishPin.draw(parentNode);

        this.southCoilStartPin.moveTo({
            x: 55,
            y: 172
        });
        this.southCoilStartPin.draw(parentNode);

        this.groundPin.moveTo({
            x: 62,
            y: 155
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
        console.info(`${this.fullName} received pickUp message`);
        this._coil = new InductionCoil(`${this.fullName} Coil`, this.startPin, this.endPin);
        this._coil.induct();
    }

    stopPickingUp() {
        console.info(`${this.fullName} received stopPickingUp message`);
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