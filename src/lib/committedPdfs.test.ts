/** Reads the COMMITTED sample PDFs with pdftotext (what a woodworker actually sees). */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';

const text = (name: string) => execFileSync('pdftotext', ['-layout', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' });
const flat = (name: string) => text(name).replace(/\s+/g, ' ');

describe('Committed PDFs: crosscut step prints the computed slice size (draft5h)', () => {
  it('end-grain and default checkerboard: 38.1 mm + 5 mm = 1-11/16" (43 mm)', () => {
    for (const n of ['end-grain', 'checkerboard-default']) {
      expect(flat(n), n).toContain('Slice size: 1-11/16" (43 mm)');
    }
  });
  it('metric: sheet units first, 40 mm + 5 mm = 45 mm (1-3/4")', () => {
    expect(flat('metric')).toContain('Slice size: 45 mm (1-3/4")');
  });
});

const SAMPLES = ['checkerboard-default', 'checkerboard-16x24', 'end-grain', 'chevron', 'brick', 'metric', 'herringbone', 'hand-hole', 'scrap-chaotic', 'features-combined'];
/** Text of one step, "Step N: Title" up to the next step heading. */
const step = (name: string, title: string) => {
  const t = text(name);
  const m = new RegExp(`\\n\\s*Step \\d+: (?:${title})\\n[\\s\\S]*?(?=\\n\\s*Step \\d+:|$)`).exec(t);
  return m ? m[0] : '';
};
const cutList = (name: string) => { const t = text(name); return t.slice(t.indexOf('Cut List'), t.indexOf('Step 1:')); };
/** Part column only (x 20-100 mm on the page), so wrapped cells of other columns don't interleave. */
const partColumn = (name: string) => {
  const t = execFileSync('pdftotext', ['-x', '56', '-y', '0', '-W', '228', '-H', '842', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' });
  return t.slice(t.indexOf('Part'), t.indexOf('Board Layout') > 0 ? t.indexOf('Board Layout') : undefined).replace(/\s+/g, ' ');
};

describe('Board Master 2: every final/assembled flatten step prints its real width and route', () => {
  it('chevron Step 8 prints the glue-up width and the planer template', () => {
    expect(step('chevron', 'Flatten and sand').replace(/\s+/g, ' ')).toContain(
      'Flatten the final glue-up, 12.0" (305 mm) wide x 18.0" (457 mm) long: Planer OK: 12.0" (305 mm) wide, long grain.');
  });
  it('no sample prints the generic planer sentence in Flatten and sand', () => {
    for (const n of SAMPLES) {
      const s = step(n, 'Flatten and sand');
      expect(s, n).toMatch(/Flatten the final glue-up, \S+ \(\d+ mm\)|Flatten the final glue-up, \d+ mm/);
      expect(s, n).not.toMatch(/plane flat if the panel is no wider than/);
    }
  });
});

describe('Board Master 3 / Shop Tester D: length split and width split are labelled apart, same labels in steps and cut list', () => {
  it('metric prints Panel A/B by length with sub-panels 1/2 and 2/2', () => {
    const f = flat('metric');
    for (const l of ['Panel A (1 of 2 by length), sub-panel 1/2', 'Panel A (1 of 2 by length), sub-panel 2/2',
      'Panel B (2 of 2 by length), sub-panel 1/2', 'Panel B (2 of 2 by length), sub-panel 2/2']) expect(f).toContain(l);
  });
  it('no Qty cell reads "1 sub-panel"', () => {
    for (const n of SAMPLES) expect(cutList(n), n).not.toMatch(/\b1 sub-panel\b/);
  });
  it('step labels equal cut-list labels (metric, chevron, end-grain, checkerboard)', () => {
    for (const n of ['metric', 'chevron', 'end-grain', 'checkerboard-default']) {
      const labels = (s: string) => [...new Set([...s.matchAll(/Panel [A-Z](?: \(\d of \d by length\))?, sub-panel \d\/\d/g)].map(m => m[0]))].sort();
      const cl = labels(cutList(n));
      expect(cl.length, n).toBeGreaterThan(0);
      expect(labels(step(n, 'Crosscut slices|Angled cuts')), n).toEqual(cl);
    }
  });
});

describe('Shop Tester A: end-grain square geometry', () => {
  it('checkerboard: strips 1" wide, milled 1.6 mm over, panel planed to the 1" square, 18 rows', () => {
    const f = partColumn('checkerboard-default');
    expect(f).toContain('strips 1" (25 mm) wide, milled 1-1/16" (27 mm) thick; plane the glued panel to the 1" (25 mm) square size');
    expect(f).toContain('18 slices × 43.1 mm');
  });
  it('slice size is printed on the cut list and the crosscut step', () => {
    expect(partColumn('end-grain')).toContain('1-11/16" (43 mm) thick');
    expect(step('end-grain', 'Crosscut slices')).toContain('Slice size: 1-11/16" (43 mm)');
  });
  it('metric board: 2 sub-panels', () => {
    const f = flat('metric');
    expect(f).toContain('sub-panel 2/2');
    expect(f).not.toMatch(/sub-panel \d\/3/);
  });
  it('no PDF prints "from cut list" placeholders', () => {
    for (const n of [...SAMPLES, 'mill-plan']) expect(flat(n), n).not.toMatch(/from (the )?cut list/);
  });
});

describe('Shop Tester B: strip order pattern[i mod n] across the full width, no seam', () => {
  const orders = (n: string) => [...text(n).matchAll(/sub-panel (\d)\/(\d) \(order: ([A-Z](?: [A-Z])+)\)/g)];
  it('checkerboard sub-panels run W M across the full width and the seam alternates', () => {
    const o = orders('checkerboard-default');
    const byIdx = new Map(o.map(m => [Number(m[1]), m[3].split(' ')]));
    const full = [...byIdx.keys()].sort().flatMap(k => byIdx.get(k)!);
    expect(full).toEqual(full.map((_, i) => ['W', 'M'][i % 2]));
    for (let k = 1; k < byIdx.size; k++) expect(byIdx.get(k)!.at(-1)).not.toBe(byIdx.get(k + 1)![0]);
  });
  it('chevron: panels 2 and 4 start on maple', () => {
    const o = orders('chevron').map(m => m[3].split(' ')[0]);
    expect(o.length).toBe(4);
    expect([o[1], o[3]]).toEqual(['M', 'M']);
  });
});

describe('Shop Tester E: every sub-panel prints its strip width', () => {
  it('each sub-panel row says "strips <w> wide"', () => {
    for (const n of ['checkerboard-default', 'metric', 'chevron', 'end-grain']) {
      const c = partColumn(n);
      const rows = (c.match(/sub-panel \d\/\d:/g) ?? []).length;
      expect(rows, n).toBeGreaterThan(0);
      expect((c.match(/strips \S+ \(\d+ mm\) wide|strips \d+ mm \(\S+\) wide/g) ?? []).length, n).toBe(rows);
    }
  });
});

describe('Shop Tester F: planer wording only for long grain within limits', () => {
  it('every planer line is the template with a real width <= 305 mm', () => {
    for (const n of SAMPLES) {
      for (const m of text(n).matchAll(/[^\n]*(Planer OK|plane flat|planer capacity)[^\n]*/g)) {
        const t = /Planer OK: (\S+ \((\d+) mm\)|(\d+) mm \(\S+\)) wide, long grain/.exec(m[0]);
        expect(t, `${n}: ${m[0]}`).not.toBeNull();
        expect(Number(t![2] ?? t![3]), n).toBeLessThanOrEqual(305);
      }
    }
  });
  it('never after the end-grain flip', () => {
    for (const n of ['end-grain', 'checkerboard-default', 'brick', 'metric']) {
      const t = text(n);
      const after = t.slice(t.indexOf('Rotate slices') >= 0 ? t.indexOf('Step', t.indexOf('Rotate slices') - 10) : t.length);
      expect(after, n).not.toContain('Planer OK');
      expect(step(n, 'Flatten and sand'), n).toContain('never the planer');
    }
  });
});

describe('Shop Tester G: brick, herringbone and scrap print their sled width', () => {
  it('crosscut / angled-cut steps say "Sled width: sled must clear 12.0" (305 mm)"', () => {
    for (const n of ['brick', 'herringbone', 'scrap-chaotic']) expect(flat(n), n).toContain('Sled width: sled must clear 12.0" (305 mm).');
  });
});

describe('Board QA minor 1: mill-plan.pdf is text only, by decision', () => {
  it('has 0 images and says the figures are in the cut sheet', () => {
    const list = execFileSync('pdfimages', ['-list', 'samples/mill-plan.pdf'], { encoding: 'utf-8' }).split('\n').slice(2).filter(Boolean);
    expect(list.length).toBe(0);
    expect(flat('mill-plan')).toContain('Figures: see the cut sheet PDF (this mill plan is text only).');
  });
  it('mill plan steps carry the computed text, not the generic catalog sentence', () => {
    const f = flat('mill-plan');
    expect(f).toContain('Flatten Panel A, sub-panel 1/2, 6.2" (158 mm) wide: Planer OK: 6.2" (158 mm) wide, long grain.');
    expect(f).not.toContain('plane flat if the panel is no wider than');
  });
});
