/************************************************************
 * dimensioning.jsx
 * 
 * Creates dimensioning lines and measurements for a given object
 * in Adobe Illustrator, based on label type and object size.
 * 
 * Relies on constants defined in constants.jsx and the "Guides" layer.
 * Requires the "Add Arrows" action set with "50%" and "75%" actions.
 ************************************************************/

//@include "constants.jsx" // Ensure constants are available

/**
 * Creates dimension lines and measurements for a specific target object.
 * @param {Document} doc The active Illustrator document.
 * @param {PageItem} targetObject The object to measure (e.g., the main label shape).
 * @param {string} labelType The type of label ("Rolls", "Sheets", "Die-cut").
 * @param {SpotColor} dimensionColorSpot The pre-created spot color to use for dimension lines/text.
 */
function createDimensionLinesForObject(doc, targetObject, labelType, dimensionColorSpot) {

    // --- Get Configuration ---
    // Use the dimension font name from constants.jsx
    var FONT_NAME = DIMENSION_FONT_NAME; 
    // Use the action set name from constants.jsx
    var ACTION_SET_NAME = DIMENSION_ACTION_SET_NAME; 

    // Ensure the target object is valid
    if (!targetObject) {
        alert("Error: No target object provided for dimensioning.");
        return;
    }
    // Ensure the color is provided
     if (!dimensionColorSpot) {
        alert("Error: DimensionLine spot color was not provided to createDimensionLinesForObject.");
        return;
    }
    
    var sel = targetObject; // Use the passed object
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

    // Get the Guides layer
    var guidesLayer;
    try {
        guidesLayer = doc.layers.getByName("Guides");
    } catch (e) {
        alert("Error: 'Guides' layer not found. Cannot add dimension lines.");
        return;
    }

    // --- Utility Functions (Scoped within the main function) ---
    
    // Utility function: convert inches to points
    function inchesToPoints(inches) {
        return inches * 72;
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

    // Get the size category based on object dimensions
    var sizeCategory = getSizeCategory(wIn, hIn);

    // Get the appropriate offsets based on choice (labelType) and size category from the global table
    // Ensure labelType exists in the table, default to Sheets if not (or handle error)
    var typeOffsets = DIMENSION_OFFSETS_TABLE[labelType];
    if (!typeOffsets) {
        alert("Warning: Unknown label type '" + labelType + "' for dimensioning. Using 'Sheets' defaults.");
        typeOffsets = DIMENSION_OFFSETS_TABLE["Sheets"];
    }
    var offsets = typeOffsets[sizeCategory];
    if (!offsets) {
        alert("Warning: Could not find dimension offsets for size category '" + sizeCategory + "' and label type '" + labelType + "'. Using defaults.");
        // Provide some fallback default if necessary, or use a base category like "1to2"
        offsets = typeOffsets["1to2"] || DIMENSION_OFFSETS_TABLE["Sheets"]["1to2"]; 
    }

    var dimLineOffset = offsets.dimLine;
    var textOffset = offsets.text;
    var strokeWidth = offsets.strokeWidth;
    var fontSize = offsets.fontSize;
    var arrowActionName = offsets.arrowAction; // Use the action name from the table

    // ----------------------------------------------------------------
    // Helper: create a single dimension line (path) on the Guides layer
    // ----------------------------------------------------------------
    function createDimLine(x1, y1, x2, y2) {
        // Create the line within the guidesLayer
        var line = guidesLayer.pathItems.add(); 
        line.stroked = true;
        line.strokeWidth = strokeWidth;
        // Use the DimensionLine spot color
        line.strokeColor = dimensionColorSpot; 
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
            // Use the action name from constants/offsetsTable
            app.doScript(arrowActionName, ACTION_SET_NAME); 
        } catch(e) {
            alert('Could not run "' + arrowActionName + '" action from "' + ACTION_SET_NAME + '" set.\nMake sure that action set and action exist.');
        }
        // Reapply the custom strokeWidth and color after the arrow action
        // to ensure it remains as defined in the offsetsTable.
        line.strokeWidth = strokeWidth;
        line.strokeColor = dimensionColorSpot; // Re-apply color as action might change it
        
        doc.selection = null;
        return line;
    }

    // ----------------------------------------------------------------
    // Helper: create the dimension text at a given (x, y), 
    // with given string, font size, and an optional rotation (degrees).
    // Creates text on the Guides layer.
    // ----------------------------------------------------------------
    function createDimText(txt, fontSize, x, y, rotateDegrees) {
        // Create the text frame within the guidesLayer
        var t = guidesLayer.textFrames.add(); 
        t.contents = txt;

        // Set the text font using the constant FONT_NAME
        try {
            t.textRange.characterAttributes.textFont = textFonts.getByName(FONT_NAME);
        } catch (fontError) {
            alert("Error: Font '" + FONT_NAME + "' not found for dimensions. Please ensure it is installed.\n" + fontError);
             // Optionally, set a default font or stop the script
             t.remove(); // Remove the incomplete text frame
             return null; // Indicate failure
        }
        t.textRange.characterAttributes.size = fontSize;

        // Set the text color to the DimensionLine spot color
        t.textRange.fillColor = dimensionColorSpot; 

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

            // ** Simpler adjustment for rotated text **
            // For 90-degree rotation (height dimension), we want the text's 
            // effective 'bottom' (which is now its right edge after rotation)
            // to be aligned correctly based on the textOffset.
            // The createDimText call for vertical text handles the final adjustment.
            
            // No complex repositioning here, let the caller handle final offset adjustment.
        }
        
        return t;
    }

    // Helper function to format dimension numbers with proper rounding
    function formatDimension(value) {
        // First, try rounding to two decimals
        var twoDecimal = Math.round(value * 100) / 100;
        // If the difference between the original value and the two-decimal value is minimal (under 0.001),
        // we assume the value is effectively a two-decimal measurement. This avoids trailing zeros for simple fractions like 1.50.
        if (Math.abs(twoDecimal - value) < 0.001) {
            var str = twoDecimal.toString().replace(/\.?0+$/, ''); // Remove trailing .0 or .00
            // Ensure there's at least one digit after decimal if it started with one (e.g., 1.0 -> 1, but 1.5 -> 1.5)
            // Refined check: only add ".0" if it was originally integer-like ending in .0
             if (str.indexOf('.') === -1 && value.toString().match(/\.0+$/)) {
                 str += ".0"; 
            } else if (str.indexOf('.') === -1 && value % 1 !== 0 && !value.toString().match(/\.0+$/) ) {
                // Handle cases like 1.5 that became "15" then "1.5" but might lose the decimal if exactly 1.5000
                // This might still need refinement depending on exact desired formatting for all cases.
                // Simplified: just return the twoDecimal string representation if it's close enough
                str = twoDecimal.toFixed(2).replace(/\.?0+$/, ''); // Recalculate to handle precision issues
            }
            // Final check to prevent cases like "1" when it should be "1.0"
            if (str.indexOf('.') === -1 && value.toString().indexOf('.') > -1 && value.toString().match(/\.0+$/)) {
                 str += ".0";
            }

             return str + "\""; // Use inch marks instead of " in"
        } else {
            // Otherwise, preserve the extra precision by rounding to four decimals
            var fourDecimal = Math.round(value * 10000) / 10000;
            var str = fourDecimal.toString().replace(/\.?0+$/, ''); // Remove trailing zeros
            // Ensure it doesn't become integer representation if it had decimals
            if (str.indexOf('.') === -1 && value.toString().indexOf('.') > -1) {
                // Find the first non-zero digit after the decimal to determine precision needed
                var decimals = value.toString().split('.')[1] || "";
                var precision = 0;
                for (var i = 0; i < decimals.length; i++) {
                    if (decimals[i] !== '0') {
                        precision = i + 1;
                        break;
                    }
                }
                 precision = Math.max(2, Math.min(4, precision)); // Ensure 2-4 decimals shown if needed
                str = fourDecimal.toFixed(precision);

            }
            return str + "\""; // Use inch marks
        }
    }

    // ----------------------------------------------------------------
    // MAIN LOGIC: Create dimension lines and text on Guides Layer
    // ----------------------------------------------------------------

    // 1) HORIZONTAL dimension line (width)
    //    - offset above top edge by dimLineOffset inches
    //    - length matches object width
    var lineY = top + inchesToPoints(dimLineOffset); 
    var hLine = createDimLine(left, lineY, right, lineY);

    // Now the horizontal dimension text:
    // The text's bottom should be textOffset above the line
    // so actual text baseline reference is lineY + textOffset(in points).
    var textY = lineY + inchesToPoints(textOffset);
    // Format width label properly
    var widthLabel = formatDimension(wIn);

    var hText = createDimText(widthLabel, fontSize, (left + right)/2, textY, 0);
    // Check if text creation failed (e.g., due to missing font)
    if (!hText) {
        alert("Failed to create width dimension text.");
        // Clean up created line? Optional.
        // if (hLine) hLine.remove(); 
        return; // Stop script if text couldn't be created
    }
    // Group the horizontal line and text
    var widthGroup = guidesLayer.groupItems.add();
    widthGroup.name = "Width";
    if (hLine) hLine.move(widthGroup, ElementPlacement.PLACEATEND);
    if (hText) hText.move(widthGroup, ElementPlacement.PLACEATEND);


    // 2) VERTICAL dimension line (height)
    //    - offset left of object by dimLineOffset inches
    //    - length matches object height
    var lineX = left - inchesToPoints(dimLineOffset);
    var vLine = createDimLine(lineX, top, lineX, bottom);

    // The vertical dimension text:
    var midY = (top + bottom)/2; 
    // Format height label properly
    var heightLabel = formatDimension(hIn);
    
    // Initially position the text at the line's X position, centered vertically
    // The rotation happens inside createDimText
    var heightText = createDimText(heightLabel, fontSize, lineX, midY, 90);
    // Check if text creation failed
    if (!heightText) {
         alert("Failed to create height dimension text.");
         // Clean up created lines? Optional.
         // if (hLine) hLine.remove(); 
         // if (hText) hText.remove();
         // if (vLine) vLine.remove();
         return; // Stop script if text couldn't be created
    }
    
    // After rotation, adjust position to maintain proper offset from original object
    // We want the right edge of the text's bounding box to be textOffset points
    // to the left of the dimension line (lineX).
    app.redraw(); // Ensure bounds are updated after rotation
    var textBounds = heightText.geometricBounds; // [left, top, right, bottom] of the rotated text
    var textRight = textBounds[2]; // After 90deg rotation, [2] is the effective 'right' edge (top of original text)
    
    // Calculate the desired X position for the right edge of the text bounds
    var desiredTextRightX = lineX - inchesToPoints(textOffset);
    
    // Calculate the horizontal adjustment needed
    var adjustmentX = desiredTextRightX - textRight;
    
    // Calculate vertical adjustment to ensure it's centered along the dimension line Y-axis
    var textCenterY = (textBounds[1] + textBounds[3]) / 2;
    var adjustmentY = midY - textCenterY;

    // Move the text to the final position
    heightText.translate(adjustmentX, adjustmentY);

    // Group the vertical line and text
    var heightGroup = guidesLayer.groupItems.add();
    heightGroup.name = "Height";
    if (vLine) vLine.move(heightGroup, ElementPlacement.PLACEATEND);
    if (heightText) heightText.move(heightGroup, ElementPlacement.PLACEATEND);

    // Deselect everything at the end
    doc.selection = null; 

} // End of createDimensionLinesForObject function 