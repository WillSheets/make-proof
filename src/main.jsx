/*
 * MAIN: Core implementation of the Label Proof script
 */

// Include dependencies
//@include "constants.jsx"
//@include "utils.jsx"
//@include "ui.jsx"
//@include "core.jsx"

/**
 * Creates document, shape, runs offset actions, and adds guidelines if requested.
 * Called from run.jsx.
 */
function createRectangleWithDielineStroke() {
    var config = getUserSelections();
    if (!config) return; // canceled

    var widthPts = config.widthInches * INCH_TO_POINTS;
    var heightPts = config.heightInches * INCH_TO_POINTS;

    var doc = createDocument(config.widthInches, config.heightInches);
    fitViewToArt(doc);

    // Create dieline color
    var dielineColorSpot = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);

    // Create shape
    var shape = createLabelShape(doc, config.shapeType, widthPts, heightPts);
    applyStrokeToShape(shape, dielineColorSpot, 1, "Dieline");

    doc.selection = null;
    doc.selection = [shape];

    // Run offset action
    if (!runOffsetAction(config.labelType)) {
        alert("Error running offset action. Please try again.");
        return;
    }

    // Handle multiple paths if created
    if (doc.selection.length > 1) {
        handleMultiplePaths(doc, config.labelType, dielineColorSpot);
        adjustArtboardForLabelType(doc.artboards[0], config.labelType, widthPts, heightPts);
    }

    organizeLayers(doc, config.labelType);
    fitViewToArt(doc);

    // Get references to guide objects
    var guidesLayer = doc.layers.getByName("Guides");

    var bleedObj = findObjectByName(guidesLayer, "Bleed");
    var backerObj = findObjectByName(guidesLayer, "Backer");
    var dielineObj = findObjectByName(guidesLayer, "Dieline");
    var safezoneObj = findObjectByName(guidesLayer, "Safezone");

    // Check for critical objects
    if (!bleedObj) {
        alert("Bleed object not found. Please ensure your offset action creates/names a Bleed path.");
    }

    // Store geometric bounds for guide objects
    if (bleedObj) {
        var bleedBounds = bleedObj.geometricBounds; // [x1, y1, x2, y2]
    }
    if (backerObj) {
        var backerBounds = backerObj.geometricBounds;
    }
    if (dielineObj) {
        var dielineBounds = dielineObj.geometricBounds;
    }
    if (safezoneObj) {
        var safezoneBounds = safezoneObj.geometricBounds;
    }

    if (config.addGuidelines) {
        addDimensionGuidelines(doc, config);

        // Create white background
        var whiteLayer = doc.layers.add();
        whiteLayer.name = "White Background";
        whiteLayer.zOrder(ZOrderMethod.SENDTOBACK);

        // Determine scaling based on dimensions
        var widthScale = getScaleFactor(config.widthInches);
        var heightScale = getScaleFactor(config.heightInches);
        var finalWidthPts = widthPts * widthScale;
        var finalHeightPts = heightPts * heightScale;

        // Create white backer rectangle
        var whiteBackerSpotColor = createWhiteBackerColor(doc);

        // Center the rectangle
        var artRect = doc.artboards[0].artboardRect;
        var left = artRect[0], top = artRect[1], right = artRect[2], bottom = artRect[3];
        var centerX = (left + right) / 2;
        var centerY = (top + bottom) / 2;

        // Calculate rectangle position for centering
        var rectTop = centerY + (finalHeightPts / 2);
        var rectLeft = centerX - (finalWidthPts / 2);

        var whiteRect = whiteLayer.pathItems.rectangle(rectTop, rectLeft, finalWidthPts, finalHeightPts);
        whiteRect.stroked = false;
        whiteRect.filled = true;
        whiteRect.fillColor = whiteBackerSpotColor;

        // Add legend
        var legendFileName = getLegendFileName(config);
        addLegend(doc, legendFileName, whiteRect);

        // Lock the White Background layer
        whiteLayer.locked = true;
    }
}

// Remove this line to prevent double execution
// createRectangleWithDielineStroke(); 