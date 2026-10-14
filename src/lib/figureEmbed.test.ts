import { describe, it, expect } from 'vitest';
import { PdfGenerator } from './pdf';
import { createDefaultBoard, create16x24Board } from './defaults';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';
import { BoardStyle } from '../types';

const styles: BoardStyle[] = ['checkerboard', 'chevron', 'end-grain'] as BoardStyle[];

describe('Step figures are embedded as images', () => {
  for (const style of styles) {
    it(`${style}: one image per step figure, no [Step Diagram]`, () => {
      const d = { ...createDefaultBoard(), style };
      const raw = Buffer.from(new PdfGenerator(d).generateCutSheet(calculateRequiredParts(d)).output('arraybuffer')).toString('latin1');
      expect(raw).not.toContain('[Step Diagram]');
      const images = (raw.match(/\/Subtype \/Image/g) ?? []).length;
      const withFigure = loadStyleCatalog(style as unknown as CatalogStyleName).steps.filter(s => s.figureType).length;
      expect(withFigure).toBeGreaterThan(0);
      expect(images).toBeGreaterThanOrEqual(withFigure);
    });
  }
  it('16x24 checkerboard embeds figures', () => {
    const d = create16x24Board();
    const raw = Buffer.from(new PdfGenerator(d).generateCutSheet(calculateRequiredParts(d)).output('arraybuffer')).toString('latin1');
    expect(raw).not.toContain('[Step Diagram]');
    expect((raw.match(/\/Subtype \/Image/g) ?? []).length).toBeGreaterThan(0);
  });
});
