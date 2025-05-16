/*
 * GEOMETRY: Pure helpers that perform maths or string formatting only.
 * NO Illustrator DOM calls are allowed in this file so that the logic can
 * be unit-tested in a non-Illustrator JS environment.
 */

//@include "constants.jsx" // For INCH_TO_POINTS

// ────────────────────────────────────────────────────────────
// Unit conversion helpers
// ────────────────────────────────────────────────────────────

/**
 * Convert inches → points (Illustrator uses 72 pt per inch)
 * @param {number} inches
 * @returns {number} points
 */
function inchesToPoints(inches) {
    return inches * INCH_TO_POINTS;
}

/**
 * Convert points → inches
 * @param {number} points
 * @returns {number} inches
 */
function pointsToInches(points) {
    return points / INCH_TO_POINTS;
}

// ────────────────────────────────────────────────────────────
// Geometry helpers
// ────────────────────────────────────────────────────────────

/**
 * Calculate object area from its visible bounds
 * @param {PathItem|{visibleBounds:number[]}} item – Illustrator page item or mock with visibleBounds
 * @returns {number}
 */
function getArea(item) {
    var width  = item.visibleBounds[2] - item.visibleBounds[0];
    var height = item.visibleBounds[1] - item.visibleBounds[3];
    return width * height;
}

/**
 * Return a size category token based on the max of width/height (in inches)
 *   under0_5, 0_5to1, 1to2, 2to4, 4to6, 6to10, over10
 * @param {number} wIn – width in inches
 * @param {number} hIn – height in inches
 * @returns {string}
 */
function getSizeCategory(wIn, hIn) {
    var maxDim = Math.max(wIn, hIn);
    if (maxDim < 0.5) return "under0_5";
    if (maxDim < 1)   return "0_5to1";
    if (maxDim < 2)   return "1to2";
    if (maxDim < 4)   return "2to4";
    if (maxDim < 6)   return "4to6";
    if (maxDim < 10)  return "6to10";
    return "over10";
}

// ────────────────────────────────────────────────────────────
// Scaling helper (moved from utils.jsx)
// ────────────────────────────────────────────────────────────

/**
 * Determine the scale factor for white-backer size based on the given dimension.
 * Implements a sliding scale derived from press visibility needs.
 * @param {number} dimension – dimension in inches
 * @returns {number} scale factor
 */
function getScaleFactor(dimension) {
    var points = [
        {inches: 1,  factor: 2.75},
        {inches: 2,  factor: 1.875},
        {inches: 3,  factor: 1.6},
        {inches: 4,  factor: 1.5},
        {inches: 5,  factor: 1.4},
        {inches: 6,  factor: 1.33},
        {inches: 7,  factor: 1.285},
        {inches: 8,  factor: 1.25},
        {inches: 9,  factor: 1.25},
        {inches: 10, factor: 1.225},
        {inches: 11, factor: 1.2},
        {inches: 12, factor: 1.1875}
    ];

    if (dimension <= 1)  return 2.5;
    if (dimension >= 12) return 1.2;

    for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i];
        var p2 = points[i + 1];
        if (dimension > p1.inches && dimension < p2.inches) {
            var range = p2.inches - p1.inches;
            var ratio  = (dimension - p1.inches) / range;
            return p1.factor + (p2.factor - p1.factor) * ratio;
        } else if (dimension === p1.inches) {
            return p1.factor;
        }
    }

    return points[points.length - 1].factor;
}

// ────────────────────────────────────────────────────────────
// Number formatting helper (moved from dimensioning.jsx)
// ────────────────────────────────────────────────────────────

/**
 * Format a dimension value (in inches) with smart rounding and inch mark.
 * @param {number} value – inches
 * @returns {string} formatted string, e.g., 1.5" or 0.75"
 */
function formatDimension(value) {
    var twoDecimal = Math.round(value * 100) / 100;
    if (Math.abs(twoDecimal - value) < 0.001) {
        var str = twoDecimal.toString().replace(/\.?0+$/, "");
        if (str.indexOf('.') === -1 && value.toString().match(/\.0+$/)) {
            str += ".0";
        }
        return str + "\"";
    } else {
        var fourDecimal = Math.round(value * 10000) / 10000;
        var str2 = fourDecimal.toString().replace(/\.?0+$/, "");
        if (str2.indexOf('.') === -1 && value.toString().indexOf('.') > -1) {
            var decimals = value.toString().split('.')[1] || "";
            var precision = 0;
            for (var iDec = 0; iDec < decimals.length; iDec++) {
                if (decimals[iDec] !== '0') {
                    precision = iDec + 1;
                    break;
                }
            }
            precision = Math.max(2, Math.min(4, precision));
            str2 = fourDecimal.toFixed(precision);
        }
        return str2 + "\"";
    }
} 