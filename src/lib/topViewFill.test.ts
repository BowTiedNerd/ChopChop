import { describe, it, expect } from 'vitest';
import { generatePattern } from './patterns';
import { createDefaultBoard, create16x24Board } from './defaults';

describe('Checkerboard pattern fills the board', () => {
  for (const d of [createDefaultBoard(), create16x24Board()]) {
    it(`${d.dimensions.width}x${d.dimensions.length}: rows reach the full length`, () => {
      const p = generatePattern({ ...d, style: 'checkerboard' });
      const maxZ = Math.max(...p.strips.map(s => s.z + s.depth));
      const maxX = Math.max(...p.strips.map(s => s.x + s.width));
      expect(maxZ).toBeCloseTo(d.dimensions.length, 6);
      expect(maxX).toBeCloseTo(d.dimensions.width, 6);
    });
  }
});
