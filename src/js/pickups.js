/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";
import { Component, Pin } from "./coreComponents.js";

/**
 * Represents 1 coil in a pickup, which handles generating current.
 * This is not a component itself, but is instantiated transiently
 * by pickups when induction is needed.
 */
class InductionCoil {

    constructor(name, startPin, endPin) {
        this._startPin = startPin;
        this._endPin = endPin;
        this._name = name;

        this._startPinListenerOff = null;
        this._endPinListenerOff = null;
    }

    induct() {
        console.info(`${this._name} received induct message`);
        this._unsubscribeToEvents();
        this._subscribeToEvents();
    }

    stopInducting() {
        console.info(`${this._name} received stopInducting message`);
        this._unsubscribeToEvents();
    }

    _unsubscribeToEvents() {
        if (typeof this._endPinListenerOff === "function")
            this._endPinListenerOff();
        if (typeof this._startPinListenerOff === "function")
            this._startPinListenerOff();
    }

    _subscribeToEvents() {
        this._startPinListenerOff = this._startPin.on("voltageChanged", (_) => {
            if (this._startPin.hasVoltage() && !this._endPin.hasVoltage()) {
                console.info(`${this._name} start pin has voltage, sending to end pin`);
                this._endPin.receiveVoltage({ value: 1, fromPinId: this._startPin.id });
            }
        });

        this._endPinListenerOff = this._endPin.on("voltageChanged", (_) => {
            if (this._endPin.hasVoltage() && !this._startPin.hasVoltage()) {
                console.info(`${this._name} end pin has voltage, sending to start pin`);
                this._startPin.receiveVoltage({ value: 1, fromPinId: this._endPin.id });
            }
        });
    }
}

/**
 * Base class for pickups.
 * @abstract
 */
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

        this._southCoil = new InductionCoil(`${this.fullName}, South Coil`, this.southCoilFinishPin, this.southCoilStartPin);
        this._southCoil.induct();

        this._northCoil = new InductionCoil(`${this.fullName}, North Coil`, this.northCoilStartPin, this.northCoilFinishPin);
        this._northCoil.induct();
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

    async _drawChildNodes(parentNode) {

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
            return Promise.resolve();
        });
    }

    _calculateLabelDrawPosition(rootNode) {
        return { x: 40, y: -20 };
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
        const pin1 = new Pin({ label: `${this.fullName} coil end pin` });
        const pin2 = new Pin({ label: `${this.fullName} coil start pin` });
        this.pinIds.push(pin1.id, pin2.id);
    }

    async _drawChildNodes(parentNode) {
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
            return Promise.resolve();
        });
    }
}