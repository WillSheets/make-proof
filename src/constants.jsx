/*
 * CONSTANTS: Configuration values for the Label Proof script
 */

/**
 * Conversion factor: 1 inch = 72 points in Illustrator.
 */
var INCH_TO_POINTS = 72;

/**
 * Determine the project root dynamically (assumes this file sits inside a `src` folder)
 */
var ROOT_FOLDER = (function () {
    // `$.fileName` is the full path to this file (src/constants.jsx)
    // Its parent is the `src` folder; one level above is the project root.
    var thisFile = new File($.fileName);
    return thisFile.parent.parent; // Folder object representing the root of the project
})();

/**
 * Path to the Legends folder (relative to the project root)
 */
var LEGENDS_FOLDER_PATH = ROOT_FOLDER.fsName + "/legends";

/**
 * Configuration for each label type with dimension line offsets.
 */
var LABEL_TYPE_CONFIG = {
    "Sheets": {
        dimensionLineOffsets: {
            widthLineOffset: 0.4375,
            widthTextOffset: 0.125,
            heightLineOffset: 0.4375,
            heightTextOffset: 0.125
        }
    },
    "Rolls": {
        dimensionLineOffsets: {
            widthLineOffset: 0.3125,
            widthTextOffset: 0.125,
            heightLineOffset: 0.3125,
            heightTextOffset: 0.125
        }
    },
    "Die Cut": {
        dimensionLineOffsets: {
            widthLineOffset: 0.3125,
            widthTextOffset: 0.125,
            heightLineOffset: 0.3125,
            heightTextOffset: 0.125
        }
    },
    "Custom": {
        dimensionLineOffsets: {
            widthLineOffset: 0.4375,
            widthTextOffset: 0.125,
            heightLineOffset: 0.4375,
            heightTextOffset: 0.125
        }
    }
};

/**
 * Default font for text elements
 */
var FONT_NAME = "MyriadPro-Regular";

/**
 * Determines font size for dimension text based on the smallest dimension in inches.
 */
function getDimensionFontSize(d) {
    if (d < 4) {
        return 10;
    } else if (d <= 8) {
        return 20;
    } else {
        return 30;
    }
} 