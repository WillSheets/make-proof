/*
 * RUN: Main entry point for the Label Proof script
 * This file serves as the primary entry point and delegates to the modules in the src directory
 */

// Include all dependencies
//@include "src/workflow.jsx"

/**
 * Main execution function that starts the Label Proof script.
 * Delegates to workflow.jsx which in turn includes its own dependencies.
 */
function run() {
    // Call the main function from main.jsx
    createRectangleWithDielineStroke();
}

// Execute the script
run(); 