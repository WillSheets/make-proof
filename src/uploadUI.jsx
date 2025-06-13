/*
 * uploadUI.jsx - User interface for Upload mode
 * 
 * Organization:
 * 1. Shared UI Configuration and Helpers (keep in sync with makeUI.jsx)
 * 2. Upload-specific UI Components
 * 3. Event Handlers for Upload mode
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
        title: "Upload Proof Template",
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

// Preference storage: use Illustrator's own preference store with a JSON fallback file
var PREF_KEY_DEFAULT_DIR = "LabelProof/defaultUploadDir";
var PREFS_FILE = File(Folder.userData + "/LabelProofPrefs.json");

// Load preferences from disk; returns an object or an empty one if unavailable
function loadPrefs() {
    var obj = {};

    // 1) Illustrator preferences (primary)
    try {
        var storedDir = app.preferences.getStringPreference(PREF_KEY_DEFAULT_DIR);
        if (storedDir && storedDir !== "") {
            obj.defaultUploadDir = storedDir;
        }
    } catch (prefErr) {}

    // 2) JSON file fallback (for pre-existing installs or if preferences unavailable)
    if (!obj.defaultUploadDir && PREFS_FILE.exists) {
        try {
            PREFS_FILE.encoding = "UTF-8";
            PREFS_FILE.open("r");
            var txt = PREFS_FILE.read();
            PREFS_FILE.close();
            var parsed = JSON.parse(txt);
            if (parsed && parsed.defaultUploadDir) obj.defaultUploadDir = parsed.defaultUploadDir;
        } catch (e) {
            if (PREFS_FILE.opened) PREFS_FILE.close();
        }
    }

    return obj;
}

// Save preferences object to disk (overwrites the entire file)
function savePrefs(obj) {
    if (!obj) return;

    // 1) Illustrator preference store
    if (obj.defaultUploadDir) {
        try {
            app.preferences.setStringPreference(PREF_KEY_DEFAULT_DIR, obj.defaultUploadDir);
        } catch(prefErr) {}
    }

    // 2) JSON fallback (harmless if fails)
    try {
        PREFS_FILE.encoding = "UTF-8";
        PREFS_FILE.open("w");
        PREFS_FILE.write(JSON.stringify(obj));
        PREFS_FILE.close();
    } catch (e) {
        if (PREFS_FILE.opened) PREFS_FILE.close();
    }
}

// Return the most recently modified *.ai file in a folder, or null if none
function getMostRecentFileInFolder(folderObj) {
    if (!folderObj || !folderObj.exists) return null;
    var candidates = [].concat(
        folderObj.getFiles("*.ai"),
        folderObj.getFiles("*.pdf")
    );
    if (!candidates || candidates.length === 0) return null;
    var latest = candidates[0];
    for (var i = 1; i < candidates.length; i++) {
        if (candidates[i].modified && candidates[i].modified > latest.modified) {
            latest = candidates[i];
        }
    }
    return latest;
}

// Helper to truncate button labels to 50 characters
function truncateLabel(str) {
    var MAX = 50;
    if (str.length > MAX) return str.substring(0, MAX) + "...";
    return str;
}

// Helper to format folder path for display (shows just folder name with leading slash)
function formatFolderDisplayName(folderPath) {
    if (!folderPath) return "Set Default Folder";
    
    // Extract folder name from path
    var folderName = folderPath.replace(/\\/g, "/").split("/").pop();
    if (!folderName) return "Set Default Folder";
    
    return "/" + folderName;
}

// ============================================================================
// END SHARED SECTION
// ============================================================================

// ============================================================================
// UPLOAD-SPECIFIC UI COMPONENTS
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

/**
 * Creates the upload section (Upload mode specific)
 * @param {Object} parent - Parent container
 * @param {Object} controls - Controls object to store references
 * @param {Object} prefs - User preferences
 */
function createUploadSection(parent, controls, prefs) {
    // Container for both upload options
    var uploadOptionsContainer = parent.add("group");
    uploadOptionsContainer.orientation = "column";
    uploadOptionsContainer.alignChildren = "center";
    uploadOptionsContainer.preferredSize.width = UI_CONFIG.layout.widths.separator;
    uploadOptionsContainer.maximumSize.width = UI_CONFIG.layout.widths.separator;
    uploadOptionsContainer.margins = [0, 0, 0, 0];
    
    // First option: Default Directory
    var defaultDirGroup = uploadOptionsContainer.add("group");
    defaultDirGroup.orientation = "row";
    defaultDirGroup.alignChildren = ["left", "center"];
    defaultDirGroup.alignment = ["fill", "center"];
    defaultDirGroup.preferredSize.width = UI_CONFIG.layout.widths.separator;
    defaultDirGroup.maximumSize.width = UI_CONFIG.layout.widths.separator;
    defaultDirGroup.spacing = UI_CONFIG.layout.spacing.loose;
    
    var defaultDirLabel = defaultDirGroup.add("statictext", undefined, "Use the Latest File in:");
    applyTextStyle(defaultDirLabel);
    defaultDirLabel.preferredSize.width = 130;
    
    var initialDirText = formatFolderDisplayName(prefs.defaultUploadDir);
    var defaultDirButton = defaultDirGroup.add("button", undefined, initialDirText);
    defaultDirButton.preferredSize.height = 20;
    defaultDirButton.preferredSize.width = 170;
    defaultDirButton.alignment = ["left", "center"];
    
    // Second option: Upload Proof
    var uploadProofGroup = uploadOptionsContainer.add("group");
    uploadProofGroup.orientation = "row";
    uploadProofGroup.alignChildren = ["left", "center"];
    uploadProofGroup.alignment = ["fill", "center"];
    uploadProofGroup.preferredSize.width = UI_CONFIG.layout.widths.separator;
    uploadProofGroup.maximumSize.width = UI_CONFIG.layout.widths.separator;
    uploadProofGroup.margins = [0, UI_CONFIG.layout.spacing.tight, 0, UI_CONFIG.layout.spacing.normal];
    uploadProofGroup.spacing = UI_CONFIG.layout.spacing.loose;

    var uploadProofLabel = uploadProofGroup.add("statictext", undefined, "Or Upload a File Here:");
    applyTextStyle(uploadProofLabel);
    uploadProofLabel.preferredSize.width = 130;

    // Button container to enable a narrow spacing between the two buttons
    var buttonContainer = uploadProofGroup.add("group");
    buttonContainer.orientation = "row";
    buttonContainer.alignChildren = ["left", "center"];
    buttonContainer.spacing = 2; // 2-px gap between Upload and Clear buttons

    var uploadBtn = buttonContainer.add("button", undefined, "Upload Proof Template");
    uploadBtn.preferredSize.height = 20;
    uploadBtn.alignment = ["left", "center"];

    // Clear button (initially hidden)
    var clearBtn = buttonContainer.add("button", undefined, "X");
    clearBtn.preferredSize.height = 20;
    clearBtn.preferredSize.width = 20;
    clearBtn.alignment = ["left", "center"];
    clearBtn.visible = false;
    applyTextStyle(clearBtn);

    // Width management helpers
    var BASE_BTN_WIDTH = defaultDirButton.preferredSize.width; // reference width
    var CLEAR_BTN_WIDTH = clearBtn.preferredSize.width;        // 20
    var GAP_WIDTH       = buttonContainer.spacing;             // 2

    // Initial width (no clear button)
    uploadBtn.preferredSize.width = BASE_BTN_WIDTH;

    function showClearButton() {
        clearBtn.visible = true;
        var newW = BASE_BTN_WIDTH - CLEAR_BTN_WIDTH - GAP_WIDTH;
        if (newW < 50) newW = 50; // safety minimum
        uploadBtn.preferredSize.width = newW;
        uploadBtn.size.width = newW;
        buttonContainer.layout.layout(true);
        uploadProofGroup.layout.layout(true);
    }

    function hideClearButton() {
        clearBtn.visible = false;
        uploadBtn.preferredSize.width = BASE_BTN_WIDTH;
        uploadBtn.size.width = BASE_BTN_WIDTH;
        buttonContainer.layout.layout(true);
        uploadProofGroup.layout.layout(true);
    }

    // Set up button handlers
    defaultDirButton.onClick = function () {
        var selectedFolder = Folder.selectDialog("Select default proof template directory");
        if (selectedFolder) {
            prefs.defaultUploadDir = selectedFolder.fsName;
            defaultDirButton.text = formatFolderDisplayName(prefs.defaultUploadDir);
            savePrefs(prefs);

            var latestFile = getMostRecentFileInFolder(selectedFolder);
            if (latestFile) {
                controls.dieLineFile = latestFile;
                uploadBtn.text = truncateLabel(latestFile.name);
                showClearButton();
            }
        }
    };

    uploadBtn.onClick = function() {
        var dieLineFile = File.openDialog("Select an Illustrator file", "*.ai;*.pdf", false);
        if (dieLineFile) {
            controls.dieLineFile = dieLineFile;
            uploadBtn.text = truncateLabel(dieLineFile.name);
            showClearButton();
        }
    };

    clearBtn.onClick = function() {
        controls.dieLineFile = null;
        uploadBtn.text = "Upload Proof Template";
        hideClearButton();
    };
}

// ============================================================================
// EVENT HANDLERS FOR UPLOAD MODE
// ============================================================================

/**
 * Sets up all event handlers for Upload mode controls
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
 * Validates Upload mode inputs
 * @param {Object} controls - Upload mode controls
 * @param {Object} prefs - User preferences
 * @returns {Object} Validation result with isValid flag and file
 */
function validateInputs(controls, prefs) {
    var file = controls.dieLineFile;
    
    // Fallback to default directory if no manual file chosen
    if (!file && prefs.defaultUploadDir) {
        var fallbackFolder = new Folder(prefs.defaultUploadDir);
        if (fallbackFolder.exists) {
            file = getMostRecentFileInFolder(fallbackFolder);
        }
    }
    
    return {
        isValid: file != null,
        file: file
    };
}

/**
 * Helper functions for building configuration
 */
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
 * Builds configuration for Upload mode
 * @param {Object} controls - Upload mode controls
 * @param {Object} validationResult - Result from validateInputs
 * @returns {Object} Configuration object
 */
function buildConfig(controls, validationResult) {
    return {
        mode: "Upload",
        dieLineFile: validationResult.file,
        swapOrientation: controls.swapOrientationCheckbox.value,
        labelType: getSelectedLabel(controls),
        addGuidelines: controls.guidelinesCheckbox.value,
        material: getSelectedMaterial(controls),
        whiteInk: hasWhiteInk(controls)
    };
}

// ============================================================================
// TAB BUILDING
// ============================================================================

/**
 * Builds the Upload tab content
 * @param {Object} parent - Parent container
 * @param {Object} prefs - User preferences
 * @returns {Object} Object with controls and panel references
 */
function buildUploadTab(parent, prefs) {
    var panel = parent.add("group");
    panel.orientation = "column";
    panel.alignChildren = ["center", "top"];
    panel.spacing = UI_CONFIG.layout.spacing.normal;
    
    var controls = {};
    
    // Upload section
    createUploadSection(panel, controls, prefs);
    
    // Separator after upload section
    addSeparatorLine(panel);
    
    // Label Type
    createLabelTypeSection(panel, controls);
    panel.children[panel.children.length - 1].alignment = "center";
    
    // Material Type
    addSeparatorLine(panel);
    createMaterialTypeSection(panel, controls);
    panel.children[panel.children.length - 1].alignment = "center";
    
    // White Ink
    addSeparatorLine(panel);
    createWhiteInkSection(panel, controls);
    panel.children[panel.children.length - 1].alignment = "center";
    
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
 * Shows the Upload mode dialog
 * @returns {Object|null} Configuration object or null if cancelled
 */
function showDialog() {
    app.preferences.setIntegerPreference("rulerUnits", 2); // Inches
    
    // Load persisted preferences
    var prefs = loadPrefs();
    
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
    var tabResult = buildUploadTab(dlg, prefs);
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
        var validationResult = validateInputs(controls, prefs);
        
        if (!validationResult.isValid) {
            return; // Do not close
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

if (!$.global.UploadUI) {
    $.global.UploadUI = {
        buildTab: buildUploadTab,
        validate: validateInputs,
        buildConfig: buildConfig,
        showDialog: showDialog
    };
} 