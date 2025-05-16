/*
 * WORKFLOW: High-level orchestration for the Label Proof script.
 * Collects user input, delegates to illustrator helpers, positions legend, etc.
 */

// Include dependencies – order matters
//@include "constants.jsx"
//@include "geometry.jsx"
//@include "illustrator.jsx"
//@include "ui.jsx"

// ---------------------------------------------------------------------------
// Main public entry (was createRectangleWithDielineStroke in main.jsx)
// ---------------------------------------------------------------------------

function createRectangleWithDielineStroke() {
    var config = getUserSelections();
    if (!config) return; // user cancelled

    var widthPts  = config.widthInches  * INCH_TO_POINTS;
    var heightPts = config.heightInches * INCH_TO_POINTS;

    var doc = createDocument(config.widthInches, config.heightInches, "LabelProof");
    fitViewToArt(doc);

    // Spot colours used throughout
    var dielineColorSpot     = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);
    var dimensionColorSpot   = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    var bleedLineSpotColor   = createSpotColor(doc, BLEEDLINE_COLOR_NAME, BLEEDLINE_COLOR_CMYK);

    // Draw primary shape
    var shape = createLabelShape(doc, config.shapeType, widthPts, heightPts);
    applyStrokeToShape(shape, dielineColorSpot, 1, "Dieline");

    doc.selection = [shape];

    // Run offset action recorded in Illustrator
    if (!runOffsetAction(config.labelType)) {
        alert("Error running offset action. Please try again.");
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
    // Dimensioning & legend / backer
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
        createDimensionLinesForObject(doc, dielineObj, config.labelType, dimensionColorSpot);

        // ----- White backer rectangle --------------------------------------------------
        var whiteLayer = doc.layers.add();
        whiteLayer.name = "White Background";
        whiteLayer.zOrder(ZOrderMethod.SENDTOBACK);

        var widthScale  = getScaleFactor(config.widthInches);
        var heightScale = getScaleFactor(config.heightInches);
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

        // Legend
        var legendFileName = getLegendFileName(config);
        addLegend(doc, legendFileName, whiteRect);

        whiteLayer.locked = true;
    }
} 