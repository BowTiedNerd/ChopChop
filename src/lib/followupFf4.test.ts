/** Shop Tester ff4f88d5 + Board Master rulings: coverage, tumbling tiling, metric decimals, banners, defaults. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { calculateRequiredParts } from './lumberPlanner';
import { sampleDesigns } from './sampleDesigns';
import { createDefaultBoard } from './defaults';
import { neededSlices } from './neededSlices';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

const raw = (n: string) => execFileSync('pdftotext', ['-raw', `samples/${n}.pdf`, '-'], { encoding: 'utf-8' });
const flat = (n: string) => raw(n).replace(/\s+/g, ' ');
const step = (n: string, title: string) => {
  const m = new RegExp(`[\\n\\f]Step \\d+: (?:${title})\\n[\\s\\S]*?(?=[\\n\\f]Step \\d+:|$)`).exec(raw(n));
  return (m ? m[0] : '').replace(/\s+/g, ' ');
};

describe('coverage: slices cover the board, needed count from board size + catalog only (every sample)', () => {
  for (const [name, d] of sampleDesigns()) {
    const rows = calculateRequiredParts(d);
    const cut = rows.filter(r => typeof r.slices === 'number');
    const need = neededSlices(d, cut[0]?.thickness);
    if (!need) continue;
    it(name, () => {
      const t = rows.find(r => r.tumbling)?.tumbling;
      if (t) {
        // spare slice is not counted: used rows x hexagons per slice
        const used = t.logCount * t.slicesPerLog - t.spare;
        expect(used * t.hexPerSlice, name).toBeGreaterThanOrEqual(need.slices * need.hexPerSlice!);
        return;
      }
      const sum = cut.filter(r => !r.subPanel || r.subPanel.index === 1).reduce((a, r) => a + r.slices!, 0);
      expect(sum, name).toBeGreaterThanOrEqual(need.slices);
    });
  }
});

describe('tumbling block tiling (Board Master)', () => {
  // draft5s row-strip method; every expected number is derived from the catalog logStructure / blank rules
  const d = sampleDesigns().find(([n]) => n === 'tumbling-block-3d')![1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- catalog JSON walked by key
  const cat = loadStyleCatalog('tumbling-block-3d' as CatalogStyleName).cutListAllowances as unknown as Record<string, any>;
  const need = neededSlices(d)!;
  const spare = Number(/_slices=rows\+(\d+)spare/.exec(cat.tumblingBlockMethod.logStructure)![1]);
  const offset = Math.sqrt(3) * 38.1 / 2;
  it('row strips: slices used x hexagons per slice >= rows x hexagons, plus the spare', () => {
    const t = calculateRequiredParts(d).find(r => r.tumbling)!.tumbling!;
    expect([t.hexPerSlice, t.tileRows, t.spare]).toEqual([need.hexPerSlice, need.slices, spare]);
    expect((t.logCount * t.slicesPerLog - t.spare) * t.hexPerSlice).toBeGreaterThanOrEqual(need.slices * need.hexPerSlice!);
    expect(t.stripsPerTone).toBe(need.hexPerSlice! * t.logCount); // catalog stripsPerTone = hexPerSlice (per log)
    const n = need.slices + spare;
    expect(t.logLength_mm).toBeCloseTo(Math.max(cat.blankRule.blankMinLength_mm, n * (d.dimensions.thickness + cat.flatteningAllowance_mm + cat.kerf_mm) + 2 * cat.blankRule.crosscutTrim_mm), 6);
  });
  it('every log <= blankMaxLength (914.4 mm)', () => {
    for (const r of calculateRequiredParts(d).filter(x => x.tumbling)) expect(r.length).toBeLessThanOrEqual(cat.blankRule.blankMaxLength_mm);
  });
  it('cut list and glue-up print hexagons per slice, rows, spare and the half-hexagon offset', () => {
    const f = flat('tumbling-block-3d');
    expect(f).toContain(`${need.hexPerSlice} hexagons per slice`);
    expect(f).toContain(`${need.slices} rows used + ${spare} spare: slice ${need.slices + spare} spare`);
    expect(f).toContain(`offset alternate rows by half a hexagon, 1-5/16" (${Math.round(offset)} mm)`);
    expect(f).toContain('Glue them in pairs, then join the pairs, on a flat caul with light, even pressure. Trim the zig-zag edges on the sled with a stop block and hold-down.');
  });
  it('log crosscut prints cut height, blade height, sled width and the bandsaw warning', () => {
    const f = flat('tumbling-block-3d');
    expect(f).toMatch(/Cut height: \S+ \(66 mm\) \(log height\)\. Blade height: set the blade/);
    expect(f).toMatch(/Sled width: sled must clear the log/);
    expect(f).toContain('If a slice is not cut through in one pass, finish it on the bandsaw; never flip the log for a second pass on the sled.');
  });
  it('bevel-rip warning verbatim, replacing "never against the rip fence alone"', () => {
    const s = step('tumbling-block-3d', 'Bevel strips');
    expect(s).toContain('Featherboard holding the stock down and against the jig, push block for the last 12", keeper on the jig side away from the fence, never trap a piece between the blade and the fence.');
    expect(s).not.toContain('never against the rip fence alone');
  });
  it('step 2 is "Mill tone boards"; log glue-up has no bar-clamp spacing', () => {
    expect(flat('tumbling-block-3d')).toContain('Step 2: Mill tone boards');
    const g = step('tumbling-block-3d', 'Glue up');
    expect(g).toContain('Clamping: light, even pressure in the 60° cradle or with tape; no bar-clamp spacing.');
    expect(g).not.toContain('Clamp spacing');
  });
});

describe('metric sheets: under 25 mm one decimal, from the true value', () => {
  it('metric and features-combined print 12.5 / 5.0 / 9.5 / 3.2 / 12.7 style values', () => {
    for (const n of ['metric', 'features-combined']) {
      const f = flat(n);
      // no whole-mm main value under 25 mm
      expect(f.match(/(?<![\d.])(?:[1-9]|1\d|2[0-4]) mm \(\d+\.\d\d"\)/g) ?? [], n).toEqual([]);
    }
    expect(flat('metric')).toContain('12.5 mm (0.49") wide × 5.0 mm (0.20") deep');
    expect(flat('metric')).toContain('plus 3.2 mm (0.13")');
    expect(flat('features-combined')).toContain('9.5 mm (0.38") high');
  });
  it('each sub-25 mm metric value is within 0.05 mm of its true size', () => {
    for (const [n, d] of sampleDesigns().filter(([, x]) => x.unitSystem === 'metric')) {
      const truths: number[] = [];
      const walk = (o: unknown): void => {
        if (typeof o === 'number') truths.push(o);
        else if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') Object.values(o).forEach(walk);
        else if (typeof o === 'string') for (const m of o.matchAll(/(?:(\d+)-)?(\d+)(?:\/(\d+))?"\s*\(\d/g)) truths.push((m[3] ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number(m[2])) * 25.4);
      };
      walk(d); walk(JSON.parse(execFileSync('cat', [`styles/${d.style}.json`], { encoding: 'utf-8' })));
      for (const r of calculateRequiredParts(d)) { walk(r.dims); walk(r.strips); truths.push(r.width, r.thickness, r.length); }
      for (const m of flat(n).matchAll(/(?<![\d.~])(\d+\.\d) mm \(\d+\.\d\d"\)/g)) {
        const v = Number(m[1]);
        if (v >= 25) continue;
        expect(truths.some(t => Math.abs(t - v) <= 0.05 + 1e-9), `${n}: ${m[0]}`).toBe(true);
      }
    }
  });
});

describe('banners and defaults', () => {
  it('no planer infeed warning on a router-sled / drum-sander-only step (brick step 4)', () => {
    const s = step('brick', 'Flatten first panel');
    expect(s).toMatch(/router sled or drum sander/);
    expect(s).not.toMatch(/infeed and outfeed/i);
  });
  it('inch boards default to the inch groove: 1/2" (12.7 mm) wide, 3/4" (19.1 mm) from the edge', () => {
    expect(createDefaultBoard().juiceGroove.width).toBe(12.7);
    expect(flat('hand-hole')).toContain('1/2" (12.7 mm) wide');
    expect(flat('hand-hole')).toContain('3/4" (19.1 mm) from the edge');
  });
  it('hand-hole and features-combined are sample designs with JSON exports', () => {
    const names = sampleDesigns().map(([n]) => n);
    expect(names).toEqual(expect.arrayContaining(['hand-hole', 'features-combined']));
    for (const n of ['hand-hole', 'features-combined']) expect(existsSync(`samples/${n}.json`), n).toBe(true);
  });
});

describe('long grain: "Crosscut to final length", no "slice" (Board Master)', () => {
  it('edge-grain cut list and trim step', () => {
    const f = flat('planer-margin');
    expect(f).toContain('Crosscut to final length: 18" (457 mm)');
    expect(calculateRequiredParts(sampleDesigns().find(([n]) => n === 'planer-margin')![1]).map(r => r.part).join(' ')).not.toMatch(/\bslices?\b/);
    expect(f).toMatch(/Set a stop block for the final length, 18" \(457 mm\)/);
  });
});
