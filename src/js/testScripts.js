/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { StratPickup, MonoJack, Wire, DPDTOnOn, componentClassMap, Humbucker, Potentiometer } from "./components.js";

const stratPickupAndJack = (diagramLayer) => {

    const pickup = new StratPickup();
    pickup.moveTo({ x: 10, y: 10 });
    pickup.draw(diagramLayer);

    const hotPin = pickup.endPin;
    const hotPinPos = hotPin.findNode(diagramLayer).getAbsolutePosition();
    const groundPin = pickup.startPin;
    const groundPinPos = groundPin.findNode(diagramLayer).getAbsolutePosition();

    const jack = new MonoJack();
    jack.moveTo({ x: 10, y: 200 });
    jack.draw(diagramLayer);

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
    hotWire.draw(diagramLayer);

    const groundWire = new Wire({
        startPoint: [groundPinPos.x, groundPinPos.y],
        midPoint: [160, 160],
        endPoint: [sleevePos.x, sleevePos.y],
        startPinId: groundPin.id,
        endPinId: sleevePin.id,
        color: "black"
    });
    groundWire.draw(diagramLayer);

};

const humbuckerInSeries = (diagramLayer) => {

    const pickup = new Humbucker({ label: "Test" });
    pickup.moveTo({ x: 10, y: 10 });
    pickup.draw(diagramLayer);

    const hotPin = pickup.northCoilStartPin;
    const hotPinPos = hotPin.findNode(diagramLayer).getAbsolutePosition();
    const groundPin = pickup.southCoilStartPin;
    const groundPinPos = groundPin.findNode(diagramLayer).getAbsolutePosition();

    const northEndPin = pickup.northCoilFinishPin;
    const northEndPinPos = northEndPin.findNode(diagramLayer).getAbsolutePosition();

    const southCoilEndPin = pickup.southCoilFinishPin;
    const southCoilEndPinPos = southCoilEndPin.findNode(diagramLayer).getAbsolutePosition();

    const jumper = new Wire({
        label: "Jumper",
        startPoint: [northEndPinPos.x, northEndPinPos.y],
        midPoint: [45, 185],
        endPoint: [southCoilEndPinPos.x, southCoilEndPinPos.y],
        startPinId: northEndPin.id,
        endPinId: southCoilEndPin.id,
        color: "blue"
    });
    jumper.draw(diagramLayer);

    const jack = new MonoJack();
    jack.moveTo({ x: 10, y: 300 });
    jack.draw(diagramLayer);

    const tipPin = jack.tipPin;
    const tipPos = tipPin.findNode(diagramLayer).getAbsolutePosition();

    const sleevePin = jack.sleevePin;
    const sleevePos = sleevePin.findNode(diagramLayer).getAbsolutePosition();

    const hotWire = new Wire({
        label: "Hot",
        startPoint: [hotPinPos.x, hotPinPos.y],
        midPoint: [20, 200],
        endPoint: [tipPos.x, tipPos.y],
        startPinId: hotPin.id,
        endPinId: tipPin.id,
        color: "black"
    });
    hotWire.draw(diagramLayer);

    const groundWire = new Wire({
        label: "Ground",
        startPoint: [groundPinPos.x, groundPinPos.y],
        midPoint: [90, 270],
        endPoint: [sleevePos.x, sleevePos.y],
        startPinId: groundPin.id,
        endPinId: sleevePin.id,
        color: "green"
    });
    groundWire.draw(diagramLayer);

};

const pickupSwitchJack = (diagramLayer) => {

    const pickup = new StratPickup();
    pickup.moveTo({ x: 10, y: 10 });
    pickup.draw(diagramLayer);

    const hotPin = pickup.endPin;
    const hotPinPos = hotPin.findNode(diagramLayer).getAbsolutePosition();
    const groundPin = pickup.startPin;
    const groundPinPos = groundPin.findNode(diagramLayer).getAbsolutePosition();

    console.info("pickup hot pin", hotPin.id);
    console.info("pickup ground pin", groundPin.id);

    const sw = new DPDTOnOn();
    sw.moveTo({ x: 50, y: 110 });
    sw.draw(diagramLayer);

    const inPin = sw.pin5;
    const inPinPos = inPin.findNode(diagramLayer).getAbsolutePosition();
    const outPin = sw.pin4;
    const outPinPos = outPin.findNode(diagramLayer).getAbsolutePosition();

    console.info("switch input pin", inPin.id);
    console.info("switch output pin", outPin.id);

    const hotWire = new Wire({
        startPoint: [hotPinPos.x, hotPinPos.y],
        midPoint: [75, 120],
        endPoint: [inPinPos.x, inPinPos.y],
        startPinId: hotPin.id,
        endPinId: inPin.id,
        color: "red"
    });
    hotWire.draw(diagramLayer);
    console.info("hot wire from pickup", hotWire.id);

    const jack = new MonoJack();
    jack.moveTo({ x: 10, y: 200 });
    jack.draw(diagramLayer);

    const tipPin = jack.tipPin;
    const tipPos = tipPin.findNode(diagramLayer).getAbsolutePosition();

    const sleevePin = jack.sleevePin;
    const sleevePos = sleevePin.findNode(diagramLayer).getAbsolutePosition();

    console.info("jack tip pin", tipPin.id);
    console.info("jack sleeve pin", sleevePin.id);


    const hotWire2 = new Wire({
        startPoint: [outPinPos.x, outPinPos.y],
        midPoint: [75, 175],
        endPoint: [tipPos.x, tipPos.y],
        startPinId: outPin.id,
        endPinId: tipPin.id,
        color: "red"
    });
    hotWire2.draw(diagramLayer);

    console.info("hot wire from switch to jack", hotWire2.id);

    const groundWire = new Wire({
        startPoint: [groundPinPos.x, groundPinPos.y],
        midPoint: [160, 160],
        endPoint: [sleevePos.x, sleevePos.y],
        startPinId: groundPin.id,
        endPinId: sleevePin.id,
        color: "black"
    });
    groundWire.draw(diagramLayer);

    console.info("ground wire", groundWire.id);
};

const pickupPotJack = (diagramLayer) => {

    const pickup = new StratPickup({ label: "Pickup" });
    pickup.moveTo({ x: 10, y: 10 });
    pickup.draw(diagramLayer);

    const pickupHotPin = pickup.endPin;
    const pickupHotPinPos = pickupHotPin.findNode(diagramLayer).getAbsolutePosition();
    const pickupGroundPin = pickup.startPin;
    const pickupGroundPinPos = pickupGroundPin.findNode(diagramLayer).getAbsolutePosition();


    const pot = new Potentiometer({ label: "Volume" });
    pot.moveTo({ x: 200, y: 180 });
    pot.draw(diagramLayer);

    const potPin3 = pot.pin3;
    const potPin3Pos = potPin3.findNode(diagramLayer).getAbsolutePosition();
    const potWiperPin = pot.wiperPin;
    const potWiperPinPos = potWiperPin.findNode(diagramLayer).getAbsolutePosition();
    const potPin1 = pot.pin1;
    const potPin1Pos = potPin1.findNode(diagramLayer).getAbsolutePosition();
    const potGroundPin = pot.groundPin;
    const potGroundPinPos = potGroundPin.findNode(diagramLayer).getAbsolutePosition();

    const hotWire = new Wire({
        label: "hotwire from pickup",
        startPoint: [pickupHotPinPos.x, pickupHotPinPos.y],
        midPoint: [100, 180],
        endPoint: [potPin3Pos.x, potPin3Pos.y],
        startPinId: pickupHotPin.id,
        endPinId: potPin3.id,
        color: "red"
    });
    hotWire.draw(diagramLayer);

    const jack = new MonoJack({ label: "Jack" });
    jack.moveTo({ x: 100, y: 300 });
    jack.draw(diagramLayer);

    const tipPin = jack.tipPin;
    const tipPos = tipPin.findNode(diagramLayer).getAbsolutePosition();

    const sleevePin = jack.sleevePin;
    const sleevePos = sleevePin.findNode(diagramLayer).getAbsolutePosition();

    const hotWire2 = new Wire({
        label: "outwire",
        startPoint: [potWiperPinPos.x, potWiperPinPos.y],
        midPoint: [150, 250],
        endPoint: [tipPos.x, tipPos.y],
        startPinId: potWiperPin.id,
        endPinId: tipPin.id,
        color: "red"
    });
    hotWire2.draw(diagramLayer);

    const jumperWire = new Wire({
        label: "pot jumper",
        startPoint: [potPin1Pos.x, potPin1Pos.y],
        midPoint: [300, 300],
        endPoint: [potGroundPinPos.x, potGroundPinPos.y],
        startPinId: potPin1.id,
        endPinId: potGroundPin.id,
        color: "black"
    });
    jumperWire.draw(diagramLayer);

    const groundWire = new Wire({
        label: "groundwire from pot",
        startPoint: [potGroundPinPos.x, potGroundPinPos.y],
        midPoint: [250, 250],
        endPoint: [sleevePos.x, sleevePos.y],
        startPinId: potGroundPin.id,
        endPinId: sleevePin.id,
        color: "black"
    });
    groundWire.draw(diagramLayer);

    const groundWireFromPickup = new Wire({
        label: "groundwire from pickup",
        startPoint: [pickupGroundPinPos.x, pickupGroundPinPos.y],
        midPoint: [250, 250],
        endPoint: [potGroundPinPos.x, potGroundPinPos.y],
        startPinId: pickupGroundPin.id,
        endPinId: potGroundPin.id,
        color: "black"
    });
    groundWireFromPickup.draw(diagramLayer);

    console.info("ground wire", groundWire.id);
};

const dpdtOnOn = (diagramLayer) => {
    const sw = new DPDTOnOn();
    sw.moveTo({ x: 50, y: 50 });
    sw.draw(diagramLayer);
}

const testDrawAll = (diagramLayer) => {

    const startX = 10;
    const startY = 50;

    const xOffset = 325;
    const yOffset = 150;

    const numPerRow = 3;

    let x = startX, y = startY, count = 0;

    Object.keys(componentClassMap).forEach(kind => {
        if (kind === "Wire" || kind === "Pin")
            return;

        const component = new componentClassMap[kind]({ label: kind });
        component.moveTo({ x, y });
        component.draw(diagramLayer);

        count++;
        x += xOffset;
        if (count % numPerRow === 0) {
            x = startX;
            y += yOffset;
        }
    });
}

export default { stratPickupAndJack, testDrawAll, dpdtOnOn, pickupSwitchJack, humbuckerInSeries, pickupPotJack };