/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */
import{TwoPinPassThroughComponenet}from"./coreComponents.js";class Resistor extends TwoPinPassThroughComponenet{constructor(s){super(s)}static get _pin1Position(){return{x:0,y:3}}static get _pin2Position(){return{x:25,y:3}}}export class CarbonResistor extends Resistor{constructor(s={}){super(s)}static get ImageURL(){return"/img/res-carb.svg"}}export class MetalResistor extends Resistor{constructor(s={}){super(s)}static get ImageURL(){return"/img/res-metal.svg"}}
