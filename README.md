# SVG to Stencil
Convert SVG paths to MXGraph syntax used in DrawIO stencils

**Notes:**<br>
- Only simple monotone shapes are supported due to the limitations of DrawIO shapes (think clip-art)
- SVGs containing groups `<g>`, definitions `<def>` or transform attributes are not supported.
- Fill and stroke properties are not translated.

## How to use

### Using this app to create DrawIO Stencil XML
1. Drag and drop an SVG file onto the input textarea<br>
   Optional: One can also paste SVG XML in the input textarea
2. Make sure the "include all stencil tags" checkbox is selected
3. Click the big convert button
4. Copy the output from the Stencil XML textarea

### Create a new DrawIO shape
1. In DrawIO select Arrange > Insert > Shape
2. Paste the Stencil XML in the provided area (replacing the demo text)
3. Click Preview to make sure the image translated correctly
4. Click Apply

### DrawIO adjustments to new shape
To further improve DrawIO's handling of your shape you can do the following:
1. Select your new shape by clicking on it
2. In the "Style" panel change the Fill and Line properties to your liking
3. In the "Arrange" panel under "Size" select "Constrain Proportions" and change the size to your liking

Now your shape is ready to be added to the Scratchpad or a custom library.

**Note:** To edit your shape at anytime: select it and click "Edit shape" in the "Style" panel


## Wishlist for future versions
- Handle transform:translate with
  - shapes
  - paths
- Add more SVG shapes:
  - line
  - polyline
  - polygon
