export const TOOL_MODE_SELECT = "select";
export const TOOL_MODE_WIRE = "wire";

export const WIRE_COLOR_RED = "red";
export const WIRE_COLOR_BLACK = "black";
export const WIRE_COLOR_GREEN = "green";
export const WIRE_COLOR_YELLOW = "yellow";
export const WIRE_COLOR_BLUE = "blue";

export const WIRE_COLOR_DEFAULT = WIRE_COLOR_BLACK;

export class DiagramState {

    constructor() {
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

    getComponent(id) {
        return this._componenetMap[parseInt(id, 10)];
    }

    _addToComponentMap(id, componentInstance) {
        this._componenetMap[id] = componentInstance;
    }

    findComponents(predicate) {
        return Object.values(this._componenetMap).filter(predicate);
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
}