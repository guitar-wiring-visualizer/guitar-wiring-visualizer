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

    getNewIdentity(){
        return ++this._lastIssuedId;
    }

    registerComponent(componentInstance){
        this._addToComponentMap(componentInstance.id, componentInstance);
    }

    getComponent(id) {
        return this._componenetMap[id];
    }

    _addToComponentMap(id, componentInstance) {
        this._componenetMap[id] = componentInstance;
    }

    findComponents(predicate){
        return Object.values(this._componenetMap).filter(predicate);
    }

    removeComponentById(componentId){
        delete this._componenetMap[parseInt(componentId, 10)];
    }
}