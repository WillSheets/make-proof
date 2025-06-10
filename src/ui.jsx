/*
 * UI: User interface functions for the Label Proof script
 */

// Include constants
//@include "constants.jsx"

/**
 * Centralized UI configuration for easy adjustments
 * All spacing, margins, sizes, and styling options in one place
 */
var UI_CONFIG = {
    // Window properties
    window: {
        title: "New Proof",
        width: 380,
        backgroundColor: [0.2, 0.2, 0.2, 1]
    },
    
    // Layout spacing and margins
    layout: {
        // Spacing
        spacing: {
            tight: 5,
            normal: 10,
            loose: 20
        },
        // Margins
        margins: {
            dialog: [10, 5, 10, 20], // [left, top, right, bottom] - increased bottom margin
            tab: 20,
            section: 0,
            // [left, top, right, bottom] - Adjust left value (25) to increase/decrease left margin
            tabContent: [10, 10, 10, 10]
        },
        // Standard widths
        widths: {
            section: 300,
            statusText: 300,
            separator: 320,
            filePath: 260
        }
    },
    
    // Control sizes
    controls: {
        // Input fields
        input: {
            charactersWide: 5,
            spinButtonSpacing: 2
        },
        // Status text
        status: {
            charactersWide: 28,
            topMargin: 0  // Minimal margin when at top of dialog
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

/**
 * Displays the main dialog and collects user input.
 * @returns {object|null} configuration object or null if cancelled
 */
function getUserSelections() {
    app.preferences.setIntegerPreference("rulerUnits", 2); // Inches

    // Load persisted preferences (user-specific)
    var prefs = loadPrefs();

    // Create main dialog with configuration
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

    // --- Status text (at top) ---------------------------------------------------
    // (Replaced by a dropdown selector)
    // --- Mode Selection Dropdown ---------------------------------------------------
    var dropdownGroup = dlg.add("group");
    dropdownGroup.alignment = "center";
    dropdownGroup.margins = [0, UI_CONFIG.layout.spacing.loose * 1, 0, UI_CONFIG.layout.spacing.loose * 1];
    
    var modeDropdown = dropdownGroup.add("dropdownlist", undefined, ["Make a Proof Template", "Upload a Proof Template"]);
    modeDropdown.selection = 0; // Default to Make
    modeDropdown.preferredSize.width = UI_CONFIG.layout.widths.separator;
    modeDropdown.alignment = "center";
    applyTextStyle(modeDropdown);

    // Placeholder for status text (actual control is added near the bottom of the dialog)
    var statusText;

    // Content container using stack orientation to switch between panels
    var contentContainer = dlg.add("group");
    contentContainer.orientation = "stack";
    contentContainer.alignment = ["fill", "fill"];
    contentContainer.alignChildren = ["fill", "fill"];
    contentContainer.margins = [UI_CONFIG.layout.margins.tabContent[0], 0, UI_CONFIG.layout.margins.tabContent[2], UI_CONFIG.layout.margins.tabContent[3]];
    
    // Create content panels
    var makePanel = contentContainer.add("group");
    makePanel.orientation = "column";
    makePanel.alignChildren = ["center", "top"];
    makePanel.spacing = UI_CONFIG.layout.spacing.normal;
    makePanel.visible = true;
    
    var uploadPanel = contentContainer.add("group");
    uploadPanel.orientation = "column";
    uploadPanel.alignChildren = ["center", "top"];
    uploadPanel.spacing = UI_CONFIG.layout.spacing.normal;
    uploadPanel.visible = false;
    
    // Tab switching functions
    function showMakeTab() {
        makePanel.visible = true;
        uploadPanel.visible = false;
        statusText.text = "";
        // Update button appearance
        try {
            modeDropdown.selection = 0;
        } catch(e) {
            // Fallback if dropdown selection not supported
        }
    }
    
    function showUploadTab() {
        makePanel.visible = false;
        uploadPanel.visible = true;
        statusText.text = "";
        // Update button appearance
        try {
            modeDropdown.selection = 1;
        } catch(e) {
            // Fallback if dropdown selection not supported
        }
    }
    
    // Button click handlers
    modeDropdown.onChange = function() {
        if (modeDropdown.selection && modeDropdown.selection.index === 0) {
            showMakeTab();
        } else {
            showUploadTab();
        }
    };
    
    // (Initial Make mode selection will be set after the status message control is created)
    // UI Control collections
    var makeControls = {};
    var uploadControls = {};

    // --- "Make" Tab UI ---

    // Label Type
    var make_labelGroup = createUISection(makePanel, "Label Type:");
    makeControls.sheetsRadio = createStyledRadio(make_labelGroup, "Sheets", true);
    makeControls.rollsRadio = createStyledRadio(make_labelGroup, "Rolls", false);
    makeControls.dieRadio = createStyledRadio(make_labelGroup, "Die-cut", false);
    makeControls.customRadio = createStyledRadio(make_labelGroup, "Custom", false);

    // Shape Type
    addSeparatorLine(makePanel);
    var make_shapeGroup = createUISection(makePanel, "Shape Type:");
    makeControls.squaredRadio = createStyledRadio(make_shapeGroup, "Squared", true);
    makeControls.roundedRadio = createStyledRadio(make_shapeGroup, "Rounded", false);
    makeControls.roundRadio = createStyledRadio(make_shapeGroup, "Round", false);

    // Material Type
    addSeparatorLine(makePanel);
    var make_materialGroup = createUISection(makePanel, "Material Type:", {spacing: UI_CONFIG.controls.radioGroup.materialSpacing});
    makeControls.whiteRadio = createStyledRadio(make_materialGroup, "White", false);
    makeControls.clearRadio = createStyledRadio(make_materialGroup, "Clear", false);
    makeControls.metallicRadio = createStyledRadio(make_materialGroup, "Metallic", false);
    makeControls.holographicRadio = createStyledRadio(make_materialGroup, "Holographic", false);

    // White Ink
    addSeparatorLine(makePanel);
    var make_whiteGroup = createUISection(makePanel, "White Ink?");
    makeControls.noWhiteRadio = createStyledRadio(make_whiteGroup, "No", true);
    makeControls.yesHorizRadio = createStyledRadio(make_whiteGroup, "Yes (wide layout)", false);
    makeControls.yesVertRadio = createStyledRadio(make_whiteGroup, "Yes (tall layout)", false);

    // Size Input
    addSeparatorLine(makePanel);
    var make_sizeSection = createUISection(makePanel, "Size:");

    var make_sizeInputGroup = make_sizeSection.add("group");
    make_sizeInputGroup.orientation = "row";
    make_sizeInputGroup.alignChildren = "center";
    make_sizeInputGroup.spacing = UI_CONFIG.layout.spacing.loose;

    var widthResult = createLabeledNumericInput(make_sizeInputGroup, "Width", "");
    var heightResult = createLabeledNumericInput(make_sizeInputGroup, "Height", "");

    makeControls.widthInput = widthResult.input;
    makeControls.heightInput = heightResult.input;

    // Guidelines and Orientation (no title) section (after Size)
    addSeparatorLine(makePanel);
    var make_miscGroup = makePanel.add("group");
    make_miscGroup.orientation = "row";
    make_miscGroup.alignChildren = ["center", "center"];
    make_miscGroup.preferredSize.width = UI_CONFIG.layout.widths.separator;
    make_miscGroup.spacing = UI_CONFIG.layout.spacing.loose;
    make_miscGroup.margins = [0, UI_CONFIG.layout.spacing.normal, 0, 0];

    makeControls.guidelinesCheckbox = make_miscGroup.add("checkbox", undefined, "Add Guidelines?");
    applyTextStyle(makeControls.guidelinesCheckbox);

    makeControls.swapOrientationCheckbox = make_miscGroup.add("checkbox", undefined, "Swap the Orientation?");
    applyTextStyle(makeControls.swapOrientationCheckbox);

    // --- "Upload" Tab UI ---

    // Helper to truncate button labels to 50 characters
    function truncateLabel(str) {
        var MAX = 50;
        if (str.length > MAX) return str.substring(0, MAX) + "...";
        return str;
    }

    // Default directory picker: button + path label -----------------------------
    var defaultDirGroup = uploadPanel.add("group");
    defaultDirGroup.orientation = "row";
    defaultDirGroup.alignChildren = ["center", "center"];
    defaultDirGroup.margins = [0, 0, 0, UI_CONFIG.layout.spacing.normal];

    var initialDirLabel = prefs.defaultUploadDir ? "Default Directory: " + prefs.defaultUploadDir : "Set Default Directory";
    var defaultDirButton = defaultDirGroup.add("button", undefined, truncateLabel(initialDirLabel));

    defaultDirButton.onClick = function () {
        var selectedFolder = Folder.selectDialog("Select default proof template directory");
        if (selectedFolder) {
            prefs.defaultUploadDir = selectedFolder.fsName;
            var label = "Default Directory: " + prefs.defaultUploadDir;
            defaultDirButton.text = truncateLabel(label);
            savePrefs(prefs);

            var latestFile = getMostRecentFileInFolder(selectedFolder);
            if (latestFile) {
                uploadControls.dieLineFile = latestFile;
                upload_uploadBtn.text = truncateLabel(latestFile.name);
            }
        }
    };

    // Upload section (button)
    var upload_uploadBtn = uploadPanel.add("button", undefined, "Upload Proof Template");
    upload_uploadBtn.alignment = "center";
    // Add a 5px spacer below the button
    var uploadBtnSpacer = uploadPanel.add("group");
    uploadBtnSpacer.preferredSize.height = 5;
    
    upload_uploadBtn.onClick = function() {
        var dieLineFile = File.openDialog("Select an Illustrator file", "*.ai;*.pdf", false);
        if (dieLineFile) {
            uploadControls.dieLineFile = dieLineFile;
            upload_uploadBtn.text = truncateLabel(dieLineFile.name);
        }
    }
    
    // Ensure both buttons share the same width
    upload_uploadBtn.onDraw = defaultDirButton.onDraw = null; // ensure default style
    var btnWidth = UI_CONFIG.layout.widths.separator;
    upload_uploadBtn.preferredSize.width = btnWidth;
    defaultDirButton.preferredSize.width = btnWidth;
    upload_uploadBtn.minimumSize.width = btnWidth;
    defaultDirButton.minimumSize.width = btnWidth;

    // Label Type
    var upload_labelGroup = createUISection(uploadPanel, "Label Type:");
    uploadControls.sheetsRadio = createStyledRadio(upload_labelGroup, "Sheets", true);
    uploadControls.rollsRadio = createStyledRadio(upload_labelGroup, "Rolls", false);
    uploadControls.dieRadio = createStyledRadio(upload_labelGroup, "Die-cut", false);
    uploadControls.customRadio = createStyledRadio(upload_labelGroup, "Custom", false);

    // Material Type
    addSeparatorLine(uploadPanel);
    var upload_materialGroup = createUISection(uploadPanel, "Material Type:", {spacing: UI_CONFIG.controls.radioGroup.materialSpacing});
    uploadControls.whiteRadio = createStyledRadio(upload_materialGroup, "White", false);
    uploadControls.clearRadio = createStyledRadio(upload_materialGroup, "Clear", false);
    uploadControls.metallicRadio = createStyledRadio(upload_materialGroup, "Metallic", false);
    uploadControls.holographicRadio = createStyledRadio(upload_materialGroup, "Holographic", false);

    // White Ink
    addSeparatorLine(uploadPanel);
    var upload_whiteGroup = createUISection(uploadPanel, "White Ink?");
    uploadControls.noWhiteRadio = createStyledRadio(upload_whiteGroup, "No", true);
    uploadControls.yesHorizRadio = createStyledRadio(upload_whiteGroup, "Yes (wide layout)", false);
    uploadControls.yesVertRadio = createStyledRadio(upload_whiteGroup, "Yes (tall layout)", false);

    // Guidelines and Orientation (no title) section (after White Ink)
    addSeparatorLine(uploadPanel);
    var upload_miscGroup = uploadPanel.add("group");
    upload_miscGroup.orientation = "row";
    upload_miscGroup.alignChildren = ["center", "center"];
    upload_miscGroup.preferredSize.width = UI_CONFIG.layout.widths.separator;
    upload_miscGroup.spacing = UI_CONFIG.layout.spacing.loose;
    upload_miscGroup.margins = [0, UI_CONFIG.layout.spacing.normal, 0, 0];

    uploadControls.guidelinesCheckbox = upload_miscGroup.add("checkbox", undefined, "Add Guidelines?");
    applyTextStyle(uploadControls.guidelinesCheckbox);

    uploadControls.swapOrientationCheckbox = upload_miscGroup.add("checkbox", undefined, "Swap the Orientation?");
    applyTextStyle(uploadControls.swapOrientationCheckbox);

    // --- Event Handler Setup ---

    /**
     * Sets up event handlers for a set of controls (make or upload tab)
     * @param {Object} controls - The controls object containing all UI elements
     */
    function setupControlEventHandlers(controls) {
        // Behavior on label type selections
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
            updateMaterialSelectionState();
        };
        
        controls.rollsRadio.onClick = function() {
            controls.yesHorizRadio.enabled = true;
            controls.yesVertRadio.enabled = true;
            controls.whiteRadio.enabled = true;
            controls.clearRadio.enabled = true;
            controls.metallicRadio.enabled = true;
            controls.holographicRadio.enabled = true;
            controls.guidelinesCheckbox.enabled = true;
            updateMaterialSelectionState();
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
            updateMaterialSelectionState();
        };
        
        controls.customRadio.onClick = function() {
            controls.yesHorizRadio.enabled = true;
            controls.yesVertRadio.enabled = true;
            controls.whiteRadio.enabled = true;
            controls.clearRadio.enabled = true;
            controls.metallicRadio.enabled = true;
            controls.holographicRadio.enabled = true;
            controls.guidelinesCheckbox.value = true;
            controls.guidelinesCheckbox.enabled = false;
            updateMaterialSelectionState();
        };
        
        controls.noWhiteRadio.onClick = function() {
            controls.guidelinesCheckbox.enabled = true;
            updateMaterialSelectionState();
        };
        
        controls.yesHorizRadio.onClick = function() {
            controls.guidelinesCheckbox.value = true;
            controls.guidelinesCheckbox.enabled = false;
            enforceOneMaterialSelected();
            updateMaterialSelectionState();
        };
        
        controls.yesVertRadio.onClick = function() {
            controls.guidelinesCheckbox.value = true;
            controls.guidelinesCheckbox.enabled = false;
            enforceOneMaterialSelected();
            updateMaterialSelectionState();
        };

        // Track which material (if any) is selected
        controls.lastMaterialSelected = null;

        // Add onClick handlers for material radios to implement custom logic
        controls.whiteRadio.onClick = function() { handleMaterialToggle(controls.whiteRadio); };
        controls.clearRadio.onClick = function() { handleMaterialToggle(controls.clearRadio); };
        controls.metallicRadio.onClick = function() { handleMaterialToggle(controls.metallicRadio); };
        controls.holographicRadio.onClick = function() { handleMaterialToggle(controls.holographicRadio); };

        // Material selection helper functions
        function handleMaterialToggle(clickedRadio) {
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
        }

        function enforceOneMaterialSelected() {
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

        function updateMaterialSelectionState() {
            var whiteScenario = (controls.yesHorizRadio.value || controls.yesVertRadio.value);
            if (whiteScenario) {
                enforceOneMaterialSelected();
            }
        }
    }

    // Set up event handlers for both tabs
    setupControlEventHandlers(makeControls);
    setupControlEventHandlers(uploadControls);

    // Initialize material radio button states (disabled for Sheets)
    makeControls.whiteRadio.enabled = false;
    makeControls.clearRadio.enabled = false;
    makeControls.metallicRadio.enabled = false;
    makeControls.holographicRadio.enabled = false;
    uploadControls.whiteRadio.enabled = false;
    uploadControls.clearRadio.enabled = false;
    uploadControls.metallicRadio.enabled = false;
    uploadControls.holographicRadio.enabled = false;
    
    // OK/Cancel button group
    var buttonGroup = dlg.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    buttonGroup.alignChildren = "center";
    buttonGroup.margins = [0, UI_CONFIG.layout.spacing.normal, 0, UI_CONFIG.layout.spacing.normal];
    
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");

    // --- Status message (below OK/Cancel buttons) --------------------------------------
    var statusGroup = dlg.add("group");
    statusGroup.alignment = "center";
    statusGroup.margins = [0, 0, 0, 0]; // Minimal margins

    statusText = statusGroup.add("statictext", undefined, "");
    statusText.characters = UI_CONFIG.controls.status.charactersWide;
    statusText.alignment = ["center", "center"];
    statusText.justify = "center";
    applyTextStyle(statusText);
    statusText.preferredSize.width = UI_CONFIG.layout.widths.statusText;

    // Now that statusText exists, set the initial mode
    showMakeTab();

    // Initialize the UI state since Sheets is selected by default
    makeControls.sheetsRadio.onClick();
    uploadControls.sheetsRadio.onClick();

    // Dialog result tracking
    var dialogResult = false;
    var finalConfig = {};

    // OK button handler
    okButton.onClick = function() {
        // Reset status text to placeholder before validation
        statusText.text = "";

        if (makePanel.visible) {
            // Validate width and height inputs
            var widthVal  = parseFloat(makeControls.widthInput.text);
            var heightVal = parseFloat(makeControls.heightInput.text);
            var widthMissing  = isNaN(widthVal)  || widthVal  <= 0;
            var heightMissing = isNaN(heightVal) || heightVal <= 0;

            if (widthMissing && heightMissing) {
                statusText.text = "Missing the label size.";
                return; // Do not close dialog
            } else if (widthMissing) {
                statusText.text = "Missing the label width.";
                return;
            } else if (heightMissing) {
                statusText.text = "Missing the label height.";
                return;
            }
            
            // Build configuration for Make mode
            finalConfig.mode = "Make";
            finalConfig.shapeType = makeControls.squaredRadio.value ? "Squared" : 
                                  (makeControls.roundedRadio.value ? "Rounded" : "Round");
            finalConfig.labelType = makeControls.sheetsRadio.value ? "Sheets" :
                                  (makeControls.rollsRadio.value ? "Rolls" :
                                  (makeControls.dieRadio.value ? "Die-cut" :
                                  (makeControls.customRadio.value ? "Custom" : null)));
            finalConfig.addGuidelines = makeControls.guidelinesCheckbox.value;
            finalConfig.swapOrientation = makeControls.swapOrientationCheckbox.value;
            finalConfig.material = makeControls.whiteRadio.value ? "White" :
                                 makeControls.clearRadio.value ? "Clear" :
                                 makeControls.metallicRadio.value ? "Metallic" :
                                 makeControls.holographicRadio.value ? "Holographic" : null;
            finalConfig.whiteInk = makeControls.yesHorizRadio.value || makeControls.yesVertRadio.value;
            finalConfig.widthInches = widthVal;
            finalConfig.heightInches = heightVal;

        } else { // Upload Tab
            // Fallback to default directory if no manual file chosen
            if (!uploadControls.dieLineFile && prefs.defaultUploadDir) {
                var fallbackFolder = new Folder(prefs.defaultUploadDir);
                if (fallbackFolder.exists) {
                    var fallbackFile = getMostRecentFileInFolder(fallbackFolder);
                    if (fallbackFile) {
                        uploadControls.dieLineFile = fallbackFile;
                    }
                }
            }

            if (!uploadControls.dieLineFile) {
                statusText.text = "Please upload a proof template.";
                return; // Do not close
            }

            // Build configuration for Upload mode
            finalConfig.mode = "Upload";
            finalConfig.dieLineFile = uploadControls.dieLineFile;
            finalConfig.swapOrientation = uploadControls.swapOrientationCheckbox.value;
            finalConfig.labelType = uploadControls.sheetsRadio.value ? "Sheets" :
                                  (uploadControls.rollsRadio.value ? "Rolls" :
                                  (uploadControls.dieRadio.value ? "Die-cut" :
                                  (uploadControls.customRadio.value ? "Custom" : null)));
            finalConfig.addGuidelines = uploadControls.guidelinesCheckbox.value;
            finalConfig.material = uploadControls.whiteRadio.value ? "White" :
                                 uploadControls.clearRadio.value ? "Clear" :
                                 uploadControls.metallicRadio.value ? "Metallic" :
                                 uploadControls.holographicRadio.value ? "Holographic" : null;
            finalConfig.whiteInk = uploadControls.yesHorizRadio.value || uploadControls.yesVertRadio.value;
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