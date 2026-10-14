import { pdfShownText } from './pdfTestText';
import { describe, it, expect } from 'vitest';
import { PdfGenerator, pdfSafe } from './pdf';
import { createDefaultBoard, create16x24Board } from './defaults';
import { calculateRequiredParts } from './lumberPlanner';

describe('PDF text encoding', () => {
  it('maps non-WinAnsi characters', () => {
    expect(pdfSafe('1.663" (≈1 21/32")')).toBe('1.663" (~1 21/32")');
  });
  for (const [name, make] of [['default', createDefaultBoard], ['16x24', create16x24Board]] as const) {
    it(`${name}: no stray "H or ≈ in PDF text`, () => {
      const d = make();
      const raw = Buffer.from(new PdfGenerator(d).generateCutSheet(calculateRequiredParts(d)).output('arraybuffer')).toString('latin1');
      const shown = pdfShownText(raw);
      expect(shown.length).toBeGreaterThan(100);
      expect(shown).not.toMatch(/"H|\(H|≈/);
      expect(shown).toMatch(/Flatten panel 1\/\d+, [\d.]+" \(\d+ mm\) wide/);
    });
  }
});
