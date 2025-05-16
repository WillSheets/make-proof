# Label Proofing – Development Guide

> **Audience**: Large-Language-Model (LLM) coding agents & human collaborators.
>
> **Goal**: Preserve a predictable, low-friction Developer Experience (DX) so that new functionality can be introduced *rapidly* without breaking Illustrator compatibility or established production rules.

---

## 1. Repository Philosophy
1. **Single Source-of-Truth** – All production constants (colors, offsets, font choices, etc.) live in `src/constants.jsx`.  Never hard-code values elsewhere.
2. **Small, Named Modules** – Each logical concern (UI, geometry, dimensioning, file-IO…) lives in its own `.jsx` file under `src/`.  Keep cross-file coupling minimal and *never* introduce circular `//@include` chains.
3. **Predictable Naming** – Spot-colors & layers are read by external RIP/press software; *name stability is a contract*.  When adding new colors or layers use `PascalCase` and document them in `constants.jsx`.
4. **Non-Destructive by Default** – Scripts should leave user artwork untouched unless explicitly told to convert/flatten/expand.

---

## 2. Runtime Expectations
• Adobe Illustrator ≥ v25 running ExtendScript (ES3-era JavaScript).
• User action sets installed:
  • `Offset` (label-type‐specific path offsets)
  • `Add Arrows` (`50%` & `75%` arrowhead variants)
• Legend artwork resides in `legends/` **without renaming**.

When adding dependencies, update **this file**.

---

## 3. Directory Conventions
```
run.jsx              – Entry point; only responsibility is to `//@include src/main.jsx`
src/
  ui.jsx             – Dialog creation & validation
  main.jsx           – High-level workflow (user input → proof document)
  core.jsx           – Path creation, layer ordering, legend placement
  dimensioning.jsx   – Dimension lines & text helpers
  utils.jsx          – Reusable, stateless helpers (color, math, file system)
  constants.jsx      – Immutable values & lookup tables
  tests/             – ExtendScript test harness (see §8)
legends/             – Reference AI files displayed on proofs
```
> **Rule**: If a new module can be described in one sentence, it deserves its own file.

---

## 4. Coding Standards
1. **ES3 compatibility** – Stick to `var`, function declarations, and prototype methods; no ES6 syntax.
2. **Docblocks** – Public functions *must* include JSDoc-style comments describing params, return, side-effects.
3. **Prefix `unsafe_`** – Any helper that mutates global Illustrator state (selection, ruler units, etc.) should be prefixed `unsafe_` so callers are aware.
4. **Error Handling** – Wrap Illustrator API calls in `try/catch`; surface actionable messages (never silent fails).
5. **Redraw Throttling** – Batch visual updates; avoid unnecessary `app.redraw()` calls inside tight loops.

---

## 5. Extending Functionality
### 5.1 Add a New Label Type
1. Update `LABEL_TYPE_CONFIG` in `constants.jsx`.
2. Record offset action in Illustrator and save under `Offset` set.
3. Add DIMENSION_OFFSETS_TABLE entry.
4. Extend UI radio-button group in `ui.jsx`.

### 5.2 Add a New Legend Variant
1. Place `.ai` file in `legends/` using naming scheme: `SZ-CL-[Qualifier].ai`.
2. Update `utils.getLegendFileName()` mapping logic if required.

### 5.3 Override Defaults (e.g., Font)
Change value in `constants.jsx` **only**; never in consuming modules.

---

## 6. LLM Workflow
1. **Plan → Execute → Verify**: Draft an outline, apply minimal edits, and run script in Illustrator sandbox.
2. **Tool Use**: Prefer static analysis (search, read) over runtime execution when possible.
3. **Atomic Commits**: Each pull-request or automated change should address *one* concern.
4. **Update Codex**: If you introduce a new rule, append it to this file with author/date header.

---

## 7. Documentation & Versioning
• Bump semantic version in `package.json` (to be added) on public API changes.
• Maintain a `CHANGELOG.md` summarising user-visible behaviour.

---

## 8. Quality Gates (Coming Soon)
1. **Static Lint** – Configure ESLint with ExtendScript parser for stylistic consistency.
2. **Unit Tests** – `src/tests/` to be executed via ESTK or Roboflow runner; mock Illustrator DOM where practical.
3. **CI** – GitHub Actions to lint, run tests, and bundle a distributable `dist/run.jsx`.

---

## 9. Common Pitfalls
| Issue | Mitigation |
|-------|------------|
| Legend file not found | Validate existence early; fallback to alert with filename & expected path. |
| Font missing | Catch `textFonts.getByName` errors; prompt user to install font or auto-fallback. |
| Offset action fails silently | Retry (`utils.runOffsetAction`) max 3× then abort with guidance. |
| Layer mis-ordering after offsets | Use explicit `zOrder` calls immediately after creation; never rely on Illustrator defaults. |

---

## 10. Glossary (quick-reference)
| Term | Meaning |
|------|---------|
| **Bleed** | Extra artwork beyond dieline; trimmed after cutting |
| **Safe Zone** | Area within dieline free of critical elements |
| **Backer** | Waste matrix remaining on die-cut labels |
| **Legend** | Visual key showing layer stack & spot colors |

---

*Last updated: <2025-05-16-10:38AM>*