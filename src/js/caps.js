/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { TwoPinPassThroughComponenet} from "./coreComponents.js";

/**
 * Base class for capacitors.
 * @abstract
 */
class Capacitor extends TwoPinPassThroughComponenet {
    constructor(state) {
        super(state);
    }
}

export class BumbleBeeCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-bb.svg";
    }
    static get _pin1Position() { return { x: 2, y: 14 }; }
    static get _pin2Position() { return { x: 105, y: 14 }; }
}

export class OrangeDropCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-od.svg";
    }
    static get _pin1Position() { return { x: 1, y: 42 }; }
    static get _pin2Position() { return { x: 62, y: 42 }; }
}

export class CeramicDiscCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-cd.svg";
    }
    static get _pin1Position() { return { x: 3, y: 18 }; }
    static get _pin2Position() { return { x: 17, y: 18 }; }
}

export class ChicletCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-chic.svg";
    }
    static get _pin1Position() { return { x: 2, y: 41 }; }
    static get _pin2Position() { return { x: 22, y: 41 }; }
}

export class MalloryMustardCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-mal.svg";
    }
    static get _pin1Position() { return { x: 0, y: 7 }; }
    static get _pin2Position() { return { x: 58, y: 7 }; }
}

export class PolystyreneBlueCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-poly-blue.svg";
    }
    static get _pin1Position() { return { x: 0, y: 10 }; }
    static get _pin2Position() { return { x: 50, y: 10 }; }
}

export class PolystyreneRedCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-poly-red.svg";
    }
    static get _pin1Position() { return { x: 0, y: 10 }; }
    static get _pin2Position() { return { x: 50, y: 10 }; }
}

export class VitaminQCap extends Capacitor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/cap-vitq.svg";
    }
    static get _pin1Position() { return { x: 1, y: 14 }; }
    static get _pin2Position() { return { x: 84, y: 14 }; }
}
