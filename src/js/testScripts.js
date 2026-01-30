/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { StratPickup, MonoJack, Wire } from "./components.js";

const stratPickupAndJack = (diagramLayer) => {

    const pickup = new StratPickup({});
    pickup.createOnLayer(diagramLayer, { x: 10, y: 10 });

    const hotPin = pickup.endPin;
    const hotPinPos = hotPin.findNode(diagramLayer).getAbsolutePosition();
    const groundPin = pickup.startPin;
    const groundPinPos = groundPin.findNode(diagramLayer).getAbsolutePosition();

    const jack = new MonoJack({});
    jack.createOnLayer(diagramLayer, { x: 10, y: 200 });

    const tipPin = jack.tipPin;
    const tipPos = tipPin.findNode(diagramLayer).getAbsolutePosition();

    const sleevePin = jack.sleevePin;
    const sleevePos = sleevePin.findNode(diagramLayer).getAbsolutePosition();

    const hotWire = new Wire({
        startPoint: [hotPinPos.x, hotPinPos.y],
        midPoint: [150, 150],
        endPoint: [tipPos.x, tipPos.y],
        startPinId: hotPin.id,
        endPinId: tipPin.id,
        color: "red"
    });
    hotWire.createOnLayer(diagramLayer);

    const groundWire = new Wire({
        startPoint: [groundPinPos.x, groundPinPos.y],
        midPoint: [160, 160],
        endPoint: [sleevePos.x, sleevePos.y],
        startPinId: groundPin.id,
        endPinId: sleevePin.id,
        color: "black"
    });
    groundWire.createOnLayer(diagramLayer);

};

export default { stratPickupAndJack };