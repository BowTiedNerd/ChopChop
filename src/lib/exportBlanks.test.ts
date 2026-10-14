/** Export side, every sample design: no blank/panel over blankMaxLength (catalog blankRule.blankMaxLength_mm, 914.4 mm = 36"), and per-blank slice counts add up to the board's slices. */
import { describe, it, expect } from 'vitest';
import { buildExportDoc } from '../../scripts/export';
import { generatePattern } from './patterns';
import { sampleDesigns as designs } from './sampleDesigns';

import { catalogBlankMax } from './catalogBlankMax';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

describe('export: every blank/panel/log within the catalog min and max length, and slice counts add up', () => {
  for (const [name, design] of designs()) {
    it(name, () => {
      const { exportDoc, cutList } = buildExportDoc(design, { exportedAt: '2026-01-01T00:00:00Z', commitSha: 'test' });
      const br = loadStyleCatalog(design.style as CatalogStyleName).cutListAllowances.blankRule!;
      const rows = exportDoc.cutList as Array<{ part: string; length: number | string; slices?: number; subPanel?: { index: number } }>;
      const cut = rows.filter(r => typeof r.slices === 'number');
      rows.forEach((r, i) => {
        if (typeof r.slices !== 'number') return;
        expect(cutList[i].length, `${name}: ${r.part}`).toBeLessThanOrEqual(catalogBlankMax(design.style));
        expect(cutList[i].length, `${name}: ${r.part}`).toBeGreaterThanOrEqual(br.blankMinLength_mm);
      });
      if (cut.length === 0) return; // no crosscut rows
      const strips = generatePattern(design).strips as Array<{ z?: number }>;
      const tb = (exportDoc as { tumblingBlock?: { logCount: number; slicesPerLog: number } }).tumblingBlock;
      // board slices: one per row along the length; tumbling block: one hexagon per slice (3 diamonds each)
      const total = tb ? Math.ceil(strips.length / 3) : new Set(strips.map(s => (s.z ?? 0).toFixed(3))).size;
      // sub-panels of one panel share its slices: count each panel once (sub-panel 1)
      const sum = cut.filter(r => !r.subPanel || r.subPanel.index === 1).reduce((a, r) => a + r.slices!, 0);
      if (tb) expect(sum, `${name}: log slices`).toBeGreaterThanOrEqual(total);
      else expect(sum, `${name}: per-panel slices`).toBe(total);
    });
  }
});
