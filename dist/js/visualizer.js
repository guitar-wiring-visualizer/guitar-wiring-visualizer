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

        this._createAllAnimations();

        DiagramState.instance.on("wireChanged", (_) => {
            console.log("received wireChanged event");
            const wasActiveWhenEventReceived = this.isActive;

            if(wasActiveWhenEventReceived)
                this.stop();

            this._refreshActiveWireNodesList();
            this._createAllAnimations()
            console.log(this._activeWireNodes);

            if(wasActiveWhenEventReceived)
                this.start();
        });

        Visualizer.instance = this;
    }

    _createAllAnimations(){
        this._animations = [this._createActiveWireAnimation()].concat(this._createSignalWireAnimations());
    }

    get isActive() {
        return this._isActive;
    }

    start() {
        this._isActive = true;
        this._visLayer.visible(true);
        this._animations.filter(a => a != null).forEach(a => a.start());
    }

    stop() {
        this._animations.filter(a => a != null).forEach(a => a.stop());
        this._visLayer.visible(false);
        this._isActive = false;
    }

    _refreshActiveWireNodesList() {
        this._visLayer.destroyChildren();
        const activeWires = DiagramState.instance.findComponents((component) => {
            return component.constructor.name === "Wire";
            //TODO filter to wires actively getting signal
        });

        const activeWireNodes = activeWires.filter(a => a != null).map((component) => {
            return this._diagramLayer.findOne("#" + component.id.toString());
        });

        this._activeWireNodes = activeWireNodes.filter(a => a != null).map((node) => {
            const clone = node.clone({
                shadowColor: node.stroke()
            });
            this._visLayer.add(clone);
            return clone;

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

            this._activeWireNodes.filter(a => a != null).forEach(wireNode => {
                wireNode.shadowBlur(currentShadow);
                wireNode.shadowOpacity(10 / currentShadow);
            });

        }, this._visLayer);
    }

    _createSignalWireAnimations() {

        const SPEED = 17;

        const createAnimationForWire = (wireLine) => {

            const wirePoints = wireLine.points();

            // console.log({ wirePoints });
            const tensionPoints = wireLine.getTensionPoints();
            // console.log({ tensionPoints });

            // if original and tension are the standard 6 point lines, we can combine, otherwise use original wire points
            const actualPoints = wirePoints.length === 6 && tensionPoints.length === 6 ? [
                wirePoints.at(0), wirePoints.at(1),
                tensionPoints.at(0), tensionPoints.at(1),
                wirePoints.at(2), wirePoints.at(3),
                tensionPoints.at(4), tensionPoints.at(5),
                wirePoints.at(4), wirePoints.at(5)
            ] : wirePoints;
            //console.log({ actualPoints });

            const startPoint = { x: actualPoints.at(0), y: actualPoints.at(1) };

            const electron = new Konva.Circle({
                x: startPoint.x,
                y: startPoint.y,
                radius: 4,
                fill: 'cyan',
                shadowColor: "#35FF1F",
                shadowBlur: 10,
                shadowOffset: { x: -5, y: 0 },
                shadowOpacity: 1,
            });
            this._visLayer.add(electron);

            const wirePathData = linePointsToSVGData(actualPoints);

            const wirePath = new Konva.Path({
                data: wirePathData,
                stroke: 'cyan',
                strokeWidth: 1,
                fill: 'transparent'
            });

            const steps = SPEED; // number of steps in animation
            const pathLen = wirePath.getLength();
            console.log({ pathLen });
            const step = pathLen / steps;
            let currentPos = 0, pointAtLen;

            return new Konva.Animation((frame) => {
                if (currentPos * step > pathLen) {
                    currentPos = 0;
                }
                currentPos = currentPos + 1;
                pointAtLen = wirePath.getPointAtLength(currentPos * step);
                //console.log({ currentPos, pointAtLen });
                electron.position({ x: pointAtLen.x, y: pointAtLen.y });

            }, this._visLayer);

            function linePointsToSVGData(points) {
                let path = 'M ' + points[0] + ',' + points[1];
                for (let i = 2; i < points.length; i += 2) {
                    path += ' L ' + points[i] + ',' + points[i + 1];
                }
                return path;
            }
        }

        return this._activeWireNodes.filter(a => a != null).map(wireNode => {
            return createAnimationForWire(wireNode);
        });

    }

}