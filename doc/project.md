# Guitar Wiring Visualizer

## Executive Summary

GWV is a web page that allows a user to create wiring diagrams for electric guitars. The user can place components such as pickups, pots, switches, jacks, etc, onto a canvas and draw wires between them.  The diagram shows the signal flow so the user can see and validate the cicuit.

## Requirements

### MVP

- [x] Library of component shapes (pickups, potentiometers, switches, etc)
- [x] Components have glue-points
- [ ] Components have text label
- [x] User can drag component from library to canvas - creates instance on canvas
- [x] User can move component instance to new location on canvas
- [x] User can rotate component instance
- [ ] User can edit label of component instances
- [x] User can remove component instance from canvas
- [x] User can draw connector lines between component glue points
- [x] Connectors redraw when moving component

### Switches

- [ ] Switch components have multiple states
- [ ] Switch states control how signal flows to/from inner pole/throw connections and glue-points
- [ ] User can click Switch component to change state (cycle through on each click)
- [ ] Actuator of switch is rendered according to state (e.g. "bat handle" shows up/down)

### Signal Flows V1

- [ ] Drawing shows signal flow from pickup(s) to output jack(s)
- [ ] Hot and Ground are differentiated
- [ ] User can toggle signal flow visibility on/off
- [ ] Signal flow honors Switch states

### Signal Flows V2

- [ ] Signal flows render as animated "marching ants" line

### Schematic

 - [ ] Render diagram as standard schematic in separate readonly canvas

 ### Persistence

 - [ ] User can get link to diagram. Diagram must be fully rendered from URL.
 - [ ] URLs must be forward compatible

 ### Visbility toggle
 - [ ] User can toggle all components visibility on/off
 - [ ] User can toggle all connectors visibility on/off

 ### Samples library
  - [ ] User can load a diagram from a list of samples



