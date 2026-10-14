/** Tumbling block log model (catalog tumblingBlockMethod): diamond strips per tone, offset logs, slices per log. */
import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard } from './defaults';
import { loadStyleCatalog } from './catalogLoader';

const three = () => {
  const d = createDefaultBoard();
  d.style = 'tumbling-block-3d' as typeof d.style;
  d.species = [{ name: 'Maple', color: '#F5E6D3' }, { name: 'Cherry', color: '#C04000' }, { name: 'Walnut', color: '#654321' }];
  return d;
};

describe('tumbling-block log model', () => {
  it('3 tone rows + logs; logs sized by the blank rule; no strip-set panels, sub-panels or planing', () => {
    const parts = calculateRequiredParts(three());
    const br = loadStyleCatalog('tumbling-block-3d').cutListAllowances.blankRule!;
    const tones = parts.filter(p => /diamond strips/.test(p.part));
    const logs = parts.filter(p => /^Log [A-Z]:/.test(p.part));
    expect(tones.map(p => /\((light|mid|dark)\)/.exec(p.part)![1])).toEqual(['light', 'mid', 'dark']);
    const t = logs[0].tumbling!;
    expect(logs.length).toBe(t.logCount);
    for (const p of tones) expect(p.quantity).toBe(t.stripsPerTone);
    for (const l of logs) {
      expect(l.slices).toBe(t.slicesPerLog);
      expect(l.length).toBeGreaterThanOrEqual(br.blankMinLength_mm);
      expect(l.length).toBeLessThanOrEqual(br.blankMaxLength_mm!);
      expect(l.part).toContain('never planed');
    }
    for (const p of parts) {
      expect(p.part).not.toMatch(/strip-set panel|sub-panel|Planer OK/);
      expect(p.subPanel).toBeUndefined();
    }
  });
});
