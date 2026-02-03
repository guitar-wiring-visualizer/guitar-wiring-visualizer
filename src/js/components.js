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
import { BumbleBeeCap, CeramicDiscCap, ChicletCap, MalloryMustardCap, OrangeDropCap, PolystyreneBlueCap, PolystyreneRedCap, VitaminQCap } from "./caps.js";
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
    CeramicDiscCap,
    ChicletCap,
    MalloryMustardCap,
    PolystyreneBlueCap,
    PolystyreneRedCap,
    VitaminQCap,
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