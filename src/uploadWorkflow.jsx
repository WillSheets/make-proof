/*
 * uploadWorkflow.jsx - Core logic for Upload mode
 * Processes an existing Illustrator file as a proof template
 */

//@include "constants.jsx"
//@include "geometry.jsx"
//@include "illustrator.jsx"
//@include "uploadUI.jsx"

/**
 * Main workflow function for Upload mode
 * Opens and processes an existing Illustrator file as a proof template
 * @param {Object} config - Configuration object from UI
 */
function runUploadWorkflow(config) {
    // If no config provided, something went wrong
    if (!config) {
        alert("No configuration provided to Upload workflow");
        return;
    }
    
    // Open the selected file
    var doc;
    try {
        doc = app.open(config.dieLineFile);
    } catch (e) {
        alert("Error opening file: " + e.toString());
        return;
    }
    
    // Create spot colors used throughout
    var dielineColorSpot     = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);
    var dimensionColorSpot   = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    var bleedLineSpotColor   = createSpotColor(doc, BLEEDLINE_COLOR_NAME, BLEEDLINE_COLOR_CMYK);
    
    // Find the main shape (dieline) in the document
    var shape = null;
    var largestArea = 0;
    
    // Search for the largest path item in the document
    for (var i = 0; i < doc.pathItems.length; i++) {
        var item = doc.pathItems[i];
        var area = getArea(item);
        if (area > largestArea) {
            largestArea = area;
            shape = item;
        }
    }
    
    if (!shape) {
        alert("No suitable dieline shape found in the uploaded file.");
        return;
    }
    
    // Apply dieline styling to the found shape
    shape.name = "Dieline";
    applyStrokeToShape(shape, dielineColorSpot, 1, "Dieline");
    
    // Get dimensions from the shape
    var bounds = shape.visibleBounds;
    var widthPts = bounds[2] - bounds[0];
    var heightPts = bounds[1] - bounds[3];
    var widthInches = widthPts / INCH_TO_POINTS;
    var heightInches = heightPts / INCH_TO_POINTS;
    
    // Handle orientation swap if requested
    if (config.swapOrientation) {
        var temp = widthInches;
        widthInches = heightInches;
        heightInches = temp;
        temp = widthPts;
        widthPts = heightPts;
        heightPts = temp;
        
        // Rotate the shape 90 degrees
        shape.rotate(90);
    }
    
    // Select the shape for offset action
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
        var whiteRectForDimensions = null;
        var bleedObjBoundsForDimensions = null;
        
        if (bleedObj) {
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
        whiteRectForDimensions = whiteRect.geometricBounds;
        
        // Call createDimensionLinesForObject
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

if (!$.global.UploadWorkflow) {
    $.global.UploadWorkflow = {
        run: runUploadWorkflow
    };
} 