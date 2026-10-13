# Acceptance Checklist (Board QA)

The pass bar for the rebuild; old hashes/test counts cannot be matched.

1. **Text size:** No PDF text under 8 pt (footers, prices note, captions). On screen/SVG nothing drawn under 10.67 px = font size × sqrt(|det CTM|) incl. every transform and viewBox-to-display ratio. Min drawing font 11 units; code refuses smaller rather than shrinking; no fitFont-style shrink below min. Figures never scaled down; they scroll sideways.

2. **No truncation:** Labels, captions, warnings, setting tags, part names print in full. No .slice, [:N], "…", first-sentence cuts; long text wraps, frame grows. Tests compare printed text to catalog/model source strings. Code search for cutting patterns plus printed-text test. Exceptions exact-code match only, none involving warnings/banners/cutDanger; test enforces.

3. **Caps:** Every safety banner on its own figure, no cap, no "+N more"; out of room → frame grows or figure moves to next page with banners. Setting tags cap 2 + "+ N more settings, see step text"; every setting in full in step text. Any other cap prints "+ N more" or shows items elsewhere.

4. **Labels off drawing:** No label box/background overlaps board, strip, blade, fence, stock, bed, cutterhead, glue/cut line, arrow, or another label. Only exception: dimension label on its own dimension line, matched by ID (data-dim / data-dim-id), never distance. data-panel only on plain backgrounds via one helper with fixed roles/fills; test rejects it on depicted parts. Nothing past frame/image edge; viewBox grows. Checks use isPointInFill/isPointInStroke; fail on any single overlap.

5. **Viewports & cue:** Browser check at 1280×800, 768×1024, 390×844 on at least default checkerboard, chevron, brick, metric (unsure if those were the exact four). "→ scroll for more" cue in own strip below figure; only on overflow; hides at scroll end; hidden in print; tested on natural overflow at 390 and forced narrow column. Accepted for 2.5.4: two editor tables overflowing at 390 (then check must fail on them).

6. **Display format:** 3 decimals + fraction via one formatter inchText; ≈ only on inexact (`1.663" (≈1 21/32")`; `0.750" (3/4")`). Metric hardware per Board Master 2.5.4.

7. **Geometry/validation:** Sweeps via full validation (sim.export / calcBoard). Stripe count includes 2×kerf, no tolerance subtraction. Angle limits chevron 20–60°, herringbone 30–60° (unsure exact); old counts 216 in range, 8 refusals, 186 size-sweep, 220 extremes — new counts may differ but each explained. Refused design exits non-zero, writes no files (chevron 19°; gapped chevron refused). Concurrent exports identical except timestamps. Undefined output folder is an error, never `undefined/`. Keep test for low-angle chevron 1.5" wide bug (old probe inset 1e-9, unsure).

8. **Diagrams match app:** Every boardviz sample drawn from app export; agreement.json exact. sim.py error/refusal fatal, no default fallback.

9. **Proof:** Every rule has a test; fix-off evidence (disable fix in scratch copy, test fails, restore). Repo is only truth; QA checks clean clone at tagged commit: npm ci, build, typecheck, lint, all tests, check.py, boardviz tests; tree unchanged before/after. Every sample PDF full-text compared to source strings and read page by page.

Carried to 2.5.4 (not blocking): metric part names, rip-fence caption wording, figures landing on page after step text, mill plan `2C` label, page-fill test gap, lint warnings, never-printed "break edges (180 grit)".
