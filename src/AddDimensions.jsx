/************************************************************
 * AddDimensions.jsx
 * 
 * Creates dimensioning lines and measurements for selected objects
 * in Adobe Illustrator, with formatting options for Rolls, Sheets,
 * or Die-cut specifications.
 * 
 * Prerequisites:
 * - Single object selection
 * - "Add Arrows" action set with "50%" action
 * - Arial Bold font (Arial-BoldMT)
 ************************************************************/

(function(){

    // Utility function: convert inches to points
    function inchesToPoints(inches) {
        return inches * 72;
    }

    // Quick check for open docs and selection
    if (app.documents.length === 0) {
        alert("No open documents.");
        return;
    }
    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length !== 1) {
        alert("No object");
        return;
    }
    
    var sel = doc.selection[0];
    var gb = sel.geometricBounds; 
    // geometricBounds = [left, top, right, bottom] in points
    var left   = gb[0];
    var top    = gb[1];
    var right  = gb[2];
    var bottom = gb[3];

    // Dimensions in points
    var widthPt  = right - left;
    var heightPt = top - bottom;
    // Convert to inches
    var wIn = widthPt / 72;
    var hIn = heightPt / 72;

    // We'll check each dimension individually for <5" or >=5" 
    // to decide text size.
    function getFontSizeForWidth()  { return (wIn < 5) ? 8 : 15; }
    function getFontSizeForHeight() { return (hIn < 5) ? 8 : 15; }

    // ----------------------------------------------------------------
    // Build the dialog with three buttons
    // ----------------------------------------------------------------
    var w = new Window("dialog", "Dimension Lines");
    w.orientation = "column";
    w.alignChildren = "fill";

    var g = w.add("group");
    g.orientation = "row";

    var rollsBtn  = g.add("button", undefined, "Rolls");
    var sheetsBtn = g.add("button", undefined, "Sheets");
    var dieBtn    = g.add("button", undefined, "Die-cut");

    var choice = null;
    rollsBtn.onClick = function() {
        choice = "Rolls";
        w.close();
    };
    sheetsBtn.onClick = function() {
        choice = "Sheets";
        w.close();
    };
    dieBtn.onClick = function() {
        choice = "Die-cut";
        w.close();
    };

    w.show();
    if (!choice) {
        // User canceled
        return;
    }

    // Helper function to determine size category based on dimensions
    function getSizeCategory(width, height) {
        var maxDim = Math.max(width, height);
        if (maxDim < 0.5) return "under0_5";
        if (maxDim < 1) return "0_5to1";
        if (maxDim < 2) return "1to2";
        if (maxDim < 4) return "2to4";
        if (maxDim < 6) return "4to6";
        if (maxDim < 10) return "6to10";
        return "over10";
    }

    // Dimension line and text offsets per size category and type
    var offsetsTable = {
        "Rolls": {
            "under0_5":  { dimLine: 0.1875, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
            "0_5to1":    { dimLine: 0.2, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
            "1to2":      { dimLine: 0.2125, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
            "2to4":      { dimLine: 0.2375, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
            "4to6":      { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "6to10":     { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "over10":    { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
        },
        "Sheets": {
            "under0_5":  { dimLine: 0.25, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
            "0_5to1":    { dimLine: 0.2625, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
            "1to2":      { dimLine: 0.275, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
            "2to4":      { dimLine: 0.3, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
            "4to6":      { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "6to10":     { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "over10":    { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
        },
        "Die-cut": {
            "under0_5":  { dimLine: 0.3125, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
            "0_5to1":    { dimLine: 0.325, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
            "1to2":      { dimLine: 0.3375, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
            "2to4":      { dimLine: 0.3625, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
            "4to6":      { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "6to10":     { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
            "over10":    { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
        }
    };

    // Get the size category based on object dimensions
    var sizeCategory = getSizeCategory(wIn, hIn);

    // Get the appropriate offsets based on choice and size category
    var offsets = offsetsTable[choice][sizeCategory];
    var dimLineOffset = offsets.dimLine;
    var textOffset = offsets.text;
    var strokeWidth = offsets.strokeWidth;
    var fontSize = offsets.fontSize;

    // ----------------------------------------------------------------
    // Helper: create a single dimension line (path)
    // ----------------------------------------------------------------
    function createDimLine(x1, y1, x2, y2) {
        var line = doc.pathItems.add();
        line.stroked = true;
        line.strokeWidth = strokeWidth;
        line.filled = false;

        var p1 = line.pathPoints.add();
        p1.anchor = [x1, y1];
        p1.leftDirection = p1.anchor;
        p1.rightDirection = p1.anchor;

        var p2 = line.pathPoints.add();
        p2.anchor = [x2, y2];
        p2.leftDirection = p2.anchor;
        p2.rightDirection = p2.anchor;

        // We want to run the arrow action on this line.
        // Select the line first.
        doc.selection = null;
        line.selected = true;
        try {
            app.doScript(offsets.arrowAction, "Add Arrows"); 
        } catch(e) {
            alert('Could not run "' + offsets.arrowAction + '" action from "Add Arrows" set.\nMake sure that action set exists.');
        }
        // Reapply the custom strokeWidth after the arrow action
        // to ensure it remains as defined in the offsetsTable.
        line.strokeWidth = strokeWidth;
        
        doc.selection = null;
        return line;
    }

    // ----------------------------------------------------------------
    // Helper: create the dimension text at a given (x, y), 
    // with given string, font size, and an optional rotation (degrees).
    //
    // The 'x,y' is where we *want* the bottom-center of the text to sit 
    // for horizontal text. If we do a rotation, we'll apply it after 
    // positioning, then re-adjust to keep the bounding box where we want.
    // ----------------------------------------------------------------
    function createDimText(txt, fontSize, x, y, rotateDegrees) {
        var t = doc.textFrames.add();
        t.contents = txt;

        // Set the text font to Arial Bold
        // The internal name might differ on some systems ("Arial-BoldMT")
        t.textRange.characterAttributes.textFont = textFonts.getByName("Arial-BoldMT");
        t.textRange.characterAttributes.size = fontSize;

        // Set the text color to 100% Magenta (0% Cyan, 100% Magenta, 0% Yellow, 0% Black)
        var magenta = new CMYKColor();
        magenta.cyan = 0;
        magenta.magenta = 100;
        magenta.yellow = 0;
        magenta.black = 0;
        t.textRange.fillColor = magenta;

        // Initially put the text's top-left at [x, y]
        // We'll do a quick bounding box shift so that its bottom-center 
        // aligns with [x, y] if we are not rotating. 
        t.position = [x, y]; // AI uses [left, top]

        // Figure out the bounding box
        var b = t.geometricBounds; 
        var textWidth  = b[2] - b[0];
        var textHeight = b[1] - b[3];

        // Move so that the text's *bottom center* is exactly at (x, y).
        // The top-left by default is at (x, y).
        // So we shift left by half the width, and down by the total height.
        t.position = [
            x - textWidth/2, 
            y + textHeight
        ];

        // If a rotation is requested, we rotate around the center. 
        // Then, to keep the bounding box from shifting, we measure again
        // and re-position if needed.
        if (rotateDegrees && rotateDegrees !== 0) {
            // Rotate around the center:
            t.rotate(rotateDegrees, true, true, true, true, Transformation.CENTER);

            // After rotation, re-check bounding box and shift so that the
            // "bottom" is again at the same anchor in the rotated sense.
            b = t.geometricBounds;
            var w  = b[2] - b[0];
            var h  = b[1] - b[3];
            var curCenterY = b[1] - h/2;
            var shiftX = x - b[0];
            var shiftY = y - curCenterY;
            
            t.position = [ b[0] + shiftX, b[1] + shiftY ];
        }
        
        return t;
    }

    // Helper function to format dimension numbers with proper rounding
    function formatDimension(value) {
        // First, try rounding to two decimals
        var twoDecimal = Math.round(value * 100) / 100;
        // If the difference between the original value and the two-decimal value is minimal (under 0.001),
        // we assume the value is effectively a two-decimal measurement.
        if (Math.abs(twoDecimal - value) < 0.001) {
            var str = twoDecimal.toString().replace(/\.?0+$/, '');
            return str + " in";
        } else {
            // Otherwise, preserve the extra precision by rounding to four decimals
            var fourDecimal = Math.round(value * 10000) / 10000;
            var str = fourDecimal.toString().replace(/\.?0+$/, '');
            return str + " in";
        }
    }

    // ----------------------------------------------------------------
    // MAIN LOGIC: Create dimension lines and text
    // ----------------------------------------------------------------

    // 1) HORIZONTAL dimension line (width)
    //    - offset above top edge by dimLineOffset inches
    //    - length matches object width
    var lineY = top + inchesToPoints(dimLineOffset); 
    var hLine = createDimLine(left, lineY, right, lineY);

    // Now the horizontal dimension text:
    // If wIn < 5 => 8pt else 15pt
    // The text's bottom should be textOffset above the line
    // so actual text baseline reference is lineY + textOffset(in points).
    var textY = lineY + inchesToPoints(textOffset);
    // Format width label properly
    var widthLabel = formatDimension(wIn);

    createDimText(widthLabel, fontSize, (left + right)/2, textY, 0);

    // 2) VERTICAL dimension line (height)
    //    - offset left of object by dimLineOffset inches
    //    - length matches object height
    var lineX = left - inchesToPoints(dimLineOffset);
    var vLine = createDimLine(lineX, top, lineX, bottom);

    // The vertical dimension text:
    var midY = (top + bottom)/2; 
    // Format height label properly
    var heightLabel = formatDimension(hIn);
    
    // Initially position the text at the line's X position
    var heightText = createDimText(heightLabel, fontSize, lineX, midY, 90);
    
    // After rotation, adjust position to maintain proper offset from original object
    var textBounds = heightText.geometricBounds;
    var textRight = textBounds[2]; // After rotation, [2] is the right edge
    var requiredX = left - inchesToPoints(dimLineOffset + textOffset);
    var adjustment = requiredX - textRight;
    
    // Move the text to maintain proper offset
    heightText.translate(adjustment, 0);

})();
