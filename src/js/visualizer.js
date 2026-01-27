import { DiagramState } from "./diagram.js";

export class Visualizer {

    constructor(diagramLayer) {
        if (Visualizer.instance)
            return Visualizer.instance;

        this._diagramLayer = diagramLayer;

        this._visLayer = new Konva.Layer({
            visible: false
        });
        const stage = this._diagramLayer.getStage();
        stage.add(this._visLayer);

        this._isActive = false;

        this._activeWireNodes = [];

        this._animations = [
            this._createActiveWireAnimation()
        ];

        DiagramState.instance.on("wireChanged", (_) => {
            console.log("received wireChanged event");
            this._refreshActiveWireNodesList();
            console.log(this._activeWireNodes);
        });

        Visualizer.instance = this;
    }

    get isActive() {
        return this._isActive;
    }

    start() {
        this._isActive = true;
        this._visLayer.visible(true);
        this._animations.forEach(a => a.start());
    }

    stop() {
        this._animations.forEach(a => a.stop());
        this._visLayer.visible(false);
        this._isActive = false;
    }

    _refreshActiveWireNodesList() {
        this._visLayer.destroyChildren();
        const activeWires = DiagramState.instance.findComponents((component) => {
            return component.constructor.name === "Wire";
            //TODO filter to wires actively getting signal
        });

        const activeWireNodes = activeWires.map((component) => {
            if (component)
                return this._diagramLayer.findOne("#" + component.id.toString());
        });

        this._activeWireNodes = activeWireNodes.map((node) => {
            if (node) {
                const clone = node.clone({
                    shadowColor: node.stroke()
                });
                this._visLayer.add(clone);
                return clone;
            }
        });
    }

    _createActiveWireAnimation() {

        const SPEED = 15;
        const TIME_DIFF_MULTIPLIER = 1000;
        const MAX_SHADOW = 10;

        let currentShadow = 0;
        let increasing = true;

        return new Konva.Animation((frame) => {

            if (currentShadow > MAX_SHADOW + 1 || currentShadow < 0) {
                currentShadow = 0;
                increasing = true;
            }
            if (currentShadow > MAX_SHADOW) {
                increasing = false;
            }

            const changeAmount = (frame.timeDiff / TIME_DIFF_MULTIPLIER) * SPEED;

            if (increasing) {
                currentShadow = currentShadow + changeAmount;
            } else {
                currentShadow = currentShadow - changeAmount;
            }

            this._activeWireNodes.forEach(wireNode => {
                if (wireNode) {
                    wireNode.shadowBlur(currentShadow);
                    wireNode.shadowOpacity(10 / currentShadow);
                }
            });

        }, this._visLayer);
    }
}