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

export class DiagramState extends EventEmitter {

    constructor() {
        super()
        if (DiagramState.instance) {
            return DiagramState.instance;
        }
        this._lastIssuedId = 0;

        this._componenetMap = {};

        this.showConnectors = false;
        this.toolMode = TOOL_MODE_SELECT;
        this.wireToolColor = WIRE_COLOR_DEFAULT;

        DiagramState.instance = this;
    }

    getNewIdentity() {
        return ++this._lastIssuedId;
    }

    registerComponent(componentInstance) {
        this._addToComponentMap(componentInstance.id, componentInstance);
    }

    notifyNodeChanged(node) {
        console.log("notifyNodeChanged", node.name())
        if (node.name() === "Wire") {
            this._emit("wireChanged", node);
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
        const component = this.getComponent(componentId);
        if (component.pinIds) {
            component.pinIds.forEach(pinId => {
                this.removeComponentById(pinId);
            });
        }
        delete this._componenetMap[component.id];
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
        console.log({ data: diagramState });

        const encoded = await compress(JSON.stringify(diagramState));
        console.log({ encoded });

        return encoded;
    }

    async loadState(data) {
        console.log({ data });

        const decoded = await decompress(data);
        console.log({ decoded });

        const diagramState = JSON.parse(decoded);
        console.log({ diagramState });

        const idsDeserliazed = []
        diagramState.componentStates.forEach(state => {
            idsDeserliazed.push(state.id);

            const className = state.className;
            console.log("deserializing", className);

            const componentInstance = new componentClassMap[className](state);

            this.registerComponent(componentInstance);

        });

        this._lastIssuedId = idsDeserliazed.sort((a, b) => b - a).at(0);
        console.log("reset last issued id", this._lastIssuedId);

        console.log("loaded diagram state!");
    }

    drawAll(container) {
        this._allComponentInstances()
            .filter(i => i.constructor.name !== 'Pin') //Pins don't need to be drawn directly.
            .forEach(c => c.draw(container));
    }
}


// Compreses string to GZIP. Retruns a Promise with Base64 string
const compress = string => {
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
    return new Response(cs.readable).blob().then(blobToBase64);
};

// Decompresses base64 encoded GZIP string. Retruns a string with original text.
const decompress = base64string => {
    const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
    const cs = new DecompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
        return new TextDecoder().decode(arrayBuffer);
    });
}
