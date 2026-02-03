/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */

import { Pin, Wire } from "./coreComponents.js";
import { StratPickup, Humbucker } from "./pickups.js";
import { MonoJack } from "./jacks.js";
import { DPDTOnOn, DPDTOnOnOn, DPDTOnOffOn } from "./switches.js";
import { Potentiometer } from "./pots.js";
import { BumbleBeeCap, CeramicDiscExtraSmall, CeramicDiscSmall, CeramicDiscMedium, CeramicDiscLarge, Chiclet, MalloryMustard, OrangeDropCap, PolystyreneBlue, PolystyreneRed, VitaminQ } from "./caps.js";
import { CarbonResistor, MetalResistor } from "./resistors.js";

// Re-export all components through components.js
export * from './coreComponents.js';
export * from './pickups.js';
export * from './jacks.js';
export * from './switches.js';
export * from './pots.js';
export * from './caps.js';
export * from './resistors.js';

/**
 * Map of components for dynamic creation.
 */
export const componentClassMap = {
    BumbleBeeCap,
    OrangeDropCap,
    CeramicDiscSmall,
    CeramicDiscMedium,
    CeramicDiscLarge,
    CeramicDiscExtraSmall,
    Chiclet,
    MalloryMustard,
    PolystyreneBlue,
    PolystyreneRed,
    VitaminQ,
    CarbonResistor,
    MetalResistor,
    Potentiometer,
    DPDTOnOn,
    DPDTOnOffOn,
    DPDTOnOnOn,
    Humbucker,
    StratPickup,
    MonoJack,
    Wire,
    Pin,
};