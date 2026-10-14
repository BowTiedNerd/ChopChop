/**
 * Inch sheets: every printed mm value under 25 mm keeps one decimal of the TRUE size (29/32" (23.4 mm) for a
 * 23.37 mm rip, never 23.0 from the rounded fraction). Each one must be within 0.05 mm of a true field value:
 * the cut list's numbers (dims, strip widths, sizes), the design, and the catalog's numbers and quoted sizes.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { calculateRequiredParts } from './lumberPlanner';
import { sampleDesigns } from './sampleDesigns';

const PDF: Record<string, string> = { 'brick-basketweave': 'brick' };
const SKIP = new Set(['metric', 'blank-limit-914.4', 'edge-grain', 'face-grain', 'stripe-inlay']); // no committed PDF / mm-first sheet

function truths(style: string, d: ReturnType<typeof sampleDesigns>[number][1]): number[] {
  const out: number[] = [];
  const walk = (o: unknown): void => {
    if (typeof o === 'number') out.push(o);
    else if (typeof o === 'string') {
      // quoted catalog sizes: the fraction is the true size
      for (const m of o.matchAll(/(?:(\d+)-)?(\d+)(?:\/(\d+))?"\s*\(\d/g)) out.push((m[3] ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number(m[2])) * 25.4);
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk(JSON.parse(readFileSync(`styles/${style}.json`, 'utf-8')));
  walk(d);
  for (const r of calculateRequiredParts(d)) {
    walk(r.dims); walk(r.strips); walk(r.tumbling);
    out.push(r.width, r.thickness, r.length);
    if (r.sliceThickness) out.push(r.sliceThickness);
  }
  return out;
}

describe('inch sheets: mm under 25 mm is the true size to one decimal', () => {
  for (const [name, d] of sampleDesigns()) {
    if (SKIP.has(name)) continue;
    it(name, () => {
      const t = execFileSync('pdftotext', ['-raw', `samples/${PDF[name] ?? name}.pdf`, '-'], { encoding: 'utf-8' }).replace(/\s+/g, ' ');
      const ts = truths(d.style, d);
      const bad: string[] = [];
      let n = 0;
      for (const m of t.matchAll(/(?<!~)(?:\d+-)?\d+(?:\/\d+)?" \((\d+\.\d) mm\)/g)) {
        const mm = Number(m[1]);
        if (mm >= 25) continue;
        n++;
        if (!ts.some(v => Math.abs(v - mm) <= 0.05 + 1e-9)) bad.push(m[0]);
      }
      expect(n, name).toBeGreaterThan(0);
      expect([...new Set(bad)], name).toEqual([]);
    });
  }
});
