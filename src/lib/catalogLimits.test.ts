import { describe, it, expect, vi, afterEach } from 'vitest';
import * as loader from './catalogLoader';
import { calculateRequiredParts } from './lumberPlanner';
import { createDefaultBoard } from './defaults';

afterEach(() => vi.restoreAllMocks());

function withoutLimit(path: string[]) {
  const real = loader.loadStyleCatalog;
  vi.spyOn(loader, 'loadStyleCatalog').mockImplementation((style) => {
    const c = structuredClone(real(style)) as unknown as Record<string, unknown>;
    let o = c as Record<string, unknown>;
    for (const k of path.slice(0, -1)) o = o[k] as Record<string, unknown>;
    delete o[path[path.length - 1]];
    return c as unknown as ReturnType<typeof real>;
  });
}

describe('Every limit comes from the catalog (no hard-coded fallback)', () => {
  const limits = [
    ['cutListAllowances', 'kerf_mm'],
    ['cutListAllowances', 'planerMaxWidth_mm'],
    ['cutListAllowances', 'jointerMaxWidth_mm'],
    ['cutListAllowances', 'flatteningAllowance_mm'],
    ['cutListAllowances', 'blankRule', 'blankMaxLength_mm'],
    ['cutListAllowances', 'blankRule', 'panelMaxPlanerWidth_mm'],
    ['cutListAllowances', 'blankRule', 'sledMaxWidth_mm'],
  ];
  for (const path of limits) {
    it(`throws when ${path.slice(1).join('.')} is missing`, () => {
      withoutLimit(path);
      expect(() => calculateRequiredParts(createDefaultBoard())).toThrow(new RegExp(path[path.length - 1]));
    });
  }
});
