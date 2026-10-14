/** Export side, every sample design: no blank/panel over blankMaxLength (915 mm, 36"), and per-blank slice counts add up to the board's slices. */
import { describe, it, expect } from 'vitest';
import { buildExportDoc } from '../../scripts/export';
import { generatePattern } from './patterns';
import { createDefaultBoard } from './defaults';
import { BoardDesign } from '../types';

const MAX = 915;
function designs(): Array<[string, BoardDesign]> {
  const out: Array<[string, BoardDesign]> = [];
  const mk = (name: string, f: (d: BoardDesign) => void) => { const d = createDefaultBoard(); f(d); out.push([name, d]); };
  mk('checkerboard-default', () => {});
  mk('checkerboard-16x24', d => { d.dimensions.width = 406.4; d.dimensions.length = 609.6; });
  for (const s of ['end-grain', 'chevron', 'brick-basketweave', 'herringbone', 'scrap-chaotic', 'tumbling-block-3d', 'edge-grain', 'face-grain', 'stripe-inlay']) {
    mk(s, d => { d.style = s as BoardDesign['style']; });
  }
  mk('metric', d => { d.unitSystem = 'metric'; d.dimensions = { width: 300, length: 450, thickness: 40 }; });
  return out;
}
/** Slices a row crosscuts: "N slices" (panels) or "crosscut N slices"/"crosscut N ×" (blanks). */
const slicesOf = (part: string) => Number((/(\d+) slices/.exec(part) ?? /crosscut (\d+) ×/.exec(part) ?? [])[1] ?? NaN);

describe('export: blanks within 915 mm and slice counts add up', () => {
  for (const [name, design] of designs()) {
    it(name, () => {
      const { exportDoc, cutList } = buildExportDoc(design, { exportedAt: '2026-01-01T00:00:00Z', commitSha: 'test' });
      const rows = exportDoc.cutList as Array<{ part: string; length: number | string; panelId?: string; subPanel?: { index: number } }>;
      rows.forEach((r, i) => expect(cutList[i].length, `${name}: ${r.part}`).toBeLessThanOrEqual(MAX));
      const blankRows = rows.filter(r => /strip-set panel|blank/.test(r.part));
      if (blankRows.length === 0) return; // long-grain styles: no crosscut blanks
      const strips = generatePattern(design).strips as Array<{ z?: number }>;
      const panelStyle = blankRows.some(r => /strip-set panel/.test(r.part));
      const total = panelStyle ? new Set(strips.map(s => (s.z ?? 0).toFixed(3))).size : strips.length;
      // sub-panels of one panel share its slices: count each panel once (sub-panel 1)
      const counted = blankRows.filter(r => !r.subPanel || r.subPanel.index === 1);
      const sum = counted.reduce((a, r) => a + slicesOf(r.part), 0);
      expect(sum, `${name}: per-blank slices`).toBe(total);
    });
  }
});
