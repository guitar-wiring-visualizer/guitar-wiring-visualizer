/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { componentClassMap } from "./components.js";
import { CompressionType, getCompressor } from "./compression.js";

export const ToolMode = Object.freeze({
    Select: 0,
    Wire: 1
});

export const WireColors = Object.freeze({
    Black: "black",
    Red: "red",
    Yellow: "yellow",
    Green: "green",
    Blue: "blue"
});

export const WIRE_COLOR_DEFAULT = WireColors.Black;

/**
 * Tracks all component instances on the diagram.
 * Can serialize and deserialize entire state of all components on the diagram.
 */
export class DiagramState {

    constructor(options = {}) {
        if (DiagramState.instance) {
            return DiagramState.instance;
        }

        this._lastIssuedId = 0;

        this._componenetMap = {};

        this.showConnectors = false;
        this.showActuators = true;
        this.showInternals = true;
        this.showLabels = true;
        this.toolMode = ToolMode.Select;
        this.wireToolColor = WIRE_COLOR_DEFAULT;
        this.debugMode = options.debugMode || false;

        DiagramState.instance = this;
    }

    getNewIdentity() {
        return ++this._lastIssuedId;
    }

    registerComponent(componentInstance) {
        this._addToComponentMap(componentInstance.id, componentInstance);
    }

    getComponent(id) {
        return this._componenetMap[parseInt(id, 10)];
    }

    _addToComponentMap(id, componentInstance) {
        this._componenetMap[id] = componentInstance;
    }

    _allComponentInstances() {
        return Object.values(this._componenetMap);
    }

    findComponents(predicate) {
        return this._allComponentInstances().filter(predicate);
    }

    findComponentsOfType(type, predicate) {
        return this.findComponents((c) => c.constructor === type && predicate(c));
    }

    removeComponentById(componentId) {
        this._removeComponentInternal(componentId);
    }

    _removeComponentInternal(componentId) {
        const component = this.getComponent(componentId);
        if (component) {
            component.pinIds?.forEach(pinId => {
                this._removeComponentInternal(pinId);
            });
            delete this._componenetMap[component.id];
        }
    }

    removeAllComponents() {
        const allIds = Object.keys(this._componenetMap);
        allIds.forEach(componentId => {
            this._removeComponentInternal(componentId);
        });
    }

    async serializeState() {
        if (this._allComponentInstances().length === 0) {
            return "";
        }
        const diagramState = {
            componentStates: this._allComponentInstances().map(component => {
                return component.state;
            }),
        }
        console.debug({ data: diagramState });

        const compressor = await getCompressor(CompressionType.BROTLI);

        const encoded = await compressor.compress(JSON.stringify(diagramState));
        console.debug({ encoded });

        return encoded;
    }

    async loadState(encodedDataString) {
        console.debug({ data: encodedDataString });

        let compressor = await getCompressor(CompressionType.BROTLI);

        let decodedDataString;
        try {
            decodedDataString = await compressor.decompress(encodedDataString);
        } catch (err) {
            console.warn("brotli decompression failed, trying gzip.", err);
            compressor = await getCompressor(CompressionType.GZIP);
            decodedDataString = await compressor.decompress(encodedDataString);
        }
        console.debug({ decoded: decodedDataString });

        const deserializedState = JSON.parse(decodedDataString);
        console.debug({ deserializedState: deserializedState });

        // keep track of ids
        const idsDeserialized = []

        // do all the pins first, since other components depend on them
        deserializedState.componentStates.forEach(state => {
            const className = state.className;
            if (className === "Pin") {
                idsDeserialized.push(state.id);
                console.debug("recreating", className, state.id);
                const componentInstance = new componentClassMap[className](state);
                this.registerComponent(componentInstance);
            }

        });

        // rest of the compoents
        deserializedState.componentStates.forEach(state => {
            const className = state.className;
            if (className !== "Pin") {
                idsDeserialized.push(state.id);
                console.debug("recreating", className, state.id);
                const componentInstance = new componentClassMap[className](state);
                this.registerComponent(componentInstance);
            }
        });

        this._lastIssuedId = idsDeserialized.sort((a, b) => b - a).at(0);
        console.debug("reset last issued id", this._lastIssuedId);

        console.info("loaded diagram state!");
    }

    drawAll(container) {
        this._allComponentInstances()
            .filter(i => i.constructor.name !== 'Pin') //Pins don't need to be drawn directly.
            .forEach(c => c.draw(container));
    }

    _findAllPickups() {
        return this.findComponents((c) => {
            return c.can("pickUp");
        });
    }

    _findAllResetVoltageComponents() {
        return this.findComponents((c) => {
            return c.can("resetVoltage");
        });
    }

    _findAllJacks() {
        return this.findComponents((c) => {
            return c.can("jackIn");
        });
    }

    start() {
        // note: the order of starting these is important.
        this._findAllPickups().forEach(pickup => pickup.pickUp());
        this._findAllJacks().forEach(jack => jack.jackIn());
    }

    stop() {
        this._findAllResetVoltageComponents().forEach(c => {
            c.resetVoltage();
        });
        this._findAllPickups().forEach(
            pickup => pickup.stopPickingUp()
        );
    }
}

