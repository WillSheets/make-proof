/*
 * UTILS: Utility functions for the Label Proof script
 */

// Include constants
//@include "constants.jsx"

/**
 * Creates a SpotColor with specified CMYK percentages.
 * @param {Document} doc - The Illustrator document.
 * @param {string} name - Name of the spot color.
 * @param {number[]} cmykArray - [C, M, Y, K] percentages.
 * @returns {SpotColor}
 */
function createSpotColor(doc, name, cmykArray) {
    var spot = doc.spots.add();
    spot.name = name;
    spot.colorType = ColorModel.SPOT;

    var cmyk = new CMYKColor();
    cmyk.cyan = cmykArray[0];
    cmyk.magenta = cmykArray[1];
    cmyk.yellow = cmykArray[2];
    cmyk.black = cmykArray[3];

    spot.color = cmyk;

    var spotColor = new SpotColor();
    spotColor.spot = spot;
    return spotColor;
}

/**
 * Calculates the area of a pathItem using its visible bounds.
 * @param {PathItem} pathItem
 * @returns {number} area
 */
function getArea(pathItem) {
    var width = pathItem.visibleBounds[2] - pathItem.visibleBounds[0];
    var height = pathItem.visibleBounds[1] - pathItem.visibleBounds[3];
    return width * height;
}

/**
 * Sets text attributes on a text frame.
 * @param {TextFrame} textFrame
 * @param {Color} fillColor
 * @param {number} fontSize
 */
function applyTextAttributes(textFrame, fillColor, fontSize) {
    textFrame.textRange.characterAttributes.size = fontSize;
    textFrame.textRange.characterAttributes.fillColor = fillColor;

    var fallbackFont = app.textFonts[0];
    var chosenFont = fallbackFont; 
    for (var i = 0; i < app.textFonts.length; i++) {
        if (app.textFonts[i].name === FONT_NAME) {
            chosenFont = app.textFonts[i];
            break;
        }
    }
    textFrame.textRange.characterAttributes.textFont = chosenFont;
}

/**
 * Executes an offset action for the specified label type.
 * @param {string} labelType
 * @returns {boolean} success
 */
function runOffsetAction(labelType) {
    var attempts = 0;
    var success = false;
    while (!success && attempts < 3) {
        try {
            app.doScript(labelType, "Offset");
            success = true;
        } catch (e) {
            attempts++;
            $.sleep(250);
        }
    }
    return success;
}

/**
 * Fits the view to all artwork and redraws.
 * @param {Document} doc
 */
function fitViewToArt(doc) {
    app.redraw();
    $.sleep(100);
    app.executeMenuCommand("fitall");
    app.redraw();
    $.sleep(200);
}

/**
 * Finds a pageItem by name within a layer.
 * @param {Layer} layer - The layer to search in.
 * @param {string} name - The name to search for.
 * @returns {PageItem|null} - The found item or null.
 */
function findObjectByName(layer, name) {
    for (var i = 0; i < layer.pageItems.length; i++) {
        if (layer.pageItems[i].name === name) {
            return layer.pageItems[i];
        }
    }
    return null;
}

/**
 * Determine the scale factor based on the given dimension (inches).
 * This function uses the provided reference points to create a sliding scale.
 * @param {number} dimension - The dimension in inches
 * @returns {number} The scale factor to apply
 */
function getScaleFactor(dimension) {
    var points = [
        {inches: 1, factor: 2.75},    // ≤1" gets 175% larger
        {inches: 2, factor: 1.875},   // 2" gets 87.5% larger
        {inches: 3, factor: 1.6},     // 3" gets 60% larger
        {inches: 4, factor: 1.5},     // 4" gets 50% larger
        {inches: 5, factor: 1.4},     // 5" gets 40% larger
        {inches: 6, factor: 1.33},    // 6" gets 33% larger
        {inches: 7, factor: 1.285},   // 7" gets 28.5% larger
        {inches: 8, factor: 1.25},    // 8" gets 25% larger
        {inches: 9, factor: 1.25},    // 9" gets 25% larger
        {inches: 10, factor: 1.225},  // 10" gets 22.5% larger
        {inches: 11, factor: 1.2},    // 11" gets 20% larger
        {inches: 12, factor: 1.1875}  // ≥12" gets 18.75% larger
    ];

    if (dimension <= 1) return 2.5;
    if (dimension >= 12) return 1.2;

    // Find where dimension fits between points
    for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i];
        var p2 = points[i+1];
        if (dimension > p1.inches && dimension < p2.inches) {
            // linear interpolation
            var range = p2.inches - p1.inches;
            var ratio = (dimension - p1.inches) / range;
            var factor = p1.factor + (p2.factor - p1.factor)*ratio;
            return factor;
        } else if (dimension === p1.inches) {
            return p1.factor;
        }
    }
    return points[points.length - 1].factor;
}

/**
 * Create a white spot color named "WhiteBacker"
 * @param {Document} doc - The Illustrator document
 * @returns {SpotColor} The white backer spot color
 */
function createWhiteBackerColor(doc) {
    var whiteBackerSpot = doc.spots.add();
    whiteBackerSpot.name = "WhiteBacker";
    whiteBackerSpot.colorType = ColorModel.SPOT;
    var cmyk = new CMYKColor();
    cmyk.cyan = 0; cmyk.magenta = 0; cmyk.yellow = 0; cmyk.black = 0;
    whiteBackerSpot.color = cmyk;

    var spotColor = new SpotColor();
    spotColor.spot = whiteBackerSpot;
    return spotColor;
}

/**
 * Determine the appropriate legend file name based on user selections.
 * @param {Object} config - The user configuration object
 * @returns {string} The legend file name
 */
function getLegendFileName(config) {
    var base = "SZ-CL";

    // If die cut is chosen, we add "-Backer"
    if (config.labelType === "Die-cut") {
        base += "-Backer";
    }

    // If material selected
    if (config.material) {
        base += "-" + config.material;
    }

    // If white ink selected
    if (config.whiteInk) {
        base += "-WhiteInk";
    }

    // Add extension
    base += ".ai";

    return base;
} 