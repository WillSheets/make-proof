/*
 * ILLUSTRATOR: Thin wrapper around Adobe Illustrator DOM.
 * All functions here may mutate global Illustrator state – treat them as *impure*.
 * Depends on constants.jsx for config values and geometry.jsx for pure helpers.
 */

//@include "constants.jsx"
//@include "geometry.jsx"

// ────────────────────────────────────────────────────────────
// Color helpers
// ────────────────────────────────────────────────────────────

/**
 * Create / return a SpotColor with the given CMYK values.
 * @param {Document} doc Illustrator document
 * @param {string} name Spot swatch name
 * @param {number[]} cmykArray [C,M,Y,K]
 * @returns {SpotColor}
 */
function createSpotColor(doc, name, cmykArray) {
    var spot = doc.spots.add();
    spot.name = name;
    spot.colorType = ColorModel.SPOT;

    var cmyk = new CMYKColor();
    cmyk.cyan    = cmykArray[0];
    cmyk.magenta = cmykArray[1];
    cmyk.yellow  = cmykArray[2];
    cmyk.black   = cmykArray[3];
    spot.color   = cmyk;

    var spotColor = new SpotColor();
    spotColor.spot = spot;
    return spotColor;
}

/**
 * Convenience wrapper for an opaque white backer spot color.
 * @param {Document} doc
 * @returns {SpotColor}
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

// ────────────────────────────────────────────────────────────
// Document helpers
// ────────────────────────────────────────────────────────────

/**
 * Create a new CMYK document sized in *inches*.
 */
function createDocument(widthInches, heightInches, title) {
    var tempWidth  = Math.max(widthInches, 1);
    var tempHeight = Math.max(heightInches, 1);
    var docPreset  = new DocumentPreset();
    docPreset.units     = RulerUnits.Inches;
    docPreset.width     = tempWidth;
    docPreset.height    = tempHeight;
    docPreset.colorMode = DocumentColorSpace.CMYK;
    if (title) docPreset.title = title;
    var doc = app.documents.addDocument(DocumentColorSpace.CMYK, docPreset);
    doc.rulerUnits = RulerUnits.Inches;

    var desiredWidthPts  = widthInches * 72;
    var desiredHeightPts = heightInches * 72;
    doc.artboards[0].artboardRect = [0, desiredHeightPts, desiredWidthPts, 0];
    return doc;
}

/** Resize artboard for rolls / die-cut allowing for bleed. */
function adjustArtboardForLabelType(artboard, labelType, widthPts, heightPts) {
    if (labelType === "Rolls" || labelType === "Die-cut") {
        var bleed    = (labelType === "Rolls") ? 0.0625 : 0.1875;
        var bleedPts = bleed * INCH_TO_POINTS;
        artboard.artboardRect = [ -bleedPts,
                                  heightPts + bleedPts,
                                  widthPts + bleedPts,
                                  -bleedPts ];
    }
}

/** Fit view to all artwork – helper used after drawing changes. */
function fitViewToArt(doc) {
    app.redraw();
    $.sleep(100);
    app.executeMenuCommand("fitall");
    app.redraw();
    $.sleep(200);
}

// ────────────────────────────────────────────────────────────
// Path & shape helpers
// ────────────────────────────────────────────────────────────

function createLabelShape(doc, shapeType, widthPts, heightPts) {
    var lower = shapeType.toLowerCase();
    if (lower === "round") {
        return doc.pathItems.ellipse(heightPts, 0, widthPts, heightPts);
    } else if (lower === "rounded") {
        return doc.pathItems.roundedRectangle(heightPts, 0, widthPts, heightPts, 9, 9);
    }
    return doc.pathItems.rectangle(heightPts, 0, widthPts, heightPts);
}

function applyStrokeToShape(shape, strokeColor, strokeWidth, name) {
    shape.filled = false;
    shape.stroked = true;
    shape.strokeColor = strokeColor;
    shape.strokeWidth = strokeWidth;
    if (name) shape.name = name;
}

/**
 * Retry running the Offset action (Sheets / Rolls / Die-cut) up to 3×.
 */
function runOffsetAction(labelType) {
    var attempts = 0;
    while (attempts < 3) {
        try {
            app.doScript(labelType, "Offset");
            return true;
        } catch (e) {
            attempts++;
            $.sleep(250);
        }
    }
    return false;
}

// ────────────────────────────────────────────────────────────
// Layer / object finders
// ────────────────────────────────────────────────────────────

function findObjectByName(layer, name) {
    for (var i = 0; i < layer.pageItems.length; i++) {
        if (layer.pageItems[i].name === name) {
            return layer.pageItems[i];
        }
    }
    return null;
}

// ────────────────────────────────────────────────────────────
// Offset-generated path management
// ────────────────────────────────────────────────────────────

function handleMultiplePaths(doc, labelType, dielineColorSpot, bleedLineSpotColor) {
    var smallestPath = doc.selection[0];
    var smallestArea = getArea(smallestPath);
    var originalDielinePath = null;

    for (var i = 0; i < doc.selection.length; i++) {
        var cand = doc.selection[i];
        var area = getArea(cand);
        if (area < smallestArea) {
            smallestPath = cand;
            smallestArea = area;
        }
        if (cand.name === "Dieline") originalDielinePath = cand;
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

function handleDieCutPaths(doc, originalDielinePath, dielineColorSpot, cutToPathSpotColor, bleedLineSpotColor) {
    var unnamed = [];
    for (var pIndex = 0; pIndex < doc.pathItems.length; pIndex++) {
        var p = doc.pathItems[pIndex];
        if (!p.name || p.name === "") {
            unnamed.push({ path: p, area: getArea(p) });
        }
    }
    unnamed.sort(function(a, b) { return b.area - a.area; });

    if (unnamed.length >= 2) {
        var bleedPath = unnamed[0].path;
        bleedPath.name = "Bleed";
        bleedPath.strokeColor = bleedLineSpotColor;

        var backerPath = unnamed[1].path;
        backerPath.name = "Backer";
        backerPath.strokeColor = cutToPathSpotColor;
    }
    if (originalDielinePath) originalDielinePath.strokeColor = dielineColorSpot;

    var guidesLayer = doc.layers[0];
    var bleedObject = null, backerObject = null, dielineObject = null, safezoneObject = null;

    for (var i = 0; i < guidesLayer.pageItems.length; i++) {
        var item = guidesLayer.pageItems[i];
        switch (item.name) {
            case "Bleed":     bleedObject   = item; break;
            case "Backer":    backerObject  = item; break;
            case "Dieline":   dielineObject = item; break;
            case "Safezone":  safezoneObject= item; break;
        }
    }
    if (safezoneObject) safezoneObject.zOrder(ZOrderMethod.SENDBACKWARD);
    if (dielineObject)  dielineObject.zOrder(ZOrderMethod.SENDBACKWARD);
    if (backerObject)   backerObject.zOrder(ZOrderMethod.BRINGFORWARD);
    if (bleedObject)    bleedObject.zOrder(ZOrderMethod.BRINGTOFRONT);
}

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

// ────────────────────────────────────────────────────────────
// Legend placement helpers
// ────────────────────────────────────────────────────────────

function getLegendFileName(config) {
    var base = "SZ-CL";
    if (config.labelType === "Die-cut") base += "-Backer";
    if (config.material) base += "-" + config.material;
    if (config.whiteInk) base += "-WhiteInk";
    return base + ".ai";
}

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

    // Embed to get a GroupItem
    var legendGroup = null;
    var groupsBefore = [];
    for (var i = 0; i < guidesLayer.groupItems.length; i++) groupsBefore.push(guidesLayer.groupItems[i]);

    try {
        placed.embed();
        app.redraw();
        var groupsAfter = [];
        for (var j = 0; j < guidesLayer.groupItems.length; j++) groupsAfter.push(guidesLayer.groupItems[j]);

        var found = null;
        for (var k = 0; k < groupsAfter.length; k++) {
            if (groupsBefore.indexOf(groupsAfter[k]) === -1) {
                found = groupsAfter[k];
                break;
            }
        }
        legendGroup = found;
    } catch (e) {
        alert("Error embedding legend file: " + e);
        if (placed && placed.isValid) placed.remove();
        return;
    }

    if (!legendGroup) {
        alert("Could not locate embedded legend group");
        return;
    }

    legendGroup.name = "Legends";

    // Geometry for scaling/placement
    var whiteGB = whiteRect.geometricBounds;
    var whiteWidth  = whiteGB[2] - whiteGB[0];
    var whiteBottom = whiteGB[3];

    var bleedObj = findObjectByName(guidesLayer, "Bleed");
    if (!bleedObj) {
        alert("Bleed object not found – cannot position legend accurately.");
        legendGroup.remove();
        return;
    }
    var bleedBottom = bleedObj.geometricBounds[3];

    var groupInitialWidth  = legendGroup.width;
    var groupInitialHeight = legendGroup.height;

    var actualDistance = Math.abs(whiteBottom - bleedBottom);
    var maxAllowedHeight = (actualDistance > 0) ? actualDistance / 3 : -1;
    var targetWidth = (whiteWidth > 0) ? 0.8 * whiteWidth : -1;

    var scaleForHeight = (groupInitialHeight > 0 && maxAllowedHeight > 0) ? (maxAllowedHeight / groupInitialHeight) * 100 : Infinity;
    var scaleForWidth  = (groupInitialWidth  > 0 && targetWidth      > 0) ? (targetWidth      / groupInitialWidth)  * 100 : Infinity;
    var finalScale = Math.min(scaleForHeight, scaleForWidth);
    if (finalScale === Infinity || finalScale <= 0) finalScale = 100;

    legendGroup.resize(finalScale, finalScale, true, true, true, true, true, Transformation.CENTER);
    app.redraw();

    var finalBounds = legendGroup.geometricBounds;
    var whiteCenterX = (whiteGB[0] + whiteGB[2]) / 2;
    var legendCenterX = (finalBounds[0] + finalBounds[2]) / 2;
    var dx = whiteCenterX - legendCenterX;

    var midpoint = (whiteBottom + bleedBottom) / 2;
    var legendCenterY = (finalBounds[1] + finalBounds[3]) / 2;
    var dy = midpoint - legendCenterY;

    legendGroup.translate(dx, dy);
    app.redraw();
}

// ────────────────────────────────────────────────────────────
// Dimensioning (ported from dimensioning.jsx)
// ────────────────────────────────────────────────────────────

function createDimensionLinesForObject(doc, targetObject, labelType, dimensionColorSpot) {
    var FONT_NAME = DIMENSION_FONT_NAME;
    var ACTION_SET_NAME = DIMENSION_ACTION_SET_NAME;

    if (!targetObject) {
        alert("Error: No target object provided for dimensioning.");
        return;
    }
    if (!dimensionColorSpot) {
        alert("Error: DimensionLine spot color missing.");
        return;
    }

    var gb = targetObject.geometricBounds;
    var left = gb[0], top = gb[1], right = gb[2], bottom = gb[3];
    var widthPt  = right - left;
    var heightPt = top - bottom;
    var wIn = pointsToInches(widthPt);
    var hIn = pointsToInches(heightPt);

    var guidesLayer;
    try {
        guidesLayer = doc.layers.getByName("Guides");
    } catch (e) {
        alert("'Guides' layer not found. Cannot add dimensions.");
        return;
    }

    // Use global getSizeCategory / getScaleFactor helpers
    var sizeCategory = getSizeCategory(wIn, hIn);

    var typeOffsets = DIMENSION_OFFSETS_TABLE[labelType] || DIMENSION_OFFSETS_TABLE["Sheets"];
    var offsets = typeOffsets[sizeCategory] || typeOffsets["1to2"] || DIMENSION_OFFSETS_TABLE["Sheets"]["1to2"];

    var dimLineOffset = offsets.dimLine;
    var textOffset    = offsets.text;
    var strokeWidth   = offsets.strokeWidth;
    var fontSize      = offsets.fontSize;
    var arrowActionName = offsets.arrowAction;

    // Inner helper to create a dimension line and run arrow action
    function createDimLine(x1, y1, x2, y2) {
        var line = guidesLayer.pathItems.add();
        line.stroked = true;
        line.strokeWidth = strokeWidth;
        line.strokeColor = dimensionColorSpot;
        line.filled = false;

        var p1 = line.pathPoints.add();
        p1.anchor = [x1, y1];
        p1.leftDirection = p1.rightDirection = p1.anchor;
        var p2 = line.pathPoints.add();
        p2.anchor = [x2, y2];
        p2.leftDirection = p2.rightDirection = p2.anchor;

        doc.selection = null;
        line.selected = true;
        try {
            app.doScript(arrowActionName, ACTION_SET_NAME);
        } catch (e) {
            alert('Could not run "' + arrowActionName + '" action from "' + ACTION_SET_NAME + '" set.');
        }
        line.strokeWidth = strokeWidth;
        line.strokeColor = dimensionColorSpot;
        doc.selection = null;
        return line;
    }

    // Inner helper – create text
    function createDimText(txt, x, y, rotateDeg) {
        var t = guidesLayer.textFrames.add();
        t.contents = txt;
        try {
            t.textRange.characterAttributes.textFont = textFonts.getByName(FONT_NAME);
        } catch (fontError) {
            alert("Font '" + FONT_NAME + "' not found. Please install it.");
            t.remove();
            return null;
        }
        t.textRange.characterAttributes.size = fontSize;
        t.textRange.fillColor = dimensionColorSpot;
        t.position = [x, y];

        var b = t.geometricBounds;
        var textWidth  = b[2] - b[0];
        var textHeight = b[1] - b[3];
        t.position = [x - textWidth/2, y + textHeight];

        if (rotateDeg) {
            t.rotate(rotateDeg, true, true, true, true, Transformation.CENTER);
        }
        return t;
    }

    // HORIZONTAL dimension
    var lineY = top + inchesToPoints(dimLineOffset);
    var hLine = createDimLine(left, lineY, right, lineY);
    var textY = lineY + inchesToPoints(textOffset);
    var widthLabel = formatDimension(wIn);
    var hText = createDimText(widthLabel, (left + right)/2, textY, 0);

    var widthGroup = guidesLayer.groupItems.add();
    widthGroup.name = "Width";
    if (hLine) hLine.move(widthGroup, ElementPlacement.PLACEATEND);
    if (hText) hText.move(widthGroup, ElementPlacement.PLACEATEND);

    // VERTICAL dimension
    var lineX = left - inchesToPoints(dimLineOffset);
    var vLine = createDimLine(lineX, top, lineX, bottom);

    var midY = (top + bottom)/2;
    var heightLabel = formatDimension(hIn);
    var heightText = createDimText(heightLabel, lineX, midY, 90);

    if (heightText) {
        app.redraw();
        var tb = heightText.geometricBounds;
        var desiredRight = lineX - inchesToPoints(textOffset);
        var adjustX = desiredRight - tb[2];
        var textCenterY = (tb[1] + tb[3]) / 2;
        var adjustY = midY - textCenterY;
        heightText.translate(adjustX, adjustY);
    }

    var heightGroup = guidesLayer.groupItems.add();
    heightGroup.name = "Height";
    if (vLine) vLine.move(heightGroup, ElementPlacement.PLACEATEND);
    if (heightText) heightText.move(heightGroup, ElementPlacement.PLACEATEND);

    doc.selection = null;
} 