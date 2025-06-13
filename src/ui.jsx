/*
 * ui.jsx - Unified user interface that combines Make and Upload modes
 * Uses a dropdown menu to switch between the two modes
 */

//@include "makeUI.jsx"
//@include "uploadUI.jsx"

/**
 * Creates the main dialog with dropdown mode selector
 * @returns {Object|null} Configuration object or null if cancelled
 */
function showMainDialog() {
    app.preferences.setIntegerPreference("rulerUnits", 2); // Inches
    
    // Load preferences for Upload mode
    var prefs = loadPrefs();
    
    // Create main dialog
    var dlg = new Window("dialog", "Label Proof Template");
    dlg.orientation = "column";
    dlg.alignChildren = ["center", "top"];
    dlg.spacing = 10;
    dlg.margins = [10, 5, 10, 10];
    dlg.graphics.backgroundColor = dlg.graphics.newBrush(
        dlg.graphics.BrushType.SOLID_COLOR, 
        [0.2, 0.2, 0.2, 1]
    );
    dlg.preferredSize.width = 380;
    
    // Mode selector dropdown
    var modeGroup = dlg.add("group");
    modeGroup.orientation = "row";
    modeGroup.alignChildren = ["left", "center"];
    modeGroup.spacing = 10;
    
    var modeLabel = modeGroup.add("statictext", undefined, "Mode:");
    modeLabel.graphics.foregroundColor = modeLabel.graphics.newPen(
        modeLabel.graphics.PenType.SOLID_COLOR, 
        [1, 1, 1, 1], 
        1
    );
    
    var modeDropdown = modeGroup.add("dropdownlist", undefined, ["Make", "Upload"]);
    modeDropdown.selection = 0; // Default to Make mode
    modeDropdown.preferredSize.width = 100;
    
    // Container for mode-specific content
    var contentContainer = dlg.add("group");
    contentContainer.orientation = "stack";
    contentContainer.alignChildren = ["fill", "top"];
    contentContainer.preferredSize.width = 380;
    
    // Build both tabs
    var makeTabResult = MakeUI.buildTab(contentContainer, prefs);
    var uploadTabResult = UploadUI.buildTab(contentContainer, prefs);
    
    var makePanel = makeTabResult.panel;
    var uploadPanel = uploadTabResult.panel;
    
    var makeControls = makeTabResult.controls;
    var uploadControls = uploadTabResult.controls;
    
    // Initially show Make panel
    makePanel.visible = true;
    uploadPanel.visible = false;
    
    // Mode switching handler
    modeDropdown.onChange = function() {
        if (modeDropdown.selection.index === 0) {
            // Make mode
            makePanel.visible = true;
            uploadPanel.visible = false;
        } else {
            // Upload mode
            makePanel.visible = false;
            uploadPanel.visible = true;
        }
        dlg.layout.layout(true);
    };
    
    // OK/Cancel button group
    var buttonGroup = dlg.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    buttonGroup.alignChildren = "center";
    buttonGroup.margins = [0, 0, 0, 10];
    
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    
    // Dialog result tracking
    var dialogResult = false;
    var finalConfig = {};
    
    // OK button handler
    okButton.onClick = function() {
        var isMakeMode = (modeDropdown.selection.index === 0);
        
        if (isMakeMode) {
            var makeValidation = MakeUI.validate(makeControls);
            if (!makeValidation.isValid) {
                makeControls.sizeErrorText.visible = true;
                return;
            } else {
                makeControls.sizeErrorText.visible = false;
            }
            finalConfig = MakeUI.buildConfig(makeControls, makeValidation);
        } else {
            var uploadValidation = UploadUI.validate(uploadControls, prefs);
            if (!uploadValidation.isValid) {
                return; // Do not close
            }
            finalConfig = UploadUI.buildConfig(uploadControls, uploadValidation);
        }
        
        dialogResult = true;
        dlg.close();
    };
    
    // Cancel button handler
    cancelButton.onClick = function() {
        dialogResult = false;
        dlg.close();
    };
    
    // Show dialog and return result
    dlg.show();
    if (!dialogResult) return null;
    
    return finalConfig;
}

// ============================================================================
// PUBLIC API
// ============================================================================

if (!$.global.MainUI) {
    $.global.MainUI = {
        showDialog: showMainDialog
    };
} 