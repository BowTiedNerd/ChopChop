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

**Restored baseline** `python3 -m unittest test_boardviz` → exit 0, Ran 37: OK. Source sha256 unchanged before/after: True.

### Svg.text refuses < 11 px
Scratch `/tmp/fixoff-fdrca5gx`, `boardviz.py`:
```diff
- if size < MIN_FONT_PX:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_svg_text_refuses_under_minimum` → exit 1
```
file <_io.TextIOWrapper name='/tmp/bvtest-cow2ou0q/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fdrca5gx/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-cow2ou0q/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fdrca5gx/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-cow2ou0q/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fdrca5gx/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-cow2ou0q/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fdrca5gx/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-cow2ou0q/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_svg_text_refuses_under_minimum (test_boardviz.TextSize.test_svg_text_refuses_under_minimum) ... FAIL

======================================================================
FAIL: test_svg_text_refuses_under_minimum (test_boardviz.TextSize.test_svg_text_refuses_under_minimum)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-fdrca5gx/test_boardviz.py", line 43, in test_svg_text_refuses_under_minimum
    with self.assertRaises(ValueError): s.text(0, 20, 'tiny', size=10)
         ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
AssertionError: ValueError not raised

----------------------------------------------------------------------
Ran 1 test in 24.529s

FAILED (failures=1)
```

### drawn size uses sqrt(|det CTM|)
Scratch `/tmp/fixoff-fhmfvvnw`, `measure_labels.py`:
```diff
- const drawn=fs*Math.sqrt(det);
+ const drawn=fs;
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x` → exit 1
```
ed file <_io.TextIOWrapper name='/tmp/bvtest-vajxi7p5/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fhmfvvnw/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-vajxi7p5/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-fhmfvvnw/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-vajxi7p5/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_drawn_size_scaling_flags_11px_at_0_8x (test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x) ... /tmp/fixoff-fhmfvvnw/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-vajxi7p5/planted/scaled.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_drawn_size_scaling_flags_11px_at_0_8x (test_boardviz.TextSize.test_drawn_size_scaling_flags_11px_at_0_8x)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-fhmfvvnw/test_boardviz.py", line 39, in test_drawn_size_scaling_flags_11px_at_0_8x
    self.assertEqual([(i['kind'], i['drawn']) for i in r], [('size', 8.8)])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != [('size', 8.8)]

Second list contains 1 additional elements.
First extra element 0:
('size', 8.8)

- []
+ [('size', 8.8)]

----------------------------------------------------------------------
Ran 1 test in 25.922s

FAILED (failures=1)
```

### SVG width == viewBox width (1:1)
Scratch `/tmp/fixoff-by8ohsiw`, `boardviz.py`:
```diff
- width="{W}" height="{H}" viewBox
+ width="{int(W*0.8)}" height="{H}" viewBox
```
`$ python3 -m unittest -v test_boardviz.Index.test_svgs_are_one_to_one` → exit 1
```
y8ohsiw/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5rbeccki/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-by8ohsiw/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5rbeccki/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-by8ohsiw/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5rbeccki/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_svgs_are_one_to_one (test_boardviz.Index.test_svgs_are_one_to_one) ... /tmp/fixoff-by8ohsiw/test_boardviz.py:75: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5rbeccki/samples/brick-basketweave/crosscut.svg' mode='r' encoding='UTF-8'>
  m = re.search(r'width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"', open(f).read())
FAIL

======================================================================
FAIL: test_svgs_are_one_to_one (test_boardviz.Index.test_svgs_are_one_to_one)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-by8ohsiw/test_boardviz.py", line 76, in test_svgs_are_one_to_one
    self.assertEqual(m.group(1), m.group(3), f); self.assertEqual(m.group(2), m.group(4), f)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: '512' != '640'
- 512
+ 640
 : /tmp/bvtest-5rbeccki/samples/brick-basketweave/crosscut.svg

----------------------------------------------------------------------
Ran 1 test in 24.297s

FAILED (failures=1)
```

### index never shrinks figures
Scratch `/tmp/fixoff-du872zz0`, `boardviz.py`:
```diff
- <img style='max-width:none'
+ <img style='max-width:48%'
```
`$ python3 -m unittest -v test_boardviz.Index.test_index_never_shrinks` → exit 1
```
ardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o_xnphlm/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-du872zz0/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o_xnphlm/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-du872zz0/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o_xnphlm/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-du872zz0/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o_xnphlm/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_index_never_shrinks (test_boardviz.Index.test_index_never_shrinks) ... /tmp/fixoff-du872zz0/test_boardviz.py:67: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o_xnphlm/samples/index.html' mode='r' encoding='UTF-8'>
  h = open(os.path.join(SAMPLES_DIR, 'index.html')).read()
FAIL

======================================================================
FAIL: test_index_never_shrinks (test_boardviz.Index.test_index_never_shrinks)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-du872zz0/test_boardviz.py", line 69, in test_index_never_shrinks
    self.assertEqual(len(imgs), h.count('<img'))
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 0 != 91

----------------------------------------------------------------------
Ran 1 test in 25.758s

FAILED (failures=1)
```

### RIP FENCE beside fence, not on it
Scratch `/tmp/fixoff-gpgahle7`, `boardviz.py`:
```diff
- svg.text(fx - 30, ty + 30, 'RIP FENCE'
+ svg.text(fx - 2, ty + 30, 'RIP FENCE'
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_no_label_covers_drawing` → exit 1
```
mp/fixoff-gpgahle7/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-f9d4vu3f/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-gpgahle7/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-f9d4vu3f/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing) ... FAIL

======================================================================
FAIL: test_no_label_covers_drawing (test_boardviz.Overlap.test_no_label_covers_drawing)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-gpgahle7/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-f9d4vu3f/samples/br[8409 chars]re'}] != []

First list contains 32 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-f9d4vu3f/samples/brick-basketweave/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'RIP FENCE', 'element': '<rect x="107.25" y="70.00" width="22.00" height="240.00" rx="0.00" fill="#6B6B6B" stroke="#222222" stroke-width="1"></re'}

Diff is 9517 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 26.851s

FAILED (failures=1)
```

### 'head' right of cutterhead
Scratch `/tmp/fixoff-u5r8rsnq`, `boardviz.py`:
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
  File "/tmp/fixoff-u5r8rsnq/test_boardviz.py", line 80, in test_no_label_covers_drawing
    self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-0sab6l57/samples/ed[660 chars]e>'}] != []

First list contains 3 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-0sab6l57/samples/edge-grain/rip-fence-setup.svg', 'kind': 'label-on-geometry', 'label': 'head', 'element': '<circle cx="250.00" cy="508.18" r="20.00" fill="#9A9A9A" stroke="#222222" stroke-width="1"></circle>'}

Diff is 811 characters long. Set self.maxDiff to None to see it.

======================================================================
FAIL: test_placement_rules (test_boardviz.Labels.test_placement_rules)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-u5r8rsnq/test_boardviz.py", line 250, in test_placement_rules
    self.assertGreater(float(ht.group(1)), float(head.group(1)) + float(head.group(2)))
    ~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 240.0 not greater than 270.0

----------------------------------------------------------------------
Ran 2 tests in 26.333s

FAILED (failures=2)
```

### label may overlap only its own data-dim
Scratch `/tmp/fixoff-ld7t2mrw`, `check_overlap.py`:
```diff
- if(skipDim!==null && g.getAttribute('data-dim')===skipDim) continue;
+ 
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed` → exit 1
```
ht_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed) ... /tmp/fixoff-ld7t2mrw/test_boardviz.py:85: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-1_hfxgis/planted/own.svg' mode='w' encoding='UTF-8'>
  good = os.path.join(PL(), 'own.svg'); open(good, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-ld7t2mrw/test_boardviz.py", line 86, in test_planted_overlap_caught_own_dim_allowed
    self.assertEqual(check_overlap.overlaps([good]), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [{'file': '/tmp/bvtest-1_hfxgis/planted/ow[171 chars]e>'}] != []

First list contains 1 additional elements.
First extra element 0:
{'file': '/tmp/bvtest-1_hfxgis/planted/own.svg', 'kind': 'patch-on-geometry', 'label': 'patch 1', 'element': '<line x1="20.00" y1="130.00" x2="220.00" y2="130.00" stroke="#555" stroke-width="1" data-dim="1"></line>'}

+ []
- [{'element': '<line x1="20.00" y1="130.00" x2="220.00" y2="130.00" '
-              'stroke="#555" stroke-width="1" data-dim="1"></line>',
-   'file': '/tmp/bvtest-1_hfxgis/planted/own.svg',
-   'kind': 'patch-on-geometry',
-   'label': 'patch 1'}]

----------------------------------------------------------------------
Ran 1 test in 25.811s

FAILED (failures=1)
```

### label-on-geometry detection
Scratch `/tmp/fixoff-09dyynjy`, `check_overlap.py`:
```diff
- if(hits(g,lp)) found=true;
+ 
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed` → exit 1
```
njy/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o6vhg0qi/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed) ... /tmp/fixoff-09dyynjy/test_boardviz.py:85: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o6vhg0qi/planted/own.svg' mode='w' encoding='UTF-8'>
  good = os.path.join(PL(), 'own.svg'); open(good, 'w').write(s.render('t'))
/tmp/fixoff-09dyynjy/test_boardviz.py:88: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-o6vhg0qi/planted/planted.svg' mode='w' encoding='UTF-8'>
  bad = os.path.join(PL(), 'planted.svg'); open(bad, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_overlap_caught_own_dim_allowed (test_boardviz.Overlap.test_planted_overlap_caught_own_dim_allowed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-09dyynjy/test_boardviz.py", line 90, in test_planted_overlap_caught_own_dim_allowed
    self.assertEqual([i['kind'] for i in r], ['label-on-geometry'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != ['label-on-geometry']

Second list contains 1 additional elements.
First extra element 0:
'label-on-geometry'

- []
+ ['label-on-geometry']

----------------------------------------------------------------------
Ran 1 test in 25.818s

FAILED (failures=1)
```

### patch-covers-label detection
Scratch `/tmp/fixoff-w9cky8ti`, `check_overlap.py`:
```diff
- out.push({file,kind:'patch-covers-label',label:t.textContent,patch:n});
+ 0;
```
`$ python3 -m unittest -v test_boardviz.Overlap.test_planted_patch_covers_label_caught` → exit 1
```
/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-w9cky8ti/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-v9udx5p9/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-w9cky8ti/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-v9udx5p9/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-w9cky8ti/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-v9udx5p9/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_planted_patch_covers_label_caught (test_boardviz.Overlap.test_planted_patch_covers_label_caught) ... /tmp/fixoff-w9cky8ti/test_boardviz.py:95: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-v9udx5p9/planted/patch.svg' mode='w' encoding='UTF-8'>
  p = os.path.join(PL(), 'patch.svg'); open(p, 'w').write(s.render('t'))
FAIL

======================================================================
FAIL: test_planted_patch_covers_label_caught (test_boardviz.Overlap.test_planted_patch_covers_label_caught)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-w9cky8ti/test_boardviz.py", line 97, in test_planted_patch_covers_label_caught
    self.assertIn('patch-covers-label', kinds)
    ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'patch-covers-label' not found in set()

----------------------------------------------------------------------
Ran 1 test in 25.105s

FAILED (failures=1)
```

### panel() rejects depicted parts
Scratch `/tmp/fixoff-p_b2vud1`, `boardviz.py`:
```diff
- if role in DEPICTED:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills` → exit 1
```
est-_5na67sj/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-p_b2vud1/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-_5na67sj/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-p_b2vud1/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-_5na67sj/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-p_b2vud1/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-_5na67sj/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_panel_rejects_parts_roles_and_fills (test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills) ... FAIL

======================================================================
FAIL: test_panel_rejects_parts_roles_and_fills (test_boardviz.Panels.test_panel_rejects_parts_roles_and_fills)
----------------------------------------------------------------------
ValueError: unknown panel role 'bed'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/tmp/fixoff-p_b2vud1/test_boardviz.py", line 115, in test_panel_rejects_parts_roles_and_fills
    with self.assertRaisesRegex(ValueError, 'depicted part'): s.panel(role, 0, 0, 10, 10, '#D9D9D9')
         ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: "depicted part" does not match "unknown panel role 'bed'"

----------------------------------------------------------------------
Ran 1 test in 24.908s

FAILED (failures=1)
```

### data-panel only on plain <rect> backgrounds
Scratch `/tmp/fixoff-88br1rjk`, `boardviz.py`:
```diff
- if tag != 'rect': probs.append
+ if False: probs.append
```
`$ python3 -m unittest -v test_boardviz.Panels.test_data_panel_planted_on_strip_caught` → exit 1
```
test-2i06q4n6/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-88br1rjk/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-2i06q4n6/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-88br1rjk/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-2i06q4n6/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_data_panel_planted_on_strip_caught (test_boardviz.Panels.test_data_panel_planted_on_strip_caught) ... /tmp/fixoff-88br1rjk/test_boardviz.py:121: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-2i06q4n6/samples/checkerboard/top-view.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_data_panel_planted_on_strip_caught (test_boardviz.Panels.test_data_panel_planted_on_strip_caught)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-88br1rjk/test_boardviz.py", line 126, in test_data_panel_planted_on_strip_caught
    self.assertEqual(bv.panel_inventory(planted), ['data-panel on <polygon>'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: [] != ['data-panel on <polygon>']

Second list contains 1 additional elements.
First extra element 0:
'data-panel on <polygon>'

- []
+ ['data-panel on <polygon>']

----------------------------------------------------------------------
Ran 1 test in 29.194s

FAILED (failures=1)
```

### data-panel emitted only by panel()
Scratch `/tmp/fixoff-0stdx4le`, `boardviz.py`:
```diff
- self.items.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx
+ self.items.append(f'<rect data-panel="saw-table" x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx
```
`$ python3 -m unittest -v test_boardviz.Panels.test_data_panel_only_on_backgrounds` → exit 1
```
: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-9_naojsg/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-0stdx4le/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-9_naojsg/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_data_panel_only_on_backgrounds (test_boardviz.Panels.test_data_panel_only_on_backgrounds) ... /tmp/fixoff-0stdx4le/test_boardviz.py:103: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-9_naojsg/samples/brick-basketweave/crosscut.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_data_panel_only_on_backgrounds (test_boardviz.Panels.test_data_panel_only_on_backgrounds)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-0stdx4le/test_boardviz.py", line 104, in test_data_panel_only_on_backgrounds
    self.assertEqual(bv.panel_inventory(t), [], f)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: ['role saw-table with fill #8A8A8A', 'role[61 chars]B5A'] != []

First list contains 3 additional elements.
First extra element 0:
'role saw-table with fill #8A8A8A'

+ []
- ['role saw-table with fill #8A8A8A',
-  'role saw-table with fill #5B3A29',
-  'role saw-table with fill #B58B5A'] : /tmp/bvtest-9_naojsg/samples/brick-basketweave/crosscut.svg

----------------------------------------------------------------------
Ran 1 test in 25.860s

FAILED (failures=1)
```

### agreement.json exact match
Scratch `/tmp/fixoff-6dlypjc2`, `boardviz.py`:
```diff
- if printed != want:
+ if False:
```
`$ python3 -m unittest -v test_boardviz.Export.test_agreement_catches_edited_label` → exit 1
```
mp/fixoff-6dlypjc2/boardviz.py:566: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-yc1cay6r/planted/agree/steps/checkerboard/glue-up-2.svg' mode='r' encoding='utf8'>
/tmp/fixoff-6dlypjc2/boardviz.py:566: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-yc1cay6r/planted/agree/steps/checkerboard/glue-up.svg' mode='r' encoding='utf8'>
/tmp/fixoff-6dlypjc2/boardviz.py:566: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-yc1cay6r/planted/agree/steps/checkerboard/mill-rough-stock.svg' mode='r' encoding='utf8'>
/tmp/fixoff-6dlypjc2/boardviz.py:566: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-yc1cay6r/planted/agree/steps/checkerboard/rip-strips.svg' mode='r' encoding='utf8'>
/tmp/fixoff-6dlypjc2/boardviz.py:566: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-yc1cay6r/planted/agree/steps/checkerboard/rotate-slices.svg' mode='r' encoding='utf8'>
FAIL

======================================================================
FAIL: test_agreement_catches_edited_label (test_boardviz.Export.test_agreement_catches_edited_label)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-6dlypjc2/test_boardviz.py", line 160, in test_agreement_catches_edited_label
    self.assertFalse(bv.check_agreement(d, ex, raw)['ok'])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: True is not false

----------------------------------------------------------------------
Ran 1 test in 25.923s

FAILED (failures=1)
```

### no banner cap
Scratch `/tmp/fixoff-ybk2i803`, `boardviz.py`:
```diff
- for i, b in enumerate(banners):
+ for i, b in enumerate(banners[:1]):
```
`$ python3 -m unittest -v test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed` → exit 1
```
porter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-ybk2i803/test_boardviz.py:171: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-1bcpns6f/steps/face-grain/mill-rough-stock.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_no_truncation_no_ellipsis_all_banners_printed (test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-ybk2i803/test_boardviz.py", line 174, in test_no_truncation_no_ellipsis_all_banners_printed
    for b in s['safetyBanners']: self.assertIn(b, printed, (st, s['stepId']))
                                 ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'WARNING: Keep hands clear of the infeed and outfeed. Feed only boards at least 12" (305 mm) long.' not found in ['Face Grain: step 1: Mill rough stock', 'Joint one face and one edge on the jointer, then plane to final thickness plus 1/8" (3 mm). Rest overnight, then plane to final thickness. Take ~1/64" (0.4 mm) passes for the last two passes.', 'Final pass depth: ~1/64" (0.4 mm)', 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or thinner than 1/2" (12.5 mm).'] : ('face-grain', 'mill-rough-stock')

----------------------------------------------------------------------
Ran 1 test in 23.846s

FAILED (failures=1)
```

### long text wraps, never cut
Scratch `/tmp/fixoff-reiillhf`, `boardviz.py`:
```diff
- lines = wrap(s, size, max_w, bold) if max_w else [s]
+ lines = wrap(s, size, max_w, bold)[:1] if max_w else [s]
```
`$ python3 -m unittest -v test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed` → exit 1
```
ff-reiillhf/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-reiillhf/test_boardviz.py:171: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-fe6p0sqz/steps/face-grain/mill-rough-stock.svg' mode='r' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_no_truncation_no_ellipsis_all_banners_printed (test_boardviz.Text.test_no_truncation_no_ellipsis_all_banners_printed)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-reiillhf/test_boardviz.py", line 174, in test_no_truncation_no_ellipsis_all_banners_printed
    for b in s['safetyBanners']: self.assertIn(b, printed, (st, s['stepId']))
                                 ~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or thinner than 1/2" (12.5 mm).' not found in ['Face Grain: step 1: Mill rough stock', 'Joint one face and one edge on the jointer, then plane to final thickness plus 1/8" (3 mm). Rest', 'Final pass depth: ~1/64" (0.4 mm)', 'WARNING: Use push blocks on the jointer. Never joint stock shorter than 12" (305 mm) or', 'WARNING: Keep hands clear of the infeed and outfeed. Feed only boards at least 12" (305'] : ('face-grain', 'mill-rough-stock')

----------------------------------------------------------------------
Ran 1 test in 24.684s

FAILED (failures=1)
```

### relative/undefined --out refused
Scratch `/tmp/fixoff-txlezxh4`, `boardviz.py`:
```diff
- or not os.path.isabs(out):
+ :
```
`$ python3 -m unittest -v test_boardviz.Export.test_relative_or_undefined_out_refused` → exit 1
```
e='/tmp/bvtest-5ils8k4l/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-txlezxh4/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5ils8k4l/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-txlezxh4/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5ils8k4l/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-txlezxh4/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5ils8k4l/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-txlezxh4/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-5ils8k4l/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_relative_or_undefined_out_refused (test_boardviz.Export.test_relative_or_undefined_out_refused) ... FAIL

======================================================================
FAIL: test_relative_or_undefined_out_refused (test_boardviz.Export.test_relative_or_undefined_out_refused)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-txlezxh4/test_boardviz.py", line 141, in test_relative_or_undefined_out_refused
    with self.assertRaises(SystemExit), redirect_stderr(io.StringIO()): bv.main(args)
         ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
AssertionError: SystemExit not raised

----------------------------------------------------------------------
Ran 1 test in 26.988s

FAILED (failures=1)
```

### refused design fatal, no fallback
Scratch `/tmp/fixoff-vwugkwo6`, `boardviz.py`:
```diff
- raise ExportError(f'export failed (exit {p.returncode}): {p.stderr.strip()}')
+ return run_export('checkerboard', [])
```
`$ python3 -m unittest -v test_boardviz.Export.test_refused_design_fatal_no_files` → exit 1
```
ing='UTF-8'>
/tmp/fixoff-vwugkwo6/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ksdfxyll/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vwugkwo6/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ksdfxyll/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vwugkwo6/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ksdfxyll/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vwugkwo6/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ksdfxyll/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-vwugkwo6/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-ksdfxyll/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_refused_design_fatal_no_files (test_boardviz.Export.test_refused_design_fatal_no_files) ... FAIL

======================================================================
FAIL: test_refused_design_fatal_no_files (test_boardviz.Export.test_refused_design_fatal_no_files)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-vwugkwo6/test_boardviz.py", line 149, in test_refused_design_fatal_no_files
    self.assertEqual(rc, 2)
    ~~~~~~~~~~~~~~~~^^^^^^^
AssertionError: 0 != 2

----------------------------------------------------------------------
Ran 1 test in 26.793s

FAILED (failures=1)
```

### <styleId>/<stepId>.svg naming
Scratch `/tmp/fixoff-_r3atqpu`, `boardviz.py`:
```diff
- return step.get('stepId') or
+ return f"step-{step['stepNumber']}" or
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_files_match_catalog_exactly` → exit 1
```
' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-_r3atqpu/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-_r3atqpu/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-_r3atqpu/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-_r3atqpu/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_files_match_catalog_exactly (test_boardviz.Steps.test_step_files_match_catalog_exactly)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-_r3atqpu/test_boardviz.py", line 186, in test_step_files_match_catalog_exactly
    self.assertEqual(bv.verify_step_outputs(STEPS_ROOT, bv.load_catalogs()), [])
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: Lists differ: ['face-grain: missing edge-profile.svg', '[6563 chars]svg'] != []

First list contains 162 additional elements.
First extra element 0:
'face-grain: missing edge-profile.svg'

Diff is 7101 characters long. Set self.maxDiff to None to see it.

----------------------------------------------------------------------
Ran 1 test in 24.569s

FAILED (failures=1)
```

### no SVG for null-figure steps
Scratch `/tmp/fixoff-p5_nrfo7`, `boardviz.py`:
```diff
- if s['figureType'] is None: continue
+ if s['figureType'] is None:
            out[f"{ex['design']['style']}/{step_id(s)}"] = fig_text_step(ex, s); continue
```
`$ python3 -m unittest -v test_boardviz.Steps.test_no_svg_for_null_figure_steps` → exit 1
```
ad(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-p5_nrfo7/boardviz.py:614: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-p5_nrfo7/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-p5_nrfo7/boardviz.py:614: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-p5_nrfo7/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-p5_nrfo7/boardviz.py:614: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-p5_nrfo7/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_no_svg_for_null_figure_steps (test_boardviz.Steps.test_no_svg_for_null_figure_steps)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-p5_nrfo7/test_boardviz.py", line 192, in test_no_svg_for_null_figure_steps
    self.assertFalse(os.path.exists(os.path.join(STEPS_ROOT, st, s['stepId'] + '.svg')))
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: True is not false

----------------------------------------------------------------------
Ran 1 test in 23.807s

FAILED (failures=1)
```

### duplicate stepId detected
Scratch `/tmp/fixoff-n8zhhijr`, `boardviz.py`:
```diff
- if dup: problems.append
+ if False: problems.append
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails` → exit 1
```
for st in STYLES}
/tmp/fixoff-n8zhhijr/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-n8zhhijr/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-n8zhhijr/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-n8zhhijr/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-n8zhhijr/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-n8zhhijr/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_ids_unique_and_rename_or_duplicate_fails (test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-n8zhhijr/test_boardviz.py", line 203, in test_step_ids_unique_and_rename_or_duplicate_fails
    self.assertTrue(any('duplicate' in p for p in bv.verify_step_outputs(STEPS_ROOT, dup)))
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: False is not true

----------------------------------------------------------------------
Ran 1 test in 24.755s

FAILED (failures=1)
```

### renamed stepId detected (missing file)
Scratch `/tmp/fixoff-52cr8cwo`, `boardviz.py`:
```diff
- for f in sorted(want - have): problems.append(f'{st}: missing {f}')
+ pass
```
`$ python3 -m unittest -v test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails` → exit 1
```
ardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-52cr8cwo/exporter/catalog/stripe-inlay.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-52cr8cwo/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-52cr8cwo/exporter/catalog/scrap-chaotic.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
/tmp/fixoff-52cr8cwo/boardviz.py:613: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/fixoff-52cr8cwo/exporter/catalog/tumbling-block-3d.json' mode='r' encoding='utf8'>
  return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}
FAIL

======================================================================
FAIL: test_step_ids_unique_and_rename_or_duplicate_fails (test_boardviz.Steps.test_step_ids_unique_and_rename_or_duplicate_fails)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-52cr8cwo/test_boardviz.py", line 201, in test_step_ids_unique_and_rename_or_duplicate_fails
    self.assertTrue(any('missing ' + s0['stepId'] + '.svg' in p for p in probs), probs)
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: False is not true : ['end-grain: unexpected mill-rough-stock.svg']

----------------------------------------------------------------------
Ran 1 test in 25.193s

FAILED (failures=1)
```

### strips never capped
Scratch `/tmp/fixoff-6snhw79x`, `boardviz.py`:
```diff
- return sorted(strips, key=lambda s: s['x'])
+ return sorted(strips, key=lambda s: s['x'])[:8]
```
`$ python3 -m unittest -v test_boardviz.Strips.test_high_strip_count_never_capped` → exit 1
```
losed file <_io.TextIOWrapper name='/tmp/bvtest-josnq7_i/steps/tumbling-block-3d/glue-up.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6snhw79x/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-josnq7_i/steps/tumbling-block-3d/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6snhw79x/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-josnq7_i/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6snhw79x/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-josnq7_i/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-6snhw79x/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-josnq7_i/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_high_strip_count_never_capped (test_boardviz.Strips.test_high_strip_count_never_capped) ... FAIL

======================================================================
FAIL: test_high_strip_count_never_capped (test_boardviz.Strips.test_high_strip_count_never_capped)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-6snhw79x/test_boardviz.py", line 211, in test_high_strip_count_never_capped
    row = bv.section_strips(ex); self.assertEqual(len(row), n)
                                 ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^
AssertionError: 8 != 40

----------------------------------------------------------------------
Ran 1 test in 27.886s

FAILED (failures=1)
```

### fit helper handles rotation
Scratch `/tmp/fixoff-cynalj34`, `test_fit_helper.py`:
```diff
-         if r:

+         if False:

```
`$ python3 -m unittest -v test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation` → exit 1
```
/crosscut-slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-cynalj34/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-fuk61onm/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-cynalj34/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-fuk61onm/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-cynalj34/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-fuk61onm/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation) ... /tmp/fixoff-cynalj34/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-fuk61onm/planted/fit.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-cynalj34/test_boardviz.py", line 59, in test_fit_helper_any_attribute_order_and_rotation
    self.assertEqual(out.stdout, '2\n1\n'); self.assertEqual(out.returncode, 1)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
AssertionError: '1\n1\n' != '2\n1\n'
+ 2
  1
- 1


----------------------------------------------------------------------
Ran 1 test in 25.194s

FAILED (failures=1)
```

### fit helper fails on any line
Scratch `/tmp/fixoff-4qr2zv_m`, `test_fit_helper.py`:
```diff
- return 1 if report[0] or report[1] else 0
+ return 0
```
`$ python3 -m unittest -v test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation` → exit 1
```
slices.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-4qr2zv_m/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-p8ho0np_/steps/tumbling-block-3d/glue-up-2.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-4qr2zv_m/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-p8ho0np_/steps/tumbling-block-3d/flatten-and-sand.svg' mode='w' encoding='UTF-8'>
/tmp/fixoff-4qr2zv_m/boardviz.py:709: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-p8ho0np_/steps/tumbling-block-3d/edge-profile.svg' mode='w' encoding='UTF-8'>
test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation) ... /tmp/fixoff-4qr2zv_m/test_boardviz.py:31: ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/bvtest-p8ho0np_/planted/fit.svg' mode='w' encoding='UTF-8'>
FAIL

======================================================================
FAIL: test_fit_helper_any_attribute_order_and_rotation (test_boardviz.TextSize.test_fit_helper_any_attribute_order_and_rotation)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/fixoff-4qr2zv_m/test_boardviz.py", line 59, in test_fit_helper_any_attribute_order_and_rotation
    self.assertEqual(out.stdout, '2\n1\n'); self.assertEqual(out.returncode, 1)
                                            ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
AssertionError: 0 != 1

----------------------------------------------------------------------
Ran 1 test in 25.483s

FAILED (failures=1)
```
