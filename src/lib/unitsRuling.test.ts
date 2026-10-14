/** Board Master units ruling, on the committed PDFs: inch sheets print 1/32" fractions with mm in parentheses;
 *  metric sheets print mm with a 2-place decimal inch value, never a fraction. The parenthesized value converts
 *  back to the main value within half the printer's rounding step (derived from the formatter's constants). */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { INCH_FRACTION_DENOMINATOR, METRIC_INCH_DECIMALS } from '../utils/format';
import { readdirSync, readFileSync } from 'fs';

/** Fixed sizes written in the catalog text itself (e.g. 'narrower than 6" (152 mm)') are not printer output. */
const CATALOG = readdirSync('styles').filter(f => f.endsWith('.json')).map(f => readFileSync(`styles/${f}`, 'utf-8').replace(/\\"/g, '"')).join('\n');

const text = (n: string) => execFileSync('pdftotext', ['-raw', `samples/${n}.pdf`, '-'], { encoding: 'utf-8' });
const INCH_TOL_MM = (25.4 / INCH_FRACTION_DENOMINATOR) / 2;          // 1/64" = 0.40 mm
const METRIC_TOL_MM = (25.4 * Math.pow(10, -METRIC_INCH_DECIMALS)) / 2; // 0.005" = 0.127 mm
const frac = (s: string) => { const m = /^(?:(\d+)-)?(?:(\d+)\/(\d+)|(\d+))$/.exec(s)!; return m[4] ? Number(m[4]) : Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]); };

describe('units ruling', () => {
  for (const n of ['checkerboard-default', 'checkerboard-16x24', 'end-grain', 'chevron', 'brick', 'tumbling-block-3d']) {
    it(`${n} (inch sheet): fraction (mm), paren within ${INCH_TOL_MM.toFixed(3)} mm`, () => {
      const pairs = [...text(n).matchAll(/((?:\d+-)?\d+\/\d+|\b\d+)" \((\d+(?:\.\d)?) mm\)/g)];
      expect(pairs.length).toBeGreaterThan(0);
      for (const m of pairs.filter(p => !CATALOG.includes(p[0]))) expect(Math.abs(frac(m[1]) * 25.4 - Number(m[2])), m[0]).toBeLessThanOrEqual(INCH_TOL_MM + 1e-9);
      expect(text(n)).not.toMatch(/\d+\.\d" \(\d+ mm\)/); // no 1-place decimal inches
    });
  }
  for (const n of ['metric', 'features-combined']) {
    it(`${n} (metric sheet): mm (0.00"), paren within ${METRIC_TOL_MM.toFixed(3)} mm, never a fraction`, () => {
      const t = text(n);
      const pairs = [...t.matchAll(/(\d+) mm \((\d+\.\d+)"\)/g)];
      expect(pairs.length).toBeGreaterThan(0);
      for (const m of pairs) {
        expect(m[2].split('.')[1].length, m[0]).toBe(METRIC_INCH_DECIMALS);
        expect(Math.abs(Number(m[2]) * 25.4 - Number(m[1])), m[0]).toBeLessThanOrEqual(METRIC_TOL_MM + 1e-9);
      }
      expect(t).not.toMatch(/\d+ mm \([^)]*\/[^)]*"\)/);
    });
  }
});
