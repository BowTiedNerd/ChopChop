/** Board Master 98f9ec19 review + Shop Tester 98f9ec19 notes: pdftotext checks on the committed sample PDFs. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';

const flat = (name: string) => execFileSync('pdftotext', ['-raw', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');
const step = (name: string, title: string) => {
  const t = execFileSync('pdftotext', ['-raw', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' });
  const m = new RegExp(`[\\n\\f]Step \\d+: (?:${title})\\n[\\s\\S]*?(?=[\\n\\f]Step \\d+:|$)`).exec(t);
  return (m ? m[0] : '').replace(/\s+/g, ' ');
};

describe('Board Master 98f9ec19', () => {
  it('brick: one panel per course type, strips sum to 12" (305 mm), one length per panel, slices add up', () => {
    const f = flat('brick');
    expect(f).toContain('Panel A: Walnut strip-set panel 13-3/4" (349 mm) wide: 4 × Walnut 3" (76 mm)');
    expect(f).toContain('Panel B: Walnut strip-set panel 13-3/4" (349 mm) wide: 12 × Walnut 1" (25 mm)');
    expect(f).toContain('Slices: 18 in all (Panel A 3, Panel B 7, Panel C 2, Panel D 6)');
    expect(f).not.toMatch(/Walnut blank|Maple blank/);
  });
  it('brick fence line gives both rip settings (78 mm and 27 mm)', () => {
    expect(flat('brick')).toContain('Fence to blade: 3-1/16" (78 mm) and 1-13/16" (46 mm) and 1-1/16" (27 mm)');
  });
  it('scrap: one glued panel, slices from it, no "1 slices"', () => {
    const f = flat('scrap-chaotic');
    expect(f).toMatch(/Panel A: [^:]+ strip-set panel 12" \(305 mm\) wide:/);
    expect(f).toContain('Slices: 10 in all (Panel A 10)');
    expect(f).not.toMatch(/\b1 slices\b/);
  });
  it('end-grain allowance printed as 3/16" (5.0 mm), sheet units first', () => {
    for (const n of ['end-grain', 'brick', 'checkerboard-default']) expect(flat(n), n).toContain('End-grain allowance: 3/16" (5.0 mm).');
  });
  it('mixed-grain / end-grain sheets label the strip-set planer line', () => {
    for (const n of ['chevron', 'end-grain', 'checkerboard-default']) {
      const f = flat(n);
      expect(f, n).toContain('Strip-set (long grain, before slicing): Planer OK');
      expect(f.replace(/Strip-set \(long grain, before slicing\): Planer OK/g, ''), n).not.toContain('Planer OK');
    }
  });
});

describe('Shop Tester 98f9ec19', () => {
  it('every trim step gets a sled width', () => {
    for (const [n, t] of [['brick', 'Trim ends'], ['chevron', 'Trim to rectangle'], ['herringbone', 'Trim to rectangle'], ['features-combined', 'Trim to length']]) {
      expect(step(n, t), `${n} ${t}`).toMatch(/Sled width: (sled must clear the glue-up|the glue-up is)/);
    }
  });
  it('angled cuts get a stop block and hold-down', () => {
    for (const n of ['chevron', 'herringbone']) expect(step(n, 'Angled cuts'), n).toContain('Set a stop block on the angled sled for the piece width and clamp each cut with the hold-down');
  });
  it('herringbone cut list says angled cuts, not crosscut', () => {
    const f = flat('herringbone');
    const cut = f.slice(f.indexOf('Cut List'), f.indexOf('Step 1:'));
    expect(cut).toContain('angled cuts on the sled with a stop block and hold-down');
    expect(cut).not.toMatch(/crosscut \d+ slices/);
  });
  it('no "1 slices" / "1 pieces" anywhere', () => {
    for (const n of ['brick', 'scrap-chaotic', 'chevron', 'herringbone', 'end-grain', 'tumbling-block-3d', 'checkerboard-16x24']) expect(flat(n), n).not.toMatch(/\b1 (slices|pieces)\b/);
  });
});

describe('Board QA 98f9ec19 pre-check', () => {
  const MIXED = ['chevron', 'herringbone', 'brick', 'scrap-chaotic', 'tumbling-block-3d'];
  it('mixed-grain sheets: every step, not just the final flatten; only the labelled strip-set line, none on tumbling block', () => {
    for (const n of MIXED) {
      const f = flat(n);
      const bare = f.replace(/Strip-set \(long grain, before slicing\): Planer OK/g, '');
      expect(bare, n).not.toContain('Planer OK');
      if (n === 'tumbling-block-3d') expect(f, n).not.toMatch(/Planer OK/i);
    }
  });
  it('mixed-grain final flatten drops the planer infeed warning', () => {
    for (const n of MIXED) expect(step(n, 'Flatten and sand'), n).not.toMatch(/infeed and outfeed/i);
  });
  it('juice-groove corner radius prints 1" (25 mm), never 1" (26 mm)', () => {
    for (const n of ['hand-hole', 'herringbone', 'scrap-chaotic', 'checkerboard-default', 'checkerboard-16x24', 'brick']) expect(flat(n), n).not.toContain('1" (26 mm)');
    expect(flat('checkerboard-16x24')).toContain('corner radius 1" (25 mm)');
  });
  it('hand hole prints its slot from the catalog: 4" × 1" (102 × 25 mm), 1/2" (12.7 mm) end radius', () => {
    const f = flat('hand-hole');
    expect(f).toContain('Handles: hand hole, slot 4" × 1" (102 × 25 mm), 1/2" (12.7 mm) end radius');
    expect(step('hand-hole', 'Edge profile')).toContain('Hand hole: rout a slot 4" × 1" (102 × 25 mm), 1/2" (12.7 mm) end radius');
  });
});
