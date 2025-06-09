/*
 * UI: User interface functions for the Label Proof script
 */

// Include constants
//@include "constants.jsx"

/**
 * Displays the main dialog and collects user input.
 * @returns {object|null} configuration object or null if cancelled
 */
function getUserSelections() {
    app.preferences.setIntegerPreference("rulerUnits", 2); // Inches

    var dlg = new Window("dialog", "Make a New Proof");
    dlg.orientation = "column";
    dlg.alignChildren = ["center", "top"];
    // Common width for section blocks so their left edges stay aligned when centered
    var sectionWidth = 300; // matches separator line width
    dlg.spacing = 10;
    dlg.margins = 15;
    dlg.graphics.backgroundColor = dlg.graphics.newBrush(dlg.graphics.BrushType.SOLID_COLOR, [0.2, 0.2, 0.2, 1]);

    // make the overall window a bit wider than the 300-px content block
    dlg.preferredSize.width = 360;  // pick any value larger than 300

    // --- Status text (error) ---------------------------------------------------
    var statusGroup = dlg.add("group");
    statusGroup.alignment = "center";
    var statusText = statusGroup.add("statictext", undefined, "Proof Settings");
    statusText.characters = 28;
    statusText.alignment = ["center", "center"];
    statusText.justify = "center";
    // White text colour
    statusText.graphics.foregroundColor = statusText.graphics.newPen(
        statusText.graphics.PenType.SOLID_COLOR, [1, 1, 1], 1
    );
    statusText.preferredSize.width = 300; // constrain width so it doesn't stretch the dialog

    function createHeader(parent, text) {
        var header = parent.add("statictext", undefined, text);
        header.graphics.font = ScriptUI.newFont(header.graphics.font.name, "BOLD", header.graphics.font.size);
        header.graphics.foregroundColor = header.graphics.newPen(header.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        return header;
    }
    function styleControl(control) {
        control.graphics.foregroundColor = control.graphics.newPen(control.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
    }
    function createSection(parent, headerText) {
        // Container that will be centered inside the dialog while its children remain left-aligned
        var section = parent.add("group");
        section.orientation = "column";
        section.alignChildren = ["left", "top"]; // keep internal elements flushed left
        section.alignment = "center";            // but center the whole section in the window
        section.preferredSize.width = sectionWidth; // ensure consistent width across sections

        // Header
        var header = createHeader(section, headerText);
        // Allow header to fill the width so its text starts at the same left edge
        header.alignment = ["left", "top"];

        // Horizontal group for the section's selectable controls
        var optionsGroup = section.add("group");
        optionsGroup.orientation = "row";
        optionsGroup.alignChildren = ["left", "center"];
        optionsGroup.preferredSize.width = sectionWidth; // keep options width consistent as well
        optionsGroup.spacing = 20;
        return optionsGroup;
    }

    // Helper to add a centered, fixed-width separator line
    function addSeparator(parent) {
        var sep = parent.add("panel");
        sep.alignment = "center";
        sep.preferredSize.width = 300; // shorten line length
        return sep;
    }

    // Add function to create spin buttons like in NewDie.jsx
    function createSpinButtons(parent, editText, increment1, increment2) {
        var spinGroup = parent.add("group");
        spinGroup.orientation = "row";
        spinGroup.spacing = 2;
        spinGroup.alignChildren = "center";
        
        var firstSpinGroup = spinGroup.add("group");
        firstSpinGroup.orientation = "column";
        firstSpinGroup.spacing = 0;
        firstSpinGroup.alignChildren = "center";
        
        var upBtn1 = firstSpinGroup.add("statictext", undefined, "\u25B2"); // ▲
        var downBtn1 = firstSpinGroup.add("statictext", undefined, "\u25BC"); // ▼
        
        upBtn1.addEventListener('mousedown', function() { adjustValue(increment1); });
        downBtn1.addEventListener('mousedown', function() { adjustValue(-increment1); });

        var secondSpinGroup = spinGroup.add("group");
        secondSpinGroup.orientation = "column";
        secondSpinGroup.spacing = 0;
        secondSpinGroup.alignChildren = "center";
        
        var upBtn2 = secondSpinGroup.add("statictext", undefined, "\u25B2");
        var downBtn2 = secondSpinGroup.add("statictext", undefined, "\u25BC");
        
        upBtn2.addEventListener('mousedown', function() { adjustValue(increment2); });
        downBtn2.addEventListener('mousedown', function() { adjustValue(-increment2); });
        
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
        
        return spinGroup;
    }

    // Label Type
    var labelGroup = createSection(dlg, "Label Type:");
    var sheetsRadio = labelGroup.add("radiobutton", undefined, "Sheets");
    var rollsRadio = labelGroup.add("radiobutton", undefined, "Rolls");
    var dieRadio = labelGroup.add("radiobutton", undefined, "Die-cut");
    var customRadio = labelGroup.add("radiobutton", undefined, "Custom");
    sheetsRadio.value = true;
    
    styleControl(sheetsRadio);
    styleControl(rollsRadio);
    styleControl(dieRadio);
    styleControl(customRadio);

    // Shape Type
    addSeparator(dlg);
    var shapeGroup = createSection(dlg, "Shape Type:");
    var squaredRadio = shapeGroup.add("radiobutton", undefined, "Squared");
    var roundedRadio = shapeGroup.add("radiobutton", undefined, "Rounded");
    var roundRadio = shapeGroup.add("radiobutton", undefined, "Round");
    squaredRadio.value = true;
    styleControl(squaredRadio);
    styleControl(roundedRadio);
    styleControl(roundRadio);

    // Material Type
    addSeparator(dlg);
    var materialGroup = createSection(dlg, "Material Type:");
    materialGroup.spacing = 15; // Decreased spacing to fit all options
    var whiteRadio = materialGroup.add("radiobutton", undefined, "White");
    var clearRadio = materialGroup.add("radiobutton", undefined, "Clear");
    var metallicRadio = materialGroup.add("radiobutton", undefined, "Metallic");
    var holographicRadio = materialGroup.add("radiobutton", undefined, "Holographic");
    styleControl(whiteRadio);
    styleControl(clearRadio);
    styleControl(metallicRadio);
    styleControl(holographicRadio);
    whiteRadio.enabled = false;
    clearRadio.enabled = false;
    metallicRadio.enabled = false;
    holographicRadio.enabled = false;

    // Guidelines
    addSeparator(dlg);
    var guideGroup = createSection(dlg, "Add Guidelines?");
    var noGuideRadio = guideGroup.add("radiobutton", undefined, "No");
    var yesGuideRadio = guideGroup.add("radiobutton", undefined, "Yes");
    noGuideRadio.value = true;
    styleControl(noGuideRadio);
    styleControl(yesGuideRadio);

    // White Ink
    addSeparator(dlg);
    var whiteGroup = createSection(dlg, "White Ink?");
    var noWhiteRadio = whiteGroup.add("radiobutton", undefined, "No");
    var yesHorizRadio = whiteGroup.add("radiobutton", undefined, "Yes (wide layout)");
    var yesVertRadio = whiteGroup.add("radiobutton", undefined, "Yes (tall layout)");
    noWhiteRadio.value = true;
    styleControl(noWhiteRadio);
    styleControl(yesHorizRadio);
    styleControl(yesVertRadio);

    // Replace the Size Input section
    addSeparator(dlg);
    var sizeGroup = createSection(dlg, "Size:");
    
    // Create container for width and height inputs
    var sizeInputGroup = sizeGroup.add("group");
    sizeInputGroup.orientation = "row";
    sizeInputGroup.alignChildren = "center";
    sizeInputGroup.spacing = 20;
    
    // Width input with label
    var widthGroup = sizeInputGroup.add("group");
    widthGroup.orientation = "row";
    widthGroup.alignChildren = "center";
    widthGroup.spacing = 10; // Increased from 5 to move Width label further from input
    
    var widthLabel = widthGroup.add("statictext", undefined, "Width:");
    styleControl(widthLabel);
    
    var widthInput = widthGroup.add("edittext", undefined, "");
    widthInput.characters = 5;
    
    // Add spin buttons for width (1 and 0.0625)
    createSpinButtons(widthGroup, widthInput, 1, 0.0625);
    
    // Height input with label
    var heightGroup = sizeInputGroup.add("group");
    heightGroup.orientation = "row";
    heightGroup.alignChildren = "center";
    heightGroup.spacing = 10; // Increased from 5 to move Height label further from input
    
    var heightLabel = heightGroup.add("statictext", undefined, "Height:");
    styleControl(heightLabel);
    
    var heightInput = heightGroup.add("edittext", undefined, "");
    heightInput.characters = 5;
    
    // Add spin buttons for height (1 and 0.0625)
    createSpinButtons(heightGroup, heightInput, 1, 0.0625);

    // Behavior on label type selections
    sheetsRadio.onClick = function() {
        noWhiteRadio.value = true;
        yesHorizRadio.enabled = false;
        yesVertRadio.enabled = false;
        whiteRadio.enabled = false;
        clearRadio.enabled = false;
        metallicRadio.enabled = false;
        holographicRadio.enabled = false;
        whiteRadio.value = false;
        clearRadio.value = false;
        metallicRadio.value = false;
        holographicRadio.value = false;
        noGuideRadio.enabled = true;
        updateMaterialSelectionState();
    };
    rollsRadio.onClick = function() {
        yesHorizRadio.enabled = true;
        yesVertRadio.enabled = true;
        whiteRadio.enabled = true;
        clearRadio.enabled = true;
        metallicRadio.enabled = true;
        holographicRadio.enabled = true;
        noGuideRadio.enabled = true;
        updateMaterialSelectionState();
    };
    dieRadio.onClick = function() {
        yesHorizRadio.enabled = true;
        yesVertRadio.enabled = true;
        whiteRadio.enabled = true;
        clearRadio.enabled = true;
        metallicRadio.enabled = true;
        holographicRadio.enabled = true;
        yesGuideRadio.value = true;
        noGuideRadio.enabled = false;
        updateMaterialSelectionState();
    };
    customRadio.onClick = function() {
        yesHorizRadio.enabled = true;
        yesVertRadio.enabled = true;
        whiteRadio.enabled = true;
        clearRadio.enabled = true;
        metallicRadio.enabled = true;
        holographicRadio.enabled = true;
        yesGuideRadio.value = true;
        noGuideRadio.enabled = false;
        updateMaterialSelectionState();
    };
    noWhiteRadio.onClick = function() {
        noGuideRadio.enabled = true;
        // If going to "No" white ink, it's allowed to have zero or one material selected.
        updateMaterialSelectionState();
    };
    yesHorizRadio.onClick = function() {
        yesGuideRadio.value = true;
        noGuideRadio.enabled = false;
        // Ensure exactly one material is selected
        enforceOneMaterialSelected();
        updateMaterialSelectionState();
    };
    yesVertRadio.onClick = function() {
        yesGuideRadio.value = true;
        noGuideRadio.enabled = false;
        // Ensure exactly one material is selected
        enforceOneMaterialSelected();
        updateMaterialSelectionState();
    };

    // Track which material (if any) is selected
    var lastMaterialSelected = null;

    // Add onClick handlers for material radios to implement custom logic
    whiteRadio.onClick = function() {
        handleMaterialToggle(whiteRadio);
    };
    clearRadio.onClick = function() {
        handleMaterialToggle(clearRadio);
    };
    metallicRadio.onClick = function() {
        handleMaterialToggle(metallicRadio);
    };
    holographicRadio.onClick = function() {
        handleMaterialToggle(holographicRadio);
    };

    function handleMaterialToggle(clickedRadio) {
        var whiteScenario = (yesHorizRadio.value || yesVertRadio.value);

        if (whiteScenario) {
            // "Yes White" scenario: must always have exactly one selected.
            // Radio buttons naturally enforce at least one selection in a group,
            // and the user cannot uncheck a selected radio by clicking it again.
            // No special logic needed here, just update lastMaterialSelected.
            if (clickedRadio.value) {
                lastMaterialSelected = clickedRadio;
            }
        } else {
            // "No White" scenario:
            // User can have zero or one material selected.
            // If the user clicks the same selected material again, we want to deselect it.
            if (clickedRadio === lastMaterialSelected) {
                // Deselecting the currently selected material
                clickedRadio.value = false;
                lastMaterialSelected = null;
            } else {
                // Selecting a new material
                if (clickedRadio.value) {
                    lastMaterialSelected = clickedRadio;
                } else {
                    // If they clicked an unselected radio, it becomes selected
                    clickedRadio.value = true;
                    lastMaterialSelected = clickedRadio;
                }
            }
        }
    }

    function enforceOneMaterialSelected() {
        // If none is currently selected and we are in a white scenario, select one by default
        var whiteScenario = (yesHorizRadio.value || yesVertRadio.value);
        if (whiteScenario) {
            var anySelected = whiteRadio.value || clearRadio.value || metallicRadio.value || holographicRadio.value;
            if (!anySelected) {
                // Default to white (new default)
                whiteRadio.value = true;
                lastMaterialSelected = whiteRadio;
            }
        }
    }

    function updateMaterialSelectionState() {
        var whiteScenario = (yesHorizRadio.value || yesVertRadio.value);

        if (whiteScenario) {
            // Exactly one material must be selected
            // If somehow none is selected (e.g., user just changed scenario), fix it:
            enforceOneMaterialSelected();
        } else {
            // No White scenario: zero or one material allowed
            // No additional action needed since handleMaterialToggle covers toggling off.
        }
    }

    // Initialize the UI state since Sheets is selected by default
    sheetsRadio.onClick();

    // OK/Cancel
    var buttonGroup = dlg.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center"; // Center the button group
    buttonGroup.alignChildren = "center"; // Center the buttons within the group
    buttonGroup.margins = [0, 15, 0, 0]; // Small top margin
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");

    var dialogResult = false;
    okButton.onClick = function() {
        // Reset status text to placeholder before validation
        statusText.text = "Proof Settings";

        // Validate width and height inputs
        var widthVal  = parseFloat(widthInput.text);
        var heightVal = parseFloat(heightInput.text);
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

        dialogResult = true;
        dlg.close();
    };
    cancelButton.onClick = function() {
        dialogResult = false;
        dlg.close();
    };

    dlg.show();
    if (!dialogResult) return null;

    // Gather user input
    var shapeType = squaredRadio.value ? "Squared" : (roundedRadio.value ? "Rounded" : "Round");
    var labelType = sheetsRadio.value ? "Sheets" :
                    (rollsRadio.value ? "Rolls" :
                    (dieRadio.value ? "Die-cut" :
                    (customRadio.value ? "Custom" : null)));
    var addGuidelines = yesGuideRadio.value;
    var material = whiteRadio.value ? "White" :
                   clearRadio.value ? "Clear" :
                   metallicRadio.value ? "Metallic" :
                   holographicRadio.value ? "Holographic" : null;
    var whiteInk = yesHorizRadio.value || yesVertRadio.value;

    return {
        shapeType: shapeType,
        labelType: labelType,
        addGuidelines: addGuidelines,
        material: material,
        whiteInk: whiteInk,
        widthInches: parseFloat(widthInput.text),
        heightInches: parseFloat(heightInput.text)
    };
} 