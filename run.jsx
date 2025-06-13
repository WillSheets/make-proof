/*
 * RUN: Main entry point for the Label Proof script
 * Shows a unified dialog with dropdown mode selector, then runs the appropriate workflow
 */

// Include dependencies
//@include "src/ui.jsx"
//@include "src/makeWorkflow.jsx"
//@include "src/uploadWorkflow.jsx"

/**
 * Main execution function that shows the unified dialog
 * and runs the selected workflow based on the configuration
 */
function run() {
    // Show the unified dialog with dropdown
    var config = MainUI.showDialog();
    
    // If user cancelled, exit
    if (!config) return;
    
    // Route to appropriate workflow based on mode
    if (config.mode === "Make") {
        // Create a new template from scratch
        MakeWorkflow.run(config);
    } else if (config.mode === "Upload") {
        // Process an uploaded file
        UploadWorkflow.run(config);
    }
}

// Execute the script
run(); 