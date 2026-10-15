# visuals-draft3 progress
- [done] Copied from visuals-draft2; exporter catalog = draft5 (handHole width 25.4, endRadius 12.7), identical to /workspace/catalog-draft-3.0.
- [done] Hand hole drawn with catalog width_mm/endRadius_mm; hand_hole_problems() raises on endRadius != width/2.
- [done] Tests: HandHole.test_end_radius_is_half_width_and_mismatch_flagged; Strict test runs by default, skipped only with BOARDVIZ_ALLOW_MISMATCH=1; test_strict_is_on_by_default.
- [done] Inset label lifted (label_dy) so its patch clears the 25.4 mm slot extension line (overlap check caught it).
- [done] Regenerated samples (12, PNGs) + steps (PNGs); measure_labels 0, check_overlap 0, fit 0/0.
- [done] Default: Ran 48, FAILED (failures=1) = strict test (37 mismatches). Opt-out: Ran 48, OK (skipped=1).
- [running] fixoff.py (39 cases) -> FIX-OFF.md, log /tmp/fixoff3.log
- [progress 22:08] fixoff 36/39 cases done
- [done] fixoff 39/39 failed when broken; FIX-OFF.md written
