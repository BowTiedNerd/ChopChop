/** Board Visuals: tumbling-block strips are counted per row (offset rows must not double the sub-panel count). */
import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard } from './defaults';

describe('tumbling-block sub-panel count', () => {
  it('12" board: 12 strips across, 2 sub-panels of 6', () => {
    const d = createDefaultBoard();
    d.style = 'tumbling-block-3d' as typeof d.style;
    const parts = calculateRequiredParts(d).map(p => p.part).filter(p => p.includes('strip-set panel'));
    const subs = new Set(parts.map(p => /sub-panel \d\/(\d)/.exec(p)?.[1]));
    expect([...subs]).toEqual(['2']);
    for (const p of parts) expect(p).toContain('glue 6 whole strips');
  });
});
