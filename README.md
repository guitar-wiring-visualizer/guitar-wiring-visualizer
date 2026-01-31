# Guitar Wiring Visualizer

[![CD](https://github.com/guitar-wiring-visualizer/guitar-wiring-visualizer/actions/workflows/cd.yml/badge.svg)](https://github.com/guitar-wiring-visualizer/guitar-wiring-visualizer/actions/workflows/cd.yml)

A web-based app that lets you create wiring diagrams for electric guitars.

> View demo here: https://guitar-wiring-visualizer.github.io/

- Makes it easy to draw plans for electric guitars circuits.
- Visualizer allows validating the circuit by showing the flow of signal.
- See the effects of flipping switches on the signal flow.
- Share diagrams via stateful URL links.

The app is for creating _wiring diagrams_, not actual schematics.  (Although, generating a schematic from the diagram should be possible, but has not been implemented yet.)

The thinking is:

- Not everyone is comfortable reading/creating schematics.
- Diagram can be used to determine physical layout of the components in the confines of a guitar body cavity.
- Diagram can be easily followed when soldering components together.

For a schematic-based tools, see:
- https://everycircuit.com/
- https://www.circuitlab.com/

## Development

The app is written in vanilla JavaScript and HTML.  No backend/server technology is needed.  The code leverages the great [Konva](https://konvajs.org/) ([MIT](https://github.com/konvajs/konva/blob/master/LICENSE)) library for drawing to the HTML canvas.

[Bootstrap](https://getbootstrap.com/) ([MIT](https://github.com/twbs/bootstrap/blob/main/LICENSE)) is used for styling.

### Demo site hosting

github pages is used to host the site.  Upon commit to master, the source code is copied to the `guitar-wiring-visualizer.github.io` repository to be served by github pages, using an action.  Note - the site is served from the `gh-pages` branch.

### Local server

For normal development:
```
python3 -m http.server -d ./src
```

To test the build:
```
./build_dist.sh
python3 -m http.server -d ./dist
```
Remove the `./dist` folder when done.

### Test/Demo Scripts
To make development easier, a pre-configured diagram can be created on page-load.  The scripts to create the diagram are in the `testScipts.js` module.

To load a script, specify the name in the `script` URL parameter.

For example `?script=stratPickupAndJack` with load and run the `stratPickupAndJack` script from the `testScripts.js` module.

