/** Board Master units ruling, checked against the TRUE exported dimensions:
 *  inch sheets: fraction to 1/32" (within half its step, 1/64", of the true value) and whole mm (within 0.5 mm);
 *  metric sheets: whole mm (within 0.5 mm) and a 2-place decimal inch value (within 0.005"), never a fraction.
 *  Each printed cut-list cell must also appear in the committed sample PDF. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { shopSize } from '../utils/format'; // the function under test only; tolerances are hard-coded below
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard, create16x24Board, createMetricBoard } from './defaults';
import { BoardDesign } from '../types';
import { readdirSync, readFileSync } from 'fs';

// Units ruling tolerances, hard-coded (Board QA): never derived from format.ts constants
const FRAC_TOL_IN = 1 / 64;
const DEC_TOL_IN = 0.005;
const MM_TOL = 0.5;
const MM_SMALL_TOL = 0.05;
const MM_WHOLE_FROM = 25;
const VERBATIM_CATALOG_KEYS = ['Final pass depth'];
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
            expect(m![3].length, printed).toBe(2);
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

/** Catalog keys holding fixed text printed verbatim (the '~1/64" (0.4 mm)' final-pass note): exempt by key. */
const EXEMPT_KEYS = new Set<string>([...VERBATIM_CATALOG_KEYS, 'notes']);

type Quoted = { file: string; path: string; text: string; at: number; pair: string; catalog: Record<string, unknown> };
/** Every inch-first pair quoted in catalog text, with the key path it sits under (exempt keys and their fixed value skipped). */
export function quotedCatalogPairs(dir = 'styles'): Quoted[] {
  const out: Quoted[] = [];
  for (const file of readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const catalog = JSON.parse(readFileSync(`${dir}/${file}`, 'utf-8'));
    const fixed = new Set<string>();
    const strings: Array<[string, string]> = [];
    const walk = (o: unknown, path: string, key: string): void => {
      if (EXEMPT_KEYS.has(key)) { if (typeof o === 'string') fixed.add(o); return; }
      if (typeof o === 'string') strings.push([path, o]);
      else if (Array.isArray(o)) o.forEach(x => walk(x, `${path}[]`, key));
      else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, `${path}.${k}`, k));
    };
    walk(catalog, '', '');
    // the fixed value of an exempt key is also exempt where step prose repeats it verbatim
    const vals = [...fixed].filter(v => v.length < 40);
    for (const [path, raw] of strings) {
      const text = vals.reduce((acc, v) => acc.split(v).join(''), raw);
      for (const m of text.matchAll(/~?(?:\d+-)?\d+(?:\/\d+)?"\s*\(\d+(?:\.\d+)? mm\)/g)) {
        out.push({ file, path, text, at: m.index!, pair: m[0], catalog });
      }
    }
  }
  return out;
}

/**
 * Each quoted pair, mapped explicitly to the catalog field it states: [pair, key path, text just before the pair, field].
 * field null = the catalog has no number for it (the fraction itself is the true size). An unmapped pair fails the test.
 */
const QUOTED_FIELDS: Array<[string, RegExp, RegExp, string | null]> = [
  ['1/8" (3 mm)', /\.steps\[\]\.description$/, /final thickness plus $/, 'cutListAllowances.roughToFinalOversize_mm.thickness'],
  ['1/8" (3 mm)', /\.steps\[\]\.description$/, /default: $/, null],
  ['1/8" (3 mm)', /\.settings\.Bit$/, /^$/, null],
  ['1/8" (3.2 mm)', /\.cutListAllowances\.kerf_text$/, /^$/, 'cutListAllowances.kerf_mm'],
  ['12" (305 mm)', /\.cutListAllowances\.blankRule\.panelWidthText$/, /no wider than $/, 'cutListAllowances.planerMaxWidth_mm'],
  ['12" (305 mm)', /\.steps\[\]\.description$/, /at least $/, 'cutListAllowances.minPieceLength_mm.planerJointer'],
  ['12" (305 mm)', /\.steps\[\]\.safetyBanners\[\]$/, /joint stock shorter than $/, 'cutListAllowances.jointerMinimum_mm.length'],
  ['12" (305 mm)', /\.steps\[\]\.safetyBanners\[\]$/, /Feed only boards at least $/, 'cutListAllowances.planerMinimum_mm.length'],
  ['12" (305 mm)', /\.steps\[\]\.description$/, /no wider than $/, 'cutListAllowances.planerMaxWidth_mm'],
  ['1/2" (12.7 mm)', /\.features\.handHole\.(bit|text)$/, /(^|a )$/, 'features.handHole.endRadius_mm'],
  ['1/2" (12.7 mm)', /\.steps\[\]\.safetyBanners\[\]$/, /thinner than $/, null],
  ['6" (152 mm)', /\.steps\[\]\.(description|safetyBanners)(\[\])?$/, /(Cut pieces of|shorter than) $/, 'cutListAllowances.minPieceLength_mm.tableSawFreehand'],
  ['6" (152 mm)', /\.steps\[\]\.safetyBanners\[\]$/, /narrower than $/, null],
  ['8" (203 mm)', /\.settings\.Clamp spacing$/, /about $/, null],
  ['24" (610 mm)', /\.cutListAllowances\.blankRule\.panelWidthText$/, /over $/, 'cutListAllowances.blankRule.sledMaxWidth_mm'],
  ['36" (914 mm)', /\.cutListAllowances\.blankRule\.text$/, /exceeds $/, 'cutListAllowances.blankRule.blankMaxLength_mm'],
  ['4" (102 mm)', /\.features\.fingerGrip\.text$/, /grips $/, 'features.fingerGrip.length_mm'],
  ['4" (102 mm)', /\.features\.handHole\.text$/, /slot $/, 'features.handHole.length_mm'],
  ['1" (25 mm)', /\.features\.handHole\.text$/, /long x $/, 'features.handHole.width_mm'],
  ['1-1/2" (38 mm)', /\.features\.handHole\.text$/, /centred $/, 'features.handHole.edgeInset_mm'],
];
const field = (o: Record<string, unknown>, path: string): unknown => path.split('.').reduce<unknown>((a, k) => (a as Record<string, unknown> | undefined)?.[k], o);

/** Mismatches between quoted pairs and their mapped catalog fields (exported for the rule-off script). */
export function quotedPairMismatches(dir = 'styles'): string[] {
  const bad: string[] = [];
  for (const q of quotedCatalogPairs(dir)) {
    const before = q.text.slice(Math.max(0, q.at - 40), q.at);
    const map = QUOTED_FIELDS.find(([pair, path, ctx]) => pair === q.pair && path.test(q.path) && ctx.test(before));
    if (!map) { bad.push(`${q.file} ${q.path}: unmapped ${q.pair} after "${before}"`); continue; }
    const m = /^~?(?:(\d+)-)?(\d+)(?:\/(\d+))?"\s*\((\d+(?:\.(\d+))?) mm\)$/.exec(q.pair)!;
    const inMm = (m[3] ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number(m[2])) * 25.4;
    const mm = Number(m[4]);
    let t = inMm;
    if (map[3]) {
      const v = field(q.catalog, map[3]);
      if (typeof v !== 'number') { bad.push(`${q.file}: ${map[3]} missing for ${q.pair}`); continue; }
      t = v;
    }
    const inTol = 25.4 / 64;
    const mmTol = Math.pow(10, -(m[5]?.length ?? 0)) / 2;
    if (Math.abs(inMm - t) > inTol + 1e-9 || Math.abs(mm - t) > mmTol + 1e-9) bad.push(`${q.file} ${q.pair} vs ${map[3]} = ${t}`);
  }
  return [...new Set(bad)];
}

describe('verbatim final-pass note (catalog settings["Final pass depth"])', () => {
  const note = (): string => (JSON.parse(readFileSync('styles/checkerboard.json', 'utf-8')).steps as Array<{ settings?: Record<string, string> }>)
    .map(st => st.settings?.['Final pass depth']).find(Boolean)!;
  it('is printed exactly as the catalog writes it on inch and metric sheets (setting and step text)', () => {
    expect(note()).toBe('~1/64" (0.4 mm)');
    for (const nm of ['checkerboard-default', 'metric']) {
      const t = pdf(nm).replace(/\s+/g, ' ');
      expect(t, nm).toContain(`Final pass depth: ${note()}`);
      expect(t, nm).toContain(`Take ${note()} passes`);
    }
  });
  it('is exempt from the quoted-pair check by its key: an unmapped ~1/64" pair would otherwise fail', () => {
    expect(QUOTED_FIELDS.some(([pair]) => pair.startsWith('~'))).toBe(false);
    expect(EXEMPT_KEYS.has('Final pass depth')).toBe(true);
  });
});

describe('units ruling: quoted catalog text agrees with catalog values (no exception for "about")', () => {
  it('each quoted pair is mapped to its catalog field: fraction within 1/64", mm within half its printed step', () => {
    expect(quotedCatalogPairs().length).toBeGreaterThan(0);
    expect(quotedPairMismatches()).toEqual([]);
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
