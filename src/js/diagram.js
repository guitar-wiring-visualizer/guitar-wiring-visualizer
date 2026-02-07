/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { componentClassMap } from "./components.js";
import EventEmitter from "./eventEmitter.js";

export const TOOL_MODE_SELECT = "select";
export const TOOL_MODE_WIRE = "wire";

export const WIRE_COLOR_RED = "red";
export const WIRE_COLOR_BLACK = "black";
export const WIRE_COLOR_GREEN = "green";
export const WIRE_COLOR_YELLOW = "yellow";
export const WIRE_COLOR_BLUE = "blue";

export const WIRE_COLOR_DEFAULT = WIRE_COLOR_BLACK;

/**
 * Tracks all component instances on the diagram.
 * Can serialize and deserialize entire state of all components on the diagram.
 */
export class DiagramState extends EventEmitter {

    constructor(options = {}) {
        super()
        if (DiagramState.instance) {
            return DiagramState.instance;
        }
        this._lastIssuedId = 0;

        this._componenetMap = {};

        this.showConnectors = false;
        this.toolMode = TOOL_MODE_SELECT;
        this.wireToolColor = WIRE_COLOR_DEFAULT;
        this.debugMode = options.debugMode || false;

        DiagramState.instance = this;
    }

    getNewIdentity() {
        return ++this._lastIssuedId;
    }

    registerComponent(componentInstance) {
        this._addToComponentMap(componentInstance.id, componentInstance);
        this._emit("componentAdded", componentInstance.id);
    }

    notifyNodeChanged(node) {
        console.debug("notifyNodeChanged", node.name())

        if (node.name() === "Wire") {
            this._emit("wireChanged", node);
        }

        //TOD0: refactor how events are bubbled out
        if (["DPDTOnOn", "DPDTOnOffOn", "DPDTOnOnOn", "Potentiometer", "ThreeWayToggle"].includes(node.name())) {
            this._emit("switchChanged", node);
        }
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
        this._emit("componentRemoved", componentId);
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
        this._emit("allComponentsRemoved");
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

        const encoded = await Compressor.compress(JSON.stringify(diagramState));
        console.debug({ encoded });

        return encoded;
    }

    async loadState(encodedDataString) {
        console.debug({ data: encodedDataString });

        const decodedDataString = await Compressor.decompress(encodedDataString);
        console.debug({ decoded: decodedDataString });

        const deserializedState = JSON.parse(decodedDataString);
        console.debug({ deserializedState: deserializedState });

        // keep track if ids
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

class Compressor {

    static async compress(string) {
        const blobToBase64 = blob => new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
        const byteArray = new TextEncoder().encode(string);
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();
        const blob = await new Response(cs.readable).blob();
        return blobToBase64(blob);
    }

    static async decompress(base64string) {
        const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
        const cs = new DecompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const arrayBuffer = await new Response(cs.readable).arrayBuffer();
        return new TextDecoder().decode(arrayBuffer);
    }
}
