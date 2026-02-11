/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

/**
 * All the event types.
 */
export const Events = Object.freeze({
    ComponentAdded: "component_added",
    ComponentRemoved: "component_removed",
    ComponentMoved: "component_moved",
    ComponentDrawn: "component_drawn",
    ComponentRedrawn: "component_redrawn",
    VoltageChanged: "voltage_changed",
    WireColorChanged: "wire_color_changed",
    PotRotated: "pot_rotated",
    SwitchFlipped: "switch_flipped"
});

/**
 * Base for classes that emit events, and can register and unregister listeners.
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        this._validateEvent(event);
        this._validateListener(listener);
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return () => this.off(event, listener);
    }

    off(event, listener) {
        this._validateEvent(event);
        this._validateListener(listener);
        if (!this.events[event]) return;
        const index = this.events[event].indexOf(listener);
        if (index !== -1) this.events[event].splice(index, 1);
    }

    _emit(event, ...args) {
        this._validateEvent(event);
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }

    _isValidEvent(event) {
        return typeof event === "string" && Object.values(Events).includes(event);
    }

    _isValidListener(listener) {
        return typeof listener === "function";
    }

    _validateEvent(event) {
        if (!this._isValidEvent(event))
            throw new Error(`invalid event ${event}`);
    }

    _validateListener(listener) {
        if (!this._isValidListener(listener))
            throw new Error(`invalid listener ${listener}`);
    }
}

/**
 * Mediator for decoupling emitters from listeners.
 */
export class EventDispatcher extends EventEmitter {

    constructor() {
        if (EventDispatcher.instance)
            return EventDispatcher.instance;

        super();

        EventDispatcher.instance = this;
    }

    dispatch(event, ...args) {
        console.debug("dispatching", event);
        this._emit(event, ...args);
    }
}
