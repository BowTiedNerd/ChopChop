"""Shared headless-Chrome harness: inline each SVG (1:1) in one HTML page, run a JS checker, read JSON back via --dump-dom."""
import html, json, os, re, subprocess, tempfile

def run(svg_files, js, timeout=600):
    parts = ['<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}div.f{margin:0;padding:0}</style></head><body>']
    for i, f in enumerate(svg_files):
        with open(f, encoding='utf8') as fh: s = fh.read()
        s = re.sub(r'^<\?xml[^>]*>', '', s)
        parts.append(f'<div class="f" data-file="{html.escape(f)}">{s}</div>')
    parts.append('<pre id="out"></pre><script>' + js + '\n'
                 'document.getElementById("out").textContent = JSON.stringify(check());</script></body></html>')
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf8') as t:
        t.write(''.join(parts)); path = t.name
    try:
        p = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=4000,3000',
                            '--virtual-time-budget=600000', '--dump-dom', 'file://' + path],
                           capture_output=True, text=True, timeout=timeout)
        m = re.search(r'<pre id="out">(.*?)</pre>', p.stdout, re.S)
        if not m or not m.group(1).strip():
            raise RuntimeError('chrome produced no result: ' + p.stderr[-800:])
        return json.loads(html.unescape(m.group(1)))
    finally:
        os.unlink(path)

def collect(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            for dp, _, fs in os.walk(p):
                out += [os.path.join(dp, f) for f in fs if f.endswith('.svg')]
        else:
            out.append(p)
    return sorted(out)
