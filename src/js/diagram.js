export const TOOL_MODE_SELECT = "select";
export const TOOL_MODE_WIRE = "wire"

export class DiagramState {

    constructor() {
        if (DiagramState.instance) {
            return DiagramState.instance;
        }
        this._lastIssuedId = 0;

        this._componenetMap = {};

        this.showConnectors = false;
        this.toolMode = TOOL_MODE_SELECT;

        DiagramState.instance = this;

    }

    registerComponent(componentInstance, konvaNode) {
        this._assignAutoIncrementIdentity(konvaNode);
        this._addToComponentMap(konvaNode.id(), componentInstance);
    }

    getComponent(id) {
        return this._componenetMap[id];
    }

    _assignAutoIncrementIdentity(konvaNode) {
        konvaNode.id((++this._lastIssuedId).toString());
    }

    _addToComponentMap(id, componentInstance) {
        this._componenetMap[id] = componentInstance;
    }
}