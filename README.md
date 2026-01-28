# Guitar Wiring Visualizer

Source code for  https://guitar-wiring-visualizer.github.io/

## Development

The app is written in vanilla JavaScript and HTML.  No backend/server technology is needed.  The code leverages the great [Konva](https://konvajs.org/) library for drawing to the HTML canvas.

Bootstrap is used for styling.

### Demo site hosting

github pages is used to host the site.  Upon commit to master, the source code is copied to the `guitar-wiring-visualizer.github.io` repository to be served by github pages, using an action.  Note - the site is served from the `gh-pages` branch.

### Notes

Handy local server:
```
python3 -m http.server -d ./src
```
