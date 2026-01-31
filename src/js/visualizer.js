/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { DiagramState } from "./diagram.js";
import { Wire } from './components.js';

const RANGE_FOR_CLOSE_POINT_COMPARISON = 2.0;

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
        this._signalWireNodes = [];

        this._createAllAnimations();

        DiagramState.instance.on("wireChanged", (_) => {
            console.log("received wireChanged event");
            const wasActiveWhenEventReceived = this.isActive;

            this.stop();

            if (wasActiveWhenEventReceived)
                this.start();
        });

        Visualizer.instance = this;
    }

    _createAllAnimations() {
        this._animations = [this._createActiveWireAnimation()].concat(this._createSignalWireAnimations()).filter(Boolean);
    }

    get isActive() {
        return this._isActive;
    }

    start() {
        this._refreshWireNodesLists();
        this._createAllAnimations();

        this._isActive = true;
        this._visLayer.visible(true);
        this._animations.forEach(a => a.start());
    }

    stop() {
        this._animations.forEach(a => a.stop());
        this._visLayer.visible(false);
        this._isActive = false;
    }

    _refreshWireNodesLists() {
        this._visLayer.destroyChildren();

        this._activeWireNodes = [];
        this._signalWireNodes = [];

        DiagramState.instance.findComponentsOfType(Wire, (component) => {
            return component.hasVoltage();
        })
            .filter(Boolean)
            .forEach(activeWire => {
                const activeWireNode = activeWire.findNode(this._diagramLayer);

                let animationWirePoints = activeWireNode.points();
                console.log({ animationWirePoints });

                if (activeWire.voltage > 0) {
                    // Make sure to draw animation with so it shows the direction of signal flow (i.e. sending pin -> receiving pin)
                    // The wire may have been drawn in opposite direction.
                    // This is ok, but the wire we draw here needs to be in signal flow direction.
                    const pinVoltageIsFrom = activeWire.pinVoltageIsFrom;
                    const pinNodeVoltageIsFrom = pinVoltageIsFrom.findNode(this._diagramLayer);
                    const pinPosition = pinNodeVoltageIsFrom.getAbsolutePosition();
                    console.log({ pinVoltageIsFrom, pinNodeVoltageIsFrom, pinPosition });
                    
                    const wireEndX = animationWirePoints.at(-2);
                    if (areClose(pinPosition.x, wireEndX)) {
                        animationWirePoints = reverseWirePoints(animationWirePoints);
                        console.log("reversed wire points", activeWireNode.points(), animationWirePoints)
                    }
                }

                const clonedWireNode = activeWireNode.clone({
                    points: animationWirePoints,
                    shadowColor: activeWireNode.stroke()
                });
                this._visLayer.add(clonedWireNode);
                this._activeWireNodes.push(clonedWireNode);

                if (activeWire.voltage > 0) {
                    this._signalWireNodes.push(clonedWireNode);
                }
            });

        console.log("_activeWireNodes", this._activeWireNodes);
        console.log("_signalWireNodes", this._signalWireNodes);

        function areClose(a, b) {
            return Math.abs(a - b) <= RANGE_FOR_CLOSE_POINT_COMPARISON;
        }

        function reverseWirePoints(originalPoints) {
            const newPoints = [];
            for (let x = originalPoints.length - 1; x >= 1; x -= 2) {
                newPoints.push(originalPoints.at(x - 1));
                newPoints.push(originalPoints.at(x));
            }
            return newPoints;
        }
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

        return this._signalWireNodes.map(wireNode => {
            return createAnimationForWire(wireNode);
        });

    }

}