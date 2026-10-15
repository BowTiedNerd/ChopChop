/** Shop Tester 3757189 majors with Board Master rulings: brick offset width, wide-panel flattening, per-style allowance. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';
import { sampleDesigns } from './sampleDesigns';

const flat = (n: string) => execFileSync('pdftotext', ['-raw', `samples/${n}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');
const design = (n: string) => structuredClone(sampleDesigns().find(([k]) => k === n)![1]);

describe('M1 brick offset: panel = board width + half a block + 1/4" cleanup, trimmed back on the sled', () => {
  const d = design('brick-basketweave');
  const W = d.dimensions.width;
  // catalog brickRule (draft5u): blockLength_mm / 2 + offsetCleanup_mm
  const br = (loadStyleCatalog('brick-basketweave').cutListAllowances as unknown as { brickRule: { blockLength_mm: number; offsetCleanup_mm: number } }).brickRule;
  const half = br.blockLength_mm / 2;
  it('catalog brickRule is 76.2 / 6.35', () => expect([br.blockLength_mm, br.offsetCleanup_mm]).toEqual([76.2, 6.35]));
  it('every panel covers board width + block/2 + cleanup with whole continued blocks; strips sum to it', () => {
    for (const r of calculateRequiredParts(d).filter(x => x.panelId)) {
      expect(r.width).toBeGreaterThanOrEqual(W + half + br.offsetCleanup_mm - 1e-6);
      expect(r.strips!.reduce((a, c) => a + c.width * c.count, 0)).toBeCloseTo(r.width, 6);
      expect(r.courseSequence!.reduce((a, c) => a + c.width, 0)).toBeCloseTo(r.width, 6);
      expect(r.part).not.toMatch(/1-3\/4" \(44 mm\)/);
      expect(r.part).toMatch(/includes \d+ continued blocks? in course order for the half-block offset \+ 1\/4" \(6\.4 mm\) cleanup/);
    }
    expect(flat('brick')).not.toContain('(46 mm)');
  });
  it('coverage: the trimmed 305 mm board, shifted 0 or half a block, shows only the course sequence (no cleanup species)', () => {
    for (const r of calculateRequiredParts(d).filter(x => x.panelId)) {
      const seq = r.courseSequence!;
      // the course's own repeat: the board-width part of the panel (strips laid before any continuation)
      let base = 0, acc = 0;
      while (acc < W - 1e-6) acc += seq[base++].width;
      for (let i = base; i < seq.length; i++) expect(seq[i], `${r.panelId} strip ${i}`).toEqual(seq[i % base]);
      for (const shift of [0, half]) {
        // visible window [shift, shift + W] after trimming both ragged ends
        let x = 0;
        for (const st of seq) { if (x + st.width > shift + 1e-6 && x < shift + W - 1e-6) expect(seq.slice(0, base)).toContainEqual(st); x += st.width; }
        expect(x).toBeGreaterThanOrEqual(shift + W - 1e-6);
      }
    }
  });
  it('the offset step trims both ragged ends on the sled with a stop block to 12" (305 mm); coverage after trim', () => {
    const f = flat('brick');
    expect(f).toContain('After glue-up, trim both ragged ends on the crosscut sled with a stop block, down to the board width 12" (305 mm).');
    const panelW = calculateRequiredParts(d).find(x => x.panelId)!.width;
    expect(panelW - half - br.offsetCleanup_mm).toBeGreaterThanOrEqual(W - 1e-6);
  });
});

describe('M2 wide panels: no jointer / planer-sled note above planerMax - margin (299 mm)', () => {
  for (const n of ['brick', 'scrap-chaotic', 'herringbone', 'planer-margin', 'features-combined']) {
    it(n, () => {
      const f = flat(n);
      const p = (loadStyleCatalog('edge-grain').cutListAllowances as unknown as { planerTextRule: { faceTooWideForPlanerText: string; faceTooWideForJointerText: string; faceTooWideForJointerAppliesWidth_mm: [number, number] } }).planerTextRule;
      expect(p.faceTooWideForJointerAppliesWidth_mm).toEqual([152.4, 299]);
      expect(f).not.toContain(p.faceTooWideForJointerText.split('{jointerMax}')[1]);
      expect(f).toContain(p.faceTooWideForPlanerText.replace('{planerLimit}', n === 'features-combined' ? '299 mm (11.77")' : '11-25/32" (299 mm)'));
    });
  }
  it('a 200 mm long-grain panel keeps the jointer / planer-sled note', () => {
    const d = design('edge-grain'); d.dimensions.width = 200;
    expect(calculateRequiredParts(d).map(r => r.part).join(' ')).toMatch(/planer sled first/);
  });
});

describe('M3 panel thickness uses each style\'s own catalog flatteningAllowance_mm', () => {
  for (const [n, d] of sampleDesigns()) {
    const a = loadStyleCatalog(d.style as CatalogStyleName).cutListAllowances.flatteningAllowance_mm as number;
    if (!['chevron', 'herringbone', 'planer-margin', 'edge-grain', 'end-grain', 'checkerboard-default'].includes(n)) continue;
    it(`${n}: allowance ${a}`, () => {
      const rows = calculateRequiredParts(d).filter(r => r.panelId);
      const endGrain = ['end-grain', 'checkerboard-default'].includes(n);
      if (endGrain) {
        expect(a).toBe(5);
        expect(rows[0].sliceThickness).toBeCloseTo(d.dimensions.thickness + a, 6);
      } else {
        expect(a).toBe(1.5);
        for (const r of rows) expect(r.thickness).toBeCloseTo(d.dimensions.thickness + a, 6);
      }
    });
  }
  it('herringbone prints 39.6 mm thick panels', () => {
    expect(flat('herringbone')).toMatch(/1-9\/16" \(40 mm\)/);
  });
});

describe('rough-stock allowance prints from its true 3.0 mm; only kerf 3.175 prints 3.2', () => {
  it('edge-grain and brick mill steps: 1/8" (3.0 mm); kerf stays 1/8" (3.2 mm)', () => {
    for (const n of ['planer-margin', 'brick']) {
      expect(flat(n), n).toContain('final thickness plus 1/8" (3.0 mm)');
      expect(flat(n), n).not.toContain('final thickness plus 1/8" (3.2 mm)');
    }
    expect(loadStyleCatalog('edge-grain').cutListAllowances.roughToFinalOversize_mm.thickness).toBe(3);
  });
});

describe('no committed sample prints blankRule.panelWidthText or "no wider than 12""', () => {
  const SAMPLES = ['checkerboard-default', 'checkerboard-16x24', 'end-grain', 'chevron', 'brick', 'metric', 'herringbone', 'hand-hole', 'scrap-chaotic', 'features-combined', 'tumbling-block-3d', 'planer-margin'];
  for (const n of SAMPLES) {
    it(n, () => {
      const f = flat(n);
      const t = (loadStyleCatalog('edge-grain').cutListAllowances.blankRule as unknown as { panelWidthText: string }).panelWidthText.replace(/\s+/g, ' ');
      expect(f).not.toContain(t.slice(0, 60));
      expect(f).not.toContain('no wider than 12"');
    });
  }
});

describe('every trim step: sled width >= that step\'s glue-up width and names a stop block (all samples)', () => {
  const PDF: Record<string, string> = { 'brick-basketweave': 'brick', 'edge-grain': 'planer-margin', 'face-grain': 'planer-margin', 'stripe-inlay': 'planer-margin', 'blank-limit-914.4': 'end-grain' };
  for (const [n, d] of sampleDesigns()) {
    const pdf = PDF[n] ?? n;
    if (!existsSync(`samples/${pdf}.pdf`) || (PDF[n] && n !== 'brick-basketweave')) continue;
    it(n, () => {
      // independent glue-up width: widest panel, sub-panels side by side, angled ragged ends (piece length cos a + width sin a)
      const rows = calculateRequiredParts(d).filter(r => r.panelId && typeof r.slices === 'number');
      let glue = d.dimensions.width;
      const sub = new Map<string, number>();
      for (const r of rows) { glue = Math.max(glue, r.width); if (r.subPanel) sub.set(r.panelId!, (sub.get(r.panelId!) ?? 0) + r.width); }
      for (const v of sub.values()) glue = Math.max(glue, v);
      if (['chevron', 'herringbone'].includes(d.style) && sub.size === 0) {
        const a = (d.angle ?? 45) * Math.PI / 180;
        glue = Math.max(glue, d.dimensions.width + Math.max(...rows.map(r => r.sliceThickness!)) * Math.cos(a) + Math.max(...rows.flatMap(r => r.strips!).map(s => s.width)) * Math.sin(a));
      }
      const f = execFileSync('pdftotext', ['-raw', `samples/${pdf}.pdf`, '-'], { encoding: 'utf-8' });
      let n2 = 0;
      for (const m of f.matchAll(/Step \d+: Trim[^\n]*\n([\s\S]*?)(?=\nStep \d+:|$)/g)) {
        const t = m[1].replace(/\s+/g, ' ');
        const w = /(?:sled must clear the glue-up|the glue-up is),? (?:[^(]*\((\d+) mm\)|(\d+) mm \()/.exec(t);
        expect(w, t.slice(0, 120)).not.toBeNull();
        n2++;
        expect(Number(w![1] ?? w![2]) + 0.5).toBeGreaterThanOrEqual(glue);
        expect(t).toMatch(/stop block|track saw/);
      }
      void n2;
    });
  }
  it('brick Step 9 prints 15" (381 mm) and a stop block', () => expect(flat('brick')).toMatch(/Trim ends .*sled must clear the glue-up, 15" \(381 mm\)\. Square the ends on the sled with a stop block\./));
});
