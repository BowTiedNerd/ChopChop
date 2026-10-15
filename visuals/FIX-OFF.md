# FIX-OFF evidence (real runs by fixoff.py)

Each rule: copy sources to a scratch dir, break the fix there, run its guarding test, discard the copy. Originals untouched.

| # | Rule | File broken | Exit | Result | Failing test(s) |
|---|---|---|---|---|---|
| 1 | Svg.text refuses < 11 px | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_svg_text_refuses_under_minimum |
| 2 | drawn size uses sqrt(|det CTM|) | measure_labels.py | 1 | Ran 1: FAILED (failures=1) | test_drawn_size_scaling_flags_11px_at_0_8x |
| 3 | SVG width == viewBox width (1:1) | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_svgs_are_one_to_one |
| 4 | index never shrinks figures | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_index_never_shrinks |
| 5 | RIP FENCE beside fence, not on it | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_label_covers_drawing |
| 6 | 'head' right of cutterhead | boardviz.py | 1 | Ran 2: FAILED (failures=2) | test_no_label_covers_drawing, test_placement_rules |
| 7 | label may overlap only its own data-dim | check_overlap.py | 1 | Ran 1: FAILED (failures=1) | test_planted_overlap_caught_own_dim_allowed |
| 8 | label-on-geometry detection | check_overlap.py | 1 | Ran 1: FAILED (failures=1) | test_planted_overlap_caught_own_dim_allowed |
| 9 | patch-covers-label detection | check_overlap.py | 1 | Ran 1: FAILED (failures=1) | test_planted_patch_covers_label_caught |
| 10 | panel() rejects depicted parts | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_panel_rejects_parts_roles_and_fills |
| 11 | data-panel only on plain <rect> backgrounds | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_data_panel_planted_on_strip_caught |
| 12 | data-panel emitted only by panel() | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_data_panel_only_on_backgrounds |
| 13 | agreement.json exact match | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_agreement_catches_edited_label |
| 14 | no banner cap | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_truncation_no_ellipsis_all_banners_printed |
| 15 | long text wraps, never cut | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_truncation_no_ellipsis_all_banners_printed |
| 16 | relative/undefined --out refused | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_relative_or_undefined_out_refused |
| 17 | refused design fatal, no fallback | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_refused_design_fatal_no_files |
| 18 | <styleId>/<stepId>.svg naming | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_step_files_match_catalog_exactly |
| 19 | no SVG for null-figure steps | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_svg_for_null_figure_steps |
| 20 | duplicate stepId detected | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_step_ids_unique_and_rename_or_duplicate_fails |
| 21 | renamed stepId detected (missing file) | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_step_ids_unique_and_rename_or_duplicate_fails |
| 22 | strips never capped | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_high_strip_count_never_capped |
| 23 | fit helper handles rotation | test_fit_helper.py | 1 | Ran 1: FAILED (failures=1) | test_fit_helper_any_attribute_order_and_rotation |
| 24 | fit helper fails on any line | test_fit_helper.py | 1 | Ran 1: FAILED (failures=1) | test_fit_helper_any_attribute_order_and_rotation |
| 25 | NEW mill figures: no jointer/planer piece < 305 mm (blankRule) | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_jointer_or_planer_piece_under_minimum |
| 26 | NEW planer: panel wider than planerMaxWidth_mm goes to router sled | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_planer_never_gets_panel_wider_than_max |
| 27 | NEW jointer: no face-joint wider than jointerMaxWidth_mm | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_jointer_never_face_joints_wider_than_max |
| 28 | NEW strict mode flags exportVsCatalog | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_strict_mode_flags_every_mismatch |
| 29 | NEW strict test runs by default (opt-out only) | test_boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_strict_is_on_by_default |
| 30 | NEW hand hole sized from catalog features | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_handle_overlays_use_catalog_features |
| 31 | NEW finger grip sized from catalog features | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_handle_overlays_use_catalog_features |
| 32 | NEW rip fence: push stick drawn and labelled | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_rip_fence_has_knife_push_stick_feed |
| 33 | NEW rip fence: riving knife drawn and labelled | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_rip_fence_has_knife_push_stick_feed |
| 34 | NEW rip fence: Feed label off the arrow | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_label_covers_drawing |
| 35 | NEW rip fence: push-stick label off the push stick | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_label_covers_drawing |
| 36 | NEW metric is the 12th sample folder | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_every_agreement_ok |
| 37 | NEW hand hole end radius == width/2 flagged | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_end_radius_is_half_width_and_mismatch_flagged |
| 38 | NEW hand hole drawn with catalog endRadius_mm | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_handle_overlays_use_catalog_features |
| 39 | NEW hand-hole inset label clears the slot-width extension line | boardviz.py | 1 | Ran 1: FAILED (failures=1) | test_no_label_covers_drawing |

**Restored baseline** `BOARDVIZ_ALLOW_MISMATCH=1 python3 -m unittest test_boardviz` → exit 0, Ran 48: OK. Source sha256 unchanged before/after: True.

**Default strict test** (no opt-out) `python3 -m unittest test_boardviz.Strict.test_ci_strict_no_export_vs_catalog_mismatches` → exit 1, Ran 1: FAILED (failures=1): expected to fail until the app implements the catalog blank rule.

### Svg.text refuses < 11 px
Scratch `/tmp/fixoff-hxss3qh3`, `boardviz.py`:
```diff
- if size < MIN_FONT_PX:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_svg_text_refuses_under_minimum` → exit 1
```
file <_io.TextIOWrapper name='/tmp/bvtest-ylqq0hp5/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-hxss3qh3/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ylqq0hp5/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-hxss3qh3/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ylqq0hp5/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-hxss3qh3/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ylqq0hp5/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-hxss3qh3/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ylqq0hp5/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_svg_text_refuses_under_minimum (test_boardviz.TextSize.test_svg_text_refuses_under_minimum) ... FAIL

======================================================================
FAIL: test_svg_text_refuses_under_minimum (test_boardviz.TextSize.test_svg_text_refuses_under_minimum)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-hxss3qh3/test_boardviz.py", line 43, in test_svg_text_refuses_under_minimum
    with self.assertRaises(ValueError): s.text(0, 20, 'tiny', size=10)
         ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
AssertionError: ValueError not raised

----------------------------------------------------------------------
Ran 1 test in 26.159s

FAILED (failures=1)
```

### drawn size uses sqrt(|det CTM|)
Scratch `/tmp/fixoff-ovhu_9nt`, `measure_labels.py`:
```diff
- const drawn=fs*Math.sqrt(det);
+ const drawn=fs;
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x` → exit 1
```
ed file <_io.TextIOWrapper name='/tmp/bvtest-k7aa9qu3/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-ovhu_9nt/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-k7aa9qu3/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-ovhu_9nt/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-k7aa9qu3/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_drawn_size_scaling_flags_11px_at_0_8x (test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x) ... /tmp/fixoff-ovhu_9nt/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-k7aa9qu3/planted/scaled.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_drawn_size_scaling_flags_11px_at_0_8x (test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-ovhu_9nt/test_boardviz.py", line 39, in test_drawn_size_scaling_flags_11px_at_0_8x
    self.assertEqual([(i['kind'], i['drawn']) for i in r], [('size', 8.8)])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != [('size', 8.8)]

Second list contains 1 additional elements.
First extra element 0:
('size', 8.8)

- []
+ [('size', 8.8)]

----------------------------------------------------------------------
Ran 1 test in 27.631s

FAILED (failures=1)
```

### SVG width == viewBox width (1:1)
Scratch `/tmp/fixoff-9gqh4wtk`, `boardviz.py`:
```diff
- width="{W}" height="{H}" viewBox
+ width="{int(W*0.8)}" height="{H}" viewBox
```
`$ python3 -m unittest -v test_boardviz.Index.test_svgs_are_one_to_one` → exit 1
```
gqh4wtk/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jrt5jukl/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-9gqh4wtk/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jrt5jukl/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-9gqh4wtk/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jrt5jukl/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_svgs_are_one_to_one (test_boardviz.Index.test_svgs_are_one_to_one) ... /tmp/fixoff-9gqh4wtk/test_boardviz.py:75: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jrt5jukl/samples/brick-basketweave/crosscut.svg' mode='r' encoding='UTF-8'>
  m = re.search(r'width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"', open(f).read())
FAIL

======================================================================
FAIL: test_svgs_are_one_to_one (test_boardviz.Index.test_svgs_are_one_to_one)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-9gqh4wtk/test_boardviz.py", line 76, in test_svgs_are_one_to_one
    self.assertEqual(m.group(1), m.group(3), f); self.assertEqual(m.group(2), m.group(4), f)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: '512' != '640'
- 512
+ 640
 : /tmp/bvtest-jrt5jukl/samples/brick-basketweave/crosscut.svg

----------------------------------------------------------------------
Ran 1 test in 25.283s

FAILED (failures=1)
```

### index never shrinks figures
Scratch `/tmp/fixoff-nawr9ndv`, `boardviz.py`:
```diff
- <img style='max-width:none'
+ <img style='max-width:48%'
```
`$ python3 -m unittest -v test_boardviz.Index.test_index_never_shrinks` → exit 1
```
rdviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jx5md832/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-nawr9ndv/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jx5md832/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-nawr9ndv/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jx5md832/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-nawr9ndv/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jx5md832/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_index_never_shrinks (test_boardviz.Index.test_index_never_shrinks) ... /tmp/fixoff-nawr9ndv/test_boardviz.py:67: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-jx5md832/samples/index.html' mode='r' encoding='UTF-8'>
  h = open(os.path.join(SAMPLES_DIR, 'index.html')).read()
FAIL

======================================================================
FAIL: test_index_never_shrinks (test_boardviz.Index.test_index_never_shrinks)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-nawr9ndv/test_boardviz.py", line 69, in test_index_never_shrinks
    self.assertEqual(len(imgs), h.count('<img'))
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 0 != 100

----------------------------------------------------------------------
Ran 1 test in 31.912s

FAILED (failures=1)
```

### RIP FENCE beside fence, not on it
Scratch `/tmp/fixoff-8ct24vm7`, `boardviz.py`:
```diff
- svg.text(fx - 30, ty + 30, 'RIP FENCE'
+ svg.text(fx - 2, ty + 30, 'RIP FENCE'
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing` → exit 1
```
p/fixoff-8ct24vm7/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-n10s03y_/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-8ct24vm7/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-n10s03y_/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing) ... FAIL

======================================================================
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-8ct24vm7/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-n10s03y_/samples/br[8933 chars]re'}] != []

First list contains 34 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-n10s03y_/samples/brick-basketweave/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'RIP FENCE', 'element': '<rect x="107.25" y="70.00" width="22.00" height="240.00" rx="0.00" fill="#6B6B6B" stroke="#222222" stroke-width="1"></re'}

Diff is 10107 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 28.607s

FAILED (failures=1)
```

### 'head' right of cutterhead
Scratch `/tmp/fixoff-o0sz0xuz`, `boardviz.py`:
```diff
- svg.text(x + 262, bed_y - t - 18, 'head')
+ svg.text(x + 220, bed_y - t - 18, 'head')
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing test_boardviz.Labels.test_placement_rules` → exit 1
```
==============
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-o0sz0xuz/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-nesv8byf/samples/ed[660 chars]e>'}] != []

First list contains 3 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-nesv8byf/samples/edge-grain/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'head', 'element': '<circle cx="250.00" cy="508.18" r="20.00" fill="#9A9A9A" stroke="#222222" stroke-width="1"></circle>'}

Diff is 811 characters long. Set self.maxDiff to None to see it.

======================================================================
FAIL: test_placement_rules (test_boardviz.Labels.test_placement_rules)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-o0sz0xuz/test_boardviz.py", line 250, in test_placement_rules
    self.assertGreater(float(ht.group(1)), float(head.group(1)) + float(head.group(2)))
    ~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 240.0 not greater than 270.0

----------------------------------------------------------------------
Ran 2 tests in 27.530s

FAILED (failures=2)
```

### label may overlap only its own data-dim
Scratch `/tmp/fixoff-16vc77tm`, `check_overlap.py`:
```diff
- if(skipDim!==null && g.getAttribute('data-dim')===skipDim) continue;
+ 
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed` → exit 1
```
ht_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed) ... /tmp/fixoff-16vc77tm/test_boardviz.py:85: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ush3r1an/planted/own.svg' mode='w' encoding='UTF-8'>
  good = os.path.join(PL(), 'own.svg'); open(good, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-16vc77tm/test_boardviz.py", line 86, in test_planted_overlap_caught_own_dim_allowed
    self.assertEqual(check_overlap.overlaps([good]), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-ush3r1an/planted/ow[171 chars]e>'}] != []

First list contains 1 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-ush3r1an/planted/own.svg', 'kind': 'patch-on-geometry', 'label': 'patch 1', 'element': '<line x1="20.00" y1="130.00" x2="220.00" y2="130.00" stroke="#555" stroke-width="1" data-dim="1"></line>'}

+ []
- [{'element': '<line x1="20.00" y1="130.00" x2="220.00" y2="130.00" '
-              'stroke="#555" stroke-width="1" data-dim="1"></line>',
-   'file': '/tmp/bvtest-ush3r1an/planted/own.svg',
-   'kind': 'patch-on-geometry',
-   'label': 'patch 1'}]

----------------------------------------------------------------------
Ran 1 test in 27.072s

FAILED (failures=1)
```

### label-on-geometry detection
Scratch `/tmp/fixoff-cmze1dja`, `check_overlap.py`:
```diff
- if(hits(g,lp)) found=true;
+ 
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed` → exit 1
```
dja/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-1jq9bsr8/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed) ... /tmp/fixoff-cmze1dja/test_boardviz.py:85: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-1jq9bsr8/planted/own.svg' mode='w' encoding='UTF-8'>
  good = os.path.join(PL(), 'own.svg'); open(good, 'w').write(s.render('t'))
/tmp/fixoff-cmze1dja/test_boardviz.py:88: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-1jq9bsr8/planted/planted.svg' mode='w' encoding='UTF-8'>
  bad = os.path.join(PL(), 'planted.svg'); open(bad, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-cmze1dja/test_boardviz.py", line 90, in test_planted_overlap_caught_own_dim_allowed
    self.assertEqual([i['kind'] for i in r], ['label-on-geometry'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != ['label-on-geometry']

Second list contains 1 additional elements.
First extra element 0:
'label-on-geometry'

- []
+ ['label-on-geometry']

----------------------------------------------------------------------
Ran 1 test in 27.720s

FAILED (failures=1)
```

### patch-covers-label detection
Scratch `/tmp/fixoff-886u3m2j`, `check_overlap.py`:
```diff
- out.push({file,kind:'patch-covers-label',label:t.textContent,patch:n});
+ 0;
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_patch_covers_label_caught` → exit 1
```
/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-886u3m2j/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5fndtg19/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-886u3m2j/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5fndtg19/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-886u3m2j/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5fndtg19/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_planted_patch_covers_label_caught (test_boardviz.Overlap.test_planted_patch_covers_label_caught) ... /tmp/fixoff-886u3m2j/test_boardviz.py:95: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5fndtg19/planted/patch.svg' mode='w' encoding='UTF-8'>
  p = os.path.join(PL(), 'patch.svg'); open(p, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_patch_covers_label_caught (test_boardviz.Overlap.test_planted_patch_covers_label_caught)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-886u3m2j/test_boardviz.py", line 97, in test_planted_patch_covers_label_caught
    self.assertIn('patch-covers-label', kinds)
    ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'patch-covers-label' not found in set()

----------------------------------------------------------------------
Ran 1 test in 27.562s

FAILED (failures=1)
```

### panel() rejects depicted parts
Scratch `/tmp/fixoff-80p0xrzl`, `boardviz.py`:
```diff
- if role in DEPICTED:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills` → exit 1
```
est-tgurcka0/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-80p0xrzl/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-tgurcka0/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-80p0xrzl/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-tgurcka0/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-80p0xrzl/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-tgurcka0/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_panel_rejects_parts_roles_and_fills (test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills) ... FAIL

======================================================================
FAIL: test_panel_rejects_parts_roles_and_fills (test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills)
----------------------------------------------------------------------
ValueError: unknown panel role 'bed'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/tmp/fixoff-80p0xrzl/test_boardviz.py", line 115, in test_panel_rejects_parts_roles_and_fills
    with self.assertRaisesRegex(ValueError, 'depicted part'): s.panel(role, 0, 0, 10, 10, '#D9D9D9')
         ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: "depicted part" does not match "unknown panel role 'bed'"

----------------------------------------------------------------------
Ran 1 test in 27.334s

FAILED (failures=1)
```

### data-panel only on plain <rect> backgrounds
Scratch `/tmp/fixoff-btmun8pt`, `boardviz.py`:
```diff
- if tag != 'rect': probs.append
+ if False: probs.append
```
`$ python3 -m unittest -v test_boardviz.Panels.test_data_panel_planted_on_strip_caught` → exit 1
```
test-nuj4y5ni/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-btmun8pt/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nuj4y5ni/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-btmun8pt/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nuj4y5ni/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_data_panel_planted_on_strip_caught (test_boardviz.Panels.test_data_panel_planted_on_strip_caught) ... /tmp/fixoff-btmun8pt/test_boardviz.py:121: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nuj4y5ni/samples/checkerboard/top-view.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_data_panel_planted_on_strip_caught (test_boardviz.Panels.test_data_panel_planted_on_strip_caught)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-btmun8pt/test_boardviz.py", line 126, in test_data_panel_planted_on_strip_caught
    self.assertEqual(bv.panel_inventory(planted), ['data-panel on <polygon>'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != ['data-panel on <polygon>']

Second list contains 1 additional elements.
First extra element 0:
'data-panel on <polygon>'

- []
+ ['data-panel on <polygon>']

----------------------------------------------------------------------
Ran 1 test in 27.359s

FAILED (failures=1)
```

### data-panel emitted only by panel()
Scratch `/tmp/fixoff-feaze_y_`, `boardviz.py`:
```diff
- self.items.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx
+ self.items.append(f'<rect data-panel="saw-table" x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx
```
`$ python3 -m unittest -v test_boardviz.Panels.test_data_panel_only_on_backgrounds` → exit 1
```
: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nisb8ntr/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-feaze_y_/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nisb8ntr/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_data_panel_only_on_backgrounds (test_boardviz.Panels.test_data_panel_only_on_backgrounds) ... /tmp/fixoff-feaze_y_/test_boardviz.py:103: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-nisb8ntr/samples/brick-basketweave/crosscut.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_data_panel_only_on_backgrounds (test_boardviz.Panels.test_data_panel_only_on_backgrounds)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-feaze_y_/test_boardviz.py", line 104, in test_data_panel_only_on_backgrounds
    self.assertEqual(bv.panel_inventory(t), [], f)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: ['role saw-table with fill #8A8A8A', 'role[61 chars]B5A'] != []

First list contains 3 additional elements.
First extra element 0:
'role saw-table with fill #8A8A8A'

+ []
- ['role saw-table with fill #8A8A8A',
-  'role saw-table with fill #5B3A29',
-  'role saw-table with fill #B58B5A'] : /tmp/bvtest-nisb8ntr/samples/brick-basketweave/crosscut.svg

----------------------------------------------------------------------
Ran 1 test in 26.679s

FAILED (failures=1)
```

### agreement.json exact match
Scratch `/tmp/fixoff-hpt6uru_`, `boardviz.py`:
```diff
- if printed != want:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Export.test_agreement_catches_edited_label` → exit 1
```
mp/fixoff-hpt6uru_/boardviz.py:659: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-wlwley2h/planted/agree/steps/checkerboard/glue-up-2.svg' mode='r' encoding='utf8'>
/tmp/fixoff-hpt6uru_/boardviz.py:659: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-wlwley2h/planted/agree/steps/checkerboard/glue-up.svg' mode='r' encoding='utf8'>
/tmp/fixoff-hpt6uru_/boardviz.py:659: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-wlwley2h/planted/agree/steps/checkerboard/mill-rough-stock.svg' mode='r' encoding='utf8'>
/tmp/fixoff-hpt6uru_/boardviz.py:659: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-wlwley2h/planted/agree/steps/checkerboard/rip-strips.svg' mode='r' encoding='utf8'>
/tmp/fixoff-hpt6uru_/boardviz.py:659: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-wlwley2h/planted/agree/steps/checkerboard/rotate-slices.svg' mode='r' encoding='utf8'>
FAIL

======================================================================
FAIL: test_agreement_catches_edited_label (test_boardviz.Export.test_agreement_catches_edited_label)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-hpt6uru_/test_boardviz.py", line 160, in test_agreement_catches_edited_label
    self.assertFalse(bv.check_agreement(d, ex, raw)['ok'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: True is not false

----------------------------------------------------------------------
Ran 1 test in 26.403s

FAILED (failures=1)
```

### no banner cap
Scratch `/tmp/fixoff-v3tfigm0`, `boardviz.py`:
```diff
- for i, b in enumerate(banners):
+ for i, b in enumerate(banners[:1]):
```
`$ python3 -m unittest -v test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed` → exit 1
```
--------
Traceback (most recent call last):
  File "/tmp/fixoff-v3tfigm0/test_boardviz.py", line 174, in test_no_truncation_no_ellipsis_all_banners_printed
    for b in s['safetyBanners']: self.assertIn(b, printed, (st, s['stepId']))
                                 ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'WARNING: Keep hands clear of the infeed and outfeed. Feed only boards at least 12" (305 mm) long.' not found in ['Face Grain: step 1: Mill rough stock', 'Whole blank on the jointer (schematic, not to scale)', '42.406" (≈42 13/32")', 'Mill and rip whole blanks before any crosscut. Blank length = max(305 mm, slices x (slice + kerf) + 2 x 25 mm trim). Never send a crosscut slice or piece shorter than 305 mm to the jointer or planer.', 'Walnut strip: blank 42.406" (≈42 13/32") long, 2 slices of 20.094" (≈20 3/32") crosscut after milling.', 'Maple strip: blank 42.406" (≈42 13/32") long, 2 slices of 20.094" (≈20 3/32") crosscut after milling.', 'Blank lengths: catalog blankRule applied to the app cut list by boardviz; the app export does not apply the rule yet.', 'Joint one face and one edge on the jointer, then plane to final thickness plus 1/8" (3 mm). Rest overnight, then plane to final thickness. Take ~1/64" (0.4 mm) passes for the last two passes.', 'Final pass depth: ~1/64" (0.4 mm)', 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or thinner than 1/2" (12.5 mm).'] : ('face-grain', 'mill-rough-stock')

----------------------------------------------------------------------
Ran 1 test in 25.868s

FAILED (failures=1)
```

### long text wraps, never cut
Scratch `/tmp/fixoff-28embbmd`, `boardviz.py`:
```diff
- lines = wrap(s, size, max_w, bold) if max_w else [s]
+ lines = wrap(s, size, max_w, bold)[:1] if max_w else [s]
```
`$ python3 -m unittest -v test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed` → exit 1
```
cation_no_ellipsis_all_banners_printed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-28embbmd/test_boardviz.py", line 174, in test_no_truncation_no_ellipsis_all_banners_printed
    for b in s['safetyBanners']: self.assertIn(b, printed, (st, s['stepId']))
                                 ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or thinner than 1/2" (12.5 mm).' not found in ['Face Grain: step 1: Mill rough stock', 'Whole blank on the jointer (schematic, not to scale)', '42.406" (≈42 13/32")', 'Mill and rip whole blanks before any crosscut. Blank length = max(305 mm, slices x (slice + kerf) + 2 x 25', 'Walnut strip: blank 42.406" (≈42 13/32") long, 2 slices of 20.094" (≈20 3/32") crosscut after milling.', 'Maple strip: blank 42.406" (≈42 13/32") long, 2 slices of 20.094" (≈20 3/32") crosscut after milling.', 'Blank lengths: catalog blankRule applied to the app cut list by boardviz; the app export does not apply the', 'Joint one face and one edge on the jointer, then plane to final thickness plus 1/8" (3 mm). Rest overnight,', 'Final pass depth: ~1/64" (0.4 mm)', 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or', 'WARNING: Keep hands clear of the infeed and outfeed. Feed only boards at least 12" (305 mm)'] : ('face-grain', 'mill-rough-stock')

----------------------------------------------------------------------
Ran 1 test in 26.077s

FAILED (failures=1)
```

### relative/undefined --out refused
Scratch `/tmp/fixoff-_vvb9j7_`, `boardviz.py`:
```diff
- or not os.path.isabs(out):
+ :
```
`$ python3 -m unittest -v test_boardviz.Export.test_relative_or_undefined_out_refused` → exit 1
```
e='/tmp/bvtest-454ci_jf/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-_vvb9j7_/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-454ci_jf/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-_vvb9j7_/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-454ci_jf/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-_vvb9j7_/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-454ci_jf/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-_vvb9j7_/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-454ci_jf/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_relative_or_undefined_out_refused (test_boardviz.Export.test_relative_or_undefined_out_refused) ... FAIL

======================================================================
FAIL: test_relative_or_undefined_out_refused (test_boardviz.Export.test_relative_or_undefined_out_refused)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-_vvb9j7_/test_boardviz.py", line 141, in test_relative_or_undefined_out_refused
    with self.assertRaises(SystemExit), redirect_stderr(io.StringIO()): bv.main(args)
         ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
AssertionError: SystemExit not raised

----------------------------------------------------------------------
Ran 1 test in 27.114s

FAILED (failures=1)
```

### refused design fatal, no fallback
Scratch `/tmp/fixoff-mitgvbq4`, `boardviz.py`:
```diff
- raise ExportError(f'export failed (exit {p.returncode}): {p.stderr.strip()}')
+ return run_export('checkerboard', [])
```
`$ python3 -m unittest -v test_boardviz.Export.test_refused_design_fatal_no_files` → exit 1
```
ing='UTF-8'>
/tmp/fixoff-mitgvbq4/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kkgbhfrh/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-mitgvbq4/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kkgbhfrh/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-mitgvbq4/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kkgbhfrh/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-mitgvbq4/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kkgbhfrh/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-mitgvbq4/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kkgbhfrh/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_refused_design_fatal_no_files (test_boardviz.Export.test_refused_design_fatal_no_files) ... FAIL

======================================================================
FAIL: test_refused_design_fatal_no_files (test_boardviz.Export.test_refused_design_fatal_no_files)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-mitgvbq4/test_boardviz.py", line 149, in test_refused_design_fatal_no_files
    self.assertEqual(rc, 2)
    ~~~~~~~~~~~~~~~~^^^^^^^
AssertionError: 0 != 2

----------------------------------------------------------------------
Ran 1 test in 29.147s

FAILED (failures=1)
```

### <styleId>/<stepId>.svg naming
Scratch `/tmp/fixoff-pj58zifj`, `boardviz.py`:
```diff
- return step.get('stepId') or
+ return f"step-{step['stepNumber']}" or
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_files_match_catalog_exactly` → exit 1
```
' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-pj58zifj/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-pj58zifj/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-pj58zifj/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-pj58zifj/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_files_match_catalog_exactly (test_boardviz.Steps.test_step_files_match_catalog_exactly)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-pj58zifj/test_boardviz.py", line 186, in test_step_files_match_catalog_exactly
    self.assertEqual(bv.verify_step_outputs(STEPS_ROOT, bv.load_catalogs()), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: ['face-grain: missing edge-profile.svg', '[6563 chars]svg'] != []

First list contains 162 additional elements.
First extra element 0:
'face-grain: missing edge-profile.svg'

Diff is 7101 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 26.321s

FAILED (failures=1)
```

### no SVG for null-figure steps
Scratch `/tmp/fixoff-z4w5k0ds`, `boardviz.py`:
```diff
- if s['figureType'] is None: continue
+ if s['figureType'] is None:
            out[f"{ex['design']['style']}/{step_id(s)}"] = fig_text_step(ex, s); continue
```
`$ python3 -m unittest -v test_boardviz.Steps.test_no_svg_for_null_figure_steps` → exit 1
```
ad(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-z4w5k0ds/boardviz.py:707: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-z4w5k0ds/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-z4w5k0ds/boardviz.py:707: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-z4w5k0ds/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-z4w5k0ds/boardviz.py:707: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-z4w5k0ds/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_no_svg_for_null_figure_steps (test_boardviz.Steps.test_no_svg_for_null_figure_steps)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-z4w5k0ds/test_boardviz.py", line 192, in test_no_svg_for_null_figure_steps
    self.assertFalse(os.path.exists(os.path.join(STEPS_ROOT, st, s['stepId'] + '.svg')))
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: True is not false

----------------------------------------------------------------------
Ran 1 test in 25.585s

FAILED (failures=1)
```

### duplicate stepId detected
Scratch `/tmp/fixoff-9q7llyq8`, `boardviz.py`:
```diff
- if dup: problems.append
+ if False: problems.append
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails` → exit 1
```
for st in STYLES}
/tmp/fixoff-9q7llyq8/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-9q7llyq8/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-9q7llyq8/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-9q7llyq8/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-9q7llyq8/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-9q7llyq8/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_ids_unique_and_rename_or_duplicate_fails (test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-9q7llyq8/test_boardviz.py", line 203, in test_step_ids_unique_and_rename_or_duplicate_fails
    self.assertTrue(any('duplicate' in p for p in bv.verify_step_outputs(STEPS_ROOT, dup)))
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: False is not true

----------------------------------------------------------------------
Ran 1 test in 25.605s

FAILED (failures=1)
```

### renamed stepId detected (missing file)
Scratch `/tmp/fixoff-8yz8rtru`, `boardviz.py`:
```diff
- for f in sorted(want - have): problems.append(f'{st}: missing {f}')
+ pass
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails` → exit 1
```
ardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-8yz8rtru/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-8yz8rtru/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-8yz8rtru/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-8yz8rtru/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-8yz8rtru/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_ids_unique_and_rename_or_duplicate_fails (test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-8yz8rtru/test_boardviz.py", line 201, in test_step_ids_unique_and_rename_or_duplicate_fails
    self.assertTrue(any('missing ' + s0['stepId'] + '.svg' in p for p in probs), probs)
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: False is not true : ['end-grain: unexpected mill-rough-stock.svg']

----------------------------------------------------------------------
Ran 1 test in 31.904s

FAILED (failures=1)
```

### strips never capped
Scratch `/tmp/fixoff-14gp63h9`, `boardviz.py`:
```diff
- return sorted(strips, key=lambda s: s['x'])
+ return sorted(strips, key=lambda s: s['x'])[:8]
```
`$ python3 -m unittest -v test_boardviz.Strips.test_high_strip_count_never_capped` → exit 1
```
losed file <_io.TextIOWrapper name='/tmp/bvtest-63b4756f/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-14gp63h9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-63b4756f/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-14gp63h9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-63b4756f/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-14gp63h9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-63b4756f/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-14gp63h9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-63b4756f/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_high_strip_count_never_capped (test_boardviz.Strips.test_high_strip_count_never_capped) ... FAIL

======================================================================
FAIL: test_high_strip_count_never_capped (test_boardviz.Strips.test_high_strip_count_never_capped)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-14gp63h9/test_boardviz.py", line 211, in test_high_strip_count_never_capped
    row = bv.section_strips(ex); self.assertEqual(len(row), n)
                                 ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^
AssertionError: 8 != 40

----------------------------------------------------------------------
Ran 1 test in 27.214s

FAILED (failures=1)
```

### fit helper handles rotation
Scratch `/tmp/fixoff-vfd_c0hw`, `test_fit_helper.py`:
```diff
-         if r:

+         if False:

```
`$ python3 -m unittest -v test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation` → exit 1
```
/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vfd_c0hw/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-rt81aqlw/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vfd_c0hw/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-rt81aqlw/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vfd_c0hw/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-rt81aqlw/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation) ... /tmp/fixoff-vfd_c0hw/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-rt81aqlw/planted/fit.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-vfd_c0hw/test_boardviz.py", line 59, in test_fit_helper_any_attribute_order_and_rotation
    self.assertEqual(out.stdout, '2\n1\n'); self.assertEqual(out.returncode, 1)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
AssertionError: '1\n1\n' != '2\n1\n'
+ 2
  1
- 1


----------------------------------------------------------------------
Ran 1 test in 26.664s

FAILED (failures=1)
```

### fit helper fails on any line
Scratch `/tmp/fixoff-6aqscqt9`, `test_fit_helper.py`:
```diff
- return 1 if report[0] or report[1] else 0
+ return 0
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation` → exit 1
```
slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6aqscqt9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-x8ue4g66/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6aqscqt9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-x8ue4g66/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6aqscqt9/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-x8ue4g66/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation) ... /tmp/fixoff-6aqscqt9/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-x8ue4g66/planted/fit.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-6aqscqt9/test_boardviz.py", line 59, in test_fit_helper_any_attribute_order_and_rotation
    self.assertEqual(out.stdout, '2\n1\n'); self.assertEqual(out.returncode, 1)
                                            ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
AssertionError: 0 != 1

----------------------------------------------------------------------
Ran 1 test in 27.166s

FAILED (failures=1)
```

### NEW mill figures: no jointer/planer piece < 305 mm (blankRule)
Scratch `/tmp/fixoff-vz22altj`, `boardviz.py`:
```diff
- data-length-mm="{b["length_mm"]:.3f}"
+ data-length-mm="{b["slice_mm"]:.3f}"
```
`$ python3 -m unittest -v test_boardviz.Milling.test_no_jointer_or_planer_piece_under_minimum` → exit 1
```
 m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
/tmp/fixoff-vz22altj/test_boardviz.py:258: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-9f44117k/steps/tumbling-block-3d/mill-rough-stock.svg' mode='r' encoding='UTF-8'>
  for m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
/tmp/fixoff-vz22altj/test_boardviz.py:258: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-9f44117k/steps/tumbling-block-3d/rip-strips.svg' mode='r' encoding='UTF-8'>
  for m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
FAIL

======================================================================
FAIL: test_no_jointer_or_planer_piece_under_minimum (test_boardviz.Milling.test_no_jointer_or_planer_piece_under_minimum)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-vz22altj/test_boardviz.py", line 271, in test_no_jointer_or_planer_piece_under_minimum
    self.assertGreaterEqual(L, self.A['blankRule']['blankMinLength_mm'], (f, m, L))
    ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 78.575 not greater than or equal to 305.0 : ('/tmp/bvtest-9f44117k/samples/brick-basketweave/steps/brick-basketweave/flatten-first-panel.svg', 'planer', 78.575)

----------------------------------------------------------------------
Ran 1 test in 28.618s

FAILED (failures=1)
```

### NEW planer: panel wider than planerMaxWidth_mm goes to router sled
Scratch `/tmp/fixoff-vyk49af5`, `boardviz.py`:
```diff
- if m == 'planer' and width_mm > A['planerMaxWidth_mm']:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Milling.test_planer_never_gets_panel_wider_than_max` → exit 1
```
'r' encoding='UTF-8'>
  for m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
/tmp/fixoff-vyk49af5/test_boardviz.py:258: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-98kvl87e/steps/tumbling-block-3d/mill-rough-stock.svg' mode='r' encoding='UTF-8'>
  for m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
/tmp/fixoff-vyk49af5/test_boardviz.py:258: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-98kvl87e/steps/tumbling-block-3d/rip-strips.svg' mode='r' encoding='UTF-8'>
  for m in re.finditer(r'data-machine="([^"]+)" data-length-mm="([\d.]+)" data-width-mm="([\d.]+)"', open(f).read()):
FAIL

======================================================================
FAIL: test_planer_never_gets_panel_wider_than_max (test_boardviz.Milling.test_planer_never_gets_panel_wider_than_max)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-vyk49af5/test_boardviz.py", line 276, in test_planer_never_gets_panel_wider_than_max
    if m == 'planer': self.assertLessEqual(W, self.A['planerMaxWidth_mm'], (f, W))
                      ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 406.4 not less than or equal to 305.0 : ('/tmp/bvtest-98kvl87e/samples/checkerboard-16x24/steps/checkerboard/flatten-first-panel.svg', 406.4)

----------------------------------------------------------------------
Ran 1 test in 27.333s

FAILED (failures=1)
```

### NEW jointer: no face-joint wider than jointerMaxWidth_mm
Scratch `/tmp/fixoff-cdi460_c`, `boardviz.py`:
```diff
- if m == 'jointer' and width_mm > A['jointerMaxWidth_mm']:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Milling.test_jointer_never_face_joints_wider_than_max` → exit 1
```
ll="#222222"><tspan x="20.00" y="308.20">Blank lengths: catalog blankRule applied to the app cut list by boardviz; the app export does not apply the</tspan><tspan x="20.00" y="322.50">rule yet.</tspan></text>\n<text x="20.00" y="347.80" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="catalog.steps.0.description"><tspan x="20.00" y="347.80">Joint one face and one edge on the jointer, then plane to final thickness plus 1/8&quot; (3 mm). Rest overnight,</tspan><tspan x="20.00" y="362.10">then plane to final thickness. Take ~1/64&quot; (0.4 mm) passes for the last two passes.</tspan></text>\n<text x="20.00" y="383.40" font-family="DejaVu Sans" font-size="11" fill="#222222" font-weight="bold"><tspan x="20.00" y="383.40">Final pass depth: ~1/64&quot; (0.4 mm)</tspan></text>\n<text x="20.00" y="404.70" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.0.safetyBanners.0"><tspan x="20.00" y="404.70">WARNING: Use push blocks on the jointer. Never joint stock shorter than 12&quot; (305 mm) or</tspan><tspan x="20.00" y="419.00">thinner than 1/2&quot; (12.5 mm).</tspan></text>\n<text x="20.00" y="440.30" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.0.safetyBanners.1"><tspan x="20.00" y="440.30">WARNING: Keep hands clear of the infeed and outfeed. Feed only boards at least 12&quot; (305 mm)</tspan><tspan x="20.00" y="454.60">long.</tspan></text>\n</svg>\n'

----------------------------------------------------------------------
Ran 1 test in 27.998s

FAILED (failures=1)
```

### NEW strict mode flags exportVsCatalog
Scratch `/tmp/fixoff-403hxdnp`, `boardviz.py`:
```diff
- res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]
+ pass
```
`$ python3 -m unittest -v test_boardviz.Strict.test_strict_mode_flags_every_mismatch` → exit 1
```
in(SAMPLES_DIR, n, 'agreement.json')))['exportVsCatalog']) for n in bv.SAMPLES)
/tmp/fixoff-403hxdnp/test_boardviz.py:315: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-w4546d42/samples/scrap-chaotic/agreement.json' mode='r' encoding='UTF-8'>
  total = sum(len(json.load(open(os.path.join(SAMPLES_DIR, n, 'agreement.json')))['exportVsCatalog']) for n in bv.SAMPLES)
/tmp/fixoff-403hxdnp/test_boardviz.py:315: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-w4546d42/samples/tumbling-block-3d/agreement.json' mode='r' encoding='UTF-8'>
  total = sum(len(json.load(open(os.path.join(SAMPLES_DIR, n, 'agreement.json')))['exportVsCatalog']) for n in bv.SAMPLES)
/tmp/fixoff-403hxdnp/test_boardviz.py:315: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-w4546d42/samples/metric/agreement.json' mode='r' encoding='UTF-8'>
  total = sum(len(json.load(open(os.path.join(SAMPLES_DIR, n, 'agreement.json')))['exportVsCatalog']) for n in bv.SAMPLES)
FAIL

======================================================================
FAIL: test_strict_mode_flags_every_mismatch (test_boardviz.Strict.test_strict_mode_flags_every_mismatch)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-403hxdnp/test_boardviz.py", line 316, in test_strict_mode_flags_every_mismatch
    self.assertEqual(len(sf), total)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^
AssertionError: 0 != 37

----------------------------------------------------------------------
Ran 1 test in 26.493s

FAILED (failures=1)
```

### NEW strict test runs by default (opt-out only)
Scratch `/tmp/fixoff-f9_ft7hw`, `test_boardviz.py`:
```diff
-         if os.environ.get('BOARDVIZ_ALLOW_MISMATCH') == '1':
+         if True:
```
`$ python3 -m unittest -v test_boardviz.Strict.test_strict_is_on_by_default` → exit 1
```
'/tmp/bvtest-bzrx2mgk/samples/stripe-inlay/agreement.json' mode='r' encoding='utf8'>\n  res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]\nResourceWarning: Enable tracemalloc to get the object allocation traceback\n/tmp/fixoff-f9_ft7hw/boardviz.py:775: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-bzrx2mgk/samples/scrap-chaotic/agreement.json' mode='r' encoding='utf8'>\n  res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]\nResourceWarning: Enable tracemalloc to get the object allocation traceback\n/tmp/fixoff-f9_ft7hw/boardviz.py:775: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-bzrx2mgk/samples/tumbling-block-3d/agreement.json' mode='r' encoding='utf8'>\n  res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]\nResourceWarning: Enable tracemalloc to get the object allocation traceback\n/tmp/fixoff-f9_ft7hw/boardviz.py:775: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-bzrx2mgk/samples/metric/agreement.json' mode='r' encoding='utf8'>\n  res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]\nResourceWarning: Enable tracemalloc to get the object allocation traceback\nskipped 'BOARDVIZ_ALLOW_MISMATCH=1: 37 export-vs-catalog mismatches allowed'\n\n----------------------------------------------------------------------\nRan 1 test in 26.150s\n\nOK (skipped=1)\n"

----------------------------------------------------------------------
Ran 1 test in 53.067s

FAILED (failures=1)
```

### NEW hand hole sized from catalog features
Scratch `/tmp/fixoff-w7bjhoh0`, `boardviz.py`:
```diff
- sl, sw_ = k['length_mm'] * sc, k['width_mm'] * sc
+ sl, sw_ = 80.0, 20.0
```
`$ python3 -m unittest -v test_boardviz.Features.test_handle_overlays_use_catalog_features` → exit 1
```
 x1="358.26" y1="138.00" x2="108.72" y2="138.00" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" data-dim="3"/>\n<line x1="358.26" y1="158.00" x2="108.72" y2="158.00" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" data-dim="3"/>\n<line x1="112.72" y1="138.00" x2="112.72" y2="158.00" stroke="#555" stroke-width="1" data-dim="3"/>\n<line x1="108.72" y1="138.00" x2="116.72" y2="138.00" stroke="#555" stroke-width="1" data-dim="3"/>\n<line x1="108.72" y1="158.00" x2="116.72" y2="158.00" stroke="#555" stroke-width="1" data-dim="3"/>\n<rect data-patch="3" x="42.00" y="139.00" width="64.72" height="18.30" fill="#FFFFFF"/>\n<text x="104.72" y="152.00" font-family="DejaVu Sans" font-size="11" fill="#222222" text-anchor="end" data-dim="3" data-src="features.handHole.text_fmt.width"><tspan x="104.72" y="152.00">1.000&quot; (1&quot;)</tspan></text>\n<text x="20.00" y="601.20" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="features.handHole.text"><tspan x="20.00" y="601.20">Hand-hole slot 4&quot; (100 mm) long x 1&quot; (25.4 mm) wide, round ends, centred 1-1/2&quot; (38 mm) in from</tspan><tspan x="20.00" y="615.50">the end. Rout through with a template and a 1/2&quot; (12.7 mm) bit in shallow passes.</tspan></text>\n<text x="20.00" y="636.80" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="label.holeBit"><tspan x="20.00" y="636.80">Bit: 1/2&quot; (12.7 mm) straight or spiral bit, with a template</tspan></text>\n</svg>\n'

----------------------------------------------------------------------
Ran 1 test in 25.936s

FAILED (failures=1)
```

### NEW finger grip sized from catalog features
Scratch `/tmp/fixoff-d08y6gd5`, `boardviz.py`:
```diff
- gl, gd = g['length_mm'] * sc, g['depth_mm'] * sc
+ gl, gd = 120.0, 12.0
```
`$ python3 -m unittest -v test_boardviz.Features.test_handle_overlays_use_catalog_features` → exit 1
```
.Features.test_handle_overlays_use_catalog_features) ... /tmp/fixoff-d08y6gd5/test_boardviz.py:347: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-b6aj6gx1/samples/edge-grain/export.json' mode='r' encoding='UTF-8'>
  ex = json.load(open(os.path.join(SAMPLES_DIR, 'edge-grain', 'export.json')))
/tmp/fixoff-d08y6gd5/test_boardviz.py:348: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-b6aj6gx1/samples/edge-grain/hand-hole.svg' mode='r' encoding='UTF-8'>
/tmp/fixoff-d08y6gd5/test_boardviz.py:354: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-b6aj6gx1/samples/face-grain/export.json' mode='r' encoding='UTF-8'>
  ex = json.load(open(os.path.join(SAMPLES_DIR, 'face-grain', 'export.json')))
/tmp/fixoff-d08y6gd5/test_boardviz.py:355: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-b6aj6gx1/samples/face-grain/handle.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_handle_overlays_use_catalog_features (test_boardviz.Features.test_handle_overlays_use_catalog_features)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-d08y6gd5/test_boardviz.py", line 357, in test_handle_overlays_use_catalog_features
    self.assertEqual(t.count('width="100.00" height="9.50"'), 2)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 0 != 2

----------------------------------------------------------------------
Ran 1 test in 26.606s

FAILED (failures=1)
```

### NEW rip fence: push stick drawn and labelled
Scratch `/tmp/fixoff-fyiyt1of`, `boardviz.py`:
```diff
- svg.text(bx + 16, ty + 250, 'push stick')
+ pass
```
`$ python3 -m unittest -v test_boardviz.Features.test_rip_fence_has_knife_push_stick_feed` → exit 1
```
e fence face → near side of a tooth</tspan></text>\n<text x="20.00" y="405.30" font-family="DejaVu Sans" font-size="11" fill="#222222"><tspan x="20.00" y="405.30">set toward the fence</tspan></text>\n<text x="20.00" y="426.60" font-family="DejaVu Sans" font-size="11" fill="#222222"><tspan x="20.00" y="426.60">Kerf: 1/8&quot; (3.2 mm) full-kerf blade</tspan></text>\n<text x="20.00" y="455.90" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="catalog.steps.1.description"><tspan x="20.00" y="455.90">Rip strips with the jointed edge against the fence. Measure from the fence face to the near side of a</tspan><tspan x="20.00" y="470.20">tooth set toward the fence.</tspan></text>\n<text x="20.00" y="491.50" font-family="DejaVu Sans" font-size="11" fill="#222222" font-weight="bold"><tspan x="20.00" y="491.50">Fence to blade: strip width from cut list</tspan></text>\n<text x="20.00" y="512.80" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.1.safetyBanners.0"><tspan x="20.00" y="512.80">WARNING: Use the riving knife and blade guard on every through cut.</tspan></text>\n<text x="20.00" y="534.10" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.1.safetyBanners.1"><tspan x="20.00" y="534.10">WARNING: Use a push stick for any rip narrower than 6&quot; (152 mm). Never reach over or</tspan><tspan x="20.00" y="548.40">behind the blade.</tspan></text>\n</svg>\n'

----------------------------------------------------------------------
Ran 1 test in 27.576s

FAILED (failures=1)
```

### NEW rip fence: riving knife drawn and labelled
Scratch `/tmp/fixoff-cljx2clp`, `boardviz.py`:
```diff
- svg.text(bx + 16, ty + 58, 'riving knife')
+ pass
```
`$ python3 -m unittest -v test_boardviz.Features.test_rip_fence_has_knife_push_stick_feed` → exit 1
```
e fence face → near side of a tooth</tspan></text>\n<text x="20.00" y="405.30" font-family="DejaVu Sans" font-size="11" fill="#222222"><tspan x="20.00" y="405.30">set toward the fence</tspan></text>\n<text x="20.00" y="426.60" font-family="DejaVu Sans" font-size="11" fill="#222222"><tspan x="20.00" y="426.60">Kerf: 1/8&quot; (3.2 mm) full-kerf blade</tspan></text>\n<text x="20.00" y="455.90" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="catalog.steps.1.description"><tspan x="20.00" y="455.90">Rip strips with the jointed edge against the fence. Measure from the fence face to the near side of a</tspan><tspan x="20.00" y="470.20">tooth set toward the fence.</tspan></text>\n<text x="20.00" y="491.50" font-family="DejaVu Sans" font-size="11" fill="#222222" font-weight="bold"><tspan x="20.00" y="491.50">Fence to blade: strip width from cut list</tspan></text>\n<text x="20.00" y="512.80" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.1.safetyBanners.0"><tspan x="20.00" y="512.80">WARNING: Use the riving knife and blade guard on every through cut.</tspan></text>\n<text x="20.00" y="534.10" font-family="DejaVu Sans" font-size="11" fill="#9B1C1C" font-weight="bold" data-src="catalog.steps.1.safetyBanners.1"><tspan x="20.00" y="534.10">WARNING: Use a push stick for any rip narrower than 6&quot; (152 mm). Never reach over or</tspan><tspan x="20.00" y="548.40">behind the blade.</tspan></text>\n</svg>\n'

----------------------------------------------------------------------
Ran 1 test in 26.614s

FAILED (failures=1)
```

### NEW rip fence: Feed label off the arrow
Scratch `/tmp/fixoff-mmsrccyb`, `boardviz.py`:
```diff
- svg.text(bx + 162, ty + 190, 'Feed')
+ svg.text(bx + 140, ty + 190, 'Feed')
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing` → exit 1
```
 mode='w' encoding='UTF-8'>
/tmp/fixoff-mmsrccyb/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-noq9niwv/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-mmsrccyb/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-noq9niwv/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing) ... FAIL

======================================================================
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-mmsrccyb/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-noq9niwv/samples/br[7913 chars]e>'}] != []

First list contains 34 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-noq9niwv/samples/brick-basketweave/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'Feed', 'element': '<line x1="450.00" y1="300.00" x2="450.00" y2="190.00" stroke="#222222" stroke-width="2"></line>'}

Diff is 9087 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 28.272s

FAILED (failures=1)
```

### NEW rip fence: push-stick label off the push stick
Scratch `/tmp/fixoff-kvd5kq8g`, `boardviz.py`:
```diff
- svg.text(bx + 16, ty + 250, 'push stick')
+ svg.text(fx + 4, ty + 230, 'push stick')
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing` → exit 1
```
/fixoff-kvd5kq8g/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-albxbzld/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-kvd5kq8g/boardviz.py:816: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-albxbzld/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing) ... FAIL

======================================================================
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-kvd5kq8g/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-albxbzld/samples/br[8967 chars]="'}] != []

First list contains 34 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-albxbzld/samples/brick-basketweave/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'push stick', 'element': '<polygon points="163.40,265.00 265.85,265.00 265.85,312.00 163.40,298.00" fill="#E8B04A" stroke="#222222" stroke-width="'}

Diff is 10141 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 27.061s

FAILED (failures=1)
```

### NEW metric is the 12th sample folder
Scratch `/tmp/fixoff-62o4c5qb`, `boardviz.py`:
```diff
-     'metric': ('metric', ['rubberFeet.enabled=true']),

+ 
```
`$ python3 -m unittest -v test_boardviz.Export.test_every_agreement_ok` → exit 1
```
ceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-gu25y3or/samples/herringbone/agreement.json' mode='r' encoding='UTF-8'>
  a = json.load(open(os.path.join(SAMPLES_DIR, name, 'agreement.json')))
/tmp/fixoff-62o4c5qb/test_boardviz.py:134: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-gu25y3or/samples/stripe-inlay/agreement.json' mode='r' encoding='UTF-8'>
  a = json.load(open(os.path.join(SAMPLES_DIR, name, 'agreement.json')))
/tmp/fixoff-62o4c5qb/test_boardviz.py:134: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-gu25y3or/samples/scrap-chaotic/agreement.json' mode='r' encoding='UTF-8'>
  a = json.load(open(os.path.join(SAMPLES_DIR, name, 'agreement.json')))
/tmp/fixoff-62o4c5qb/test_boardviz.py:134: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-gu25y3or/samples/tumbling-block-3d/agreement.json' mode='r' encoding='UTF-8'>
  a = json.load(open(os.path.join(SAMPLES_DIR, name, 'agreement.json')))
FAIL

======================================================================
FAIL: test_every_agreement_ok (test_boardviz.Export.test_every_agreement_ok)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-62o4c5qb/test_boardviz.py", line 136, in test_every_agreement_ok
    self.assertEqual(n, len(bv.SAMPLES)); self.assertEqual(n, 12)
                                          ~~~~~~~~~~~~~~~~^^^^^^^
AssertionError: 11 != 12

----------------------------------------------------------------------
Ran 1 test in 25.335s

FAILED (failures=1)
```

### NEW hand hole end radius == width/2 flagged
Scratch `/tmp/fixoff-kzd56g2d`, `boardviz.py`:
```diff
- if abs(k['endRadius_mm'] - k['width_mm'] / 2) > 1e-6:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.HandHole.test_end_radius_is_half_width_and_mismatch_flagged` → exit 1
```
.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-kzd56g2d/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-kzd56g2d/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-kzd56g2d/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-kzd56g2d/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-kzd56g2d/boardviz.py:706: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-kzd56g2d/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_end_radius_is_half_width_and_mismatch_flagged (test_boardviz.HandHole.test_end_radius_is_half_width_and_mismatch_flagged)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-kzd56g2d/test_boardviz.py", line 308, in test_end_radius_is_half_width_and_mismatch_flagged
    self.assertTrue(bv.hand_hole_problems(ex['features']['handHole']))
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: [] is not true

----------------------------------------------------------------------
Ran 1 test in 33.339s

FAILED (failures=1)
```

### NEW hand hole drawn with catalog endRadius_mm
Scratch `/tmp/fixoff-gq_9p2e1`, `boardviz.py`:
```diff
- rx=k['endRadius_mm'] * sc)
+ rx=12.5)
```
`$ python3 -m unittest -v test_boardviz.Features.test_handle_overlays_use_catalog_features` → exit 1
```
 x1="348.26" y1="135.30" x2="108.72" y2="135.30" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" data-dim="3"/>\n<line x1="348.26" y1="160.70" x2="108.72" y2="160.70" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" data-dim="3"/>\n<line x1="112.72" y1="135.30" x2="112.72" y2="160.70" stroke="#555" stroke-width="1" data-dim="3"/>\n<line x1="108.72" y1="135.30" x2="116.72" y2="135.30" stroke="#555" stroke-width="1" data-dim="3"/>\n<line x1="108.72" y1="160.70" x2="116.72" y2="160.70" stroke="#555" stroke-width="1" data-dim="3"/>\n<rect data-patch="3" x="42.00" y="139.00" width="64.72" height="18.30" fill="#FFFFFF"/>\n<text x="104.72" y="152.00" font-family="DejaVu Sans" font-size="11" fill="#222222" text-anchor="end" data-dim="3" data-src="features.handHole.text_fmt.width"><tspan x="104.72" y="152.00">1.000&quot; (1&quot;)</tspan></text>\n<text x="20.00" y="601.20" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="features.handHole.text"><tspan x="20.00" y="601.20">Hand-hole slot 4&quot; (100 mm) long x 1&quot; (25.4 mm) wide, round ends, centred 1-1/2&quot; (38 mm) in from</tspan><tspan x="20.00" y="615.50">the end. Rout through with a template and a 1/2&quot; (12.7 mm) bit in shallow passes.</tspan></text>\n<text x="20.00" y="636.80" font-family="DejaVu Sans" font-size="11" fill="#222222" data-src="label.holeBit"><tspan x="20.00" y="636.80">Bit: 1/2&quot; (12.7 mm) straight or spiral bit, with a template</tspan></text>\n</svg>\n'

----------------------------------------------------------------------
Ran 1 test in 26.233s

FAILED (failures=1)
```

### NEW hand-hole inset label clears the slot-width extension line
Scratch `/tmp/fixoff-qhqbnnqb`, `boardviz.py`:
```diff
-               label_dy=-max(
+               label_dy=0*-max(
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing` → exit 1
```
ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-kiysqbu1/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing) ... FAIL

======================================================================
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-qhqbnnqb/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-kiysqbu1/samples/ed[204 chars]="'}] != []

First list contains 1 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-kiysqbu1/samples/edge-grain/hand-hole.svg', 'kind': 'patch-on-geometry', 'label': 'patch 2', 'element': '<line x1="348.26" y1="135.30" x2="108.72" y2="135.30" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" data-dim="'}

+ []
- [{'element': '<line x1="348.26" y1="135.30" x2="108.72" y2="135.30" '
-              'stroke="#555" stroke-width="0.8" stroke-dasharray="4,3" '
-              'data-dim="',
-   'file': '/tmp/bvtest-kiysqbu1/samples/edge-grain/hand-hole.svg',
-   'kind': 'patch-on-geometry',
-   'label': 'patch 2'}]

----------------------------------------------------------------------
Ran 1 test in 28.276s

FAILED (failures=1)
```
