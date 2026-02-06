/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */
export default class Geometry{static translationVector(t,a){return[a.at(0)-t.at(0),a.at(1)-t.at(1)]}static reduceVector(t,a){return[t.at(0)/a,t.at(1)/a]}static applyVector(t,a){return[a.at(0)+t.at(0),a.at(1)+t.at(1)]}static midPoint(t,a){return[(t.at(0)+a.at(0))/2,(t.at(1)+a.at(1))/2]}static distance(t,a){return Math.hypot(a.at(0)-t.at(0),a.at(1)-t.at(1))}static rectanglesOverlap(t,a){return t.x()<a.x()+a.width()&&t.x()+t.width()>a.x()&&t.y()<a.y()+a.height()&&t.y()+t.height()>a.y()}}
