"""boardviz tests (unittest). Run: python3 -m unittest -v test_boardviz"""
import copy, glob, io, json, os, re, shutil, subprocess, sys, tempfile, unittest
from contextlib import redirect_stdout, redirect_stderr
import boardviz as bv
import measure_labels, check_overlap, test_fit_helper

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = None
SAMPLES_DIR = None
STEPS_ROOT = None

def setUpModule():
    global TMP, SAMPLES_DIR, STEPS_ROOT
    TMP = tempfile.mkdtemp(prefix='bvtest-')
    SAMPLES_DIR = os.path.join(TMP, 'samples'); STEPS_ROOT = os.path.join(TMP, 'steps')
    global GEN_RC
    with redirect_stdout(io.StringIO()):
        GEN_RC = (bv.main(['all', '--out', SAMPLES_DIR]), bv.main(['steps', '--out', STEPS_ROOT]))

def tearDownModule():
    shutil.rmtree(TMP, ignore_errors=True)

def PL():
    d = os.path.join(TMP, 'planted'); os.makedirs(d, exist_ok=True); return d

def svgs(root):
    return sorted(glob.glob(os.path.join(root, '**', '*.svg'), recursive=True))

def write(tmp, name, body, w=300, h=150):
    p = os.path.join(tmp, name)
    open(p, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
                       f'<rect data-bg="1" x="0" y="0" width="{w}" height="{h}" fill="#FFFFFF"/>{body}</svg>')
    return p

class TextSize(unittest.TestCase):
    def test_drawn_size_scaling_flags_11px_at_0_8x(self):
        p = write(PL(), 'scaled.svg', '<g transform="scale(0.8)"><text x="20" y="40" font-size="11">eleven</text></g>')
        r = measure_labels.measure([p])
        self.assertEqual([(i['kind'], i['drawn']) for i in r], [('size', 8.8)])

    def test_svg_text_refuses_under_minimum(self):
        s = bv.Svg()
        with self.assertRaises(ValueError): s.text(0, 20, 'tiny', size=10)
        with self.assertRaises(ValueError): s.text(0, 20, 'tiny', size=10.99)
        s.text(0, 20, 'ok', size=11)

    def test_measure_labels_zero_on_all_figures(self):
        self.assertEqual(measure_labels.measure((svgs(SAMPLES_DIR) + svgs(STEPS_ROOT))), [])

    def test_fit_helper_prints_exactly_0_and_0(self):
        out = subprocess.run([sys.executable, os.path.join(HERE, 'test_fit_helper.py'), SAMPLES_DIR, STEPS_ROOT], capture_output=True, text=True)
        self.assertEqual(out.stdout, '0\n0\n'); self.assertEqual(out.returncode, 0)

    def test_fit_helper_any_attribute_order_and_rotation(self):
        p = write(PL(), 'fit.svg', '<text font-size="11" y="20" x="250">far right off frame text</text>'
                                  '<text transform="rotate(90 10 20)" x="10" y="20" font-size="11">rotated long label goes down</text>'
                                  '<text font-size="9" x="5" y="140">small</text>', h=150)
        out = subprocess.run([sys.executable, os.path.join(HERE, 'test_fit_helper.py'), p], capture_output=True, text=True)
        self.assertEqual(out.stdout, '2\n1\n'); self.assertEqual(out.returncode, 1)

class Gen(unittest.TestCase):
    def test_generation_exit_zero(self):
        self.assertEqual(GEN_RC, (0, 0))

class Index(unittest.TestCase):
    def test_index_never_shrinks(self):
        h = open(os.path.join(SAMPLES_DIR, 'index.html')).read()
        imgs = re.findall(r"<div style='overflow-x:auto;margin:4px'><img style='max-width:none' src='[^']+' alt='[^']+'></div>", h)
        self.assertEqual(len(imgs), h.count('<img'))
        self.assertEqual(len(imgs), sum(len(glob.glob(os.path.join(SAMPLES_DIR, n, '*.svg'))) for n in bv.SAMPLES))
        self.assertNotRegex(h, r'max-width:\s*\d|width=|%')

    def test_svgs_are_one_to_one(self):
        for f in svgs(SAMPLES_DIR):
            m = re.search(r'width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"', open(f).read())
            self.assertEqual(m.group(1), m.group(3), f); self.assertEqual(m.group(2), m.group(4), f)

class Overlap(unittest.TestCase):
    def test_no_label_covers_drawing(self):
        self.assertEqual(check_overlap.overlaps(svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)), [])

    def test_planted_overlap_caught_own_dim_allowed(self):
        s = bv.Svg(); s.rect(20, 40, 200, 60, fill='#5B3A29')
        s.dim_h(20, 220, 130, 'own dim label')
        good = os.path.join(PL(), 'own.svg'); open(good, 'w').write(s.render('t'))
        self.assertEqual(check_overlap.overlaps([good]), [])
        s.text(40, 70, 'planted on board')
        bad = os.path.join(PL(), 'planted.svg'); open(bad, 'w').write(s.render('t'))
        r = check_overlap.overlaps([bad])
        self.assertEqual([i['kind'] for i in r], ['label-on-geometry'])

    def test_planted_patch_covers_label_caught(self):
        s = bv.Svg(); s.dim_h(20, 220, 130, 'dim label')
        s.text(110, 127, 'other label', anchor='middle')
        p = os.path.join(PL(), 'patch.svg'); open(p, 'w').write(s.render('t'))
        kinds = {i['kind'] for i in check_overlap.overlaps([p])}
        self.assertIn('patch-covers-label', kinds)

class Panels(unittest.TestCase):
    def test_data_panel_only_on_backgrounds(self):
        n = 0
        for f in (svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)):
            t = open(f).read(); n += t.count('data-panel=')
            self.assertEqual(bv.panel_inventory(t), [], f)
        self.assertGreater(n, 0)
        src = open(os.path.join(HERE, 'boardviz.py')).read()
        emitters = [l for l in src.splitlines() if "data-panel=" in l and 'items.append' in l]
        self.assertEqual(len(emitters), 1)  # only Svg.panel()
        body = src.split('def panel(self')[1].split('\n    def ')[0]
        self.assertIn(emitters[0].strip(), body)

    def test_panel_rejects_parts_roles_and_fills(self):
        s = bv.Svg()
        for role in sorted(bv.DEPICTED):
            with self.assertRaisesRegex(ValueError, 'depicted part'): s.panel(role, 0, 0, 10, 10, '#D9D9D9')
        with self.assertRaises(ValueError): s.panel('banner', 0, 0, 10, 10, '#D9D9D9')
        with self.assertRaises(ValueError): s.panel('saw-table', 0, 0, 10, 10, '#FF0000')
        s.panel('saw-table', 0, 0, 10, 10, '#D9D9D9')

    def test_data_panel_planted_on_strip_caught(self):
        t = open(os.path.join(SAMPLES_DIR, 'checkerboard', 'top-view.svg')).read()
        self.assertIn('<polygon points', t); self.assertIn('fill="#F3E7D3"', t)
        # plant on a maple strip: role+fill are otherwise legal, so only the <rect>-only rule can catch it
        planted = re.sub(r'<polygon (points="[^"]*" fill="#F3E7D3")', r'<polygon data-panel="cutlist-row" \1', t, count=1)
        self.assertEqual(bv.panel_inventory(t), [])
        self.assertEqual(bv.panel_inventory(planted), ['data-panel on <polygon>'])
        planted2 = re.sub(r'<rect x', '<rect data-panel="saw-table" x', t, count=1)
        self.assertTrue(bv.panel_inventory(planted2))

class Export(unittest.TestCase):
    def test_every_agreement_ok(self):
        n = 0
        for name in bv.SAMPLES:
            a = json.load(open(os.path.join(SAMPLES_DIR, name, 'agreement.json')))
            self.assertTrue(a['ok'], (name, a['issues'][:3])); self.assertTrue(a['freshExportIdentical']); n += 1
        self.assertEqual(n, 11)

    def test_relative_or_undefined_out_refused(self):
        for out in (None, 'samples', './x', 'undefined', ''):
            args = ['checkerboard'] + ([] if out is None else ['--out', out])
            with self.assertRaises(SystemExit), redirect_stderr(io.StringIO()): bv.main(args)
        self.assertFalse(os.path.exists(os.path.join(os.getcwd(), 'undefined')))

    def test_refused_design_fatal_no_files(self):
        out = os.path.join(PL(), 'refused')
        for sets in (['angle=19'], ['dimensions.width=0']):
            with redirect_stderr(io.StringIO()), redirect_stdout(io.StringIO()):
                rc = bv.main(['chevron', '--out', out] + sum([['--set', x] for x in sets], []))
            self.assertEqual(rc, 2)
            self.assertFalse(os.path.exists(out))
        with self.assertRaises(bv.ExportError): bv.run_export('no-such-style', [])

    def test_agreement_catches_edited_label(self):
        d = os.path.join(PL(), 'agree'); shutil.copytree(os.path.join(SAMPLES_DIR, 'checkerboard'), d)
        ex = json.load(open(os.path.join(d, 'export.json'))); raw = open(os.path.join(d, 'export.json')).read()
        f = os.path.join(d, 'cut-list.svg'); t = open(f).read()
        edited = re.sub(r'(data-src="cutList\.0\.text\.width"><tspan[^>]*>[^<]*?)&quot;\)', r'\1&quot;', t, count=1)
        self.assertNotEqual(edited, t)   # one closing bracket removed from a printed width
        open(f, 'w').write(edited)
        self.assertFalse(bv.check_agreement(d, ex, raw)['ok'])

class Text(unittest.TestCase):
    def test_no_truncation_no_ellipsis_all_banners_printed(self):
        for f in (svgs(SAMPLES_DIR) + svgs(STEPS_ROOT)):
            t = open(f).read()
            self.assertNotIn('…', t, f); self.assertNotRegex(t, r'\.\.\.|more settings|\d+ more', f)
        cats = bv.load_catalogs()
        for st, cat in cats.items():
            for s in cat['steps']:
                if s['figureType'] is None: continue
                t = open(os.path.join(STEPS_ROOT, st, s['stepId'] + '.svg')).read()
                printed = [' '.join(re.findall(r'<tspan[^>]*>(.*?)</tspan>', m)) for m in re.findall(r'<text[^>]*>(.*?)</text>', t)]
                printed = [bv.html.unescape(p) for p in printed]
                for b in s['safetyBanners']: self.assertIn(b, printed, (st, s['stepId']))
                self.assertIn(s['description'], printed)
                for k, v in s['settings'].items(): self.assertIn(f'{k}: {v}', printed)

    def test_approx_only_when_inexact(self):
        for f in svgs(SAMPLES_DIR):
            for dec, frac in re.findall(r'(\d+\.\d{3})&quot; \(≈([^)]*)\)', open(f).read()):
                v = float(dec)
                self.assertNotAlmostEqual(v * 64, round(v * 64), places=6, msg=(f, dec, frac))

class Steps(unittest.TestCase):
    def test_step_files_match_catalog_exactly(self):
        self.assertEqual(bv.verify_step_outputs(STEPS_ROOT, bv.load_catalogs()), [])

    def test_no_svg_for_null_figure_steps(self):
        for st, cat in bv.load_catalogs().items():
            for s in cat['steps']:
                if s['figureType'] is None:
                    self.assertFalse(os.path.exists(os.path.join(STEPS_ROOT, st, s['stepId'] + '.svg')))

    def test_step_ids_unique_and_rename_or_duplicate_fails(self):
        cats = bv.load_catalogs()
        for st, cat in cats.items():
            ids = [s['stepId'] for s in cat['steps']]; self.assertEqual(len(ids), len(set(ids)), st)
        ren = copy.deepcopy(cats); s0 = next(s for s in ren['end-grain']['steps'] if s['figureType'])
        s0['stepId'] = s0['stepId'] + '-renamed'
        probs = bv.verify_step_outputs(STEPS_ROOT, ren)
        self.assertTrue(any('missing ' + s0['stepId'] + '.svg' in p for p in probs), probs)
        dup = copy.deepcopy(cats); st = dup['chevron']['steps']; st[1]['stepId'] = st[0]['stepId']
        self.assertTrue(any('duplicate' in p for p in bv.verify_step_outputs(STEPS_ROOT, dup)))

class Strips(unittest.TestCase):
    def test_high_strip_count_never_capped(self):
        ex, _ = bv.run_export('edge-grain', ['dimensions.width=1500'])
        n = len(ex['pattern']['strips']); self.assertGreater(n, 30)
        tv = bv.fig_top_view(ex).render('t')
        self.assertEqual(tv.count('<polygon'), n)
        row = bv.section_strips(ex); self.assertEqual(len(row), n)
        for fig in (bv.fig_strip_seq(ex), bv.fig_cross_section(ex), bv.fig_glue_up(ex, ex['catalog']['steps'][2], 1)):
            t = fig.render('t')
            self.assertGreaterEqual(t.count('<rect '), n); self.assertNotRegex(t, r'more')
        p = os.path.join(PL(), 'wide.svg'); open(p, 'w').write(bv.fig_strip_seq(ex).render('t'))
        self.assertEqual(check_overlap.overlaps([p]), []); self.assertEqual(measure_labels.measure([p]), [])

class Generation(unittest.TestCase):
    pass

def _gen_test(name):
    def t(self):
        d = os.path.join(SAMPLES_DIR, name)
        files = set(os.listdir(d))
        for need in ('top-view.svg', 'cut-list.svg', 'glue-up-1.svg', 'rip-fence-setup.svg', 'agreement.json', 'export.json'):
            self.assertIn(need, files, name)
        extra = {'edge-grain': ['cross-section.svg', 'hand-hole.svg'], 'face-grain': ['handle.svg'],
                 'end-grain': ['modifiers.svg', 'feet-overlay.svg'], 'checkerboard-16x24': ['modifiers.svg'],
                 'stripe-inlay': ['inlay-detail.svg'], 'checkerboard': ['strip-seq.svg', 'crosscut.svg', 'outline.svg']}
        for need in extra.get(name, []): self.assertIn(need, files, name)
        if name == 'edge-grain':
            self.assertIn('data-panel="planer-panel"', open(os.path.join(d, 'rip-fence-setup.svg')).read())
    return t
for _n in bv.SAMPLES:
    setattr(Generation, 'test_generate_' + _n.replace('-', '_'), _gen_test(_n))

class Labels(unittest.TestCase):
    def test_groove_and_feet_labels_full(self):
        t = open(os.path.join(SAMPLES_DIR, 'checkerboard-16x24', 'modifiers.svg')).read()
        self.assertIn(bv.html.escape('0.500" (1/2") wide × 0.188" (3/16") deep, 0.750" (3/4") from the edge, corner radius 1.000" (1"), top face.').split(' ')[0], t)
        ex = json.load(open(os.path.join(SAMPLES_DIR, 'checkerboard-16x24', 'export.json')))
        self.assertEqual(bv.groove_label(ex), 'Perimeter loop, 0.500" (1/2") wide × 0.188" (3/16") deep, 0.750" (3/4") from the edge, corner radius 1.000" (1"), top face.')

    def test_placement_rules(self):
        t = open(os.path.join(SAMPLES_DIR, 'edge-grain', 'rip-fence-setup.svg')).read()
        fence = re.search(r'<rect x="([\d.]+)" y="[\d.]+" width="22.00"', t); rf = re.search(r'<text x="([\d.]+)"[^>]*text-anchor="end"[^>]*><tspan[^>]*>RIP FENCE', t)
        self.assertLess(float(rf.group(1)), float(fence.group(1)))
        self.assertRegex(t, r'fill="#222222"[^>]*font-weight="bold"><tspan[^>]*>RIP FENCE')
        head = re.search(r'<circle cx="([\d.]+)"[^>]*r="([\d.]+)"', t); ht = re.search(r'<text x="([\d.]+)"[^>]*><tspan[^>]*>head<', t)
        self.assertGreater(float(ht.group(1)), float(head.group(1)) + float(head.group(2)))
        bed = re.search(r'<rect x="[\d.]+" y="([\d.]+)" width="440.00" height="14.00"', t); pl = re.search(r'<tspan x="[\d.]+" y="([\d.]+)">planed: ', t)
        self.assertGreater(float(pl.group(1)), float(bed.group(1)) + 14)

if __name__ == '__main__':
    unittest.main()
