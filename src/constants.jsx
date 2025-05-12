/*
 * CONSTANTS: Configuration values for the Label Proof script
 */

// ============================================================================
// File System & Paths
// ============================================================================

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


// ============================================================================
// Units
// ============================================================================

/**
 * Conversion factor: 1 inch = 72 points in Illustrator.
 */
var INCH_TO_POINTS = 72;


// ============================================================================
// Label Configuration
// ============================================================================

/**
 * Configuration for each label type (Offsets for Bleed, Safezone, Backer handled by Actions)
 */
var LABEL_TYPE_CONFIG = {
    "Sheets": { 
        // Configuration specific to Sheets, if any needed beyond offsets (e.g., legend name components)
    },
    "Rolls": {
        // Configuration specific to Rolls
    },
    "Die Cut": {
        // Configuration specific to Die Cut
    },
    "Custom": {
        // Configuration specific to Custom (may need user input later)
    }
};


// ============================================================================
// Dimensioning
// ============================================================================

/**
 * Dimension line and text offsets, font sizes, stroke widths, and actions 
 * per size category and label type. Used by dimensioning.jsx.
 */
var DIMENSION_OFFSETS_TABLE = {
    "Rolls": {
        "under0_5":  { dimLine: 0.1875, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.2125, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.2375, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
    "Sheets": {
        "under0_5":  { dimLine: 0.25, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2625, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.275, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
    "Die-cut": { // Match the key used in dimensioning.jsx (or standardize)
        "under0_5":  { dimLine: 0.3125, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.325, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.3375, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3625, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
     "Custom": { // Provide defaults for Custom, might need overrides later
        "under0_5":  { dimLine: 0.25, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2625, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.275, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    }
};

/**
 * Font name for dimension text (used by dimensioning.jsx)
 */
var DIMENSION_FONT_NAME = "Arial-BoldMT";

/**
 * Name of the Action Set containing dimension arrow actions (used by dimensioning.jsx)
 */
var DIMENSION_ACTION_SET_NAME = "Add Arrows";

// Specific action names within the set could also be constants if needed,
// but are currently defined directly in DIMENSION_OFFSETS_TABLE.
// var DIMENSION_ACTION_50 = "50%"; 
// var DIMENSION_ACTION_75 = "75%";

/**
 * CMYK color values for the DimensionLine spot color (used by main.jsx and dimensioning.jsx)
 */
var DIMENSION_COLOR_CMYK = [0, 100, 0, 0]; // Magenta 


// ============================================================================
// Bleed Line
// ============================================================================

/**
 * CMYK color values for the BleedLine spot color (used by core.jsx)
 */
var BLEEDLINE_COLOR_CMYK = [100, 0, 0, 0]; // Cyan

/**
 * Name for the BleedLine spot color (used by core.jsx)
 */
var BLEEDLINE_COLOR_NAME = "BleedLine"; 


// ============================================================================
// General
// ============================================================================

/**
 * Default font for general text elements (used by utils.jsx)
 */
var FONT_NAME = "MyriadPro-Regular"; 