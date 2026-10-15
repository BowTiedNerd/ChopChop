#!/usr/bin/env python3
"""Fix-off runner: for each rule, copy the source into a scratch dir, break the fix, run the guarding test(s),
record the real command, exit code and failure counts, then discard the scratch copy (originals never touched).
Writes FIX-OFF.md."""
import os, re, shutil, subprocess, sys, tempfile, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = ['boardviz.py', 'chromecheck.py', 'measure_labels.py', 'check_overlap.py', 'test_fit_helper.py', 'test_boardviz.py']
T = 'python3 -m unittest -v test_boardviz.'
CASES = [
 ('Svg.text refuses < 11 px', 'boardviz.py', "if size < MIN_FONT_PX:", "if False:", T + 'TextSize.test_svg_text_refuses_under_minimum'),
 ('drawn size uses sqrt(|det CTM|)', 'measure_labels.py', "const drawn=fs*Math.sqrt(det);", "const drawn=fs;", T + 'TextSize.test_drawn_size_scaling_flags_11px_at_0_8x'),
 ('SVG width == viewBox width (1:1)', 'boardviz.py', 'width="{W}" height="{H}" viewBox', 'width="{int(W*0.8)}" height="{H}" viewBox', T + 'Index.test_svgs_are_one_to_one'),
 ('index never shrinks figures', 'boardviz.py', "<img style='max-width:none'", "<img style='max-width:48%'", T + 'Index.test_index_never_shrinks'),
 ('RIP FENCE beside fence, not on it', 'boardviz.py', "svg.text(fx - 30, ty + 30, 'RIP FENCE'", "svg.text(fx - 2, ty + 30, 'RIP FENCE'", T + 'Overlap.test_no_label_covers_drawing'),
 ("'head' right of cutterhead", 'boardviz.py', "svg.text(x + 262, bed_y - t - 18, 'head')", "svg.text(x + 220, bed_y - t - 18, 'head')", T + 'Overlap.test_no_label_covers_drawing ' + 'test_boardviz.Labels.test_placement_rules'),
 ('label may overlap only its own data-dim', 'check_overlap.py', "if(skipDim!==null && g.getAttribute('data-dim')===skipDim) continue;", "", T + 'Overlap.test_planted_overlap_caught_own_dim_allowed'),
 ('label-on-geometry detection', 'check_overlap.py', "if(hits(g,lp)) found=true;", "", T + 'Overlap.test_planted_overlap_caught_own_dim_allowed'),
 ('patch-covers-label detection', 'check_overlap.py', "out.push({file,kind:'patch-covers-label',label:t.textContent,patch:n});", "0;", T + 'Overlap.test_planted_patch_covers_label_caught'),
 ('panel() rejects depicted parts', 'boardviz.py', "if role in DEPICTED:", "if False:", T + 'Panels.test_panel_rejects_parts_roles_and_fills'),
 ('data-panel only on plain <rect> backgrounds', 'boardviz.py', "if tag != 'rect': probs.append", "if False: probs.append", T + 'Panels.test_data_panel_planted_on_strip_caught'),
 ('data-panel emitted only by panel()', 'boardviz.py', "self.items.append(f'<rect x=\"{x:.2f}\" y=\"{y:.2f}\" width=\"{w:.2f}\" height=\"{h:.2f}\" rx", "self.items.append(f'<rect data-panel=\"saw-table\" x=\"{x:.2f}\" y=\"{y:.2f}\" width=\"{w:.2f}\" height=\"{h:.2f}\" rx", T + 'Panels.test_data_panel_only_on_backgrounds'),
 ('agreement.json exact match', 'boardviz.py', "if printed != want:", "if False:", T + 'Export.test_agreement_catches_edited_label'),
 ('no banner cap', 'boardviz.py', "for i, b in enumerate(banners):", "for i, b in enumerate(banners[:1]):", T + 'Text.test_no_truncation_no_ellipsis_all_banners_printed'),
 ('long text wraps, never cut', 'boardviz.py', "lines = wrap(s, size, max_w, bold) if max_w else [s]", "lines = wrap(s, size, max_w, bold)[:1] if max_w else [s]", T + 'Text.test_no_truncation_no_ellipsis_all_banners_printed'),
 ('relative/undefined --out refused', 'boardviz.py', "or not os.path.isabs(out):", ":", T + 'Export.test_relative_or_undefined_out_refused'),
 ('refused design fatal, no fallback', 'boardviz.py', "raise ExportError(f'export failed (exit {p.returncode}): {p.stderr.strip()}')", "return run_export('checkerboard', [])", T + 'Export.test_refused_design_fatal_no_files'),
 ('<styleId>/<stepId>.svg naming', 'boardviz.py', "return step.get('stepId') or", "return f\"step-{step['stepNumber']}\" or", T + 'Steps.test_step_files_match_catalog_exactly'),
 ('no SVG for null-figure steps', 'boardviz.py', "if s['figureType'] is None: continue", "if s['figureType'] is None:\n            out[f\"{ex['design']['style']}/{step_id(s)}\"] = fig_text_step(ex, s); continue", T + 'Steps.test_no_svg_for_null_figure_steps'),
 ('duplicate stepId detected', 'boardviz.py', "if dup: problems.append", "if False: problems.append", T + 'Steps.test_step_ids_unique_and_rename_or_duplicate_fails'),
 ('renamed stepId detected (missing file)', 'boardviz.py', "for f in sorted(want - have): problems.append(f'{st}: missing {f}')", "pass", T + 'Steps.test_step_ids_unique_and_rename_or_duplicate_fails'),
 ('strips never capped', 'boardviz.py', "return sorted(strips, key=lambda s: s['x'])", "return sorted(strips, key=lambda s: s['x'])[:8]", T + 'Strips.test_high_strip_count_never_capped'),
 ('fit helper handles rotation', 'test_fit_helper.py', "        if r:\n", "        if False:\n", T + 'TextSize.test_fit_helper_any_attribute_order_and_rotation'),
 ('fit helper fails on any line', 'test_fit_helper.py', "return 1 if report[0] or report[1] else 0", "return 0", T + 'TextSize.test_fit_helper_any_attribute_order_and_rotation'),
 ('NEW mill figures: no jointer/planer piece < 305 mm (blankRule)', 'boardviz.py', 'data-length-mm="{b["length_mm"]:.3f}"', 'data-length-mm="{b["slice_mm"]:.3f}"', T + 'Milling.test_no_jointer_or_planer_piece_under_minimum'),
 ('NEW planer: panel wider than planerMaxWidth_mm goes to router sled', 'boardviz.py', "if m == 'planer' and width_mm > A['planerMaxWidth_mm']:", "if False:", T + 'Milling.test_planer_never_gets_panel_wider_than_max'),
 ('NEW jointer: no face-joint wider than jointerMaxWidth_mm', 'boardviz.py', "if m == 'jointer' and width_mm > A['jointerMaxWidth_mm']:", "if False:", T + 'Milling.test_jointer_never_face_joints_wider_than_max'),
 ('NEW strict mode flags exportVsCatalog', 'boardviz.py', "res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]", "pass", T + 'Strict.test_strict_mode_flags_every_mismatch'),
 ('NEW strict test runs by default (opt-out only)', 'test_boardviz.py', "        if os.environ.get('BOARDVIZ_ALLOW_MISMATCH') == '1':", "        if True:", T + 'Strict.test_strict_is_on_by_default'),
 ('NEW hand hole sized from catalog features', 'boardviz.py', "sl, sw_ = k['length_mm'] * sc, k['width_mm'] * sc", "sl, sw_ = 80.0, 20.0", T + 'Features.test_handle_overlays_use_catalog_features'),
 ('NEW finger grip sized from catalog features', 'boardviz.py', "gl, gd = g['length_mm'] * sc, g['depth_mm'] * sc", "gl, gd = 120.0, 12.0", T + 'Features.test_handle_overlays_use_catalog_features'),
 ('NEW rip fence: push stick drawn and labelled', 'boardviz.py', "svg.text(bx + 16, ty + 250, 'push stick')", "pass", T + 'Features.test_rip_fence_has_knife_push_stick_feed'),
 ('NEW rip fence: riving knife drawn and labelled', 'boardviz.py', "svg.text(bx + 16, ty + 58, 'riving knife')", "pass", T + 'Features.test_rip_fence_has_knife_push_stick_feed'),
 ('NEW rip fence: Feed label off the arrow', 'boardviz.py', "svg.text(bx + 162, ty + 190, 'Feed')", "svg.text(bx + 140, ty + 190, 'Feed')", T + 'Overlap.test_no_label_covers_drawing'),
 ('NEW rip fence: push-stick label off the push stick', 'boardviz.py', "svg.text(bx + 16, ty + 250, 'push stick')", "svg.text(fx + 4, ty + 230, 'push stick')", T + 'Overlap.test_no_label_covers_drawing'),
 ('NEW metric is the 12th sample folder', 'boardviz.py', "    'metric': ('metric', ['rubberFeet.enabled=true']),\n", "", T + 'Export.test_every_agreement_ok'),
 ('NEW hand hole end radius == width/2 flagged', 'boardviz.py', "if abs(k['endRadius_mm'] - k['width_mm'] / 2) > 1e-6:", "if False:", T + 'HandHole.test_end_radius_is_half_width_and_mismatch_flagged'),
 ('NEW hand hole drawn with catalog endRadius_mm', 'boardviz.py', "rx=k['endRadius_mm'] * sc)", "rx=12.5)", T + 'Features.test_handle_overlays_use_catalog_features'),
 ('NEW hand-hole inset label clears the slot-width extension line', 'boardviz.py', "              label_dy=-max(", "              label_dy=0*-max(", T + 'Overlap.test_no_label_covers_drawing'),
]

def copy_scratch():
    d = tempfile.mkdtemp(prefix='fixoff-')
    for f in SRC: shutil.copy(os.path.join(HERE, f), d)
    os.symlink(os.path.join(HERE, 'exporter'), os.path.join(d, 'exporter'))
    return d

def summarize(out):
    m = re.search(r'Ran (\d+) tests?.*?\n\n(OK|FAILED \([^)]*\))', out, re.S)
    return f"Ran {m.group(1)}: {m.group(2)}" if m else out.strip().splitlines()[-1][:120]

def main():
    before = {f: hashlib.sha256(open(os.path.join(HERE, f), 'rb').read()).hexdigest() for f in SRC}
    rows, details = [], []
    for name, f, old, new, cmd in CASES:
        d = copy_scratch()
        p = os.path.join(d, f); s = open(p).read()
        if s.count(old) < 1: raise SystemExit(f'fix-off anchor not found for {name!r}: {old!r}')
        open(p, 'w').write(s.replace(old, new, 1))
        r = subprocess.run(cmd, shell=True, cwd=d, capture_output=True, text=True, timeout=900)
        out = r.stdout + r.stderr
        fails = re.findall(r'^(FAIL|ERROR): (\S+)', out, re.M)
        rows.append((name, f, r.returncode, summarize(out), ', '.join(sorted({x[1] for x in fails}))))
        tail = '\n'.join(l for l in out.splitlines() if not l.startswith(('ResourceWarning', '  s = open', '  t = open', '  open(p'))) [-1600:]
        details.append(f"### {name}\nScratch `{d}`, `{f}`:\n```diff\n- {old}\n+ {new}\n```\n`$ {cmd}` → exit {r.returncode}\n```\n{tail[-1600:]}\n```\n")
        shutil.rmtree(d)
        print(name, r.returncode, rows[-1][3], flush=True)
    base = subprocess.run('BOARDVIZ_ALLOW_MISMATCH=1 python3 -m unittest test_boardviz', shell=True, cwd=HERE, capture_output=True, text=True, timeout=900)
    strict = subprocess.run('python3 -m unittest test_boardviz.Strict.test_ci_strict_no_export_vs_catalog_mismatches', shell=True, cwd=HERE, capture_output=True, text=True, timeout=900)
    after = {f: hashlib.sha256(open(os.path.join(HERE, f), 'rb').read()).hexdigest() for f in SRC}
    md = ['# FIX-OFF evidence (real runs by fixoff.py)\n',
          'Each rule: copy sources to a scratch dir, break the fix there, run its guarding test, discard the copy. Originals untouched.\n',
          '| # | Rule | File broken | Exit | Result | Failing test(s) |', '|---|---|---|---|---|---|']
    for i, (n, f, rc, s, ft) in enumerate(rows, 1):
        md.append(f'| {i} | {n} | {f} | {rc} | {s} | {ft} |')
    md.append(f"\n**Restored baseline** `BOARDVIZ_ALLOW_MISMATCH=1 python3 -m unittest test_boardviz` → exit {base.returncode}, {summarize(base.stdout + base.stderr)}. Source sha256 unchanged before/after: {before == after}.\n")
    md.append(f"**Default strict test** (no opt-out) `python3 -m unittest test_boardviz.Strict.test_ci_strict_no_export_vs_catalog_mismatches` → exit {strict.returncode}, {summarize(strict.stdout + strict.stderr)}: expected to fail until the app implements the catalog blank rule.\n")
    md += details
    open(os.path.join(HERE, 'FIX-OFF.md'), 'w').write('\n'.join(md))
    bad = [r for r in rows if r[2] == 0]
    print('cases', len(rows), 'that did NOT fail:', [r[0] for r in bad])
    return 1 if bad or base.returncode or strict.returncode == 0 else 0

if __name__ == '__main__':
    sys.exit(main())
