# Guitar Wiring Visualizer User Manual

> Please note some of this may not work yet as the app is still in development.

## Basic Usage

### Keyboard Commands

 - `Ctrl+Enter` Start/Stop visualizer
 - `W` Activate "Add Wire" tool
 - `S` Activate "Select/Move" tool
 - `C` Cycle through color swatches. If a wire is selected the color of just that wire will be changed.
 - `F` Flip selected switch.

### Adding Components

 - Drag a component from the Library Pane on the left onto the Diagram surface.

### Selecting Items
  
Each item (any component or wire) on the diagram can be selected.

 - Activate the "Select/Move" tool.
 - Click on an item to select it.
 - Click in an empty space on the diagram to un-select.


### Arranging Components

 - Selected component can be moved, rotated, or scaled.
 - **Note:** Selected wires can only have their color changed.  Wires are moved along with the components they are connected to.

### Remove Components and Wires

 - Use `Delete` or `Backspace` button to delete selected component.

### Clear Diagram

 - Click the "Clear Diagram" button to delete everything.  This can't be undone!  (In fact, nothing can be undone at the moment. Please see Issues for feature requests.)

### Wires

 - Activate the "Add Wire" toool.
 - Optionally click a color-swatch from toolbar for new wire color.
 - Draw line from component Pin to component Pin.
 - **Note: Wire must start and end on a Pin, or it will not be added.**
 - Turn on "Show Pins" to see where Pins are.

### Change Wire Color

 - Activate the "Select/Move" tool.
 - Select a Wire
 - Click the the desired color-swatch from toolbar.

### Flipping Switches

Flipping a switch moves it's actuator through the available positions.  This will move the internal connections within the switch to alter signal flow between pins.

 - Select a switch
 - Hit `F` or click "Flip Switch" button.

### Visualizer

  - Start: Click "Start Visualizer" button or use `Ctrl-Enter`.
  - Stop: Click "Stop Visualizer" button or use `Ctrl-Enter`.

### Saving

#### Save

To save a link to the the diagram, click the "Save" button.  This will update the URL of the browser with the state of the diagram.  You may copy the current window URL and send to a friend!

Alternatively, simply click the "Save and Copy URL" button to save as well as copy the link  to your clipboard in one action.

#### Load

To view a previously saved diagram, simply navigate to the saved link.


## Concepts

### Components

This means any electrical component such as a guitar pickup, potentiometer (pot), switch, jack, capacitor, resistor, etc.

### Pins
Every component has one or more Pins which are the points at which it can be connected to the circuit.  These represent the lugs of a pot, or the solder tabs on a jack, etc.

### Wires
Pins must be connected to each other using Wires.  This applies to components that in real life have their own leads (e.g. resistors) that can be directly soldered to the lugs/pins of a component.  However, for consistency of function the app needs to use wires in place of leads.  (If this doesn't work for you, please submit an issue.)

### Visualization

The app shows the flow of signal from pickups, through components, and (hopefully) to an output jack.  Note that if the signal goes through a switch, the position of the switch's actuator will route the signal through it's pins accordingly. 
