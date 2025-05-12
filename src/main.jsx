/*
 * MAIN: Core implementation of the Label Proof script
 */

// Include dependencies
//@include "constants.jsx"
//@include "utils.jsx"
//@include "ui.jsx"
//@include "core.jsx"
//@include "dimensioning.jsx"

/**
 * Creates document, shape, runs offset actions, and adds guidelines if requested.
 * Called from run.jsx.
 */
function createRectangleWithDielineStroke() {
    var config = getUserSelections();
    if (!config) return; // canceled

    var widthPts = config.widthInches * INCH_TO_POINTS;
    var heightPts = config.heightInches * INCH_TO_POINTS;

    var doc = createDocument(config.widthInches, config.heightInches, "SLnew");
    fitViewToArt(doc);

    // Create dieline color
    var dielineColorSpot = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);
    // Create dimension line spot color (used by dimensioning.jsx)
    var dimensionColorSpot = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    // Create bleed line spot color (used by core.jsx)
    var bleedLineSpotColor = createSpotColor(doc, BLEEDLINE_COLOR_NAME, BLEEDLINE_COLOR_CMYK);

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
        // Ensure the original shape is deselected before handleMultiplePaths potentially selects the safezone
        if (shape) shape.selected = false; 
        // Pass the bleedLineSpotColor to handleMultiplePaths
        handleMultiplePaths(doc, config.labelType, dielineColorSpot, bleedLineSpotColor);
        adjustArtboardForLabelType(doc.artboards[0], config.labelType, widthPts, heightPts);
    } else {
        // If only one path after offset (e.g., Sheets/Rolls initially), the original shape is still the dieline.
        // Ensure it's still named correctly. handleMultiplePaths would normally handle safezone naming.
        // We might need to adjust logic here depending on how offsets work for Sheets/Rolls vs Die Cut.
        // Assuming the offset action *replaces* the selection for Sheets/Rolls, 
        // we might need to re-find the dieline or adjust how 'shape' is handled.
        // For now, let's assume 'shape' still refers to the dieline if selection length is 1.
        if(doc.selection.length === 1) shape = doc.selection[0]; // Update shape reference if selection changed
    }

    // Pass the bleedLineSpotColor to organizeLayers
    organizeLayers(doc, config.labelType, bleedLineSpotColor);
    fitViewToArt(doc);

    // Get references to guide objects (Bleed, Backer, Dieline, Safezone)
    var guidesLayer = doc.layers.getByName("Guides");

    var bleedObj = findObjectByName(guidesLayer, "Bleed");
    var backerObj = findObjectByName(guidesLayer, "Backer");
    var dielineObj = findObjectByName(guidesLayer, "Dieline");
    var safezoneObj = findObjectByName(guidesLayer, "Safezone");

    // Check for critical objects
    if (!bleedObj) {
        alert("Bleed object not found. Please ensure your offset action creates/names a Bleed path.");
        // Potentially return or handle error, depending on requirements
    }
    if (!dielineObj) {
         alert("Dieline object not found after offset actions.");
         // This is critical for dimensioning based on the dieline.
         // Re-assign 'shape' if it was the original and still exists?
         if (shape && shape.isValid && shape.name === "Dieline") { 
             dielineObj = shape;
             alert("Re-assigned original shape as Dieline.");
         } else {
            // Maybe search for the path with the correct area if name is lost?
            // For now, return if dieline is truly lost.
             alert("Cannot proceed without a valid Dieline object.");
             return;
         }
    }

    // Store geometric bounds (optional, kept for potential future use or debugging)
    var bleedBounds, backerBounds, dielineBounds, safezoneBounds;
    if (bleedObj) bleedBounds = bleedObj.geometricBounds; 
    if (backerObj) backerBounds = backerObj.geometricBounds;
    if (dielineObj) dielineBounds = dielineObj.geometricBounds; 
    if (safezoneObj) safezoneBounds = safezoneObj.geometricBounds;


    if (config.addGuidelines) {
        // Call the new dimensioning function, passing the DIELINE object as the target
        if (dielineObj) {
            // Pass the pre-created dimensionColorSpot as the fourth argument
            createDimensionLinesForObject(doc, dielineObj, config.labelType, dimensionColorSpot);
        } else {
            alert("Cannot add dimension guidelines because the Dieline object could not be found.");
        }

        // --- White Background & Legend Logic --- (remains largely the same)
        
        // Create white background layer
        var whiteLayer = doc.layers.add();
        whiteLayer.name = "White Background";
        whiteLayer.zOrder(ZOrderMethod.SENDTOBACK);

        // Determine scaling based on dimensions (using original config dimensions)
        var widthScale = getScaleFactor(config.widthInches);
        var heightScale = getScaleFactor(config.heightInches);
        // Use the *dieline* bounds for the base size of the white backer scaling
        var baseWidthPts = dielineBounds ? (dielineBounds[2] - dielineBounds[0]) : widthPts;
        var baseHeightPts = dielineBounds ? (dielineBounds[1] - dielineBounds[3]) : heightPts;
        
        var finalWidthPts = baseWidthPts * widthScale;
        var finalHeightPts = baseHeightPts * heightScale;

        // Create white backer rectangle spot color
        var whiteBackerSpotColor = createWhiteBackerColor(doc);

        // Center the rectangle based on the *dieline's* center
        var artRect = doc.artboards[0].artboardRect;
        var artCenterX = (artRect[0] + artRect[2]) / 2;
        var artCenterY = (artRect[1] + artRect[3]) / 2;
        
        // Use dieline center if available, otherwise use original config center
        var centerX = dielineBounds ? (dielineBounds[0] + dielineBounds[2]) / 2 : artCenterX;
        var centerY = dielineBounds ? (dielineBounds[1] + dielineBounds[3]) / 2 : artCenterY; 

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