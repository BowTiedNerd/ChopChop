/** Board Master draft5t tumbling ruling: every expected number from the catalog tumblingBlockMethod fields. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { sampleDesigns } from './sampleDesigns';
import { validateBoard } from './validation';
import { neededSlices } from './neededSlices';
import { shopSize } from '../utils/format';

const flat = (n: string) => execFileSync('pdftotext', ['-raw', `samples/${n}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');
const m = (loadStyleCatalog('tumbling-block-3d').cutListAllowances as unknown as { tumblingBlockMethod: { diamondSide_mm: { default: number; min: number; max: number }; logCutHeight: string; logWidth: string; hexOrientation: string } }).tumblingBlockMethod;
const cutMult = Number(/^(\d+(?:\.\d+)?)\*side/.exec(m.logCutHeight)![1]);
const cutMax = Number(/mustBe<=([\d.]+)mm/.exec(m.logCutHeight)![1]);
const bladeAbove = Number(/bladeHeight=cutHeight\+([\d.]+)$/.exec(m.logCutHeight)![1]);
const sledMax = Number(/upToSledMaxWidth_([\d.]+)_/.exec(m.logWidth)![1]);
const tb = () => structuredClone(sampleDesigns().find(([n]) => n === 'tumbling-block-3d')![1]);
const info = (d = tb()) => calculateRequiredParts(d).find(r => r.tumbling)!.tumbling!;

describe('draft5t tumbling ruling (Board Master)', () => {
  it('catalog: pointy-top hexagons, side default 31.75 in 25.4..31.75', () => {
    expect(m.hexOrientation).toMatch(/^pointyTop_/);
    expect(m.diamondSide_mm).toEqual({ default: 31.75, min: 25.4, max: 31.75 });
  });
  it('cut height = 2 x side (63.5 mm, 2-1/2"), within the catalog maximum, printed on the sled step', () => {
    const t = info();
    expect(t.cutHeight_mm).toBeCloseTo(cutMult * m.diamondSide_mm.default, 9);
    expect(t.cutHeight_mm).toBeLessThanOrEqual(cutMax + 1e-9);
    expect(flat('tumbling-block-3d')).toContain(`Cut height: ${shopSize(cutMult * m.diamondSide_mm.default, 'imperial')} (log height, 2 × diamond side) on the table-saw crosscut sled.`);
    expect(flat('tumbling-block-3d')).toContain('never flip the log for a second pass on the sled');
  });
  it('blade 1/4" (6.4 mm) above the log; 6.35 prints 6.4 under the one-decimal rule', () => {
    expect(shopSize(6.35, 'imperial')).toBe('1/4" (6.4 mm)');
    expect(shopSize(6.35, 'metric')).toBe('6.4 mm (0.25")');
    expect(info().bladeAbove_mm).toBe(bladeAbove);
    expect(flat('tumbling-block-3d')).toContain(`set the blade 1/4" (6.4 mm) above the log, ${shopSize(cutMult * m.diamondSide_mm.default + bladeAbove, 'imperial')}`);
  });
  it('log width = hexPerSlice x sqrt3 x side <= sled; sled width printed', () => {
    const t = info(), need = neededSlices(tb())!;
    expect(t.logWidth_mm).toBeCloseTo(need.hexPerSlice! * Math.sqrt(3) * m.diamondSide_mm.default, 9);
    expect(t.logWidth_mm).toBeLessThanOrEqual(sledMax);
    expect(flat('tumbling-block-3d')).toContain(`Sled width: sled must clear the log, ${shopSize(t.logWidth_mm, 'imperial')} (sled at most ${shopSize(sledMax, 'imperial')}; a row is never split).`);
  });
  it('never split a row: a board whose row is wider than the sled is refused, not split', () => {
    const d = tb(); d.dimensions.width = 700;
    expect(() => calculateRequiredParts(d)).toThrow(/never split/);
    const logs = calculateRequiredParts(tb()).filter(r => r.tumbling && r.panelId);
    for (const l of logs) expect(l.width).toBeCloseTo(info().hexPerSlice * Math.sqrt(3) * m.diamondSide_mm.default, 9);
  });
  it('305 x 457: 27.5 stock, 7 hex at 55.0, 385 log, 11 rows + 1 spare = 12 slices, one ~605 mm log, offset 27.5; coverage 11 x 7', () => {
    const t = info(), need = neededSlices(tb())!;
    expect([need.hexPerSlice, need.slices]).toEqual([7, 11]);
    expect(t.stripThickness_mm).toBeCloseTo(27.5, 1);
    expect(Math.sqrt(3) * t.diamondSide_mm).toBeCloseTo(55.0, 1);
    expect(t.logWidth_mm).toBeCloseTo(385, 0);
    expect([t.hexPerSlice, t.tileRows, t.spare, t.logCount, t.slicesPerLog]).toEqual([7, 11, 1, 1, 12]);
    expect(t.logLength_mm).toBeCloseTo(605.3, 1);
    expect(t.offset_mm).toBeCloseTo(27.5, 1);
    expect((t.logCount * t.slicesPerLog - t.spare) * t.hexPerSlice).toBeGreaterThanOrEqual(need.slices * need.hexPerSlice!);
    expect(need.slices * need.hexPerSlice!).toBe(77);
  });
  it('side range: 25.4 and 31.75 accepted; 25.3 and 31.8 refused by validation and the planner', () => {
    for (const v of [m.diamondSide_mm.min, m.diamondSide_mm.max]) {
      const d = tb(); d.tumblingDiamondSide_mm = v;
      expect(validateBoard(d).errors.filter(e => /Diamond side/.test(e))).toEqual([]);
      expect(() => calculateRequiredParts(d)).not.toThrow();
    }
    for (const v of [m.diamondSide_mm.min - 0.1, m.diamondSide_mm.max + 0.05]) {
      const d = tb(); d.tumblingDiamondSide_mm = v;
      expect(validateBoard(d).errors).toContain(`Diamond side must be ${m.diamondSide_mm.min}-${m.diamondSide_mm.max} mm`);
      expect(() => calculateRequiredParts(d)).toThrow(/outside/);
    }
  });
  it('tone boards: strips over boards >= stripsPerTone, each <= planer limit (299) and >= log length; offcut noted', () => {
    const a = loadStyleCatalog('tumbling-block-3d').cutListAllowances as unknown as { planerMaxWidth_mm: number; planerTextRule: { planerMargin_mm: number }; kerf_mm: number };
    const limit = a.planerMaxWidth_mm - a.planerTextRule.planerMargin_mm;
    const rows = calculateRequiredParts(tb());
    const t = info();
    const side = m.diamondSide_mm.default, perStrip = side + a.kerf_mm / Math.cos(Math.PI / 6), off = side * Math.sin(Math.PI / 3) / Math.tan(Math.PI / 3);
    for (const tone of ['light', 'mid', 'dark']) {
      const boards = rows.filter(r => r.toneBoard?.tone === tone);
      expect(boards.reduce((s, r) => s + r.toneBoard!.strips, 0)).toBeGreaterThanOrEqual(t.stripsPerTone);
      for (const r of boards) {
        expect(r.width).toBeLessThanOrEqual(limit);
        expect(r.width).toBeGreaterThanOrEqual(152.4 + off + r.toneBoard!.strips * perStrip - 1e-6);
        expect(r.length).toBeGreaterThanOrEqual(t.logLength_mm - 1e-6);
      }
    }
    const f = flat('tumbling-block-3d');
    expect(f).toMatch(/Tone board 1\/3 - tone: light; species: Maple; strips: 3; width: [^;]+; length: [^;]+; thickness: [^;]+;/);
    expect(f).toContain('the last 6" (152 mm) is offcut');
    expect(f).toContain('strips: 3; width: 11" (279 mm);');
    expect(f).toContain('strips: 2; width: 9-1/2" (241 mm);');
    for (const r of rows.filter(x => x.toneBoard)) expect(Math.abs(r.width / 6.35 - Math.round(r.width / 6.35))).toBeLessThan(1e-9);
  });
  it('tumbling glue-up steps never print "Clamp spacing"', () => {
    expect(flat('tumbling-block-3d')).not.toContain('Clamp spacing');
  });
});
