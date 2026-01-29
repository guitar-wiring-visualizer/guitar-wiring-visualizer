# Guitar Wiring Visualizer

[![CD](https://github.com/guitar-wiring-visualizer/guitar-wiring-visualizer/actions/workflows/cd.yml/badge.svg)](https://github.com/guitar-wiring-visualizer/guitar-wiring-visualizer/actions/workflows/cd.yml)

Source code for  https://guitar-wiring-visualizer.github.io/

## Development

The app is written in vanilla JavaScript and HTML.  No backend/server technology is needed.  The code leverages the great [Konva](https://konvajs.org/) library for drawing to the HTML canvas.

Bootstrap is used for styling.

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