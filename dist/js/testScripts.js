/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */
import{StratPickup,MonoJack,Wire}from"./components.js";const stratPickupAndJack=t=>{const n=new StratPickup({});n.createOnLayer(t,{x:10,y:10});const e=n.endPin,i=e.findNode(t).getAbsolutePosition(),o=n.startPin,d=o.findNode(t).getAbsolutePosition(),r=new MonoJack({});r.createOnLayer(t,{x:10,y:200});const a=r.tipPin,s=a.findNode(t).getAbsolutePosition(),P=r.sleevePin,c=P.findNode(t).getAbsolutePosition();new Wire({startPoint:[i.x,i.y],midPoint:[150,150],endPoint:[s.x,s.y],startPinId:e.id,endPinId:a.id,color:"red"}).createOnLayer(t);new Wire({startPoint:[d.x,d.y],midPoint:[160,160],endPoint:[c.x,c.y],startPinId:o.id,endPinId:P.id,color:"black"}).createOnLayer(t)};export default{stratPickupAndJack:stratPickupAndJack};
