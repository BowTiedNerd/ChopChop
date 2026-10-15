/** Shop Tester 3757189 majors with Board Master rulings: brick offset width, wide-panel flattening, per-style allowance. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
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
  it('every panel is about 349.5 mm and its strips sum to it', () => {
    for (const r of calculateRequiredParts(d).filter(x => x.panelId)) {
      expect(r.width).toBeCloseTo(W + half + br.offsetCleanup_mm, 6);
      expect(r.width).toBeCloseTo(349.25, 1);
      const sum = r.strips!.reduce((a, c) => a + c.width * c.count, 0);
      expect(sum).toBeCloseTo(r.width, 6);
      expect(r.part).toMatch(/\+ 1 × \S+ 1-3\/4" \(44 mm\) \(rip [^;]+; half-block offset \+ 1\/4" \(6\.4 mm\) cleanup\)/);
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
