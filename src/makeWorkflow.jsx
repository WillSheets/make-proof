/*
 * makeWorkflow.jsx - Core logic for Make mode
 * Creates a new proof template from scratch based on user specifications
 */

//@include "constants.jsx"
//@include "geometry.jsx"
//@include "illustrator.jsx"
//@include "makeUI.jsx"

/**
 * Main workflow function for Make mode
 * Creates a new proof template based on user specifications
 * @param {Object} config - Configuration object from UI
 */
function runMakeWorkflow(config) {
    // If no config provided, something went wrong
    if (!config) {
        alert("No configuration provided to Make workflow");
        return;
    }
    
    // Handle orientation swap if requested
    var widthInches = config.widthInches;
    var heightInches = config.heightInches;
    if (config.swapOrientation) {
        var temp = widthInches;
        widthInches = heightInches;
        heightInches = temp;
    }
    
    var widthPts  = widthInches  * INCH_TO_POINTS;
    var heightPts = heightInches * INCH_TO_POINTS;

    // Create new document
    var doc = createDocument(widthInches, heightInches, "LabelProof");
    fitViewToArt(doc);

    // Create spot colors used throughout
    var dielineColorSpot     = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);
    var dimensionColorSpot   = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    var bleedLineSpotColor   = createSpotColor(doc, BLEEDLINE_COLOR_NAME, BLEEDLINE_COLOR_CMYK);

    // Draw primary shape
    var shape = createLabelShape(doc, config.shapeType, widthPts, heightPts);
    applyStrokeToShape(shape, dielineColorSpot, 1, "Dieline");

    doc.selection = [shape];

    // Run offset action recorded in Illustrator
    if (!runOffsetAction(config.labelType)) {
        alert("Error running offset action. Please ensure the \"Offset\" action set is available with actions for: " + config.labelType);
        return;
    }

    // If offsets created additional paths, classify them
    if (doc.selection.length > 1) {
        if (shape) shape.selected = false;
        handleMultiplePaths(doc, config.labelType, dielineColorSpot, bleedLineSpotColor);
        adjustArtboardForLabelType(doc.artboards[0], config.labelType, widthPts, heightPts);
    } else {
        if (doc.selection.length === 1) shape = doc.selection[0];
    }

    organizeLayers(doc, config.labelType, bleedLineSpotColor);
    fitViewToArt(doc);

    // --------------------------------------------------------------------
    // Dimensioning & legend / white backer
    // --------------------------------------------------------------------

    var guidesLayer = doc.layers.getByName("Guides");
    var bleedObj    = findObjectByName(guidesLayer, "Bleed");
    var dielineObj  = findObjectByName(guidesLayer, "Dieline");

    if (!dielineObj) {
        if (shape && shape.isValid && shape.name === "Dieline") {
            dielineObj = shape;
        } else {
            alert("Cannot locate a valid Dieline path – aborting.");
            return;
        }
    }

    if (config.addGuidelines) {
        var whiteRectForDimensions = null; // Initialize before potentially creating whiteRect
        var bleedObjBoundsForDimensions = null;

        if (bleedObj) { // Ensure bleedObj exists before accessing its bounds
            bleedObjBoundsForDimensions = bleedObj.geometricBounds;
        }

        // ----- White backer rectangle --------------------------------------------------
        var whiteLayer = doc.layers.add();
        whiteLayer.name = "White Background";
        whiteLayer.zOrder(ZOrderMethod.SENDTOBACK);

        var widthScale  = getScaleFactor(widthInches);
        var heightScale = getScaleFactor(heightInches);
        var dielineBounds = dielineObj.geometricBounds;
        var baseWidthPts  = dielineBounds[2] - dielineBounds[0];
        var baseHeightPts = dielineBounds[1] - dielineBounds[3];
        var finalWidthPts  = baseWidthPts  * widthScale;
        var finalHeightPts = baseHeightPts * heightScale;

        var whiteBackerSpotColor = createWhiteBackerColor(doc);

        var centerX = (dielineBounds[0] + dielineBounds[2]) / 2;
        var centerY = (dielineBounds[1] + dielineBounds[3]) / 2;
        var rectTop  = centerY + finalHeightPts / 2;
        var rectLeft = centerX - finalWidthPts / 2;
        var whiteRect = whiteLayer.pathItems.rectangle(rectTop, rectLeft, finalWidthPts, finalHeightPts);
        whiteRect.stroked = false;
        whiteRect.filled  = true;
        whiteRect.fillColor = whiteBackerSpotColor;
        whiteRectForDimensions = whiteRect.geometricBounds; // Assign after creation

        // Call createDimensionLinesForObject *after* whiteRect is created and its bounds are available
        createDimensionLinesForObject(doc, dielineObj, config.labelType, dimensionColorSpot, bleedObjBoundsForDimensions, whiteRectForDimensions);

        // Legend
        var legendFileName = getLegendFileName(config);
        addLegend(doc, legendFileName, whiteRect);

        whiteLayer.locked = true;
    }

    // Final fit to view
    fitViewToArt(doc);
}

// ============================================================================
// PUBLIC API
// ============================================================================

if (!$.global.MakeWorkflow) {
    $.global.MakeWorkflow = {
        run: runMakeWorkflow
    };
} 