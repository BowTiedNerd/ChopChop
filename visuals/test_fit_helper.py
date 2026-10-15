#!/usr/bin/env python3
"""test_fit_helper: static (no browser) fit check. Reads <text>/<tspan> attributes in ANY order,
handles rotate(...) transforms, measures with the real DejaVu Sans metrics, and reports
  line 1: labels whose box leaves the viewBox
  line 2: labels with font-size under MIN_FONT_PX (or missing)
Fails (exit 1) on ANY reported line. A clean run prints exactly '0' and '0'."""
import math, re, sys
from PIL import ImageFont
import chromecheck

MIN = 11
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def attrs(tag):
    return {m.group(1): m.group(3) for m in re.finditer(r'([\w:-]+)\s*=\s*(["\'])(.*?)\2', tag)}

def check_file(path, report):
    s = open(path, encoding='utf8').read()
    root = attrs(re.search(r'<svg\b[^>]*>', s).group(0))
    vx, vy, vw, vh = map(float, root['viewBox'].split())
    for m in re.finditer(r'(<text\b[^>]*>)(.*?)</text>', s, re.S):
        a = attrs(m.group(1))
        fs = float(a['font-size']) if 'font-size' in a else 0.0
        if fs < MIN:
            report[1].append(f'{path}: font-size {fs} < {MIN}: {m.group(2)[:60]}')
            continue
        font = ImageFont.truetype(BOLD if a.get('font-weight') == 'bold' else FONT, int(round(fs)))
        rot = 0.0; rc = None
        r = re.search(r'rotate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+)[\s,]+([-\d.]+))?\s*\)', a.get('transform', ''))
        if r:
            rot = math.radians(float(r.group(1)))
            if r.group(2): rc = (float(r.group(2)), float(r.group(3)))
        spans = re.findall(r'(<tspan\b[^>]*>)(.*?)</tspan>', m.group(2), re.S) or [(m.group(1), m.group(2))]
        for tag, body in spans:
            ta = attrs(tag); x = float(ta.get('x', a.get('x', 0))); y = float(ta.get('y', a.get('y', 0)))
            txt = re.sub(r'<[^>]+>', '', body)
            txt = txt.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#x27;', "'")
            w = font.getlength(txt)
            anc = a.get('text-anchor', 'start')
            x0 = x - (w if anc == 'end' else w / 2 if anc == 'middle' else 0)
            pts = [(x0, y - fs), (x0 + w, y - fs), (x0, y + fs * .3), (x0 + w, y + fs * .3)]
            if rot:
                cx, cy = rc or (0.0, 0.0)
                pts = [(cx + (px - cx) * math.cos(rot) - (py - cy) * math.sin(rot),
                        cy + (px - cx) * math.sin(rot) + (py - cy) * math.cos(rot)) for px, py in pts]
            if any(px < vx - .5 or px > vx + vw + .5 or py < vy - .5 or py > vy + vh + .5 for px, py in pts):
                report[0].append(f'{path}: off frame: {txt[:60]}')

def main(argv):
    report = {0: [], 1: []}
    for f in chromecheck.collect(argv):
        check_file(f, report)
    for k in (0, 1):
        for line in report[k]: print(line, file=sys.stderr)
    print(len(report[0])); print(len(report[1]))
    return 1 if report[0] or report[1] else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
