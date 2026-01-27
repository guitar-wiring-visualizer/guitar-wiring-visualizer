# Guitar Wiring Visualizer

A simple web-based app that lets you create wiring diagrams for electric guitars.

> View demo here: https://guitar-wiring-visualizer.github.io/

- Makes it easy to draw how to wire electric guitars.
- Share diagrams via stateful URL links.
- Determine physical layout of the components in the confines of a guitar body cavity.
- Diagram can be easily followed when soldering components together.
- Visualizer allows validating the circuit idea by showing the flow of signal.
- See the effects of flipping switches on the signal flow.

The app is for creating _wiring diagrams_, not actual schematics.  (Although, generating a schematic from the diagram should be poissible, but has not been implemented yet.)  

For a schematic-based tools, see:
- https://everycircuit.com/
- https://www.circuitlab.com/


## Development

The app is written in vanilla JavaScript and plain HTML.  No backend/server technology is needed.  The code leverages the great [Konva](https://konvajs.org/) library for drawing to the HTML canvas.

Bootstrap is used for styling.

### Demo site hosting

github pages is used to host the site.  Upon commit to master, the source code is copied to the guitar-wiring-visualizer.github.io repository to be served by giuthub pages, using a github action.

### dev notes

Handy local server:
```
python3 -m http.server -d ./src
```
