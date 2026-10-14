import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard } from './defaults';

describe('End-grain panels', () => {
  it('default 12x18 end grain: one slice per row along the length, no 1-slice panels', () => {
    const d = { ...createDefaultBoard(), style: 'end-grain' as const };
    const panels = calculateRequiredParts(d).filter(p => p.part.includes('strip-set panel'));
    const slices = panels.map(p => Number(/ (\d+) slices/.exec(p.part)![1]));
    expect(Math.min(...slices)).toBeGreaterThan(1);
    // sub-panels share the same slices, so each sub-panel set covers all 18 rows (457.2 / 25.4)
    expect(slices[0]).toBe(18);
    for (const p of panels) expect(p.length).toBeLessThanOrEqual(915);
  });
});
