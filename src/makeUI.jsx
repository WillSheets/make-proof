/*
 * makeUI.jsx - User interface for Make mode
 * 
 * Organization:
 * 1. Shared UI Configuration and Helpers (keep in sync with uploadUI.jsx)
 * 2. Make-specific UI Components
 * 3. Event Handlers for Make mode
 * 4. Validation and Configuration Building
 * 5. Dialog Creation
 */

//@include "constants.jsx"

// ============================================================================
// SHARED SECTION ► DO NOT EDIT PER-FILE - Keep identical in both UI modules
// ============================================================================

/**
 * Centralized UI configuration for easy adjustments
 * All spacing, margins, sizes, and styling options in one place
 */
var UI_CONFIG = {
    // Window properties
    window: {
        title: "Make Proof Template",
        width: 380,
        backgroundColor: [0.2, 0.2, 0.2, 1]
    },
    
    // Layout spacing and margins
    layout: {
        // Spacing
        spacing: {
            tight: 5,
            normal: 10,
            comfy: 15,
            loose: 20
        },
        // Margins
        margins: {
            dialog: [10, 5, 10, 10], // [left, top, right, bottom]
            tab: 20,
            section: 0,
            // [left, top, right, bottom] - Adjust left value to increase/decrease left margin
            tabContent: [10, 10, 10, 10]
        },
        // Standard widths
        widths: {
            section: 300,
            separator: 320,
            filePath: 260
        }
    },
    
    // Control sizes
    controls: {
        // Input fields
        input: {
            charactersWide: 4,
            spinButtonSpacing: 2
        },

        // Radio button groups
        radioGroup: {
            spacing: 20,
            materialSpacing: 15
        },
        // Tab buttons
        tabButton: {
            height: 22
        }
    },
    
    // Colors
    colors: {
        text: {
            normal: [1, 1, 1, 1],
            header: [1, 1, 1, 1]
        },
        tabButton: {
            active: [0.35, 0.35, 0.35, 1],
            inactive: [0.25, 0.25, 0.25, 1]
        }
    },
    
    // Text increments for spin buttons
    increments: {
        primary: 1,
        secondary: 0.0625
    }
};

/**
 * Helper function to create a styled header
 * @param {Object} parent - Parent container
 * @param {string} text - Header text
 * @returns {Object} The created header control
 */
function createStyledHeader(parent, text) {
    var header = parent.add("statictext", undefined, text);
    header.graphics.font = ScriptUI.newFont(header.graphics.font.name, "BOLD", header.graphics.font.size);
    header.graphics.foregroundColor = header.graphics.newPen(
        header.graphics.PenType.SOLID_COLOR, 
        UI_CONFIG.colors.text.header, 
        1
    );
    return header;
}

/**
 * Helper function to style a control with white text
 * @param {Object} control - Control to style
 */
function applyTextStyle(control) {
    control.graphics.foregroundColor = control.graphics.newPen(
        control.graphics.PenType.SOLID_COLOR, 
        UI_CONFIG.colors.text.normal, 
        1
    );
}

/**
 * Helper function to create a section with header and options group
 * @param {Object} parent - Parent container
 * @param {string} headerText - Section header text
 * @param {Object} options - Optional configuration {spacing: number}
 * @returns {Object} The options group for adding controls
 */
function createUISection(parent, headerText, options) {
    options = options || {};
    
    // Container that will be centered while children remain left-aligned
    var section = parent.add("group");
    section.orientation = "column";
    section.alignChildren = ["left", "top"];
    section.alignment = "center";
    section.preferredSize.width = UI_CONFIG.layout.widths.section;
    
    // Header
    var header = createStyledHeader(section, headerText);
    header.alignment = ["left", "top"];
    
    // Options group
    var optionsGroup = section.add("group");
    optionsGroup.orientation = "row";
    optionsGroup.alignChildren = ["left", "center"];
    optionsGroup.preferredSize.width = UI_CONFIG.layout.widths.section;
    optionsGroup.maximumSize.width = UI_CONFIG.layout.widths.section;
    optionsGroup.spacing = options.spacing || UI_CONFIG.controls.radioGroup.spacing;
    
    return optionsGroup;
}

/**
 * Helper function to add a separator line
 * @param {Object} parent - Parent container
 * @returns {Object} The separator panel
 */
function addSeparatorLine(parent) {
    var sep = parent.add("panel");
    sep.alignment = "center";
    sep.preferredSize.width = UI_CONFIG.layout.widths.separator;
    return sep;
}

/**
 * Helper function to create a radio button with styling
 * @param {Object} parent - Parent container
 * @param {string} text - Radio button label
 * @param {boolean} checked - Initial checked state
 * @returns {Object} The styled radio button
 */
function createStyledRadio(parent, text, checked) {
    var radio = parent.add("radiobutton", undefined, text);
    if (checked) radio.value = true;
    applyTextStyle(radio);
    return radio;
}

/**
 * Helper function to create spin buttons for numeric input
 * @param {Object} parent - Parent container
 * @param {Object} editText - Associated edit text control
 * @param {number} increment1 - Primary increment value
 * @param {number} increment2 - Secondary increment value
 * @returns {Object} The spin button group
 */
function createNumericSpinners(parent, editText, increment1, increment2) {
    var spinGroup = parent.add("group");
    spinGroup.orientation = "row";
    spinGroup.spacing = UI_CONFIG.controls.input.spinButtonSpacing;
    spinGroup.alignChildren = "center";
    
    // First spin group
    var firstSpinGroup = spinGroup.add("group");
    firstSpinGroup.orientation = "column";
    firstSpinGroup.spacing = 0;
    firstSpinGroup.alignChildren = "center";
    
    var upBtn1 = firstSpinGroup.add("statictext", undefined, "\u25B2");
    var downBtn1 = firstSpinGroup.add("statictext", undefined, "\u25BC");
    
    // Second spin group
    var secondSpinGroup = spinGroup.add("group");
    secondSpinGroup.orientation = "column";
    secondSpinGroup.spacing = 0;
    secondSpinGroup.alignChildren = "center";
    
    var upBtn2 = secondSpinGroup.add("statictext", undefined, "\u25B2");
    var downBtn2 = secondSpinGroup.add("statictext", undefined, "\u25BC");
    
    // Event handlers
    function adjustValue(delta) {
        if (!editText.enabled) return;
        var textVal = editText.text;
        var current = parseFloat(textVal);
        if (textVal === "" || isNaN(current)) {
            current = 0;
        }
        
        var newVal = current + delta;
        if (newVal >= 0) {
            var formatted = newVal.toFixed(4).replace(/\.?0+$/, '');
            editText.text = formatted;
        }
    }
    
    upBtn1.addEventListener('mousedown', function() { adjustValue(increment1); });
    downBtn1.addEventListener('mousedown', function() { adjustValue(-increment1); });
    upBtn2.addEventListener('mousedown', function() { adjustValue(increment2); });
    downBtn2.addEventListener('mousedown', function() { adjustValue(-increment2); });
    
    return spinGroup;
}

/**
 * Helper function to create a labeled input with spin buttons
 * @param {Object} parent - Parent container
 * @param {string} label - Label text
 * @param {string} defaultValue - Default value
 * @returns {Object} Object containing the group and input control
 */
function createLabeledNumericInput(parent, label, defaultValue) {
    var group = parent.add("group");
    group.orientation = "row";
    group.alignChildren = "center";
    group.spacing = UI_CONFIG.layout.spacing.normal;
    
    var labelControl = group.add("statictext", undefined, label + ":");
    applyTextStyle(labelControl);
    
    var input = group.add("edittext", undefined, defaultValue || "");
    input.characters = UI_CONFIG.controls.input.charactersWide;
    
    createNumericSpinners(group, input, UI_CONFIG.increments.primary, UI_CONFIG.increments.secondary);
    
    return {
        group: group,
        label: labelControl,
        input: input
    };
}

// ============================================================================
// END SHARED SECTION
// ============================================================================

// ============================================================================
// MAKE-SPECIFIC UI COMPONENTS
// ============================================================================

/**
 * Creates label type section with radio buttons
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @returns {Object} The options group
 */
function createLabelTypeSection(parent, controls) {
    var group = createUISection(parent, "Label Type:");
    controls.sheetsRadio = createStyledRadio(group, "Sheets", true);
    controls.rollsRadio = createStyledRadio(group, "Rolls", false);
    controls.dieRadio = createStyledRadio(group, "Die-cut", false);
    return group;
}

/**
 * Creates the shape type section (Make mode specific)
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @returns {Object} The options group
 */
function createShapeTypeSection(parent, controls) {
    var group = createUISection(parent, "Shape Type:");
    controls.squaredRadio = createStyledRadio(group, "Squared", true);
    controls.roundedRadio = createStyledRadio(group, "Rounded", false);
    controls.roundRadio = createStyledRadio(group, "Circle/Oval", false);
    return group;
}

/**
 * Creates material type section with radio buttons
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @returns {Object} The options group
 */
function createMaterialTypeSection(parent, controls) {
    var group = createUISection(parent, "Material Type:", {spacing: UI_CONFIG.controls.radioGroup.materialSpacing});
    controls.whiteRadio = createStyledRadio(group, "White", false);
    controls.clearRadio = createStyledRadio(group, "Clear", false);
    controls.metallicRadio = createStyledRadio(group, "Metallic", false);
    controls.holographicRadio = createStyledRadio(group, "Holographic", false);
    
    // Initialize as disabled (will be enabled based on label type)
    controls.whiteRadio.enabled = false;
    controls.clearRadio.enabled = false;
    controls.metallicRadio.enabled = false;
    controls.holographicRadio.enabled = false;
    
    return group;
}

/**
 * Creates white ink section with radio buttons
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @returns {Object} The options group
 */
function createWhiteInkSection(parent, controls) {
    var group = createUISection(parent, "White Ink?");
    controls.noWhiteRadio = createStyledRadio(group, "No", true);
    controls.yesHorizRadio = createStyledRadio(group, "Yes (wide proof)", false);
    controls.yesVertRadio = createStyledRadio(group, "Yes (tall proof)", false);
    return group;
}

/**
 * Creates the size input section (Make mode specific)
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 */
function createSizeSection(parent, controls) {
    var container = parent.add("group");
    container.orientation = "column";
    container.alignChildren = ["center", "top"];
    container.spacing = UI_CONFIG.layout.spacing.normal;
    container.alignment = "center";
    container.preferredSize.width = UI_CONFIG.layout.widths.section;
    
    // Size header with error message
    var headerGroup = container.add("group");
    headerGroup.orientation = "row";
    headerGroup.alignChildren = ["left", "center"];
    headerGroup.alignment = ["left", "top"];
    headerGroup.preferredSize.width = UI_CONFIG.layout.widths.section;
    
    var header = createStyledHeader(headerGroup, "Size:");
    header.alignment = ["left", "top"];
    
    var errorText = headerGroup.add("statictext", undefined, "(missing)");
    errorText.graphics.foregroundColor = errorText.graphics.newPen(
        errorText.graphics.PenType.SOLID_COLOR, 
        [1, 0, 0, 1], // Red color
        1
    );
    errorText.visible = false; // Initially hidden
    controls.sizeErrorText = errorText;
    
    // Options group for the inputs
    var optionsGroup = container.add("group");
    optionsGroup.orientation = "row";
    optionsGroup.alignChildren = ["left", "center"];
    optionsGroup.preferredSize.width = UI_CONFIG.layout.widths.section;
    optionsGroup.maximumSize.width = UI_CONFIG.layout.widths.section;
    optionsGroup.spacing = UI_CONFIG.layout.spacing.loose;

    var widthResult = createLabeledNumericInput(optionsGroup, "Width", "");
    var heightResult = createLabeledNumericInput(optionsGroup, "Height", "");

    controls.widthInput = widthResult.input;
    controls.heightInput = heightResult.input;
}

/**
 * Creates guidelines and orientation checkboxes section
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @returns {Object} The group
 */
function createGuidelinesSection(parent, controls) {
    var group = parent.add("group");
    group.orientation = "row";
    group.alignChildren = ["center", "center"];
    group.preferredSize.width = UI_CONFIG.layout.widths.separator;
    group.spacing = UI_CONFIG.layout.spacing.loose;
    group.margins = [0, UI_CONFIG.layout.spacing.normal, 0, 0];

    controls.guidelinesCheckbox = group.add("checkbox", undefined, "Add Guidelines?");
    applyTextStyle(controls.guidelinesCheckbox);

    controls.swapOrientationCheckbox = group.add("checkbox", undefined, "Swap the Orientation?");
    applyTextStyle(controls.swapOrientationCheckbox);
    
    return group;
}

// ============================================================================
// EVENT HANDLERS FOR MAKE MODE
// ============================================================================

/**
 * Sets up all event handlers for Make mode controls
 * @param {Object} controls - Controls object with all UI elements
 */
function setupEventHandlers(controls) {
    // Label type handlers
    controls.sheetsRadio.onClick = function() {
        controls.noWhiteRadio.value = true;
        controls.yesHorizRadio.enabled = false;
        controls.yesVertRadio.enabled = false;
        controls.whiteRadio.enabled = false;
        controls.clearRadio.enabled = false;
        controls.metallicRadio.enabled = false;
        controls.holographicRadio.enabled = false;
        controls.whiteRadio.value = false;
        controls.clearRadio.value = false;
        controls.metallicRadio.value = false;
        controls.holographicRadio.value = false;
        controls.guidelinesCheckbox.enabled = true;
        controls.guidelinesCheckbox.value = false;
        updateMaterialSelectionState(controls);
    };
    
    controls.rollsRadio.onClick = function() {
        controls.yesHorizRadio.enabled = true;
        controls.yesVertRadio.enabled = true;
        controls.whiteRadio.enabled = true;
        controls.clearRadio.enabled = true;
        controls.metallicRadio.enabled = true;
        controls.holographicRadio.enabled = true;
        controls.guidelinesCheckbox.enabled = true;
        updateMaterialSelectionState(controls);
    };
    
    controls.dieRadio.onClick = function() {
        controls.yesHorizRadio.enabled = true;
        controls.yesVertRadio.enabled = true;
        controls.whiteRadio.enabled = true;
        controls.clearRadio.enabled = true;
        controls.metallicRadio.enabled = true;
        controls.holographicRadio.enabled = true;
        controls.guidelinesCheckbox.value = true;
        controls.guidelinesCheckbox.enabled = false;
        updateMaterialSelectionState(controls);
    };
    
    // White ink handlers
    controls.noWhiteRadio.onClick = function() {
        controls.guidelinesCheckbox.enabled = true;
        updateMaterialSelectionState(controls);
    };
    
    controls.yesHorizRadio.onClick = function() {
        controls.guidelinesCheckbox.value = true;
        controls.guidelinesCheckbox.enabled = false;
        enforceOneMaterialSelected(controls);
        updateMaterialSelectionState(controls);
    };
    
    controls.yesVertRadio.onClick = function() {
        controls.guidelinesCheckbox.value = true;
        controls.guidelinesCheckbox.enabled = false;
        enforceOneMaterialSelected(controls);
        updateMaterialSelectionState(controls);
    };
    
    // Material type handlers
    controls.lastMaterialSelected = null;
    
    var handleMaterialToggle = function(clickedRadio) {
        var whiteScenario = (controls.yesHorizRadio.value || controls.yesVertRadio.value);

        if (whiteScenario) {
            if (clickedRadio.value) {
                controls.lastMaterialSelected = clickedRadio;
            }
        } else {
            if (clickedRadio === controls.lastMaterialSelected) {
                clickedRadio.value = false;
                controls.lastMaterialSelected = null;
            } else {
                if (clickedRadio.value) {
                    controls.lastMaterialSelected = clickedRadio;
                } else {
                    clickedRadio.value = true;
                    controls.lastMaterialSelected = clickedRadio;
                }
            }
        }
    };
    
    controls.whiteRadio.onClick = function() { handleMaterialToggle(controls.whiteRadio); };
    controls.clearRadio.onClick = function() { handleMaterialToggle(controls.clearRadio); };
    controls.metallicRadio.onClick = function() { handleMaterialToggle(controls.metallicRadio); };
    controls.holographicRadio.onClick = function() { handleMaterialToggle(controls.holographicRadio); };
}

/**
 * Ensures at least one material is selected in white ink scenarios
 * @param {Object} controls - Controls object with radio buttons
 */
function enforceOneMaterialSelected(controls) {
    var whiteScenario = (controls.yesHorizRadio.value || controls.yesVertRadio.value);
    if (whiteScenario) {
        var anySelected = controls.whiteRadio.value || controls.clearRadio.value || 
                        controls.metallicRadio.value || controls.holographicRadio.value;
        if (!anySelected) {
            controls.whiteRadio.value = true;
            controls.lastMaterialSelected = controls.whiteRadio;
        }
    }
}

/**
 * Updates material selection state based on current selections
 * @param {Object} controls - Controls object with radio buttons
 */
function updateMaterialSelectionState(controls) {
    var whiteScenario = (controls.yesHorizRadio.value || controls.yesVertRadio.value);
    if (whiteScenario) {
        enforceOneMaterialSelected(controls);
    }
}

// ============================================================================
// VALIDATION AND CONFIGURATION BUILDING
// ============================================================================

/**
 * Validates Make mode inputs
 * @param {Object} controls - Make mode controls
 * @returns {Object} Validation result with isValid flag and error details
 */
function validateInputs(controls) {
    var widthVal = parseFloat(controls.widthInput.text);
    var heightVal = parseFloat(controls.heightInput.text);
    var widthMissing = isNaN(widthVal) || widthVal <= 0;
    var heightMissing = isNaN(heightVal) || heightVal <= 0;
    
    return {
        isValid: !widthMissing && !heightMissing,
        widthMissing: widthMissing,
        heightMissing: heightMissing,
        widthValue: widthVal,
        heightValue: heightVal
    };
}

/**
 * Helper functions for building configuration
 */
function getSelectedShape(controls) {
    if (controls.squaredRadio && controls.squaredRadio.value) return "Squared";
    if (controls.roundedRadio && controls.roundedRadio.value) return "Rounded";
    if (controls.roundRadio && controls.roundRadio.value) return "Round";
    return null;
}

function getSelectedLabel(controls) {
    if (controls.sheetsRadio.value) return "Sheets";
    if (controls.rollsRadio.value) return "Rolls";
    if (controls.dieRadio.value) return "Die-cut";
    return null;
}

function getSelectedMaterial(controls) {
    if (controls.whiteRadio.value) return "White";
    if (controls.clearRadio.value) return "Clear";
    if (controls.metallicRadio.value) return "Metallic";
    if (controls.holographicRadio.value) return "Holographic";
    return null;
}

function hasWhiteInk(controls) {
    return controls.yesHorizRadio.value || controls.yesVertRadio.value;
}

/**
 * Builds configuration for Make mode
 * @param {Object} controls - Make mode controls
 * @param {Object} validationResult - Result from validateInputs
 * @returns {Object} Configuration object
 */
function buildConfig(controls, validationResult) {
    return {
        mode: "Make",
        shapeType: getSelectedShape(controls),
        labelType: getSelectedLabel(controls),
        addGuidelines: controls.guidelinesCheckbox.value,
        swapOrientation: controls.swapOrientationCheckbox.value,
        material: getSelectedMaterial(controls),
        whiteInk: hasWhiteInk(controls),
        widthInches: validationResult.widthValue,
        heightInches: validationResult.heightValue
    };
}

// ============================================================================
// TAB BUILDING
// ============================================================================

/**
 * Builds the Make tab content
 * @param {Object} parent - Parent container
 * @param {Object} prefs - User preferences (not used in Make mode but kept for consistency)
 * @returns {Object} Object with controls and panel references
 */
function buildMakeTab(parent, prefs) {
    var panel = parent.add("group");
    panel.orientation = "column";
    panel.alignChildren = ["center", "top"];
    panel.spacing = UI_CONFIG.layout.spacing.normal;
    
    var controls = {};
    
    // Label Type
    createLabelTypeSection(panel, controls);
    
    // Shape Type
    addSeparatorLine(panel);
    createShapeTypeSection(panel, controls);
    
    // Material Type
    addSeparatorLine(panel);
    createMaterialTypeSection(panel, controls);
    
    // White Ink
    addSeparatorLine(panel);
    createWhiteInkSection(panel, controls);
    
    // Size Input
    addSeparatorLine(panel);
    createSizeSection(panel, controls);
    
    // Guidelines and Orientation
    addSeparatorLine(panel);
    createGuidelinesSection(panel, controls);
    
    // Set up event handlers
    setupEventHandlers(controls);
    
    // Initialize UI state (Sheets is selected by default)
    controls.sheetsRadio.onClick();
    
    return {
        controls: controls,
        panel: panel
    };
}

// ============================================================================
// DIALOG CREATION
// ============================================================================

/**
 * Shows the Make mode dialog
 * @returns {Object|null} Configuration object or null if cancelled
 */
function showDialog() {
    app.preferences.setIntegerPreference("rulerUnits", 2); // Inches
    
    // Create main dialog
    var dlg = new Window("dialog", UI_CONFIG.window.title);
    dlg.orientation = "column";
    dlg.alignChildren = ["center", "top"];
    dlg.spacing = UI_CONFIG.layout.spacing.normal;
    dlg.margins = UI_CONFIG.layout.margins.dialog;
    dlg.graphics.backgroundColor = dlg.graphics.newBrush(
        dlg.graphics.BrushType.SOLID_COLOR, 
        UI_CONFIG.window.backgroundColor
    );
    dlg.preferredSize.width = UI_CONFIG.window.width;
    
    // Build the tab
    var tabResult = buildMakeTab(dlg, {});
    var controls = tabResult.controls;
    
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
        var validationResult = validateInputs(controls);
        
        if (!validationResult.isValid) {
            controls.sizeErrorText.visible = true;
            return;
        } else {
            controls.sizeErrorText.visible = false;
        }
        
        finalConfig = buildConfig(controls, validationResult);
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

if (!$.global.MakeUI) {
    $.global.MakeUI = {
        buildTab: buildMakeTab,
        validate: validateInputs,
        buildConfig: buildConfig,
        showDialog: showDialog
    };
} 