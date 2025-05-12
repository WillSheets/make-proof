# Label Proof Script – Project Context

## Purpose
Automate the creation of production-ready *proof* documents for pressure-sensitive labels inside Adobe Illustrator.  The script builds the essential dieline, bleed, backer and safe-zone guides, adds optional dimension annotations and legends, and prepares a scalable white-ink backer, giving pre-press operators a fast, repeatable way to visualise how a label will be cut and finished.

## Technology
* **Environment:** Adobe Illustrator ExtendScript (JavaScript-based).  The operator launches `run.jsx` from Illustrator's *File → Scripts* menu or via an Action.
* **Entry point:** `run.jsx` → `createRectangleWithDielineStroke()` in `src/main.jsx`.
* **Supporting modules:**
  * `constants.jsx` – conversion factors and per-label-type dimension-line offsets.
  * `ui.jsx` – builds the dialog and returns the user's configuration.
  * `core.jsx` – Illustrator DOM helpers: document creation, drawing, layer organisation, dimension lines, legend placement.
  * `utils.jsx` – colour utilities, geometry helpers, scaling rules, legend-filename logic.

## User Workflow
1. **Dialog** (`getUserSelections`)
   * Label type: *Sheets, Rolls, Die Cut, Custom*
   * Shape: *Squared, Rounded (9 pt radius), Round*
   * Optional **Guidelines** (dimension annotations)
   * Optional **White Ink** (horizontal / vertical layout) and **Material** (Clear, Metallic, Holographic)
   * Finished width & height (≥ 0.0625 ", up to five decimal places)
2. **Document & Shape**
   * A CMYK document is created at the requested size; ruler units set to inches.
   * The main label shape is drawn and given a 1 pt magenta "Dieline" spot-colour stroke.
3. **Offset Actions** *(external Illustrator Action Set "Offset")*
   * Runs an Action whose name matches the chosen label type.
   * Expected geometry (inches):
     | Label Type | Safe-Zone | Bleed | Backer |
     |------------|-----------|-------|--------|
     | Sheets     | −0.125″   | +0.125″ | – |
     | Rolls      | −0.0625″ | +0.0625″ | – |
     | Die Cut    | −0.0625″ | +0.1875″ | +0.125″ |
4. **Post-processing** (`handleMultiplePaths`, `organizeLayers`)
   * Names and colours paths: *Safezone* (grey dashed), *Bleed* (black), *Backer* (cut-to-part orange when present).
   * Layers: `Guides` (top), `Art` (middle), optional `White Background` (bottom, locked).
5. **Guidelines** (`addDimensionGuidelines` – optional)
   * Draws magenta dimension lines & green text at offsets defined in `constants.jsx`.
6. **White-ink Backer & Legend** (when guidelines on)
   * White backer rectangle (`WhiteBacker` spot) scaled by `getScaleFactor` and centred.
   * Legend graphic (`SZ-CL-… .ai`) placed between backer and bleed; filename built from label options:
     `SZ-CL[-Backer][-<Material>][-WhiteInk].ai`

## Important Behaviours
* **Rounded radius** is fixed at 9 pt (0.125″) for all sizes.
* **Scaling rule** increases backer size on small labels (≤ 1" gets ×2.75, ≥ 12" gets ×1.2).
* **Font** defaults to `MyriadPro-Regular`; falls back silently if unavailable.
* **Missing Assets** (font, legend file) – script finishes then alerts the operator.
* **Saving/Exporting** – deliberately out of scope; handled downstream.

## Extensibility & Future Work
* Additional label types or materials can be added by updating `constants.jsx` & `LABEL_TYPE_CONFIG`, creating corresponding Actions and legend files.
* White-ink overprint settings, material-specific behaviour and export automation are earmarked for future development. 