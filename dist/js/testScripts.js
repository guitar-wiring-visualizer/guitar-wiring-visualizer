/**
 * @license AGPLv3
 * SPDX-License-Identifier: AGPLv3
 * SPDX-FileCopyrightText: Copyright (c) 2026 The Guitar Wiring Visualizer Authors
 */
import{StratPickup,MonoJack,Wire,componentClassMap}from"./components.js";const stratPickupAndJack=t=>{const o=new StratPickup;o.moveTo({x:10,y:10}),o.draw(t);const n=o.endPin,e=n.findNode(t).getAbsolutePosition(),i=o.startPin,s=i.findNode(t).getAbsolutePosition(),d=new MonoJack;d.moveTo({x:10,y:200}),d.draw(t);const a=d.tipPin,r=a.findNode(t).getAbsolutePosition(),c=d.sleevePin,P=c.findNode(t).getAbsolutePosition();new Wire({startPoint:[e.x,e.y],midPoint:[150,150],endPoint:[r.x,r.y],startPinId:n.id,endPinId:a.id,color:"red"}).draw(t);new Wire({startPoint:[s.x,s.y],midPoint:[160,160],endPoint:[P.x,P.y],startPinId:i.id,endPinId:c.id,color:"black"}).draw(t)},testDrawAll=t=>{let o=10,n=50,e=0;Object.keys(componentClassMap).forEach(i=>{const s=new componentClassMap[i];s.moveTo({x:o,y:n}),s.draw(t),e++,o+=325,e%3==0&&(o=10,n+=150)})};export default{stratPickupAndJack:stratPickupAndJack,testDrawAll:testDrawAll};
