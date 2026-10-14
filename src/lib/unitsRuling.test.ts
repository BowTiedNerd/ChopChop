/** Board Master units ruling, checked against the TRUE exported dimensions:
 *  inch sheets: fraction to 1/32" (within half its step, 1/64", of the true value) and whole mm (within 0.5 mm);
 *  metric sheets: whole mm (within 0.5 mm) and a 2-place decimal inch value (within 0.005"), never a fraction.
 *  Each printed cut-list cell must also appear in the committed sample PDF. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { INCH_FRACTION_DENOMINATOR, METRIC_INCH_DECIMALS, MM_STEP, MM_WHOLE_FROM, MM_SMALL_DECIMALS, shopSize, VERBATIM_CATALOG_KEYS } from '../utils/format';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard, create16x24Board, createMetricBoard } from './defaults';
import { BoardDesign } from '../types';
import { readdirSync, readFileSync } from 'fs';

const FRAC_TOL_IN = 1 / INCH_FRACTION_DENOMINATOR / 2;
const DEC_TOL_IN = Math.pow(10, -METRIC_INCH_DECIMALS) / 2;
const MM_TOL = MM_STEP / 2;                                   // whole mm: 0.5 mm
const MM_SMALL_TOL = Math.pow(10, -MM_SMALL_DECIMALS) / 2;    // one decimal under 25 mm: 0.05 mm
const frac = (s: string) => { const m = /^(?:(\d+)-)?(?:(\d+)\/(\d+)|(\d+))$/.exec(s); if (!m) throw new Error(`not a fraction: ${s}`); return m[4] ? Number(m[4]) : Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]); };
const pdf = (n: string) => execFileSync('pdftotext', ['-raw', `samples/${n}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');

const samples: Array<[string, () => BoardDesign]> = [
  ['checkerboard-default', createDefaultBoard],
  ['checkerboard-16x24', () => { const d = create16x24Board(); d.juiceGroove.enabled = true; return d; }],
  ['chevron', () => { const d = createDefaultBoard(); d.style = 'chevron'; return d; }],
  ['brick', () => { const d = createDefaultBoard(); d.style = 'brick-basketweave'; return d; }],
  ['metric', createMetricBoard],
];

describe('units ruling: printed values vs true dimensions', () => {
  for (const [name, mk] of samples) {
    it(name, () => {
      const d = mk();
      const text = pdf(name);
      let checked = 0;
      for (const item of calculateRequiredParts(d)) {
        for (const trueMm of [item.width, item.thickness, item.length]) {
          const printed = shopSize(trueMm, d.unitSystem);
          if (d.unitSystem === 'metric') {
            const m = /^(\d+) mm \((\d+\.(\d+))"\)$/.exec(printed);
            expect(m, printed).not.toBeNull();
            expect(m![3].length, printed).toBe(METRIC_INCH_DECIMALS);
            expect(Math.abs(Number(m![1]) - trueMm), `${printed} vs ${trueMm}`).toBeLessThanOrEqual(MM_TOL + 1e-9);
            expect(Math.abs(Number(m![2]) - trueMm / 25.4), `${printed} vs ${trueMm}`).toBeLessThanOrEqual(DEC_TOL_IN + 1e-9);
          } else {
            const m = /^([\d/-]+)" \((\d+(?:\.\d+)?) mm\)$/.exec(printed);
            expect(m, printed).not.toBeNull();
            expect(Math.abs(frac(m![1]) - trueMm / 25.4), `${printed} vs ${trueMm}`).toBeLessThanOrEqual(FRAC_TOL_IN + 1e-9);
            const tol = trueMm >= MM_WHOLE_FROM ? MM_TOL : MM_SMALL_TOL;
            expect(Math.abs(Number(m![2]) - trueMm), `${printed} vs ${trueMm}`).toBeLessThanOrEqual(tol + 1e-9);
            expect(m![2], printed).not.toBe('0');
          }
          // the committed PDF prints this cell (cells may wrap, so compare without spaces)
          expect(text.replace(/ /g, ''), `${name}: ${printed}`).toContain(printed.replace(/ /g, ''));
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(0);
    });
  }
  it('inch sheets print no decimal inches', () => {
    for (const n of ['checkerboard-default', 'checkerboard-16x24', 'chevron', 'brick', 'end-grain', 'tumbling-block-3d']) {
      expect(pdf(n), n).not.toMatch(/\d+\.\d+" \(\d/);
      expect(pdf(n), n).not.toMatch(/\(0 mm\)/);
    }
  });
});

/** Every numeric value in the catalog (the true sizes its prose quotes). */
function catalogTruths(): number[] {
  const vals = new Set<number>();
  const walk = (o: unknown): void => {
    if (typeof o === 'number' && o > 0) vals.add(o);
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  for (const f of readdirSync('styles').filter(x => x.endsWith('.json'))) walk(JSON.parse(readFileSync(`styles/${f}`, 'utf-8')));
  return [...vals];
}
/** Catalog keys holding fixed text printed verbatim (the '~1/64" (0.4 mm)' final-pass note): exempt by key. */
const EXEMPT_KEYS = new Set<string>([...VERBATIM_CATALOG_KEYS, 'notes']);
/** Every string in the catalog, except those under an exempt key. */
function catalogStrings(): string[] {
  const out: string[] = [];
  const walk = (o: unknown, key = ''): void => {
    if (EXEMPT_KEYS.has(key)) { if (typeof o === 'string') fixed.add(o); return; }
    if (typeof o === 'string') out.push(o);
    else if (Array.isArray(o)) o.forEach(x => walk(x, key));
    else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, k));
  };
  const fixed = new Set<string>();
  for (const f of readdirSync('styles').filter(x => x.endsWith('.json'))) walk(JSON.parse(readFileSync(`styles/${f}`, 'utf-8')));
  // the fixed value of an exempt key (e.g. settings['Final pass depth']) is also exempt where step prose repeats it
  const vals = [...fixed].filter(v => v.length < 40);
  return out.map(t => vals.reduce((acc, v) => acc.split(v).join(''), t));
}

describe('units ruling: quoted catalog text agrees with catalog values (no exception for "about")', () => {
  it('each inch-first pair: fraction within 1/64" and mm within half its printed step of the true value', () => {
    const truths = catalogTruths();
    const bad: string[] = [];
    let n = 0;
    for (const s of catalogStrings()) {
      for (const m of s.matchAll(/(~?)(?:(\d+)-)?(\d+)(?:\/(\d+))?"\s*\((\d+(?:\.(\d+))?) mm\)/g)) {
        n++;
        const inMm = (m[4] ? Number(m[2] ?? 0) + Number(m[3]) / Number(m[4]) : Number(m[3])) * 25.4;
        const mm = Number(m[5]);
        const inTol = 25.4 / INCH_FRACTION_DENOMINATOR / 2;
        const mmTol = Math.pow(10, -(m[6]?.length ?? 0)) / 2;
        // the true value both printed numbers must round from: the nearest catalog value within 3 mm, else the fraction itself
        const near = truths.filter(t => Math.abs(t - mm) <= 3 && Math.abs(t - inMm) <= 3)
          .sort((a, b) => Math.abs(a - mm) + Math.abs(a - inMm) - Math.abs(b - mm) - Math.abs(b - inMm))[0];
        const t = near ?? inMm;
        if (Math.abs(inMm - t) > inTol + 1e-9 || Math.abs(mm - t) > mmTol + 1e-9) bad.push(`${m[0]} (true ${t} mm)`);
      }
    }
    expect(n).toBeGreaterThan(0);
    // draft5n (frozen) still quotes three sizes whose catalog value is 0.4 mm off the fraction (> 1/64"):
    // jointerMaxWidth_mm 152 vs 6", sledMaxWidth_mm 610 vs 24", handHole width_mm 25 vs 1". Reported to Board Master;
    // any other mismatch (e.g. draft5m's 4" (100 mm) vs length_mm 101.6) fails here.
    const KNOWN_DRAFT5N = ['6" (152 mm) (true 152 mm)', '24" (610 mm) (true 610 mm)', '1" (25 mm) (true 25 mm)'];
    expect([...new Set(bad)].sort()).toEqual([...KNOWN_DRAFT5N].sort());
  });
  it('the printed sheets re-print catalog pairs to the ruling: inch sheets mm one decimal under 25 mm, metric sheets mm-first', () => {
    for (const nm of ['checkerboard-default', 'brick', 'chevron']) {
      expect(pdf(nm), nm).not.toMatch(/(?:^|[^\d.])(?:\d+-)?\d+(?:\/\d+)?" \((?:[0-9]|1[0-9]|2[0-4]) mm\)/);
    }
    // the verbatim final-pass note (settings['Final pass depth']) is fixed catalog text, printed as written
    const fixedNote = JSON.parse(readFileSync('styles/checkerboard.json', 'utf-8')).steps.map((st: { settings?: Record<string, string> }) => st.settings?.['Final pass depth']).find(Boolean) as string;
    expect(pdf('metric').split(fixedNote).join('')).not.toMatch(/\d+(?:\/\d+)?" \(\d+(?:\.\d+)? mm\)/);
  });
});
