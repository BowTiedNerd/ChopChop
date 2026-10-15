#!/usr/bin/env python3
"""boardviz: SVG diagrams for ChopChop cutting boards, drawn from the app's own export.

Usage:
  boardviz.py [style|sample] --set key=value ... --out /ABS/DIR [--png]
  boardviz.py all --out /ABS/samples [--png]          # 11 sample folders + index.html
  boardviz.py steps --out /ABS/ROOT                   # <styleId>/<stepId>.svg for every catalog step with a figure
See README.md for the rules.
"""
import argparse, hashlib, html, json, math, os, subprocess, sys
from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORTER = os.path.join(HERE, 'exporter')
FONT_FAMILY = 'DejaVu Sans'
FONT_FILE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
MIN_FONT_PX = 11            # 8 pt at 96 dpi = 10.67 px; 11 is the floor
MIN_DRAWN_PX = 10.67
PANEL_ROLES = {
    'cutlist-header': {'#5B3A29'},
    'cutlist-row': {'#F3E7D3', '#FBF8F2', '#ECECEC'},
    'saw-table': {'#D9D9D9'},
    'planer-panel': {'#F1EEE8'},
}
DEPICTED = {'board', 'strip', 'blade', 'fence', 'stock', 'bed', 'cutterhead'}
DARK = '#222222'
WARN = '#9B1C1C'

STYLES = ['face-grain', 'edge-grain', 'end-grain', 'checkerboard', 'brick-basketweave', 'chevron',
          'herringbone', 'stripe-inlay', 'scrap-chaotic', 'tumbling-block-3d']
# sample folder -> (export preset, --set list)
SAMPLES = {
    'face-grain': ('face-grain', ['handles.enabled=true', 'handles.type=handle']),
    'edge-grain': ('edge-grain', ['handles.enabled=true', 'handles.type=hand-hole-slot']),
    'end-grain': ('end-grain', ['unitSystem=metric', 'dimensions.width=300', 'dimensions.length=450',
                                'dimensions.thickness=40', 'juiceGroove.enabled=true', 'rubberFeet.enabled=true']),
    'checkerboard': ('checkerboard', []),
    'checkerboard-16x24': ('checkerboard-16x24', ['juiceGroove.enabled=true']),
    'brick-basketweave': ('brick-basketweave', []),
    'chevron': ('chevron', []),
    'herringbone': ('herringbone', []),
    'stripe-inlay': ('stripe-inlay', []),
    'scrap-chaotic': ('scrap-chaotic', []),
    'tumbling-block-3d': ('tumbling-block-3d', []),
    'metric': ('metric', ['rubberFeet.enabled=true']),
}

class ExportError(RuntimeError):
    pass

_fonts = {}
def text_width(s, size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_BOLD if bold else FONT_FILE, size)
    return _fonts[key].getlength(s)

def wrap(s, size, max_w, bold=False):
    """Word-wrap s so each line fits max_w. Never drops or shortens text."""
    words, lines, cur = s.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w) if cur else w
        if cur and text_width(t, size, bold) > max_w:
            lines.append(cur); cur = w
        else:
            cur = t
    lines.append(cur)
    return lines

def esc(s):
    return html.escape(str(s), quote=True)

class Svg:
    """Builder. Width/height grow to fit everything drawn; SVG width == viewBox width (1:1)."""
    def __init__(self, title=None):
        self.items = []
        self.maxx = 0.0
        self.maxy = 0.0
        self.ndim = 0
        self.texts = []   # (x0,y0,x1,y1) for layout collision bookkeeping
        if title:
            self.text(20, 30, title, size=16, bold=True)

    def _ext(self, x, y):
        self.maxx = max(self.maxx, x); self.maxy = max(self.maxy, y)

    # ---- geometry (drawing) -------------------------------------------------
    def rect(self, x, y, w, h, fill='none', stroke=DARK, sw=1, rx=0, dash=None, extra=''):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.items.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{rx:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}{extra}/>')
        self._ext(x + w + sw, y + h + sw)

    def poly(self, pts, fill='none', stroke=DARK, sw=1, extra=''):
        p = ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
        self.items.append(f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>')
        for x, y in pts: self._ext(x + sw, y + sw)

    def line(self, x1, y1, x2, y2, stroke=DARK, sw=1, dash=None, extra=''):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.items.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{stroke}" stroke-width="{sw}"{d}{extra}/>')
        self._ext(max(x1, x2) + sw, max(y1, y2) + sw)

    def circle(self, cx, cy, r, fill='none', stroke=DARK, sw=1, extra=''):
        self.items.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>')
        self._ext(cx + r + sw, cy + r + sw)

    def arrow(self, x1, y1, x2, y2, stroke=DARK):
        self.line(x1, y1, x2, y2, stroke=stroke, sw=2)
        a = math.atan2(y2 - y1, x2 - x1)
        p = [(x2, y2), (x2 - 9 * math.cos(a - .4), y2 - 9 * math.sin(a - .4)), (x2 - 9 * math.cos(a + .4), y2 - 9 * math.sin(a + .4))]
        self.poly(p, fill=stroke, stroke=stroke)

    # ---- backgrounds --------------------------------------------------------
    def panel(self, role, x, y, w, h, fill):
        """The ONLY way to emit data-panel. Plain backgrounds only."""
        if role in DEPICTED:
            raise ValueError(f'data-panel refused for depicted part {role!r}')
        if role not in PANEL_ROLES:
            raise ValueError(f'unknown panel role {role!r}')
        if fill.upper() not in PANEL_ROLES[role]:
            raise ValueError(f'fill {fill} not allowed for panel role {role}')
        self.items.append(f'<rect data-panel="{role}" x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}"/>')
        self._ext(x + w, y + h)

    # ---- text ---------------------------------------------------------------
    def text(self, x, y, s, size=MIN_FONT_PX, anchor='start', fill=DARK, bold=False, dim=None, src=None, max_w=None):
        """One label. Refuses size < MIN_FONT_PX. max_w wraps (figure grows); text is never cut.
        Returns the bottom y of the block."""
        if size < MIN_FONT_PX:
            raise ValueError(f'font size {size} below MIN_FONT_PX {MIN_FONT_PX}')
        lines = wrap(s, size, max_w, bold) if max_w else [s]
        lh = size * 1.3
        attrs = f' font-family="{FONT_FAMILY}" font-size="{size}" fill="{fill}"'
        if anchor != 'start': attrs += f' text-anchor="{anchor}"'
        if bold: attrs += ' font-weight="bold"'
        if dim is not None: attrs += f' data-dim="{dim}"'
        if src is not None: attrs += f' data-src="{esc(src)}"'
        tsp = ''.join(f'<tspan x="{x:.2f}" y="{y + i * lh:.2f}">{esc(l)}</tspan>' for i, l in enumerate(lines))
        self.items.append(f'<text x="{x:.2f}" y="{y:.2f}"{attrs}>{tsp}</text>')
        w = max(text_width(l, size, bold) for l in lines)
        x0 = x - (w if anchor == 'end' else w / 2 if anchor == 'middle' else 0)
        box = (x0, y - size, x0 + w, y + (len(lines) - 1) * lh + size * 0.3)
        self.texts.append(box)
        self._ext(box[2] + 2, box[3] + 4)
        return box[3]

    def vmargin(self, label, size=MIN_FONT_PX):
        """Horizontal room needed to the LEFT of a short vertical dim line."""
        return text_width(label, size) + 12

    # ---- dimensions ---------------------------------------------------------
    def _patch(self, n, box, pad=2):
        x0, y0, x1, y1 = box
        self.items.append(f'<rect data-patch="{n}" x="{x0 - pad:.2f}" y="{y0 - pad:.2f}" width="{x1 - x0 + 2 * pad:.2f}" height="{y1 - y0 + 2 * pad:.2f}" fill="#FFFFFF"/>')

    def dim_h(self, x1, x2, y, label, from_y=None, src=None, dash=None):
        """Horizontal dimension at height y, label centred ABOVE the line."""
        n = self.ndim = self.ndim + 1
        tag = f' data-dim="{n}"'
        if from_y is not None:
            for x in (x1, x2):
                self.line(x, from_y, x, y + 4 * (1 if y > from_y else -1), stroke='#555', sw=0.8, dash=dash or '3,2', extra=tag)
        self.line(x1, y, x2, y, stroke='#555', sw=1, extra=tag)
        for x in (x1, x2):
            self.line(x, y - 4, x, y + 4, stroke='#555', sw=1, extra=tag)
        w = text_width(label, MIN_FONT_PX)
        cx = (x1 + x2) / 2
        ty = y - 5
        box = (cx - w / 2, ty - MIN_FONT_PX, cx + w / 2, ty + MIN_FONT_PX * 0.3)
        self._patch(n, box)
        self.text(cx, ty, label, anchor='middle', dim=n, src=src)
        return n

    def dim_v(self, x, y1, y2, label, from_x=None, src=None, dash=None, label_dy=0.0):
        """Vertical dimension line at x; label to the LEFT of the line (room = vmargin)."""
        n = self.ndim = self.ndim + 1
        tag = f' data-dim="{n}"'
        if from_x is not None:
            for y in (y1, y2):
                self.line(from_x, y, x - 4, y, stroke='#555', sw=0.8, dash=dash or '3,2', extra=tag)
        self.line(x, y1, x, y2, stroke='#555', sw=1, extra=tag)
        for y in (y1, y2):
            self.line(x - 4, y, x + 4, y, stroke='#555', sw=1, extra=tag)
        w = text_width(label, MIN_FONT_PX)
        ty = (y1 + y2) / 2 + 4 + label_dy
        box = (x - 8 - w, ty - MIN_FONT_PX, x - 8, ty + MIN_FONT_PX * 0.3)
        self._patch(n, box)
        self.text(x - 8, ty, label, anchor='end', dim=n, src=src)
        return n

    def banners(self, x, y, banners, max_w, src_prefix):
        """Every banner, in full, no cap. Returns new y."""
        for i, b in enumerate(banners):
            y = self.text(x, y, b, fill=WARN, bold=True, max_w=max_w, src=f'{src_prefix}.{i}') + 18
        return y

    def render(self, kind):
        W = math.ceil(self.maxx + 20); H = math.ceil(self.maxy + 20)
        body = '\n'.join(self.items)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" data-figure="{kind}">\n'
                f'<rect data-bg="1" x="0" y="0" width="{W}" height="{H}" fill="#FFFFFF"/>\n{body}\n</svg>\n')

# ------------------------------------------------------------------ export
def run_export(preset, sets):
    """Call the app export. Any error or refusal is fatal (ExportError); no defaults fallback."""
    cmd = ['npx', '--no-install', 'tsx', os.path.join(EXPORTER, 'export_design.ts'), preset] + list(sets)
    p = subprocess.run(cmd, cwd=EXPORTER, capture_output=True, text=True)
    if p.returncode != 0:
        raise ExportError(f'export failed (exit {p.returncode}): {p.stderr.strip()}')
    try:
        return json.loads(p.stdout), p.stdout
    except json.JSONDecodeError as e:
        raise ExportError(f'export produced invalid JSON: {e}')

def get(d, path):
    for k in path.split('.'):
        d = d[int(k)] if isinstance(d, list) else d[k]
    return d

# ------------------------------------------------------------------ helpers
def clip_poly(pts, x0, y0, x1, y1):
    def clip(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out
    def ix(xc):
        return lambda a, b: (xc, a[1] + (b[1] - a[1]) * (xc - a[0]) / (b[0] - a[0]))
    def iy(yc):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / (b[1] - a[1]), yc)
    for ins, it in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                    (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts: break
        pts = clip(pts, ins, it)
    return pts

def strip_poly(s, sc, ox, oy):
    cx, cy = s['x'] + s['w'] / 2, s['z'] + s['d'] / 2
    r = s['rotation']; c, sn = math.cos(r), math.sin(r)
    out = []
    for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        px, py = dx * s['w'] / 2, dy * s['d'] / 2
        out.append((ox + (cx + px * c - py * sn) * sc, oy + (cy + px * sn + py * c) * sc))
    return out

def draw_board(svg, ex, ox, oy, sc):
    W, L = ex['design']['dimensions']['width'], ex['design']['dimensions']['length']
    n = 0
    for s in ex['pattern']['strips']:
        p = clip_poly(strip_poly(s, sc, ox, oy), ox, oy, ox + W * sc, oy + L * sc)
        if len(p) >= 3:
            svg.poly(p, fill=s['color'], stroke='#333', sw=0.5); n += 1
    svg.rect(ox, oy, W * sc, L * sc, stroke=DARK, sw=1.5)
    return W * sc, L * sc, n

def title(ex, what):
    return f"{ex['catalog']['displayName']}: {what}"

# ------------------------------------------------------------------ figures
def fig_top_view(ex):
    svg = Svg(title(ex, 'top view'))
    lab_l = ex['text']['length']
    ox = 40 + svg.vmargin(lab_l); oy = 80
    sc = 1.0
    w, h, n = draw_board(svg, ex, ox, oy, sc)
    svg.items.append(f'<desc data-strips="{n}" data-export-strips="{len(ex["pattern"]["strips"])}"></desc>')
    svg.dim_h(ox, ox + w, oy - 16, ex['text']['width'], src='text.width')
    svg.dim_v(ox - 16, oy, oy + h, lab_l, src='text.length')
    g = ex['design']['juiceGroove']
    if g['enabled']:
        e = g['fromEdge'] * sc
        svg.rect(ox + e, oy + e, w - 2 * e, h - 2 * e, rx=g['cornerRadius'] * sc, stroke='#1F4E79', sw=max(1, g['width'] * sc * 0.25), dash='6,3')
    svg.text(ox, oy + h + 30, f"Thickness {ex['text']['thickness']}", src='label.thickness')
    return svg

def fig_cut_list(ex):
    svg = Svg(title(ex, 'cut list'))
    cols = ['Part', 'Qty', 'Width', 'Thickness', 'Length', 'Species']
    rows = [[r['part'], str(r['quantity']), r['text']['width'], r['text']['thickness'], r['text']['length'], r['species']]
            for r in ex['cutList']]
    srcs = [[f'cutList.{i}.part', None, f'cutList.{i}.text.width', f'cutList.{i}.text.thickness', f'cutList.{i}.text.length', f'cutList.{i}.species'] for i in range(len(rows))]
    cw = [max(text_width(c, 12, True), *(text_width(r[j], 12) for r in rows)) + 24 for j, c in enumerate(cols)]
    x0, y = 20, 50
    total = sum(cw)
    svg.panel('cutlist-header', x0, y, total, 26, '#5B3A29')
    x = x0
    for j, c in enumerate(cols):
        svg.text(x + 10, y + 18, c, size=12, bold=True, fill='#FFFFFF'); x += cw[j]
    y += 26
    fills = ['#F3E7D3', '#FBF8F2']
    for i, r in enumerate(rows):
        svg.panel('cutlist-row', x0, y, total, 24, fills[i % 2])
        x = x0
        for j, c in enumerate(r):
            svg.text(x + 10, y + 17, c, size=12, src=srcs[i][j]); x += cw[j]
        y += 24
    a = ex['catalog']['cutListAllowances']
    y += 26
    note = (f"Catalog allowances ({'shop defaults' if a.get('shopDefault') else 'catalog'}): kerf {a['kerf_text']}; "
            f"rough oversize {a['roughToFinalOversize_mm']['thickness']} mm thick, {a['roughToFinalOversize_mm']['width']} mm wide, "
            f"{a['roughToFinalOversize_mm']['length']} mm long; flattening {a['flatteningAllowance_mm']} mm; sanding {a['sandingLoss_mm']} mm.")
    svg.text(x0, y, note, max_w=max(total, 500))
    return svg

def section_strips(ex):
    """One row across the width, in pattern order (first z row)."""
    allz = ex['pattern']['strips']
    z0 = min(s['z'] for s in allz)
    strips = [s for s in allz if s['z'] == z0]   # never capped: every strip in the row is drawn
    return sorted(strips, key=lambda s: s['x'])

def fig_glue_up(ex, step, idx):
    svg = Svg(title(ex, f"glue-up {idx}, step {step['stepNumber']}: {step['title']}"))
    strips = section_strips(ex)
    sc = 1.2
    ox, oy = 60, 120   # clamp arrows start at y=78, below the title block
    x = ox
    th = ex['design']['dimensions']['thickness'] * sc
    for s in strips:
        svg.rect(x, oy, s['w'] * sc, th, fill=s['color'], stroke='#333', sw=0.8)
        x += s['w'] * sc
    total = x - ox
    for cx in (ox + total * 0.25, ox + total * 0.75):
        svg.arrow(cx, 78, cx, oy - 6)
        svg.arrow(cx, oy + th + 42, cx, oy + th + 6)
    svg.arrow(ox - 50, oy + th / 2, ox - 6, oy + th / 2)
    svg.arrow(ox + total + 50, oy + th / 2, ox + total + 6, oy + th / 2)
    y = oy + th + 70
    return step_text(svg, ex, step, 20, y, max(total + 100, 520))

def step_text(svg, ex, step, x, y, max_w):
    i = step['stepNumber'] - 1
    y = svg.text(x, y, step['description'], max_w=max_w, src=f'catalog.steps.{i}.description') + 18
    for k, v in step['settings'].items():
        y = svg.text(x, y, f'{k}: {v}', max_w=max_w, bold=True) + 18
    return svg.banners(x, y, step['safetyBanners'], max_w, f'catalog.steps.{i}.safetyBanners') and svg

def first_step(ex, ftype):
    for s in ex['catalog']['steps']:
        if s['figureType'] == ftype:
            return s
    return None

def fig_rip_fence(ex, step=None):
    step = step or first_step(ex, 'rip-fence') or ex['catalog']['steps'][0]
    svg = Svg(title(ex, f"rip-fence setup, step {step['stepNumber']}: {step['title']}"))
    rip = ex['cutList'][0]
    sc = 2.0
    tx, ty, tw, th = 20, 60, 560, 260
    svg.panel('saw-table', tx, ty, tw, th, '#D9D9D9')
    bx = 300
    svg.rect(bx, ty + 60, 3.175 * sc, 140, fill='#8A8A8A', stroke=DARK)        # blade (kerf width)
    fx = bx - rip['width'] * sc                                              # fence face to near tooth
    svg.rect(fx - 22, ty + 10, 22, th - 20, fill='#6B6B6B', stroke=DARK)     # fence
    svg.rect(fx, ty + 40, rip['width'] * sc, 180, fill=ex['pattern']['strips'][0]['color'], stroke=DARK, sw=0.8)  # stock (strip)
    svg.text(bx + 16, ty + 34, 'Keeper strip')                # off the strip, right of the blade
    # riving knife behind the blade (outfeed side = top; stock feeds up the page)
    svg.rect(bx, ty + 22, 3.175 * sc, 30, fill='#4A4A4A', stroke=DARK)
    svg.text(bx + 16, ty + 58, 'riving knife')
    # push stick on the strip, trailing end
    pw = rip['width'] * sc
    svg.poly([(fx + pw * 0.2, ty + 205), (fx + pw * 0.8, ty + 205), (fx + pw * 0.8, ty + 252), (fx + pw * 0.2, ty + 238)],
             fill='#E8B04A', stroke=DARK)
    svg.text(bx + 16, ty + 250, 'push stick')
    # feed arrow, clear of the stock
    svg.arrow(bx + 150, ty + 240, bx + 150, ty + 130)
    svg.text(bx + 162, ty + 190, 'Feed')
    svg.text(fx - 30, ty + 30, 'RIP FENCE', anchor='end', bold=True, fill=DARK)
    svg.dim_h(fx, bx, ty + th + 30, rip['text']['width'], from_y=ty + 256, src='cutList.0.text.width')
    y = ty + th + 64
    y = svg.text(20, y, 'Measure fence face → near side of a tooth', max_w=520) + 18
    y = svg.text(20, y, 'set toward the fence', max_w=520) + 18
    y = svg.text(20, y, f"Kerf: {ex['catalog']['cutListAllowances']['kerf_text']}", max_w=520) + 26
    if ex['design']['style'] == 'edge-grain':
        y = planer_panel(svg, ex, 20, y) + 26
    return step_text(svg, ex, step, 20, y, 560)

def planer_panel(svg, ex, x, y):
    svg.panel('planer-panel', x, y, 560, 190, '#F1EEE8')
    svg.text(x + 10, y + 22, 'Planer', bold=True)
    bed_y = y + 120
    svg.rect(x + 40, bed_y, 440, 14, fill='#7A7A7A', stroke=DARK)            # bed
    t = ex['design']['dimensions']['thickness'] * 1.2
    svg.rect(x + 100, bed_y - t, 260, t, fill=ex['pattern']['strips'][0]['color'], stroke=DARK)  # stock
    svg.circle(x + 230, bed_y - t - 22, 20, fill='#9A9A9A', stroke=DARK)     # cutterhead
    svg.text(x + 262, bed_y - t - 18, 'head')
    svg.text(x + 40, bed_y + 34, f"planed: {ex['text']['thickness']}", src='label.planed')
    return y + 190

def fig_crosscut(ex, step):
    svg = Svg(title(ex, f"crosscut, step {step['stepNumber']}: {step['title']}"))
    sc = 0.9
    tx, ty = 20, 60
    svg.panel('saw-table', tx, ty, 600, 200, '#D9D9D9')
    bx = 120
    svg.rect(bx, ty + 20, 4, 160, fill='#8A8A8A', stroke=DARK)               # blade
    part = max(ex['cutList'], key=lambda r: r['length']) if step['stepNumber'] < 5 else min(ex['cutList'], key=lambda r: r['length'])
    i = ex['cutList'].index(part)
    L = part['length'] * sc
    svg.rect(bx + 4, ty + 80, min(L, 470), 50, fill=ex['pattern']['strips'][0]['color'], stroke=DARK)  # stock
    sx = bx + 4 + min(L, 470)
    svg.rect(sx, ty + 70, 14, 70, fill='#B58B5A', stroke=DARK)              # stop block
    svg.dim_h(bx + 4, sx, ty + 230, part['text']['length'], from_y=ty + 140, src=f'cutList.{i}.text.length')
    return step_text(svg, ex, step, 20, ty + 270, 600)

def fig_strip_seq(ex, step=None):
    svg = Svg(title(ex, 'strip sequence'))
    strips = section_strips(ex)
    sc = 1.5; x = 40; y = 60
    for s in strips:
        svg.rect(x, y, s['w'] * sc, 80, fill=s['color'], stroke='#333', sw=0.8); x += s['w'] * sc
    yy = y + 110
    for k, s in enumerate(strips):
        wtxt = s['w'] / 25.4
        yy = svg.text(40, yy, f"{k + 1}. {s['species']}") + 16
    if step:
        step_text(svg, ex, step, 40, yy + 10, max(x, 520))
    return svg

def fig_cross_section(ex):
    svg = Svg(title(ex, 'cross-section (end view)'))
    strips = section_strips(ex)
    lab = ex['text']['thickness']
    ox = 40 + svg.vmargin(lab); oy = 70; sc = 1.5
    x = ox; th = ex['design']['dimensions']['thickness'] * sc
    for s in strips:
        svg.rect(x, oy, s['w'] * sc, th, fill=s['color'], stroke='#333', sw=0.8); x += s['w'] * sc
    svg.dim_v(ox - 14, oy, oy + th, lab, src='text.thickness')
    return svg

def fig_outline(ex, step):
    svg = Svg(title(ex, f"outline, step {step['stepNumber']}: {step['title']}"))
    lab = ex['text']['length']
    ox = 40 + svg.vmargin(lab); oy = 80; sc = 0.8
    d = ex['design']['dimensions']
    svg.rect(ox, oy, d['width'] * sc, d['length'] * sc, fill='#E6D3B3', stroke=DARK, sw=2, rx=6)
    svg.dim_h(ox, ox + d['width'] * sc, oy - 16, ex['text']['width'], src='text.width')
    svg.dim_v(ox - 16, oy, oy + d['length'] * sc, lab, src='text.length')
    return step_text(svg, ex, step, 20, oy + d['length'] * sc + 40, max(d['width'] * sc + ox, 520))

def groove_label(ex):
    g = ex['text']['groove']
    return f"Perimeter loop, {g['width']} wide × {g['depth']} deep, {g['fromEdge']} from the edge, corner radius {g['cornerRadius']}, top face."

def feet_label(ex):
    f = ex['text']['feet']
    return f"4 rubber feet, {f['diameter']} diameter × {f['height']} high, foot centres {f['inset']} in from the edges (underside)."

def fig_modifiers(ex):
    svg = Svg(title(ex, 'modifiers'))
    d = ex['design']['dimensions']; sc = 0.8
    g = ex['design']['juiceGroove']
    lab = ex['text']['groove']['fromEdge']
    ox = 160; oy = 70                         # modifiers start at x=160 (vmargin for short dims)
    ox = max(ox, 30 + svg.vmargin(lab))
    W, L = d['width'] * sc, d['length'] * sc
    svg.rect(ox, oy, W, L, fill='#E6D3B3', stroke=DARK, sw=1.5)
    e = g['fromEdge'] * sc
    svg.rect(ox + e, oy + e, W - 2 * e, L - 2 * e, rx=g['cornerRadius'] * sc, stroke='#1F4E79', sw=2, dash='6,3')
    svg.dim_v(ox - 14, oy, oy + e, lab, from_x=ox, src='text.groove.fromEdge')
    svg.text(20, oy + L + 34, groove_label(ex), max_w=max(W + ox, 520), src='modifier.groove')
    return svg

def fig_feet(ex):
    svg = Svg(title(ex, 'feet overlay (underside)'))
    d = ex['design']['dimensions']; f = ex['design']['rubberFeet']; sc = 0.8
    lab = ex['text']['feet']['inset']
    ox = max(160, 30 + svg.vmargin(lab)); oy = 70
    W, L = d['width'] * sc, d['length'] * sc
    svg.rect(ox, oy, W, L, fill='#E6D3B3', stroke=DARK, sw=1.5)
    i = f['inset'] * sc; r = f['diameter'] / 2 * sc
    for cx in (ox + i, ox + W - i):
        for cy in (oy + i, oy + L - i):
            svg.circle(cx, cy, r, fill='#333333', stroke=DARK)
    svg.dim_v(ox - 14, oy, oy + i, lab, from_x=ox, src='text.feet.inset')
    svg.text(20, oy + L + 34, feet_label(ex), max_w=max(W + ox, 520), src='modifier.feet')
    return svg

def hand_hole_problems(k):
    """A round-end slot's end radius must be exactly half its width."""
    if abs(k['endRadius_mm'] - k['width_mm'] / 2) > 1e-6:
        return [f"endRadius_mm {k['endRadius_mm']} != width_mm/2 ({k['width_mm'] / 2})"]
    return []

def fig_handle(ex):
    """Hand hole (round-end slot) or finger grips, sized from catalog `features`, numbers formatted by the app."""
    h = ex['design']['handles']['type']
    F = ex['features']
    if F is None:
        raise ValueError('catalog has no features block; handle sizes unavailable')
    d = ex['design']['dimensions']; sc = 1.0
    W, L = d['width'] * sc, d['length'] * sc
    if h == 'handle':
        g = F['fingerGrip']; T = g['text_fmt']
        svg = Svg(title(ex, 'finger grips (both ends)'))
        ox = 40 + svg.vmargin(T['depth']); oy = 110
        svg.rect(ox, oy, W, L, fill='#E6D3B3', stroke=DARK, sw=1.5)
        gl, gd = g['length_mm'] * sc, g['depth_mm'] * sc
        gx = ox + (W - gl) / 2
        for y in (oy, oy + L - gd):
            svg.rect(gx, y, gl, gd, fill='#B8956A', stroke=DARK, sw=1, rx=min(gd, gl) / 2)   # grip recess (drawing)
        svg.dim_h(gx, gx + gl, oy - 30, T['length'], from_y=oy, src='features.fingerGrip.text_fmt.length', dash='4,3')
        svg.dim_v(ox - 14, oy, oy + gd, T['depth'], from_x=ox, src='features.fingerGrip.text_fmt.depth', dash='4,3')
        y = oy + L + 34
        y = svg.text(20, y, g['text'], max_w=max(W + ox, 560), src='features.fingerGrip.text') + 18
        svg.text(20, y, 'Bit: ' + g['bit'], max_w=max(W + ox, 560), src='label.gripBit')
        return svg
    k = F['handHole']; T = k['text_fmt']
    bad = hand_hole_problems(k)
    if bad:
        raise ValueError('catalog handHole inconsistent: ' + '; '.join(bad))
    svg = Svg(title(ex, f'hand hole ({h})'))
    ox = 40 + svg.vmargin(T['edgeInset']) + 30 + svg.vmargin(T['width']); oy = 110
    svg.rect(ox, oy, W, L, fill='#E6D3B3', stroke=DARK, sw=1.5)
    sl, sw_ = k['length_mm'] * sc, k['width_mm'] * sc
    cy = oy + k['edgeInset_mm'] * sc
    sx = ox + (W - sl) / 2
    # slot overlay: drawing, not background -> untagged
    svg.rect(sx, cy - sw_ / 2, sl, sw_, fill='#FBF8F2', stroke=DARK, sw=1.2, rx=k['endRadius_mm'] * sc)
    svg.dim_h(sx, sx + sl, oy - 30, T['length'], from_y=cy - sw_ / 2, src='features.handHole.text_fmt.length', dash='4,3')
    # inset label lifted so its patch clears the slot-width extension line at the slot's top edge
    svg.dim_v(ox - 14, oy, cy, T['edgeInset'], from_x=ox, src='features.handHole.text_fmt.edgeInset', dash='4,3',
              label_dy=-max(0.0, ((oy + cy) / 2 + 4 + MIN_FONT_PX * 0.3 + 2) - (cy - sw_ / 2) + 3))
    svg.dim_v(ox - 30 - svg.vmargin(T['edgeInset']), cy - sw_ / 2, cy + sw_ / 2, T['width'], from_x=sx, src='features.handHole.text_fmt.width', dash='4,3')
    y = oy + L + 34
    y = svg.text(20, y, k['text'], max_w=max(W + ox, 560), src='features.handHole.text') + 18
    svg.text(20, y, 'Bit: ' + k['bit'] + ', with a template', max_w=max(W + ox, 560), src='label.holeBit')
    return svg

def fig_inlay(ex):
    svg = Svg(title(ex, 'inlay detail'))
    strips = section_strips(ex); sc = 2.0
    x = 40; oy = 60
    th = ex['design']['dimensions']['thickness'] * sc * 0.6
    for s in strips:
        svg.rect(x, oy, s['w'] * sc, th, fill=s['color'], stroke='#333', sw=0.8); x += s['w'] * sc
    y = oy + th + 30
    for k, s in enumerate(strips):
        i = ex['pattern']['strips'].index(s)
        y = svg.text(40, y, f"{k + 1}. {s['species']}") + 16
    return svg

MILL_MACHINES = ('jointer', 'planer')

def fig_mill(ex, step):
    """Whole blanks are milled first; slices are crosscut afterwards. Pieces on the jointer/planer are tagged
    data-machine + data-length-mm (+ data-width-mm) so tests can prove nothing under the minimum is shown."""
    svg = Svg(title(ex, f"step {step['stepNumber']}: {step['title']}"))
    m = step.get('machineSetup')
    i = step['stepNumber'] - 1
    y = 64
    if m in MILL_MACHINES:
        B = ex.get('derivedBlanks')
        if not B:
            raise ValueError('catalog has no blankRule; cannot draw a milled blank')
        b = min(B, key=lambda x: x['length_mm'])
        bi = B.index(b)
        panel = 'flatten' in step.get('stepId', '') or 'panel' in step['title'].lower()
        A = ex['catalog']['cutListAllowances']
        width_mm = ex['design']['dimensions']['width'] if panel else b['width_mm']
        rerouted = None
        if m == 'planer' and width_mm > A['planerMaxWidth_mm']:
            m = rerouted = 'router-sled'          # wider than the planer: router sled or drum sander
        if m == 'jointer' and width_mm > A['jointerMaxWidth_mm']:
            m = rerouted = 'planer-sled'          # too wide to face-joint: planer sled or hand flattening
        x0, y0 = 60, 120
        pw = 520                                     # schematic (not to scale): blank drawn at fixed length
        ph = 60 if panel else 30
        svg.rect(x0 - 20, y0 + ph, pw + 40, 12, fill='#7A7A7A', stroke=DARK)      # bed / table
        extra = f' data-machine="{m}" data-length-mm="{b["length_mm"]:.3f}" data-width-mm="{width_mm:.3f}"'
        svg.rect(x0, y0, pw, ph, fill=ex['pattern']['strips'][0]['color'], stroke=DARK, extra=extra)
        where = {'router-sled': 'router sled or drum sander', 'planer-sled': 'planer sled or hand flattening'}.get(m, m)
        svg.text(x0 - 20, 84, ('Panel' if panel else 'Whole blank') + f' on the {where} (schematic, not to scale)', bold=True)
        svg.dim_h(x0, x0 + pw, y0 + ph + 44, b['text']['length'], from_y=y0 + ph + 12, src=f'derivedBlanks.{bi}.text.length')
        y = y0 + ph + 80
        y = svg.text(20, y, ex['catalog']['cutListAllowances']['blankRule']['text'], max_w=600, src='catalog.cutListAllowances.blankRule.text') + 18
        if rerouted:
            y = svg.text(20, y, A['widthRule']['text'], max_w=600, fill=WARN, bold=True, src='catalog.cutListAllowances.widthRule.text') + 18
        for k, bb in enumerate(B):
            part = ex['cutList'][bb['cutListIndex']]['part']
            y = svg.text(20, y, f"{part}: blank {bb['text']['length']} long, {bb['slices']} slices of {bb['text']['slice']} crosscut after milling.",
                         max_w=600, src=f'label.blank.{k}') + 16
        y = svg.text(20, y + 4, 'Blank lengths: catalog blankRule applied to the app cut list by boardviz; the app export does not apply the rule yet.', max_w=600) + 22
    return step_text(svg, ex, step, 20, y, 600)

def fig_text_step(ex, step):
    svg = Svg(title(ex, f"step {step['stepNumber']}: {step['title']}"))
    return step_text(svg, ex, step, 20, 64, 560)

def fig_for_step(ex, step, glue_idx=1):
    t = step['figureType']
    if t == 'rip-fence': return fig_rip_fence(ex, step)
    if t == 'glue-up': return fig_glue_up(ex, step, glue_idx)
    if t == 'crosscut': return fig_crosscut(ex, step)
    if t == 'strip-sequence': return fig_strip_seq(ex, step)
    if t == 'outline': return fig_outline(ex, step)
    if t == 'mill': return fig_mill(ex, step)
    if t == 'top-view': return add_step(fig_top_view(ex), ex, step)
    raise ValueError(f'no figure for figureType {t!r}')

def add_step(svg, ex, step):
    return step_text(svg, ex, step, 20, svg.maxy + 30, 560)

def step_id(step):
    # Catalog 3.0-draft2 has no stepId field; stepNumber is the only key.
    return step.get('stepId') or step.get('id') or f"step-{step['stepNumber']}"

def figures_for(ex):
    out = {'top-view': fig_top_view(ex), 'cut-list': fig_cut_list(ex), 'rip-fence-setup': fig_rip_fence(ex)}
    gi = 0
    steps = ex['catalog']['steps']
    for s in steps:
        if s['figureType'] == 'glue-up':
            gi += 1; out[f'glue-up-{gi}'] = fig_glue_up(ex, s, gi)
    if any(s['figureType'] == 'strip-sequence' for s in steps): out['strip-seq'] = fig_strip_seq(ex)
    if any(s['figureType'] == 'crosscut' for s in steps): out['crosscut'] = fig_crosscut(ex, first_step(ex, 'crosscut'))
    if any(s['figureType'] == 'outline' for s in steps): out['outline'] = fig_outline(ex, first_step(ex, 'outline'))
    style = ex['design']['style']
    if style in ('edge-grain', 'end-grain', 'face-grain', 'stripe-inlay'): out['cross-section'] = fig_cross_section(ex)
    if style == 'stripe-inlay': out['inlay-detail'] = fig_inlay(ex)
    if ex['design']['juiceGroove']['enabled']: out['modifiers'] = fig_modifiers(ex)
    if ex['design']['rubberFeet']['enabled']: out['feet-overlay'] = fig_feet(ex)
    if ex['design']['handles']['enabled']:
        out['handle' if ex['design']['handles']['type'] == 'handle' else 'hand-hole'] = fig_handle(ex)
    return out

def step_figures(ex):
    out, gi = {}, 0
    for s in ex['catalog']['steps']:
        if s['figureType'] is None: continue
        if s['figureType'] == 'glue-up': gi += 1
        out[f"{ex['design']['style']}/{step_id(s)}"] = fig_for_step(ex, s, gi)
    return out

# ------------------------------------------------------------------ agreement
def source_strings(ex):
    m = {'label.thickness': f"Thickness {ex['text']['thickness']}",
         'label.gripBit': ('Bit: ' + ex['features']['fingerGrip']['bit']) if ex.get('features') else None,
         'label.holeBit': ('Bit: ' + ex['features']['handHole']['bit'] + ', with a template') if ex.get('features') else None,
         **{f'label.blank.{k}': f"{ex['cutList'][bb['cutListIndex']]['part']}: blank {bb['text']['length']} long, {bb['slices']} slices of {bb['text']['slice']} crosscut after milling." for k, bb in enumerate(ex.get('derivedBlanks') or [])},
         'label.planed': f"planed: {ex['text']['thickness']}",
         'modifier.groove': groove_label(ex) if ex['text']['groove'] else None,
         'modifier.feet': feet_label(ex) if ex['text']['feet'] else None}
    return m

def check_agreement(folder, ex, raw):
    """Re-read each SVG; every data-src label must equal its export string exactly; strip counts equal."""
    import re
    issues, checked = [], 0
    extra = source_strings(ex)
    for fn in sorted(os.listdir(folder)) + [os.path.join('steps', p) for p in walk_svgs(os.path.join(folder, 'steps'))]:
        if not fn.endswith('.svg'): continue
        s = open(os.path.join(folder, fn), encoding='utf8').read()
        for m in re.finditer(r'<text [^>]*data-src="([^"]+)"[^>]*>(.*?)</text>', s):
            src = html.unescape(m.group(1))
            printed = ' '.join(html.unescape(t) for t in re.findall(r'<tspan[^>]*>(.*?)</tspan>', m.group(2)))
            want = extra[src] if src in extra else str(get(ex, src))
            checked += 1
            if printed != want:
                issues.append({'figure': fn, 'src': src, 'printed': printed, 'export': want})
        for m in re.finditer(r'data-strips="(\d+)" data-export-strips="(\d+)"', s):
            checked += 1
            if int(m.group(2)) != len(ex['pattern']['strips']):
                issues.append({'figure': fn, 'src': 'pattern.strips', 'printed': m.group(2), 'export': len(ex['pattern']['strips'])})
    fresh, fresh_raw = run_export(ex['preset'], ex['sets'])
    same = hashlib.sha256(fresh_raw.encode()).hexdigest() == hashlib.sha256(raw.encode()).hexdigest()
    if not same: issues.append({'src': 'export', 'printed': 'figures export', 'export': 'fresh export differs'})
    return {'ok': not issues and checked > 0, 'labelsChecked': checked, 'issues': issues,
            'exportSha256': hashlib.sha256(raw.encode()).hexdigest(), 'freshExportIdentical': same,
            'preset': ex['preset'], 'sets': ex['sets'], 'catalogDraft': ex['catalog']['draft'][:40],
            'exportVsCatalog': catalog_mismatches(ex)}

def catalog_mismatches(ex):
    """Report (not draw around) differences between the app export and the catalog allowances."""
    a = ex['catalog']['cutListAllowances']; d = ex['design']['dimensions']; out = []
    over = a['roughToFinalOversize_mm']
    for i, r in enumerate(ex['cutList']):
        if abs(r['thickness'] - d['thickness']) < 1e-6 and over['thickness'] > 0:
            out.append(f"cutList.{i} ({r['part']}): thickness {r['thickness']} mm = finished thickness; catalog rough oversize +{over['thickness']} mm and flattening {a['flatteningAllowance_mm']} mm + sanding {a['sandingLoss_mm']} mm not applied")
        if r['length'] in (d['length'], d['width']):
            out.append(f"cutList.{i} ({r['part']}): length {r['length']} mm = finished board size; catalog length oversize +{over['length']} mm not applied")
        mp = a.get('minPieceLength_mm', {}).get('planerJointer')
        if mp and r['length'] < mp:
            out.append(f"cutList.{i} ({r['part']}): length {r['length']:.1f} mm is under the {mp} mm planer/jointer minimum; export gives no longer blank to mill first")
    if abs(a['kerf_mm'] - 3.175) > 1e-9:
        out.append(f"app hardcodes kerf 3.175 mm; catalog kerf_mm {a['kerf_mm']}")
    return out

def walk_svgs(root):
    out = []
    if os.path.isdir(root):
        for dp, _, fs in os.walk(root):
            out += [os.path.relpath(os.path.join(dp, f), root) for f in fs if f.endswith('.svg')]
    return sorted(out)


# ------------------------------------------------------------------ catalog/step-file contract
def load_catalogs():
    d = os.path.join(EXPORTER, 'catalog')
    return {st: json.load(open(os.path.join(d, st + '.json'), encoding='utf8')) for st in STYLES}

def verify_step_outputs(root, catalogs):
    """<root>/<styleId>/<stepId>.svg must exist for every step with figureType != null, and nothing else.
    stepIds must be unique within a style. Returns a list of problems (empty = ok)."""
    problems = []
    for st, cat in catalogs.items():
        ids = [s.get('stepId') for s in cat['steps']]
        if any(not i for i in ids): problems.append(f'{st}: step without stepId')
        dup = sorted({i for i in ids if ids.count(i) > 1})
        if dup: problems.append(f'{st}: duplicate stepId {dup}')
        want = {s['stepId'] + '.svg' for s in cat['steps'] if s.get('stepId') and s['figureType'] is not None}
        d = os.path.join(root, cat['style'])
        have = set(f for f in os.listdir(d) if f.endswith('.svg')) if os.path.isdir(d) else set()
        for f in sorted(want - have): problems.append(f'{st}: missing {f}')
        for f in sorted(have - want): problems.append(f'{st}: unexpected {f}')
    return problems

def panel_inventory(svg_text):
    """Every data-panel must be a plain <rect> with an allowed role and fill. Returns problems."""
    import re
    probs = []
    for m in re.finditer(r'<(\w+)\b([^>]*data-panel="([^"]*)"[^>]*)>', svg_text):
        tag, body, role = m.groups()
        fill = re.search(r'fill="([^"]*)"', body)
        fill = fill.group(1).upper() if fill else ''
        if tag != 'rect': probs.append(f'data-panel on <{tag}>')
        elif role not in PANEL_ROLES: probs.append(f'unknown role {role}')
        elif fill not in PANEL_ROLES[role]: probs.append(f'role {role} with fill {fill}')
    return probs

# ------------------------------------------------------------------ output
def check_out(out):
    if out is None or out in ('', 'undefined', 'None') or not os.path.isabs(out):
        raise SystemExit(f'boardviz: --out must be an absolute path, got {out!r}')
    return out

def png(svg_path):
    import re
    s = open(svg_path).read()
    w, h = re.search(r'width="(\d+)" height="(\d+)"', s).groups()
    p = svg_path[:-4] + '.png'
    subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                    f'--window-size={w},{h}', f'--screenshot={p}', 'file://' + svg_path],
                   capture_output=True, check=True, timeout=120)
    return p

def write_sample(name, preset, sets, out, do_png=False):
    ex, raw = run_export(preset, sets)
    folder = os.path.join(out, name); os.makedirs(folder, exist_ok=True)
    written = []
    for k, svg in figures_for(ex).items():
        p = os.path.join(folder, k + '.svg'); open(p, 'w').write(svg.render(k)); written.append(p)
    for k, svg in step_figures(ex).items():
        p = os.path.join(folder, 'steps', k + '.svg'); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w').write(svg.render(k)); written.append(p)
    open(os.path.join(folder, 'export.json'), 'w').write(raw)
    ag = check_agreement(folder, ex, raw)
    open(os.path.join(folder, 'agreement.json'), 'w').write(json.dumps(ag, indent=1, ensure_ascii=False))
    if do_png:
        for p in written: png(p)
    return folder, ag

def strict_failures(out):
    """CI strict mode: every exportVsCatalog entry in every sample's agreement.json is a failure."""
    res = []
    for name in SAMPLES:
        f = os.path.join(out, name, 'agreement.json')
        if not os.path.exists(f): res.append(f'{name}: agreement.json missing'); continue
        res += [f'{name}: {m}' for m in json.load(open(f, encoding='utf8'))['exportVsCatalog']]
    return res

def write_index(out):
    parts = ['<!doctype html><meta charset="utf-8"><title>boardviz samples</title><body style="font-family:DejaVu Sans">']
    for name in SAMPLES:
        folder = os.path.join(out, name)
        if not os.path.isdir(folder): continue
        parts.append(f'<h2>{esc(name)}</h2>')
        for f in sorted(os.listdir(folder)):
            if f.endswith('.svg'):
                parts.append(f"<div style='overflow-x:auto;margin:4px'><img style='max-width:none' src='{esc(name)}/{esc(f)}' alt='{esc(f)}'></div>")
    open(os.path.join(out, 'index.html'), 'w').write('\n'.join(parts) + '\n</body>\n')

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('target', help='style, sample name, "all" or "steps"')
    ap.add_argument('--set', action='append', default=[])
    ap.add_argument('--out')
    ap.add_argument('--png', action='store_true')
    ap.add_argument('--strict', action='store_true', help='fail if any agreement.json exportVsCatalog is non-empty')
    a = ap.parse_args(argv)
    out = check_out(a.out)
    try:
        if a.target == 'all':
            bad = 0
            for name, (preset, sets) in SAMPLES.items():
                f, ag = write_sample(name, preset, sets, out, a.png)
                print(f"{name}: agreement ok={ag['ok']} labels={ag['labelsChecked']} catalog-mismatches={len(ag['exportVsCatalog'])}")
                bad += not ag['ok']
            write_index(out)
            if a.strict:
                sf = strict_failures(out)
                for x in sf: print('STRICT', x, file=sys.stderr)
                if sf: return 3
            return 1 if bad else 0
        if a.target == 'steps':
            for st in STYLES:
                ex, _ = run_export(st, a.set)
                for k, svg in step_figures(ex).items():
                    p = os.path.join(out, k + '.svg'); os.makedirs(os.path.dirname(p), exist_ok=True)
                    open(p, 'w').write(svg.render(k))
                    if a.png: png(p)
            print('ok'); return 0
        preset, sets = SAMPLES.get(a.target, (a.target, []))
        f, ag = write_sample(a.target, preset, sets + a.set, out, a.png)
        print(f"{a.target}: agreement ok={ag['ok']}")
        return 0 if ag['ok'] else 1
    except ExportError as e:
        print(f'boardviz: FATAL {e}', file=sys.stderr)
        return 2

if __name__ == '__main__':
    sys.exit(main())
