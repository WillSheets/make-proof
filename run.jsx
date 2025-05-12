/*
 * RUN: Main entry point for the Label Proof script
 * This file serves as the primary entry point and delegates to the modules in the src directory
 */

// Include all dependencies
//@include "src/constants.jsx"
//@include "src/utils.jsx"
//@include "src/ui.jsx"
//@include "src/core.jsx"
//@include "src/main.jsx"

/**
 * Main execution function that starts the Label Proof script.
 * Delegates to the implementation in src/main.jsx
 */
function run() {
    // Call the main function from main.jsx
    createRectangleWithDielineStroke();
}

// Execute the script
run(); 