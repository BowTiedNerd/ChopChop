import { describe, it, expect } from 'vitest';
import { calculateRequiredParts, optimizeCuttingPlan, createDefaultStock } from './lumberPlanner';
import { createDefaultBoard } from './defaults';

describe('Optimize Cutting Plan with default stock', () => {
  it('produces a non-empty cut list with >0% utilisation and plans every strip', () => {
    const d = createDefaultBoard();
    const parts = calculateRequiredParts(d);
    const before = JSON.stringify(parts);
    const r = optimizeCuttingPlan(parts, createDefaultStock(), d.style);
    expect(r.utilizationPercentage).toBeGreaterThan(0);
    expect(r.cutList.length).toBeGreaterThan(0);
    const needed = parts.flatMap(p => p.strips ?? []).reduce((n, s) => n + s.count, 0);
    const planned = r.cutPlans.flatMap(c => c.cuts).reduce((n, c) => n + c.quantity, 0);
    expect(needed).toBeGreaterThan(0);
    expect(planned).toBe(needed);
    expect(JSON.stringify(parts)).toBe(before); // caller's parts not mutated
  });
});
