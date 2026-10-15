/** Board Master rulings after ff4f88d5: brick panel length, scrap slice turn, rubber feet 1" (25 mm), allowance 3/16" (5.0 mm). */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { createDefaultBoard, DEFAULT_RUBBER_FEET_METRIC } from './defaults';
import { shopSize } from '../utils/format';

const flat = (name: string) => execFileSync('pdftotext', ['-raw', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');

describe('Board Master rulings', () => {
  it('1. brick: slices = ceil(L / course) in board order; panel length = max(305, n x (slice + kerf) + 50)', () => {
    const a = loadStyleCatalog('brick-basketweave').cutListAllowances;
    expect(a.blankRule!.blankMinLength_mm).toBe(305);
    expect(2 * a.blankRule!.crosscutTrim_mm).toBe(50);
    for (const length of [457.2, 914.4]) {
      const d = createDefaultBoard();
      d.style = 'brick-basketweave';
      d.dimensions.length = length;
      const panels = calculateRequiredParts(d).filter(p => typeof p.slices === 'number');
      expect(panels.reduce((s, p) => s + p.slices!, 0), `${length}`).toBe(Math.ceil(length / 25.4));
      for (const p of panels) {
        const want = Math.max(305, p.slices! * (p.sliceThickness! + a.kerf_mm) + 50);
        expect(p.length, `${length}: ${p.part.slice(0, 40)}`).toBeCloseTo(want, 9);
      }
      expect(panels.some(p => p.length > 305), `${length}: formula, not just the floor`).toBe(true);
    }
    expect(flat('brick')).toContain('Slices: 18 in all (Panel A 3, Panel B 7, Panel C 2, Panel D 6)');
  });
  it('2. scrap glue-up: every other slice turned 180° end-for-end, no offset that adds length', () => {
    const f = flat('scrap-chaotic');
    expect(f).toContain('Turn every other slice 180° end-for-end; keep the ends flush, with no offset, so the panel gets no longer.');
    // slices = ceil(457.2 / panel thickness 46.6) = 10
    expect(f).toContain('Slices: 10 in all (Panel A 10)');
    expect(f).not.toMatch(/offset (each|every other) slice|shift every other slice/i);
  });
  it('3. rubber feet default 25.4 mm prints 1" (25 mm)', () => {
    expect(DEFAULT_RUBBER_FEET_METRIC.diameter).toBe(25.4);
    expect(shopSize(DEFAULT_RUBBER_FEET_METRIC.diameter, 'imperial')).toBe('1" (25 mm)');
    for (const n of ['hand-hole']) expect(flat(n), n).toContain('4 rubber feet, 1" (25 mm) diameter');
  });
  it('4. end-grain allowance stays 3/16" (5.0 mm)', () => {
    for (const n of ['end-grain', 'brick', 'checkerboard-default', 'scrap-chaotic']) expect(flat(n), n).toContain('End-grain allowance: 3/16" (5.0 mm).');
  });
});
