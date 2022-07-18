# SVG to Stencil
Convert SVG paths to MXGraph syntax used in DrawIO stencils

**Notes:**  
- Only simple monotone shapes are supported due to the limitations of DrawIO shapes (think clip-art)
- SVGs containing groups `<g>`, definitions `<def>` or transform attributes are not supported.
- Fill and stroke properties are not translated.

## How to use

### Using this app to create DrawIO Stencil XML
1. Open an SVG in a text editor then select all the text and copy it
2. Paste it in this app's "SVG XML" textarea
3. Make sure the "include all stencil tags" checkbox is selected
4. Click the big and only button
5. Copy the output from the Stencil XML textarea

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
- Show a preview of the uploaded SVG
- Show a stencil compatibility score of the uploaded SVG
- Instead of copying SVG XML make it a drag-drop file uploader