/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { TwoPinPositivePassThroughComponent } from "./coreComponents.js";

/**
 * Base class for resistors
 * @abstract
 */
class Resistor extends TwoPinPositivePassThroughComponent {
    constructor(state) {
        super(state);
    }
    static get _pin1Position() { return { x: 0, y: 3 }; }
    static get _pin2Position() { return { x: 25, y: 3 }; }
}

export class CarbonResistor extends Resistor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/res-carb.svg";
    }
}

export class MetalResistor extends Resistor {
    constructor(state = {}) {
        super(state);
    }
    static get ImageURL() {
        return "/img/res-metal.svg";
    }
}