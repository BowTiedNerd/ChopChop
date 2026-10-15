# Shop Checklist (Shop Tester)

1. **Six sample sheets read cover to cover:** checkerboard, 16×24, chevron, metric, brick, mill plan. Old page counts 6/6/5/7/5/3; changes must be explained. Old hashes are history only.

2. **Full labels:** 
   - Metric groove: "Perimeter loop, 12.5 mm wide × 5 mm deep, 19 mm from the edge, corner radius 25.5 mm, top face." (unsure whether 25.5 stays; it's a layout distance → likely stays rounded 0.5 mm; Board Master decides). 
   - Metric feet: "4 rubber feet, 25.5 mm diameter × 9.5 mm high, foot centres 32 mm in from the edges (underside)." (2.5.4: `1" (25.4 mm)` × `3/8" (9.5 mm)`). 
   - 16×24 groove: "Perimeter loop, 0.500" (1/2") wide × 0.188" (3/16") deep, 0.750" (3/4") from the edge, corner radius 1.000" (1"), top face."

3. **Regressions to watch:** Metric figure label cut to "32 m"; 16×24 groove label cut short; B1 short warnings, B2 banners capped at 2, B3 edge labels off viewBox, B4 fitFont shrinking, B5 boardviz text under 11 px — each checked on paper.

4. **Bench reading:** Every machine setting (fence, blade height, bit, planer depth) in the step text even when tag says "+ N more settings". Every safety banner on the figure it applies to. No ≈ on exact fractions. Metric sheets have no stray inch values except hardware. Cut list adds up: enough rough stock for every strip plus kerf; strip count matches glue-up figure (allowances per Board Master's new catalog draft).

5. **Screens:** Screenshots at 1280, 768, 390 of the 4-warning design; cue in own strip; nothing on phone cuts a measurement. Editor-table overflow at 390 is a known 2.5.4 item.

6. **Testing from a clean clone at a tagged commit;** Shop Tester requests changes only, never approves/merges.
