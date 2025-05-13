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
 * @param {string} labelType - Type of label (Sheets, Rolls, Die-cut)
 * @param {number} widthPts - Width in points
 * @param {number} heightPts - Height in points
 */
function adjustArtboardForLabelType(artboard, labelType, widthPts, heightPts) {
    if (labelType === "Rolls" || labelType === "Die-cut") {
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

    if (labelType === "Die-cut") {
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
 * For Die-cut labels: assigns paths as Bleed, Backer, etc.
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

    // --- Embed the legend item immediately to get a GroupItem ---
    var legendGroup = null;
    var groupsBefore = [];
    for (var i = 0; i < guidesLayer.groupItems.length; i++) {
        groupsBefore.push(guidesLayer.groupItems[i]);
    }

    try {
        placed.embed(); // 'placed' becomes invalid after this
        app.redraw(); // Ensure Illustrator processes the embedding

        var groupsAfter = [];
        for (var i = 0; i < guidesLayer.groupItems.length; i++) {
            groupsAfter.push(guidesLayer.groupItems[i]);
        }

        var foundCount = 0;
        for (var j = 0; j < groupsAfter.length; j++) {
            var isNew = true;
            for (var k = 0; k < groupsBefore.length; k++) {
                if (groupsAfter[j] === groupsBefore[k]) {
                    isNew = false;
                    break;
                }
            }
            if (isNew) {
                if (groupsAfter[j].typename === "GroupItem") {
                    legendGroup = groupsAfter[j];
                    foundCount++;
                } else {
                    // If the top-level embedded item isn't a group, try to find a group within it
                    // This handles cases where embedding might create a clip group or other structures
                    if (groupsAfter[j].typename === "CompoundPathItem" && groupsAfter[j].pathItems.length > 0 && groupsAfter[j].pathItems[0].typename === "GroupItem") {
                         legendGroup = groupsAfter[j].pathItems[0]; // Example for a specific structure
                         foundCount++;
                    } else if (groupsAfter[j].pageItems && groupsAfter[j].pageItems.length === 1 && groupsAfter[j].pageItems[0].typename === "GroupItem") {
                        legendGroup = groupsAfter[j].pageItems[0];
                        foundCount++;
                    }
                }
            }
        }

        if (foundCount !== 1 || !legendGroup) {
            // Fallback: If exactly one item was added by embedding (even if not a group initially), use it.
            // This handles cases where embedding a simple AI file might not wrap it in an explicit top-level group.
            if (guidesLayer.pageItems.length === groupsBefore.length + 1 && placed.typename !== "PlacedItem" /* means it was replaced */ ) {
                 // The item that replaced 'placed' might be our legend. This is heuristic.
                 // A more robust way would be to check all items if the group search fails.
                 // For now, let's assume the prior group search is primary.
            }
            if (!legendGroup) { // If still not found
                 alert("Error: Could not uniquely identify the legend group after embedding. Found " + foundCount + " new groups. Please check the legend file structure.");
                 // Clean up potentially orphaned new items if possible, or leave for manual check
                 return;
            }
        }
    } catch (e) {
        alert("Error embedding legend file: " + e);
        if (placed && placed.isValid) placed.remove(); // Clean up placed item if embedding failed
        return;
    }

    legendGroup.name = "Legends";

    // --- Get necessary bounds for scaling constraints ---
    var whiteGB = whiteRect.geometricBounds;
    var whiteWidth = whiteGB[2] - whiteGB[0];
    var whiteBottom = whiteGB[3];

    var bleedObj = findObjectByName(guidesLayer, "Bleed");
    if (!bleedObj) {
        alert("Bleed object not found. Unable to properly position legend.");
        legendGroup.remove(); // Clean up
        return;
    }
    var bleedGB = bleedObj.geometricBounds;
    var bleedBottom = bleedGB[3];

    // --- Get initial dimensions of the legend group ---
    var groupInitialWidth = legendGroup.width;
    var groupInitialHeight = legendGroup.height;

    // --- Calculate scaling constraints ---
    var actualDistanceForLegendSpace = Math.abs(whiteBottom - bleedBottom);
    var maxAllowedHeight = -1;
    if (actualDistanceForLegendSpace > 0) {
        maxAllowedHeight = actualDistanceForLegendSpace / 3;
    }

    var targetWidth = -1;
    if (whiteWidth > 0) {
        targetWidth = 0.8 * whiteWidth;
    }

    // --- Calculate scale factors for height and width constraints ---
    var scaleFactorForHeight = Infinity;
    if (groupInitialHeight > 0 && maxAllowedHeight > 0) {
        scaleFactorForHeight = (maxAllowedHeight / groupInitialHeight) * 100;
    }

    var scaleFactorForWidth = Infinity;
    if (groupInitialWidth > 0 && targetWidth > 0) {
        scaleFactorForWidth = (targetWidth / groupInitialWidth) * 100;
    }

    // --- Choose the smaller (more restrictive) scale factor ---
    var finalScaleFactor = Math.min(scaleFactorForHeight, scaleFactorForWidth);

    // If no valid scaling constraint was applicable (e.g., zero dimensions/space) or scale factor is non-positive, default to no scaling.
    if (finalScaleFactor === Infinity || finalScaleFactor <= 0) {
        finalScaleFactor = 100; // Default to 100% (no change)
    }

    // --- Apply the final scale factor ---
    legendGroup.resize(finalScaleFactor, finalScaleFactor, true, true, true, true, true, Transformation.CENTER);
    app.redraw();

    // --- Position the legendGroup ---
    var finalBounds = legendGroup.geometricBounds; // Use geometricBounds for positioning
    var finalWidth = finalBounds[2] - finalBounds[0];
    var finalHeight = finalBounds[1] - finalBounds[3];

    // Horizontal center alignment:
    var whiteCenterX = (whiteGB[0] + whiteGB[2]) / 2;
    var legendCenterX = (finalBounds[0] + finalBounds[2]) / 2;
    var dx = whiteCenterX - legendCenterX;

    // Vertical: center the legend between the bottom of the white backer and the bottom of the bleed
    var midpoint = (whiteBottom + bleedBottom) / 2;
    var legendCenterY = (finalBounds[1] + finalBounds[3]) / 2;
    var dy = midpoint - legendCenterY;

    legendGroup.translate(dx, dy);
    app.redraw();
} 