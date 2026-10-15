/**
 * Arithmetic over every sample (Board Master / Shop Tester, 98f9ec19 round):
 * (a) every blank, panel or log is at least slices x (slice + kerf) + trim long, inside the catalog's 305-914.4 mm,
 *     and the cut list's slice total equals the crosscut step's count (committed PDFs, pdftotext);
 * (b) strip widths sum to the panel width within the rip/joint allowance;
 * (c) tumbling block: strip thickness = diamond side x sin 60 deg, printed to half a rounding step;
 *     fewer than 3 species is refused and the export writes no files.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdtempSync, writeFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';
import { sampleDesigns } from './sampleDesigns';
import { createDefaultBoard } from './defaults';
import { MM_STEP } from '../utils/format';

const flat = (name: string) => execFileSync('pdftotext', ['-raw', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');

describe('(a) lengths from slices x (slice + kerf) + trim', () => {
  for (const [name, d] of sampleDesigns()) {
    it(name, () => {
      const a = loadStyleCatalog(d.style as CatalogStyleName).cutListAllowances;
      const br = a.blankRule!;
      const rows = calculateRequiredParts(d).filter(r => typeof r.slices === 'number');
      for (const r of rows) {
        const need = r.slices! * (r.sliceThickness! + a.kerf_mm) + 2 * br.crosscutTrim_mm;
        expect(r.length, `${name}: ${r.part}`).toBeGreaterThanOrEqual(need - 1e-6);
        expect(r.length, r.part).toBeGreaterThanOrEqual(br.blankMinLength_mm - 1e-6);
        expect(r.length, r.part).toBeLessThanOrEqual(br.blankMaxLength_mm! + 1e-6);
        expect(r.part).not.toMatch(/\b1 (slices|pieces)\b/);
      }
    });
  }
  it('committed PDFs: the cut list slice total equals the crosscut / angled-cut step count', () => {
    for (const n of ['checkerboard-default', 'checkerboard-16x24', 'end-grain', 'chevron', 'brick', 'metric', 'herringbone', 'scrap-chaotic', 'tumbling-block-3d']) {
      const t = flat(n);
      const cut = t.slice(t.indexOf('Cut List'), t.indexOf('Step 1:'));
      const listed = [...cut.matchAll(/(?:\(never fence\)|hold-down:|crosscut) (\d+) (?:slices?|pieces?) ×/g)].reduce((s, m) => s + Number(m[1]), 0);
      const step = /(?:Slices|Pieces): (\d+) in all/.exec(t);
      expect(step, `${n}: no "Slices: N in all" line`).not.toBeNull();
      expect(listed, n).toBe(Number(step![1]));
    }
  });
});

describe('(b) strip widths sum to the panel width within the rip/joint allowance', () => {
  for (const [name, d] of sampleDesigns()) {
    it(name, () => {
      const a = loadStyleCatalog(d.style as CatalogStyleName).cutListAllowances;
      const allowance = a.roughToFinalOversize_mm.width;
      for (const r of calculateRequiredParts(d).filter(r => r.strips && /strip-set panel/.test(r.part))) {
        const sum = r.strips!.reduce((s, c) => s + c.width * c.count, 0);
        expect(r.width - sum, `${name}: ${r.part.slice(0, 60)}`).toBeGreaterThanOrEqual(-1e-6);
        expect(r.width - sum, `${name}: ${r.part.slice(0, 60)}`).toBeLessThanOrEqual(allowance + 1e-6);
      }
    });
  }
});

describe('(c) tumbling block', () => {
  const tb = sampleDesigns().find(([n]) => n === 'tumbling-block-3d')![1];
  it('strip thickness = diamond side x sin 60 deg; the PDF prints it to half a rounding step', () => {
    const t = calculateRequiredParts(tb).find(r => r.tumbling)!.tumbling!;
    expect(t.stripThickness_mm).toBeCloseTo(t.diamondSide_mm * Math.sin(Math.PI / 3), 9);
    const m = /mill stock \S+ \((\d+(?:\.\d+)?) mm\) thick \(side × sin 60°\)/.exec(flat('tumbling-block-3d'));
    expect(m).not.toBeNull();
    const step = m![1].includes('.') ? 0.1 : MM_STEP;
    expect(Math.abs(Number(m![1]) - t.stripThickness_mm)).toBeLessThanOrEqual(step / 2 + 1e-9);
  });
  it('the sheet prints side, 60/120 deg, logs, slices per log, and never "Planer OK"', () => {
    const f = flat('tumbling-block-3d');
    expect(f).toContain('diamond side 1-1/4" (32 mm), 60°/120° angles');
    const t = calculateRequiredParts(tb).find(r => r.tumbling)!.tumbling!;
    expect(f).toContain(`${t.stripsPerTone} strips per tone ×`);
    expect(f).toContain(`Crosscut ${t.logCount === 1 ? 'the log' : 'each log'} into ${t.slicesPerLog} slices`);
    expect(f).toContain('logs are never planed');
    expect(f).not.toMatch(/Planer OK/i);
    expect(f).toContain('on a right-tilt saw, the jig and keeper are left of the blade');
    expect(f).toContain('Never bevel a strip that is already narrow');
    expect(f).toMatch(/60° cradle or by the masking-tape roll-up method, light clamp pressure/);
  });
  it('fewer than 3 species: refused, and the export CLI writes no files', () => {
    const d = { ...createDefaultBoard(), style: 'tumbling-block-3d' as const };
    expect(() => calculateRequiredParts(d)).toThrow(/needs 3 species/);
    const dir = mkdtempSync(join(tmpdir(), 'tb-'));
    writeFileSync(join(dir, 'design.json'), JSON.stringify(d));
    const r = spawnSync('npx', ['tsx', 'scripts/export.ts', '--design', join(dir, 'design.json'), '--output', join(dir, 'out', 'tb.json')], { encoding: 'utf-8' });
    expect(r.status).not.toBe(0);
    expect(existsSync(join(dir, 'out')) ? readdirSync(join(dir, 'out')) : []).toEqual([]);
  }, 60000);
});
