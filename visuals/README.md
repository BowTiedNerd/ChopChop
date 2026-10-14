# boardviz — diagrams for ChopChop (rebuild, draft for `visuals/`)

Python SVG generator for the cutting-board app. Every figure is drawn from the **app's own export**; nothing falls back to defaults.

## Layout
| Path | What |
|---|---|
| `boardviz.py` | generator + `Svg` builder (rules below) |
| `exporter/export_design.ts` | export adapter: imports the real app (`$CHOPCHOP_DIR`, default `/workspace/chopchop-ref`, a clone of PR #1) — `validateBoard`/`validateAngle`, `generatePattern`, `calculateRequiredParts`, `formatDimension`/`inchText` — and prints one JSON document. Refusal → exit 2. The app has no export CLI yet; this adapter is the stand-in until it does. |
| `exporter/catalog/*.json` | Board Master catalog **3.0-draft3** (styleId, stepId, figureType, steps, banners, allowances). Copied from `/workspace/catalog-draft-3.0/`; PR #1 `styles/` still holds older drafts. |
| `chromecheck.py` | headless-Chrome harness (inline SVGs at 1:1, `--dump-dom`) |
| `measure_labels.py` | drawn size, text-vs-text, text-vs-frame; prints count, must be `0` |
| `check_overlap.py` | label/patch vs geometry sampling; prints count, must be `0` |
| `test_fit_helper.py` | static fit check; prints exactly `0` and `0` |
| `test_boardviz.py` | unittest suite |
| `fixoff.py` → `FIX-OFF.md` | real fix-off runs |
| `samples/` | 11 sample folders (+PNGs) and `index.html` |
| `steps/` | `<styleId>/<stepId>.svg` for the app PDF |

## Usage
```
cd exporter && npm ci            # tsx only; the app clone needs its own `npm ci`
python3 boardviz.py all   --out /ABS/samples [--png]   # 11 folders + index.html
python3 boardviz.py steps --out /ABS/steps [--set k=v] # per-step SVGs for the PDF
python3 boardviz.py chevron --set angle=45 --set dimensions.width=350 --out /ABS/dir [--png]
python3 measure_labels.py samples steps ; python3 check_overlap.py samples steps ; python3 test_fit_helper.py samples steps
python3 -m unittest -v test_boardviz ; python3 fixoff.py
```
`--out` must be absolute; relative, empty or `undefined` exits non-zero. `--set` keys are design paths (`dimensions.width`, `unitSystem`, `juiceGroove.enabled`, `handles.type`, …) plus `angle`. An export error or a refused design (e.g. chevron `angle=19`) is fatal: exit 2, no files.

## Per-step interface for the app PDF
`boardviz.py steps --out ROOT` writes `ROOT/<styleId>/<stepId>.svg` for **every catalog step whose `figureType` is not null**, and no file for null-figure steps. `styleId` = catalog `style`, `stepId` = catalog `stepId`, exactly. The PDF loads that path and falls back to its own figure if the file is missing. Each SVG is self-contained, 1:1 (`width` = viewBox width), and carries the step's description, every setting, and every safety banner in full. Sample folders hold the same layout under `samples/<sample>/steps/`. Tests guarantee the set of files equals the catalog exactly and that stepIds are unique per style.

Figure by `figureType`: `rip-fence` → fence setup (+ planer panel for edge-grain), `glue-up` → section with clamps, `crosscut` → sled/stop, `strip-sequence` → strip order, `outline` → outline + dims, `top-view` → pattern top view, `mill` → text card with banners.

## Sample folders
`face-grain` (handle), `edge-grain` (hand-hole slot, planer panel), `end-grain` (metric 300×450×40, groove + feet), `checkerboard`, `checkerboard-16x24` (groove), `brick-basketweave`, `chevron`, `herringbone`, `stripe-inlay` (inlay detail), `scrap-chaotic`, `tumbling-block-3d`. Each has top-view, cut-list, glue-up-N, rip-fence-setup, plus strip-seq / cross-section / crosscut / outline / modifiers / feet-overlay / handle / hand-hole / inlay-detail where they apply, `export.json`, and `agreement.json`.

`agreement.json`: every label tagged `data-src` must equal its export string exactly (wrapped lines rejoined), top-view strip count must equal the export, and a fresh re-export must be byte-identical. `exportVsCatalog` lists where the app's cut list disagrees with the catalog allowances. These are reported, not drawn around.

## Rules
- **Text:** `MIN_FONT_PX = 11` (8 pt = 10.67 px). `Svg.text` raises `ValueError` below it. Drawn size = font-size × √|det getScreenCTM|; under 10.67 fails. Labels are never cut or given a "…". Long text wraps and the figure grows. Banners are never capped.
- **Dimensions:** `dim_h`/`dim_v` tag the dim line, ticks, extension lines and label with `data-dim=N`, and the white label patch with `data-patch=N`. The page background is `data-bg=1`. Vertical dim labels sit to the left of the line, and `Svg.vmargin()` reserves that room.
- **Panels:** `data-panel=<role>` is emitted only by `Svg.panel(role, …, fill)`. Allowed roles and fills: cutlist-header `#5B3A29`, cutlist-row `#F3E7D3/#FBF8F2/#ECECEC`, saw-table `#D9D9D9`, planer-panel `#F1EEE8`. Any other role or fill raises, and so do board, strip, blade, fence, stock, bed and cutterhead. The hand-hole slot overlay is drawing, so it stays untagged and gets checked.
- **Placement:** "RIP FENCE" sits beside the fence in dark text, "Stock" beside the stock, "head" right of the cutterhead and "planed: …" below the bed. Handle dims go left of the board with dashed extension lines. Clamp arrows start below the title.
- **Overlap check:** label boxes are shrunk 18% top and bottom and sampled every 1.5 px with `isPointInFill`/`isPointInStroke` (only for a visible fill or stroke). `data-bg`, `data-panel` and `data-patch` are not geometry. A label may only touch lines with its own `data-dim`, and a patch may not reach geometry or another label (`patch-covers-label`).
- **Format:** every inch or metric string comes from the app's `formatDimension`/`inchText`, so ≈ appears only when the value is inexact.
- **Strips:** every strip is drawn. There is no cap, and the figure grows to fit.

## Known gaps
Handle and hand-hole sizes are in neither the export nor the catalog, so those overlays show position only. The app design has no `angle` field, so `--set angle` is validated through `validateAngle` but does not change the pattern. 3D renders are deferred.
