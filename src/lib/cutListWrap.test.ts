/** Shop Tester C: every cut-list cell wraps inside its own column. */
import { describe, it, expect } from 'vitest';
import { PdfGenerator } from './pdf';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard } from './defaults';

const COLS = [80, 8, 20, 20, 20, 22];

describe('cut list cells never overflow their column', () => {
  for (const unit of ['imperial', 'metric'] as const) {
    it(unit, () => {
      const design = createDefaultBoard();
      design.unitSystem = unit;
      const gen = new PdfGenerator(design);
      const doc = gen.getDocument();
      const calls: Array<{ t: string; x: number; w: number }> = [];
      const orig = doc.text.bind(doc);
      let inTable = false;
      (doc as unknown as { text: unknown }).text = (t: string | string[], x: number, y: number, o?: unknown) => {
        if (t === 'Cut List') inTable = true;
        else if (typeof t === 'string' && /^Step 1:/.test(t)) inTable = false;
        if (inTable && typeof t === 'string' && doc.getFontSize() === 8) calls.push({ t, x, w: doc.getTextWidth(t) });
        return orig(t as string, x, y, o as never);
      };
          gen.generateCutSheet(calculateRequiredParts(design));
      expect(calls.length).toBeGreaterThan(0);
      const starts = COLS.map((_, i) => 20 + COLS.slice(0, i).reduce((a, b) => a + b, 0));
      for (const c of calls) {
        const col = starts.findIndex(s => Math.abs(s - c.x) < 0.01);
        expect(col, c.t).toBeGreaterThanOrEqual(0);
        expect(c.w, `"${c.t}" in column ${col}`).toBeLessThanOrEqual(COLS[col] - 2 + 0.01);
      }
    });
  }
});
