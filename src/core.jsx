/*
 * CORE: Core functionality for the Label Proof script
 */

// Include dependencies
//@include "constants.jsx"
//@include "utils.jsx"

/**
 * Creates a new CMYK Illustrator document at the specified dimensions.
 * @param {number} widthInches - Width in inches
 * @param {number} heightInches - Height in inches
 * @param {string} title - The desired title for the new document
 * @returns {Document} The created document
 */
function createDocument(widthInches, heightInches, title) {
    // Ensure temporary dimensions are at least 1 inch to avoid errors
    var tempWidth = Math.max(widthInches, 1);
    var tempHeight = Math.max(heightInches, 1);

    // Set up the document preset with inches as the unit
    var docPreset = new DocumentPreset();
    docPreset.units = RulerUnits.Inches;
    docPreset.width = tempWidth;
    docPreset.height = tempHeight;
    docPreset.colorMode = DocumentColorSpace.CMYK;
    if (title) {
        docPreset.title = title;
    }

    // Create the document
    var doc = app.documents.addDocument(DocumentColorSpace.CMYK, docPreset);

    // Set ruler units to inches with larger dimensions
    doc.rulerUnits = RulerUnits.Inches;

    // Resize the artboard to the desired dimensions (convert inches to points)
    var desiredWidthPts = widthInches * 72;  // 72 points = 1 inch
    var desiredHeightPts = heightInches * 72;
    var artboard = doc.artboards[0];
    artboard.artboardRect = [0, desiredHeightPts, desiredWidthPts, 0];

    return doc;
}

/**
 * Adjusts the artboard size based on label type.
 * @param {Artboard} artboard - The artboard to adjust
 * @param {string} labelType - Type of label (Sheets, Rolls, Die Cut)
 * @param {number} widthPts - Width in points
 * @param {number} heightPts - Height in points
 */
function adjustArtboardForLabelType(artboard, labelType, widthPts, heightPts) {
    if (labelType === "Rolls" || labelType === "Die Cut") {
        var bleed = (labelType === "Rolls") ? 0.0625 : 0.1875;
        var bleedPts = bleed * INCH_TO_POINTS;
        var newArtboardRect = [
            -bleedPts,
            heightPts + bleedPts,
            widthPts + bleedPts,
            -bleedPts
        ];
        artboard.artboardRect = newArtboardRect;
    }
}

/**
 * Creates the main label shape (rectangle, rounded rectangle, or ellipse) in points.
 * @param {Document} doc - The document
 * @param {string} shapeType - Type of shape (Squared, Rounded, Round)
 * @param {number} widthPts - Width in points
 * @param {number} heightPts - Height in points
 * @returns {PathItem} The created shape
 */
function createLabelShape(doc, shapeType, widthPts, heightPts) {
    var lowerShapeType = shapeType.toLowerCase();
    var shape;
    if (lowerShapeType === "round") {
        shape = doc.pathItems.ellipse(heightPts, 0, widthPts, heightPts);
    } else if (lowerShapeType === "rounded") {
        shape = doc.pathItems.roundedRectangle(heightPts, 0, widthPts, heightPts, 9, 9);
    } else {
        shape = doc.pathItems.rectangle(heightPts, 0, widthPts, heightPts);
    }
    return shape;
}

/**
 * Applies stroke to a shape with given spot color and name.
 * @param {PathItem} shape - The shape to apply stroke to
 * @param {SpotColor} strokeColor - The stroke color
 * @param {number} strokeWidth - Width of stroke
 * @param {string} name - Name to assign to the shape
 */
function applyStrokeToShape(shape, strokeColor, strokeWidth, name) {
    shape.filled = false;
    shape.stroked = true;
    shape.strokeColor = strokeColor;
    shape.strokeWidth = strokeWidth;
    if (name) shape.name = name;
}

/**
 * Handles multiple paths created by offset action, sets up Safezone, Dieline, etc.
 * @param {Document} doc - The document
 * @param {string} labelType - Type of label
 * @param {SpotColor} dielineColorSpot - Color for dieline
 * @param {SpotColor} bleedLineSpotColor - Spot color for the bleed line
 */
function handleMultiplePaths(doc, labelType, dielineColorSpot, bleedLineSpotColor) {
    var smallestPath = doc.selection[0];
    var smallestArea = getArea(smallestPath);
    var originalDielinePath = null;

    for (var i = 0; i < doc.selection.length; i++) {
        var candidate = doc.selection[i];
        var candidateArea = getArea(candidate);
        if (candidateArea < smallestArea) {
            smallestPath = candidate;
            smallestArea = candidateArea;
        }
        if (candidate.name === "Dieline") {
            originalDielinePath = candidate;
        }
    }

    if (labelType === "Die Cut") {
        var cutToPathSpotColor = createSpotColor(doc, "SEI-CutToPart", [62.66, 0, 100, 0]);
        handleDieCutPaths(doc, originalDielinePath, dielineColorSpot, cutToPathSpotColor, bleedLineSpotColor);
    }

    // Safezone
    doc.selection = [smallestPath];
    smallestPath.name = "Safezone";
    smallestPath.strokeDashes = [5];
    smallestPath.strokeWidth = 1;
    smallestPath.strokeColor = createSpotColor(doc, "Safezone", [0, 0, 0, 50]);
}

/**
 * For Die Cut labels: assigns paths as Bleed, Backer, etc.
 * @param {Document} doc - The document
 * @param {PathItem} originalDielinePath - Original dieline path
 * @param {SpotColor} dielineColorSpot - Dieline color
 * @param {SpotColor} cutToPathSpotColor - Cut-to-part color
 * @param {SpotColor} bleedLineSpotColor - Spot color for the bleed line
 */
function handleDieCutPaths(doc, originalDielinePath, dielineColorSpot, cutToPathSpotColor, bleedLineSpotColor) {
    var unnamedPaths = [];
    for (var pIndex = 0; pIndex < doc.pathItems.length; pIndex++) {
        var p = doc.pathItems[pIndex];
        if (!p.name || p.name === "") {
            unnamedPaths.push({ path: p, area: getArea(p) });
        }
    }
    unnamedPaths.sort(function(a, b) {
        return b.area - a.area;
    });

    if (unnamedPaths.length >= 2) {
        var bleedPath = unnamedPaths[0].path;
        bleedPath.name = "Bleed";
        bleedPath.strokeColor = bleedLineSpotColor;

        var backerPath = unnamedPaths[1].path;
        backerPath.name = "Backer";
        backerPath.strokeColor = cutToPathSpotColor;
    }
    if (originalDielinePath) {
        originalDielinePath.strokeColor = dielineColorSpot;
    }

    var guidesLayer = doc.layers[0];
    var bleedObject = null, backerObject = null, dielineObject = null, safezoneObject = null;

    for (var i = 0; i < guidesLayer.pageItems.length; i++) {
        var item = guidesLayer.pageItems[i];
        switch (item.name) {
            case "Bleed": bleedObject = item; break;
            case "Backer": backerObject = item; break;
            case "Dieline": dielineObject = item; break;
            case "Safezone": safezoneObject = item; break;
        }
    }

    if (safezoneObject) safezoneObject.zOrder(ZOrderMethod.SENDBACKWARD);
    if (dielineObject) dielineObject.zOrder(ZOrderMethod.SENDBACKWARD);
    if (backerObject) backerObject.zOrder(ZOrderMethod.BRINGFORWARD);
    if (bleedObject) bleedObject.zOrder(ZOrderMethod.BRINGTOFRONT);
}

/**
 * Organize layers into Guides and Art, set Bleed where appropriate.
 * @param {Document} doc - The document
 * @param {string} labelType - Type of label
 * @param {SpotColor} bleedLineSpotColor - Spot color for the bleed line
 */
function organizeLayers(doc, labelType, bleedLineSpotColor) {
    var guidesLayer = doc.layers[0];
    guidesLayer.name = "Guides";

    var artLayer = doc.layers.add();
    artLayer.name = "Art";
    artLayer.zOrder(ZOrderMethod.SENDBACKWARD);

    if ((labelType === "Sheets" || labelType === "Rolls") && guidesLayer.pageItems.length > 0) {
        var lastObject = guidesLayer.pageItems[guidesLayer.pageItems.length - 1];
        lastObject.name = "Bleed";

        lastObject.strokeColor = bleedLineSpotColor;
        lastObject.zOrder(ZOrderMethod.BRINGTOFRONT);
    }

    app.redraw();
    $.sleep(100);
}

/**
 * Places the legend file, scales it, and positions it according to the given rules.
 * @param {Document} doc - The document
 * @param {string} legendFileName - Name of the legend file
 * @param {PathItem} whiteRect - White background rectangle
 */
function addLegend(doc, legendFileName, whiteRect) {
    var legendFile = new File(LEGENDS_FOLDER_PATH + "/" + legendFileName);
    if (!legendFile.exists) {
        alert("Legend file not found: " + legendFile.fsName);
        return;
    }

    var guidesLayer = doc.layers.getByName("Guides");
    var placed = guidesLayer.placedItems.add();
    placed.file = legendFile;

    app.redraw();

    // Get geometric bounds of placed item
    var gb = placed.geometricBounds; // [left, top, right, bottom]
    var placedWidth = gb[2] - gb[0];
    var placedHeight = gb[1] - gb[3];

    // White backer bounds
    var whiteGB = whiteRect.geometricBounds;
    var whiteBottom = whiteGB[3];
    var whiteWidth = whiteGB[2] - whiteGB[0];

    // Find the bleed object for vertical positioning
    var bleedObj = findObjectByName(guidesLayer, "Bleed");
    if (!bleedObj) {
        alert("Bleed object not found. Unable to properly position legend.");
        return;
    }
    var bleedGB = bleedObj.geometricBounds;
    var bleedBottom = bleedGB[3];

    // Vertical distance between bottoms
    var verticalDistance = whiteBottom - bleedBottom;
    // Desired legend height = 1/3 of verticalDistance
    var desiredHeight = verticalDistance / 3;

    // Scale factor to achieve desiredHeight
    var scaleFactorH = (desiredHeight / placedHeight) * 100;

    // New width constraint: Legend should not exceed 80% of the white backer's width
    var scaleFactorW = (0.8 * whiteWidth / placedWidth) * 100;

    // Choose the minimum scale factor to satisfy both height and width constraints
    var finalScaleFactor = Math.min(scaleFactorH, scaleFactorW);

    // Apply the final scale factor
    placed.resize(finalScaleFactor, finalScaleFactor, false, false, true, true, true, Transformation.CENTER);

    app.redraw();

    // Recalculate geometric bounds after scaling
    gb = placed.geometricBounds;
    var newWidth = gb[2] - gb[0];
    var newHeight = gb[1] - gb[3];

    // Horizontal center alignment:
    var whiteCenterX = (whiteGB[0] + whiteGB[2]) / 2;
    var legendCenterX = (gb[0] + gb[2]) / 2;
    var dx = whiteCenterX - legendCenterX;

    // Vertical: center the legend between the bottom of the white backer and the bottom of the bleed
    var midpoint = (whiteBottom + bleedBottom) / 2;
    var legendCenterY = (gb[1] + gb[3]) / 2;
    var dy = midpoint - legendCenterY;

    // Translate the placed item to its final position
    placed.translate(dx, dy);

    // Embed the placed item
    var guidesLayer = doc.layers.getByName("Guides"); // Ensure we have the layer reference
    var groupsBefore = [];
    for (var i = 0; i < guidesLayer.groupItems.length; i++) {
        groupsBefore.push(guidesLayer.groupItems[i]); // Store references
    }

    try {
        placed.embed(); // 'placed' becomes invalid after this

        var groupsAfter = [];
        for (var i = 0; i < guidesLayer.groupItems.length; i++) {
            groupsAfter.push(guidesLayer.groupItems[i]);
        }

        // Find the new group
        var newGroup = null;
        var foundCount = 0;
        for (var j = 0; j < groupsAfter.length; j++) {
            var isNew = true;
            for (var k = 0; k < groupsBefore.length; k++) {
                // Compare references to see if this group existed before
                if (groupsAfter[j] === groupsBefore[k]) { 
                    isNew = false;
                    break;
                }
            }
            if (isNew) {
                // Check if the new item is actually a GroupItem before assigning
                if (groupsAfter[j].typename === "GroupItem") { 
                    newGroup = groupsAfter[j];
                    foundCount++;
                }
            }
        }

        // Rename if exactly one new group was found
        if (foundCount === 1 && newGroup) {
            newGroup.name = "Legends";
        } else if (foundCount > 1) {
             // Optional: Log or alert if embedding created multiple groups unexpectedly
            // alert("Warning: Embedding legend created multiple groups unexpectedly.");
        }
        // If foundCount is 0, embed() didn't create a new group, so we do nothing.

    } catch (e) {
        alert("Error embedding legend file: " + e);
        // Decide how to handle error
    }

    app.redraw();
} 