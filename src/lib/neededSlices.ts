/**
 * Test helper (Board QA ff4f88d5): the slices a board needs, computed from the board size and catalog values only,
 * never from pattern code. Returns undefined for styles without end-grain slices.
 *  - square grid (checkerboard, end-grain) and brick: catalog panelThicknessEqualsSquareSize / ...CourseHeight, so one
 *    slice covers one panel thickness: ceil(L / panel thickness)
 *  - scrap: panel thickness = T + roughOversize.thickness + flatteningAllowance + sandingLoss: ceil(L / that)
 *  - tumbling: rows = ceil(L / (1.5 side)) + 1 (catalog logStructure), hexPerSlice = ceil(W / (sqrt3 side)) + 1
 */
import { BoardDesign } from '../types';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

export function neededSlices(d: BoardDesign, panelThickness?: number): { slices: number; hexPerSlice?: number } | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- catalog JSON walked by key
  const a = loadStyleCatalog(d.style as CatalogStyleName).cutListAllowances as unknown as Record<string, any>;
  const L = d.dimensions.length, W = d.dimensions.width;
  if (d.style === 'tumbling-block-3d') {
    const ls = /hexPerSlice=ceil\(W\/\(sqrt3\*side\)\)\+(\d+)_rows=ceil\(L\/\(1\.5\*side\)\)\+(\d+)/.exec(a.tumblingBlockMethod.logStructure)!;
    const side = 38.1;
    return { slices: Math.ceil(L / (1.5 * side) - 1e-9) + Number(ls[2]), hexPerSlice: Math.ceil(W / (Math.sqrt(3) * side) - 1e-9) + Number(ls[1]) };
  }
  if (d.style === 'scrap-chaotic') {
    const t = d.dimensions.thickness + a.roughToFinalOversize_mm.thickness + a.flatteningAllowance_mm + a.sandingLoss_mm;
    return { slices: Math.ceil(L / t - 1e-9) };
  }
  const eg = a.endGrainGridRule ?? {};
  if (['checkerboard', 'end-grain'].includes(d.style) && eg.panelThicknessEqualsSquareSize && panelThickness) return { slices: Math.ceil(L / panelThickness - 1e-9) };
  if (d.style === eg.panelThicknessEqualsCourseHeight && panelThickness) return { slices: Math.ceil(L / panelThickness - 1e-9) };
  return undefined;
}
