# UI Adjustment Guide

This concise reference shows how to tweak **`src/ui.jsx`** without hunting through code. All layout-related values live in the single **`UI_CONFIG`** object at the top of that file.

---
## 1.  Quick Reference – `UI_CONFIG`
```javascript
var UI_CONFIG = {
    window:    { /* dialog title, width, color */ },
    layout:    { /* spacing, margins, widths  */ },
    controls:  { /* control-specific sizes    */ },
    colors:    { /* pens & brushes           */ },
    increments:{ /* spinner step values      */ }
};
```
•  Update values directly; no other code changes are required.

---
## 2.  Common Adjustments

| What you want | Property to edit | Example |
|---------------|-----------------|---------|
| Dialog title  | `UI_CONFIG.window.title` | `"New Proof"` |
| Dialog width  | `UI_CONFIG.window.width` | `420` |
| Dropdown width (and separator lines) | `UI_CONFIG.layout.widths.separator` | `350` |
| Spacing between groups | `UI_CONFIG.layout.spacing.normal` | `15` |
| Extra top padding above **dropdown mode selector** | `dropdownGroup.margins[1]` (already set to `spacing.loose`) | `UI_CONFIG.layout.spacing.tight` |
| Bottom padding under **OK/Cancel** | `buttonGroup.margins[3]` or `UI_CONFIG.layout.margins.dialog[3]` | `30` |
| Default text colour | `UI_CONFIG.colors.text.normal` | `[0.9,0.9,0.9,1]` |
| Spinner increments  | `UI_CONFIG.increments.primary / secondary` | `0.5` / `0.125` |

---
## 3.  Understanding the Current Layout

```
Window (dialog)
 ├─ dropdownGroup      ← Mode selector (Make / Upload)
 │   └─ modeDropdown
 ├─ contentContainer   (stack)
 │   ├─ makePanel      ← Visible when Make selected
 │   └─ uploadPanel    ← Visible when Upload selected
 ├─ statusGroup        ← Empty by default; populated only on validation errors
 └─ buttonGroup        ← OK / Cancel
```
Key points:
1. **Dropdown replaces tabs.**  Change `dropdownGroup.margins` or `modeDropdown.preferredSize` for spacing/width.
2. **Status text starts blank.**  The script sets `statusText.text` only when validation fails; clearing errors sets it back to `""`.
3. **Panels live in a stack.**  Show/hide by calling `makePanel.visible = true/false`.

---
## 4.  Adding More Controls or Sections

Use the helper utilities already defined in **`ui.jsx`** so new UI obeys global styling automatically:

```javascript
addSeparatorLine(parentTab);                   // Horizontal rule
var mySection = createUISection(parentTab, "My Section Title:");
var myRadio   = createStyledRadio(mySection, "Choice", true);
```
*Everything inside `mySection` will be left-aligned and constrained to* `UI_CONFIG.layout.widths.section`.

---
## 5.  Colour & Font Tweaks

```javascript
UI_CONFIG.colors.text.header   = [1,1,0.8,1];   // Pale yellow headers
UI_CONFIG.colors.tabButton     = { active:[.4,.4,.4,1], inactive:[.2,.2,.2,1] };
```
Controls are recoloured through helper functions (`applyTextStyle`, etc.), so changes propagate automatically.

---
## 6.  Numeric Spinners

The paired ▲ / ▼ controls call `createNumericSpinners()`.  Adjust their behaviour with:
```javascript
UI_CONFIG.increments.primary   = 0.5;   // Coarse step
UI_CONFIG.increments.secondary = 0.125; // Fine step
```

---
## 7.  Tips & Tricks

• **Live reload:** After editing `ui.jsx`, re-run the script in Illustrator to preview changes.  Layout updates do **not** require Illustrator restart.

• **Platform differences:** If Windows vs macOS needs different margins, insert logic when building `UI_CONFIG`:
```javascript
var IS_WIN = File.fs === "Windows";
UI_CONFIG.layout.margins.dialog = IS_WIN ? [10,5,10,25] : [10,5,10,15];
```

• **Forcing re-layout:**  When toggling visibility at runtime, call `dlg.layout.layout(true);` followed by `dlg.layout.resize();` if controls look mis-aligned.

---
### Happy tweaking!  Because all layout constants live in one place, the interface can be restyled in minutes without diving deep into code. 