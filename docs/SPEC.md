# ChopChop Cutting Board Design App - Specification

This document combines the feature specification, catalog requirements, and visualization guidelines for the ChopChop cutting board design web application.

## Overview

The previous app (v2.5.3.2, TS/React/Vite, jsPDF w/ DejaVu font, SVG scenes, vitest, puppeteer) was lost in a VM wipe. This specification represents everything that was complete before the loss. The repo is the only source of truth; commit and push after every meaningful step.

## App Features (Complete Implementation)

### Board Styles

The application supports 10 cutting board styles:

1. **brick-basketweave** - Brick pattern arrangement
2. **checkerboard** - End grain, default 12x? and 16x24 sizes
3. **chevron** - V-shaped pattern
4. **edge-grain** - Edge grain orientation
5. **end-grain** - End grain orientation
6. **face-grain** - Face grain orientation
7. **herringbone** - Herringbone pattern
8. **scrap-chaotic** - Random scrap arrangement
9. **stripe-inlay** - Striped inlay pattern
10. **tumbling-block-3d** - 3D tumbling block illusion

Note: 16x24 is a checkerboard size, not a separate style.

### Custom Designer

- Second slice-and-reglue pass for custom designs

### Design Editor

- **SVG top-view preview** with dimension labels
- **3D realistic render** using three.js
  - Species textures
  - Grain direction visualization
  - Embedded in PDF output

### Modifiers

- **Juice groove** - Perimeter channel for liquids
- **Handles/hand holes** - Multiple handle options
- **Rubber feet** - Four-foot configuration

### Unit Display

#### Imperial/Metric Toggle

- Display units switchable between imperial and metric

#### Inch Format (Critical)

- Must use single formatter function `inchText`
- Format: 3 decimals + fraction in brackets
- Approximate symbol (≈) **only** when fraction is inexact
- Examples:
  - `1.663" (≈1 21/32")` - inexact fraction
  - `0.750" (3/4")` - exact fraction, no ≈

### Lumber Planner

- Milling/cutting optimizer from user's own stock
- **pricePerBF stays null** - never invent prices
- Display note: "Prices are your own entries"

### PDF Outputs

Two types of PDF documents:

1. **Cut-sheet PDF**
   - Cut list with all parts
   - Step-by-step instructions with diagrams
   - Safety banners (every banner on its own figure, no cap)
   - Setting tags (cap: 2 + "+ N more settings, see step text")
   
2. **Mill-plan PDF**
   - Milling sequence and setup

#### Step Diagrams

- Rendered from one scene model (`sceneSvg` / `scenePdf`)
- SVG and PDF versions generated from same source

### Validation Rules

#### Geometry Validation

- Every sweep goes through full validation (sim.export / calcBoard)
- Refused design exits non-zero and writes no files
- Chevron angle: 20–60° (reference: chevron 19° refused)
- Herringbone angle: 30–60°
- Gapped chevron: refused
- Stripe count includes 2×kerf and does not subtract tolerance

#### Output Consistency

- Concurrent exports identical except timestamps
- Undefined output folder is an error (never `undefined/`)

#### Regression Tests

- Keep regression test for low-angle chevron coming out 1.5" wide
  - Old fix: probe inset 1e-9 (implementation details unsure)

### User Commands

```bash
npm install
npm run dev
```

### Deployment

Deploy files for future self-hosting (Docker/nginx style) existed but are optional for this rebuild.

## Known Label Text (Must Print in Full)

### Metric Groove

```
Perimeter loop, 12.5 mm wide × 5 mm deep, 19 mm from the edge, corner radius 25.5 mm, top face.
```

### Metric Feet

```
4 rubber feet, 25.5 mm diameter × 9.5 mm high, foot centres 32 mm in from the edges (underside).
```

Note: In 2.5.4, hardware becomes `1" (25.4 mm)` dia × `3/8" (9.5 mm)` high

### 16x24 Groove

```
Perimeter loop, 0.500" (1/2") wide × 0.188" (3/16") deep, 0.750" (3/4") from the edge, corner radius 1.000" (1"), top face.
```

### Other Text

- "joint edges on the jointer"
- "Break edges (180 grit)" - exists in catalog but never printed (known 2.5.4 item)

## On-Screen Figure Rules (From B1–B4 Fixes)

### Figure Sizing and Scrolling

- Figures render at **exact viewBox size, never scaled down**
- Wide figures sit in a sideways-scrolling box
- Scroll cue (fade + "→ scroll for more") requirements:
  - Own strip BELOW the figure scroll box
  - Shown only when scrollWidth > clientWidth
  - Hidden at scroll end
  - Hidden in print

### Text Size

- Minimum SVG font: **11 units** (fitFont/svgFont can't return less)
- Banners, tags and long labels wrap; figure grows
- TopView preview labels >= 10.67 px drawn

### Label Placement

- Labels placed at anchor or nearest clear spot
- ViewBox grows so all labels are inside frame
- Dimension lines and labels share `data-dim-id`

### Background Rules

- Background shapes must enclose all other shapes (backdropViolations)
- Fence is never background

### Browser Check Script

Location: `scripts/check-svg-text.mjs <url> [shotDir]`

Requirements:
- Drawn size via computed font-size × getScreenCTM scale
- getBoundingClientRect inside SVG
- isPointInFill/isPointInStroke label-vs-geometry sampled every 1.5 units
- Cue never overlaps figure
- Test viewports:
  - 1280x800
  - 768x1024
  - 390x844 DPR1
- Test designs:
  - Checkerboard default
  - 16x24
  - End-grain/chevron/brick
  - Metric
  - 4-warning design

### PDF-Specific Rules

- `SETTING_TAG_CAP = 2` + "+ N more settings, see step text"
- All cutDanger banners (no cap)
- `BANNER_FONT = 11`, `BANNER_LINE = 14`
- Footers and prices note: 8 pt

### No Truncation Test

Code search for .slice/[:N]/ellipsis on display text:
- Exact-match exception list only
- No warning-related exceptions

## Measurement Standards

### Metric System

- Layout distances round to **0.5 mm**
- Example: groove corner radius 25.5 mm

### Imperial Hardware

- Bought parts use nominal inch with exact mm
- Format: nominal inch, then exact mm in parentheses
- Examples:
  - Feet: `1" (25.4 mm)` × `3/8" (9.5 mm)`
  - Router bits: `1/2" (12.7 mm) bit`

### Placeholder Data

Where step text, banners or allowances are unconfirmed:
- Put placeholder catalog data in a separate `styles/` folder
- Mark as **DRAFT**
- Domain expert's catalog replaces it

---

## Board Master Catalog Requirements

### Confirmed Elements

#### Styles with Samples

- checkerboard (end grain)
- 16×24
- chevron
- brick
- metric
- mill plan

Full style list and exact step wording: **unsure** (awaiting domain expert)

#### Pricing

- `pricePerBF` stays `null`
- **Never invent prices**

#### Display Format

- Three decimals + fraction
- ≈ only on inexact inch values

#### Safety and Settings

- Warnings/safety banners always in full
- Every banner on its own figure
- No "+N more" for banners
- Setting tags cap at 2 + "+ N more settings, see step text"

#### Known Phrases

- "joint edges on the jointer"
- "Break edges (180 grit)" - in catalog but never printed (P3)

### 2.5.4 Catalog Decisions

#### Hardware Specifications

- Nominal inch + exact mm in brackets
- Examples:
  - `1" (25.4 mm)`
  - `3/8" (9.5 mm)`
  - `1/2" (12.7 mm) bit`
- Feet: 25.5 → 25.4 mm

#### Layout Distances

- Stay rounded to 0.5 mm

#### Unit-Aware Catalog Strings

Examples:
- `take ~1/64" (0.4 mm) passes`
- `default: 1/8" (3 mm) roundover`
- `core box / round-nose bit 3/8–1/2" (10–12 mm)`

#### Rip-Fence Captions

- Shouldn't repeat setting name

#### Ownership

- Board App Dev owns metric part names and exact metric hardware sizes

### Unsure / To Be Rewritten

The following require fresh catalog content from Board Master:
- Full step text per style
- Exact safety-banner wording
- Cut-list allowances:
  - Kerf
  - Rough-to-final oversize
  - Planer minimums
  - Flattening allowance

Board Master will supply a fresh catalog draft labelled **new** (not 2.5.3.2) for `styles/`.

---

## Board Visuals Requirements

**Note:** Board Visuals will rebuild boardviz as `visuals/` once spec is committed. The following is for reference and compatibility. **Don't build boardviz now**, but keep app export compatible.

### Generator Overview

- Python script writing SVGs at 1:1 (width = viewBox width)
- PNGs via headless Chrome

#### CLI Usage

```bash
boardviz.py [style] --set key=value --out <ABSOLUTE path> --png
```

**Important:** Relative path broke app export once; use absolute paths only.

### Agreement Validation

- Each sample folder has `agreement.json`
- Proves the figure matches the app export exactly
- 11 agreement checks existed

### Styles with Samples

- brick-basketweave
- checkerboard
- checkerboard 16×24
- chevron
- edge-grain
- end-grain
- face-grain
- herringbone
- scrap-chaotic
- stripe-inlay
- tumbling-block-3d

### Figure Types

#### All Styles

- Top view
- Cut list
- Glue-up steps (glue-up-1…)
- Rip-fence setup

#### Some Styles (which go with which: unsure)

- Strip sequence
- Cross-section
- Crosscut and modifiers
- Outline
- Inlay detail
- Feet overlay
- Handle overlay or hand hole (two kinds)
- Planer panel in edge-grain rip-fence setup

### Samples Display

- `samples/index.html`: each figure in sideways-scrolling box
- Never shrunk (old max-width:48% removed)

### Text Requirements

- `MIN_FONT_PX = 11` (8 pt = 10.67 px at 1:1)
- `Svg.text` raises error below minimum
- Drawn size = font size × sqrt(|det CTM|)
- < 10.67 px fails
- Test that 11 px at 0.8× is flagged
- Full labels, no "…", no warnings dropped
- Long notes wrap, figure grows
  - Example: fence note two lines:
    - "Measure fence face → near side of a tooth"
    - "set toward the fence"
  - Kerf line below

### Label Placement Rules

#### Dimension Lines

- `dim_h`/`dim_v` tag lines
- Extension lines and label with `data-dim="N"`
- Label may overlap **only** lines with its own `data-dim` (by ID)

#### Label Backgrounds

- Background patch: `data-patch="N"`
- Patch must not reach other geometry or any label (patch-covers-label)
- Page background `data-bg="1"` skipped

#### Panel Tagging

- `data-panel="<role>"` only from `Svg.panel(role)`
- Valid roles/fills:
  - `cutlist-header`: #5B3A29
  - `cutlist-row`: #F3E7D3 / #FBF8F2 / #ECECEC
  - `saw-table`: #D9D9D9
  - `planer-panel`: #F1EEE8
- Other role/fill: errors
- `panel()` rejects: board, strip, blade, fence, stock, bed, cutterhead
- Hand-hole slot overlay (#FBF8F2) is drawing, untagged, checked

#### Text Placement Examples

- "RIP FENCE" - beside fence in dark text
- "head" - right of cutterhead
- "planed: …" - below planer bed
- Short vertical dims - left of line with `Svg.vmargin()`
- Modifiers start x=160
- Handle dims - left of board with dashed extension lines
- Tumbling hexagon - 30 px lower so clamp arrow clears title

### Validation Checks

#### measure_labels.py

- Size, label-vs-label, frame checks
- Must report 0 errors

#### check_overlap.py

- Headless Chrome execution
- Sample every 1.5 px with isPointInFill/isPointInStroke
- Ignores top/bottom 18% of label box
- Must report 0 errors

#### test_fit_helper.py

- Reads attributes in any order (rotated labels)
- Fails on any reported line
- Output exactly `0` and `0`

### Tests

`test_boardviz.py` had 22 tests:
- Drawn-size scaling
- Sub-min text refused
- Index never shrinks
- No label covers drawing
- Planted overlap caught while own-dim-line label passes
- data-panel only on backgrounds
- data-panel planted on strip caught
- Other 15 (generation, app-export agreement) unsure

**Every rule needs fix-off evidence.**

### Waiting for 2.5.4 (Not in Rebuild)

- Lamination figure
- Before/after previews
- Rounding by finished value
- Stop blocks
- Board feet
- Warning figures
- 24" stripe counts
- Scrap minimum
- Exact-match allowlist for text-cutting rule plus printed-text test
- Fence-label crowding check
- 3D renders (deferred)

---

## Implementation Notes

### Technology Stack

- **Frontend:** TypeScript, React, Vite
- **Testing:** vitest
- **PDF Generation:** jsPDF with embedded DejaVu font
- **3D Rendering:** three.js with species textures
- **Browser Testing:** puppeteer

### Project Structure

- `/docs` - Specification and acceptance criteria
- `/styles` - Board style catalog data (DRAFT until domain expert provides catalog)
- `/samples` - Generated sample PDFs
- `/scripts` - Browser check and validation scripts

### Development Workflow

1. Commit and push after every meaningful step
2. Generate sample PDFs into `samples/`
3. Run browser checks at multiple viewports
4. Validate all figures against placement rules
5. Test concurrent exports for consistency

---

## References

This specification combines:
- SPEC-notes.md (features, rules, known label text, 2.5.4 backlog)
- brief-board-master.md (catalog brief; full step text pending from domain expert)
- brief-board-visuals.md (Python boardviz diagram generator brief, to be rebuilt later as visuals/ by another teammate)

See BACKLOG-2.5.4.md for features deferred to version 2.5.4.
