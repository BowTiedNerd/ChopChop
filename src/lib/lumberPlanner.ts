import { sheetLen, shopSize } from '../utils/format';
/**
 * Lumber planner and milling/cutting optimizer
 * Calculates optimal cutting from user's available stock
 */

import { BoardDesign, CutListItem } from '../types';
import { generatePattern } from './patterns';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

export interface StockBoard {
  id: string;
  species: string;
  width: number;       // mm
  thickness: number;   // mm
  length: number;      // mm
  quantity: number;
  pricePerBF?: number | null; // May be null per spec
}

export interface CutPlan {
  stockBoard: StockBoard;
  cuts: CutItem[];
  wastePercentage: number;
  utilizationPercentage: number;
}

export interface CutItem {
  part: string;
  width: number;
  thickness: number;
  length: number;
  quantity: number;
  species: string;
  /** For glued panels: the single-species strips ripped from stock to make it */
  strips?: Array<{ species: string; width: number; count: number }>;
  /** Strip-set panels: label shared by the cut list and the steps, e.g. "Panel A (1 of 2 by length), sub-panel 1/2" */
  panelLabel?: string;
  stripOrder?: string;
  planerOk?: boolean;
  sliceThickness?: number;
  /** Panel id shared by all sub-panel rows of one panel (A, B, ...) */
  panelId?: string;
  /** Every derived size the part text prints, in mm (true values for unit checks) */
  dims?: Record<string, number>;
  subPanel?: { index: number; count: number };
  /** Tumbling block (catalog tumblingBlockMethod): numbers for the export and Board Visuals */
  tumbling?: { cutHeight_mm: number; bladeAbove_mm: number; bladeHeight_mm: number; sledMax_mm: number; logWidth_mm: number; tiles: number; cols: number; tileRows: number; hexPerSlice: number; spare: number; offset_mm: number; diamondSide_mm: number; stripThickness_mm: number; stripsPerTone: number; logCount: number; logLength_mm: number; slicesPerLog: number; tones: { light: string; mid: string; dark: string } };
  /** Slices crosscut from this blank/panel/log (absent when the row is not crosscut) */
  slices?: number;
}

/** Planer OK on a mixed-grain or end-grain sheet applies to the long-grain strip-set only (Board Master minor 10). */
/** Board Master ruling, printed verbatim on the tumbling bevel rip (replaces "never against the rip fence alone"). */
export const TUMBLING_BEVEL_WARNING = 'Featherboard holding the stock down and against the jig, push block for the last 12", keeper on the jig side away from the fence, never trap a piece between the blade and the fence.';

export const STRIP_SET_PREFIX = 'Strip-set (long grain, before slicing): ';

/** Tumbling block: the design's diamond side (catalog diamondSideFrom: designDiamondSide) = half the 3" block. */

interface TumblingMethod {
  minSpecies: number; tones: string[]; diamondAngles_deg: number[]; bladeTilt_deg: number;
  stripThickness: string; minStockWidthForBevelRip_mm: number; logFlatten: string; sliceThickness: string; finalFlatten: string;
  tiltDirection: string; glueUp: string; logBlankRules: string; logStructure: string; stripsPerTone: string; rowGlueUp: string;
  hexOrientation: string; diamondSide_mm: { default: number; min: number; max: number }; logCutHeight: string; logWidth: string;
}

/** Catalog tumblingBlockMethod enums -> printed text (unknown values are refused, never guessed). */
export const TUMBLING_GLUE_UP: Record<string, string> = {
  '60degCradleOrTapeRollUp_lightClampPressure': 'in a 60° cradle or by the masking-tape roll-up method, light clamp pressure only',
};
export const TUMBLING_TILT: Record<string, string> = {
  jigAndKeeperOnSideBladeTiltsAwayFrom_rightTiltSawJigLeftOfBlade: 'the thin-rip jig and the keeper go on the side the blade tilts away from: on a right-tilt saw, the jig and keeper are left of the blade',
};
export function catalogText(map: Record<string, string>, key: string, field: string): string {
  const t = map[key];
  if (!t) throw new Error(`Unsupported tumblingBlockMethod.${field}: ${key}`);
  return t;
}
/** logBlankRules "sameAsBlank_305to914.4mm_length>=slices*(slice+kerf)+50": min, max and trim, checked against blankRule. */
export function logBlankLimits(rule: string, blank: { blankMinLength_mm: number; blankMaxLength_mm?: number; crosscutTrim_mm: number }) {
  const m = /^sameAsBlank_(\d+(?:\.\d+)?)to(\d+(?:\.\d+)?)mm_length>=slices\*\(slice\+kerf\)\+(\d+(?:\.\d+)?)$/.exec(rule);
  if (!m) throw new Error(`Unsupported tumblingBlockMethod.logBlankRules: ${rule}`);
  const [min, max, trim] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (min !== blank.blankMinLength_mm || max !== blank.blankMaxLength_mm || trim !== 2 * blank.crosscutTrim_mm) {
    throw new Error(`tumblingBlockMethod.logBlankRules ${rule} disagrees with blankRule`);
  }
  return { min, max, trim };
}

/** Tumbling block per catalog tumblingBlockMethod: diamond strips by tone, offset logs, slices per log. */
/** Catalog tumblingBlockMethod.logCutHeight / logWidth (draft5t), parsed; unknown wording is an error. */
export function tumblingLogRules(m: Pick<TumblingMethod, 'logCutHeight' | 'logWidth' | 'hexOrientation'>) {
  const ch = /^(\d+(?:\.\d+)?)\*side_mustBe<=([\d.]+)mm_tableSawSled_bladeHeight=cutHeight\+([\d.]+)$/.exec(m.logCutHeight);
  if (!ch) throw new Error(`Unsupported tumblingBlockMethod.logCutHeight: ${m.logCutHeight}`);
  const lw = /^hexPerSlice\*sqrt3\*side_upToSledMaxWidth_([\d.]+)_neverSplitRow_printSledWidth$/.exec(m.logWidth);
  if (!lw) throw new Error(`Unsupported tumblingBlockMethod.logWidth: ${m.logWidth}`);
  if (!/^pointyTop_/.test(m.hexOrientation)) throw new Error(`Unsupported tumblingBlockMethod.hexOrientation: ${m.hexOrientation}`);
  return { cutMult: Number(ch[1]), cutMax: Number(ch[2]), bladeAbove: Number(ch[3]), sledMax: Number(lw[1]) };
}

/** Log cross-section (catalog logWidth / logCutHeight): width = hexPerSlice x sqrt3 x side (pointy-top hexagons
 *  side by side), cut height = cutMult x side (point to point). */
export function tumblingLogSection(hexPerSlice: number, side: number, cutMult: number) {
  return { width: hexPerSlice * Math.sqrt(3) * side, height: cutMult * side };
}

/** Diamond side: the design field, else the catalog default; outside catalog min..max is an error. */
export function tumblingDiamondSide(design: BoardDesign, m: Pick<TumblingMethod, 'diamondSide_mm'>): number {
  const r = m.diamondSide_mm;
  const side = design.tumblingDiamondSide_mm ?? r.default;
  if (!(side >= r.min - 1e-9 && side <= r.max + 1e-9)) throw new Error(`Tumbling block diamond side ${side} mm is outside ${r.min}-${r.max} mm`);
  return side;
}

export function tumblingBlockParts(design: BoardDesign, m: TumblingMethod, a: { kerf_mm: number; flatteningAllowance_mm: number; blankRule: { blankMinLength_mm: number; blankMaxLength_mm?: number; crosscutTrim_mm: number } }): CutItem[] {
  if (design.species.length < m.minSpecies) {
    throw new Error(`Tumbling block needs ${m.minSpecies} species (${m.tones.join(', ')}); only ${design.species.length} chosen`);
  }
  if (m.stripThickness !== 'diamondSide*sin(60deg)') throw new Error(`Unsupported tumblingBlockMethod.stripThickness: ${m.stripThickness}`);
  if (m.sliceThickness !== 'boardThickness+flatteningAllowance_mm') throw new Error(`Unsupported tumblingBlockMethod.sliceThickness: ${m.sliceThickness}`);
  const u = design.unitSystem;
  const side = tumblingDiamondSide(design, m);
  const lr = tumblingLogRules(m);
  const stripT = side * Math.sin(Math.PI / 3);
  const slice = design.dimensions.thickness + a.flatteningAllowance_mm;
  const { min, max, trim } = logBlankLimits(m.logBlankRules, a.blankRule);
  const glue = catalogText(TUMBLING_GLUE_UP, m.glueUp, 'glueUp');
  catalogText(TUMBLING_TILT, m.tiltDirection, 'tiltDirection');
  if (m.logFlatten !== 'none_logsAreNotPlaned') throw new Error(`Unsupported tumblingBlockMethod.logFlatten: ${m.logFlatten}`);
  // catalog logStructure (draft5s, Board Master row-strip method): one hexagon row per log; each slice is a whole row
  // strip of hexPerSlice hexagons; slices = rows + 1 spare; stripsPerTone = hexPerSlice
  const ls = /^oneHexRowPerLog_hexPerSlice=ceil\(W\/\(sqrt3\*side\)\)\+(\d+)_rows=ceil\(L\/\(1\.5\*side\)\)\+(\d+)_slices=rows\+(\d+)spare$/.exec(m.logStructure);
  if (!ls) throw new Error(`Unsupported tumblingBlockMethod.logStructure: ${m.logStructure}`);
  if (m.stripsPerTone !== 'hexPerSlice') throw new Error(`Unsupported tumblingBlockMethod.stripsPerTone: ${m.stripsPerTone}`);
  const rg = /^nestRowStripsOffsetHalfHex\(sqrt3\*side\/2\)_alternateRows_glueInPairsOnFlatCaul_lightPressure_trimZigzagEdgesOnSled$/.exec(m.rowGlueUp);
  if (!rg) throw new Error(`Unsupported tumblingBlockMethod.rowGlueUp: ${m.rowGlueUp}`);
  const hexW = Math.sqrt(3) * side;
  const hexPerSlice = Math.ceil(design.dimensions.width / hexW - 1e-9) + Number(ls[1]);
  const tileRows = Math.ceil(design.dimensions.length / (1.5 * side) - 1e-9) + Number(ls[2]);
  const spare = Number(ls[3]);
  const totalSlices = tileRows + spare;
  const offset = hexW / 2;
  // logs follow the blank rules: split evenly if one log would pass the maximum
  const perLogMax = Math.floor((max - trim) / (slice + a.kerf_mm));
  const logCount = Math.ceil(totalSlices / perLogMax);
  const slicesPerLog = Math.ceil(totalSlices / logCount);
  const logLength = Math.max(min, slicesPerLog * (slice + a.kerf_mm) + trim);
  const sec = tumblingLogSection(hexPerSlice, side, lr.cutMult);
  if (sec.height > lr.cutMax + 1e-9) throw new Error(`Tumbling log cut height ${sec.height.toFixed(1)} mm is over the catalog ${lr.cutMax} mm`);
  // never split a row: one row strip must fit the sled whole
  if (sec.width > lr.sledMax + 1e-9) throw new Error(`Tumbling log ${sec.width.toFixed(1)} mm wide is over the ${lr.sledMax} mm sled; a row is never split. Use a smaller diamond side or a narrower board.`);
  const stripsPerTone = hexPerSlice * logCount;
  const [light, mid, dark] = design.species.slice(0, 3).map(sp => sp.name);
  const tones = { light, mid, dark };
  const [a60, a120] = m.diamondAngles_deg;
  const info = { cutHeight_mm: sec.height, bladeAbove_mm: lr.bladeAbove, bladeHeight_mm: sec.height + lr.bladeAbove, sledMax_mm: lr.sledMax, logWidth_mm: sec.width, tiles: hexPerSlice * tileRows, cols: hexPerSlice, tileRows, hexPerSlice, spare, offset_mm: offset, diamondSide_mm: side, stripThickness_mm: stripT, stripsPerTone, logCount, logLength_mm: logLength, slicesPerLog, tones };
  const rows: CutItem[] = (['light', 'mid', 'dark'] as const).map(tone => ({
    part: `${tones[tone]} (${tone}) diamond strips: diamond side ${shopSize(side, u)}, ${a60}°/${a120}° angles; mill stock ${shopSize(stripT, u)} thick (side × sin 60°) and at least ${shopSize(m.minStockWidthForBevelRip_mm, u)} wide; bevel the wide stock at ${m.bladeTilt_deg}° first, then cut each diamond off with a thin-rip jig, keeper away from the fence; ${stripsPerTone} strip${stripsPerTone === 1 ? '' : 's'} per tone × ${shopSize(logLength, u)} long`,
    width: m.minStockWidthForBevelRip_mm, thickness: stripT, length: logLength, quantity: stripsPerTone, species: tones[tone],
    dims: { diamondSide_mm: side, stripThickness_mm: stripT, logLength_mm: logLength }, tumbling: info,
  }));
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < logCount; i++) {
    rows.push({
      part: `Log ${letters[i]}: one hexagon row wide, ${hexPerSlice} hexagons side by side (one diamond strip of each tone, ${light}/${mid}/${dark}, per hexagon) glued ${glue}; logs are never planed or jointed (${shopSize(sec.width, u)} wide: too wide for the planer at ${shopSize(sec.width, u)} and the jointer; crosscut only on the sled); log ${shopSize(logLength, u)} long; crosscut ${slicesPerLog} slice${slicesPerLog === 1 ? '' : 's'} × ${shopSize(slice, u)} each on a crosscut sled with a stop block (${tileRows} rows used + ${spare} spare: slice${spare === 1 ? '' : 's'} ${Array.from({ length: spare }, (_, k) => totalSlices - spare + k + 1).join(', ')} spare; ${hexPerSlice} hexagons per slice); offset alternate rows by half a hexagon, ${shopSize(offset, u)}`,
      width: sec.width, thickness: sec.height, length: logLength, quantity: 1, species: `${light}/${mid}/${dark}`,
      panelId: letters[i], slices: slicesPerLog, sliceThickness: slice,
      dims: { logLength_mm: logLength, sliceThickness_mm: slice, offset_mm: offset, logWidth_mm: sec.width, logHeight_mm: sec.height }, tumbling: info,
    });
  }
  return rows;
}

/** Catalog brickRule (draft5u): panel width = board width + blockLength_mm / 2 + offsetCleanup_mm. */
export interface BrickRule { blockLength_mm: number; offsetCleanup_mm: number; panelWidth: string; trimTo: string }
export function brickOffsetExtra(r: BrickRule | undefined): number {
  if (!r) throw new Error('catalog brickRule missing');
  if (r.panelWidth !== 'boardWidth+blockLength_mm/2+offsetCleanup_mm') throw new Error(`Unsupported brickRule.panelWidth: ${r.panelWidth}`);
  if (r.trimTo !== 'boardWidthOnSledWithStopBlock') throw new Error(`Unsupported brickRule.trimTo: ${r.trimTo}`);
  return r.blockLength_mm / 2 + r.offsetCleanup_mm;
}

/** Catalog planerTextRule (draft5u): the jointer / planer-sled text applies only within
 *  faceTooWideForJointerAppliesWidth_mm; wider panels print faceTooWideForPlanerText. */
function wideFaceNote(ctx: PanelContext, w: number, unit: 'imperial' | 'metric'): string {
  const p = ctx.allowances.planerTextRule;
  const range = p.faceTooWideForJointerAppliesWidth_mm, jt = p.faceTooWideForJointerText, pt = p.faceTooWideForPlanerText;
  if (!range || !jt || !pt) throw new Error('catalog planerTextRule faceTooWideFor* fields missing');
  if (w > range[0] && w <= range[1]) return `; ${jt.replace('{jointerMax}', sheetLen(range[0], unit))}`;
  if (w > range[1]) return `; ${pt.replace('{planerLimit}', sheetLen(range[1], unit))}`;
  return '';
}

export interface PanelContext {
  style: string;
  endGrain: boolean;
  speciesPattern: string[];
  /** the style crosscuts at an angle (catalog step angled-cuts): herringbone, chevron */
  angled?: boolean;
  /** finished board length (end-grain slice count) */
  boardLength?: number;
  /** catalog planerTextRule.neverForMixedGrain lists this style */
  mixed?: boolean;
  allowances: {
    planerMaxWidth_mm: number;
    planerMinimum_mm?: { length: number };
    endGrainGridRule?: { panelThicknessEqualsSquareSize?: boolean; stripMillThicknessOver_mm?: number };
    stripOrderRule?: { species?: string };
    stripRipRule?: { ripOver_mm?: number; then?: string };
    planerTextRule: { template: string; planerMargin_mm?: number; neverForMixedGrain?: string[]; faceTooWideForJointerText?: string; faceTooWideForJointerAppliesWidth_mm?: [number, number]; faceTooWideForPlanerText?: string };
    brickRule?: BrickRule;
  };
}

export interface MillingStep {
  stepNumber: number;
  operation: 'rough-cut' | 'joint' | 'plane' | 'rip' | 'crosscut';
  description: string;
  settings: Record<string, string>;
}

export interface OptimizationResult {
  cutPlans: CutPlan[];
  totalStock: number;
  totalWaste: number;
  utilizationPercentage: number;
  millingSteps: MillingStep[];
  cutList: CutListItem[];
}

/**
 * Get allowances for a specific style from catalog
 */
function getAllowances(style: string) {
  // No fallback: a missing or broken catalog is an error, not hard-coded shop defaults
  const catalog = loadStyleCatalog(style as CatalogStyleName);
  return {
    kerf: catalog.cutListAllowances.kerf_mm,
    roughOversize: catalog.cutListAllowances.roughToFinalOversize_mm,
    planerMinimum: catalog.cutListAllowances.planerMinimum_mm,
    flatteningAllowance: catalog.cutListAllowances.flatteningAllowance_mm,
    sandingLoss: catalog.cutListAllowances.sandingLoss_mm,
  };
}

/**
 * Calculate required parts from board design
 */
export function calculateRequiredParts(design: BoardDesign): CutItem[] {
  const pattern = generatePattern(design);
  
  // Load catalog for allowances
  const catalog = loadStyleCatalog(design.style as CatalogStyleName);
  const allowances = catalog.cutListAllowances;
  const need = <T,>(v: T | undefined, name: string): T => {
    if (v === undefined || v === null) throw new Error(`${design.style}: catalog cutListAllowances.${name} missing`);
    return v;
  };
  const kerf = need(allowances.kerf_mm, 'kerf_mm');
  const roughOversize = need(allowances.roughToFinalOversize_mm, 'roughToFinalOversize_mm');
  // draft5j: a plain number per style (5.0 end grain, 1.5 long grain)
  const flatteningAllowance = need(allowances.flatteningAllowance_mm, 'flatteningAllowance_mm');
  const sandingLoss = need(allowances.sandingLoss_mm, 'sandingLoss_mm');
  const blankRule = catalog.cutListAllowances.blankRule;
  const tumbling = (allowances as unknown as { tumblingBlockMethod?: TumblingMethod }).tumblingBlockMethod;
  if (tumbling && design.style === 'tumbling-block-3d') return tumblingBlockParts(design, tumbling, { kerf_mm: kerf, flatteningAllowance_mm: flatteningAllowance, blankRule: blankRule as BlankRule });
  
  // Check if blankRule is enabled
  if (blankRule?.millWholeBlanksFirst) {
    return calculateBlanksWithRule(
      pattern,
      kerf,
      roughOversize,
      flatteningAllowance,
      sandingLoss,
      blankRule,
      need(allowances.planerMaxWidth_mm, 'planerMaxWidth_mm'),
      need(allowances.jointerMaxWidth_mm, 'jointerMaxWidth_mm'),
      design.unitSystem,
      {
        style: design.style,
        // End grain = the catalog's steps turn the slices end grain up
        endGrain: catalog.steps.some(st => st.stepId === 'rotate-slices' || /end grain up/i.test(st.description)),
        speciesPattern: design.species.map(sp => sp.name),
        angled: catalog.steps.some(st => st.stepId === 'angled-cuts'),
        boardLength: design.dimensions.length,
        mixed: ((allowances as unknown as { planerTextRule?: { neverForMixedGrain?: string[] } }).planerTextRule?.neverForMixedGrain ?? []).includes(design.style),
        allowances: {
          planerMaxWidth_mm: need(allowances.planerMaxWidth_mm, 'planerMaxWidth_mm'),
          planerMinimum_mm: allowances.planerMinimum_mm,
          endGrainGridRule: (allowances as unknown as Record<string, unknown>).endGrainGridRule as PanelContext['allowances']['endGrainGridRule'],
          stripOrderRule: (allowances as unknown as Record<string, unknown>).stripOrderRule as PanelContext['allowances']['stripOrderRule'],
          stripRipRule: (allowances as unknown as Record<string, unknown>).stripRipRule as PanelContext['allowances']['stripRipRule'],
          brickRule: (allowances as unknown as Record<string, unknown>).brickRule as BrickRule | undefined,
          planerTextRule: need((allowances as unknown as Record<string, unknown>).planerTextRule as PanelContext['allowances']['planerTextRule'], 'planerTextRule'),
        },
      }
    );
  }
  
  // Legacy behavior: individual strips
  const parts: Map<string, CutItem> = new Map();
  
  for (const strip of pattern.strips) {
    // Add allowances to strip dimensions
    const width = strip.width + kerf + roughOversize.width;
    const thickness = strip.height + roughOversize.thickness + flatteningAllowance + sandingLoss;
    const length = strip.depth + kerf + roughOversize.length;
    
    const key = `${strip.species.name}-${width.toFixed(1)}-${thickness.toFixed(1)}-${length.toFixed(1)}`;
    
    if (parts.has(key)) {
      const existing = parts.get(key)!;
      existing.quantity++;
    } else {
      parts.set(key, {
        part: `${strip.species.name} strip`,
        width: width,
        thickness: thickness,
        length: length,
        quantity: 1,
        species: strip.species.name,
      });
    }
  }
  
  return Array.from(parts.values());
}

interface BlankRule {
  millWholeBlanksFirst: boolean;
  blankMinLength_mm: number;
  blankMaxLength_mm?: number;
  crosscutTrim_mm: number;
  blankUnit?: string;
  panelMaxPlanerWidth_mm?: number;
  panelWideOption?: string[];
  panelCrosscut?: string;
  panelWidthText?: string;
  panelStrips?: string;
  sliceCount?: string;
  overLength?: string;
  panelSplitOn?: string;
  sledMaxWidth_mm?: number;
  text: string;
}

/**
 * Calculate blanks according to blankRule
 * For stripSetPanel: mill and glue one panel with one strip of each species,
 * then crosscut slices from it
 */
function need<T>(v: T | undefined | null, name: string): T {
  if (v === undefined || v === null) throw new Error(`catalog cutListAllowances.${name} missing`);
  return v;
}

function calculateBlanksWithRule(
  pattern: { strips: Array<{ width: number; height: number; depth: number; species: { name: string } }> },
  kerf: number,
  roughOversize: { thickness: number; width: number; length: number },
  flatteningAllowance: number,
  sandingLoss: number,
  blankRule: BlankRule,
  planerMaxWidth: number,
  jointerMaxWidth: number,
  unitSystem: 'imperial' | 'metric',
  ctx: PanelContext
): CutItem[] {
  const blanks: CutItem[] = [];
  void planerMaxWidth; // the planer limit comes from planerTextRule (planerMaxWidth_mm - planerMargin_mm)
  
  if (blankRule.blankUnit === 'stripSetPanel') {
    // Strip-set panel: one panel = one strip of each species in pattern order
    // Panel width = sum of all strip widths
    // Panel is glued, then crosscut into slices
    
    // Find unique strip combinations (by species, width, thickness)
    // In most patterns, all strips have the same dimensions, just different species
    const stripKey = (strip: typeof pattern.strips[0]) => {
      const width = strip.width;
      const thickness = strip.height + roughOversize.thickness + flatteningAllowance + sandingLoss;
      const sliceThickness = strip.depth;
      return `${width.toFixed(1)}-${thickness.toFixed(1)}-${sliceThickness.toFixed(1)}`;
    };
    
    // For checkerboard/brick etc: all strips have same dims, different species
    // Count how many slices we need and group them
    const firstStrip = pattern.strips[0];
    const baseKey = stripKey(firstStrip);
    const allSamePattern = pattern.strips.every(s => stripKey(s) === baseKey);
    
    if (allSamePattern) {
      // Panel = ALL strips across the board width (catalog panelStrips: allStripsAcrossWidth),
      // slices = rows along the length (catalog sliceCount: rowsAlongLength).
      if (blankRule.panelStrips !== 'allStripsAcrossWidth' || blankRule.sliceCount !== 'rowsAlongLength') {
        throw new Error(`Unsupported blankRule panelStrips/sliceCount: ${blankRule.panelStrips}/${blankRule.sliceCount}`);
      }
      const uniqueSpecies = Array.from(new Set(pattern.strips.map(s => s.species.name)));
      const xs = Array.from(new Set(pattern.strips.map(s => (s as { x?: number }).x ?? 0).map(v => v.toFixed(3))));
      const zs = Array.from(new Set(pattern.strips.map(s => (s as { z?: number }).z ?? 0).map(v => v.toFixed(3))));
      // strips across = one row (first z); offset rows (tumbling block) shift x and must not be double-counted
      const z0 = Math.min(...pattern.strips.map(s => (s as { z?: number }).z ?? 0));
      const firstRow = pattern.strips.filter(s => Math.abs(((s as { z?: number }).z ?? 0) - z0) < 1e-6);
      const stripsAcross = firstRow.length || xs.length;
      const sliceCount = zs.length;
      const minLen = blankRule.blankMinLength_mm;
      const maxLength = blankRule.blankMaxLength_mm;
      if (maxLength === undefined) throw new Error('catalog blankRule.blankMaxLength_mm missing');
      const grid = ctx.endGrain ? ctx.allowances.endGrainGridRule : undefined;
      if (ctx.endGrain && !grid) throw new Error(`${ctx.style}: catalog endGrainGridRule missing for an end-grain style`);
      const square = firstStrip.width;
      // End-grain grid (catalog endGrainGridRule): visible cell = strip width x planed panel thickness,
      // so the panel is planed to the square size and strips are milled stripMillThicknessOver_mm over it.
      const millOver = grid ? grid.stripMillThicknessOver_mm : undefined;
      if (grid && typeof millOver !== 'number') throw new Error('catalog endGrainGridRule.stripMillThicknessOver_mm missing');
      const thickness = grid?.panelThicknessEqualsSquareSize
        ? square
        // long grain (3757189 M3): glued panel = final thickness + this style's catalog flatteningAllowance_mm
        : (ctx.endGrain ? firstStrip.height + roughOversize.thickness + flatteningAllowance + sandingLoss : firstStrip.height + flatteningAllowance);
      const stripMillThickness = grid ? square + (millOver as number) : thickness;
      // Slice thickness = finished board thickness + end-grain flattening allowance
      const sliceThickness = firstStrip.height + flatteningAllowance;
      const panelWidth = stripsAcross * firstStrip.width + roughOversize.width;

      const lenFor = (n: number) => Math.max(minLen, n * (sliceThickness + kerf) + 2 * blankRule.crosscutTrim_mm);
      let panelCount = 1;
      if (lenFor(sliceCount) > maxLength) {
        if (blankRule.overLength !== 'splitPanels') throw new Error(`Unsupported overLength: ${blankRule.overLength}`);
        while (lenFor(Math.ceil(sliceCount / panelCount)) > maxLength) {
          panelCount++;
          if (panelCount > sliceCount) throw new Error('Slice thicker than max panel length');
        }
      }
      const base = Math.floor(sliceCount / panelCount);
      const extra = sliceCount % panelCount;
      const slicesPer = Array.from({ length: panelCount }, (_, i) => base + (i < extra ? 1 : 0));

      const panelMaxWidth = blankRule.panelMaxPlanerWidth_mm;
      const sledMax = blankRule.sledMaxWidth_mm;
      if (panelMaxWidth === undefined || sledMax === undefined) {
        throw new Error('catalog blankRule.panelMaxPlanerWidth_mm / sledMaxWidth_mm missing');
      }
      const crosscutMethod = blankRule.panelCrosscut === 'crosscutSledWithStopBlock'
        ? 'crosscut sled with stop block (never fence)'
        : 'crosscut sled';
      const speciesList = uniqueSpecies.join('/');
      const options = blankRule.panelWideOption ?? [];

      // Sub-panels of consecutive whole strips: as few as the planer width allows
      let groups: number[] = [stripsAcross];
      let routerSled = false;
      if (panelWidth > panelMaxWidth) {
        if (options.includes('splitSubPanels') && blankRule.panelSplitOn === 'wholeStrips') {
          const perSub = Math.floor((panelMaxWidth - roughOversize.width) / firstStrip.width);
          if (perSub < 1) throw new Error('A single strip is wider than the planer max width');
          const subCount = Math.ceil(stripsAcross / perSub);
          groups = Array.from({ length: subCount }, (_, i) =>
            Math.floor(stripsAcross / subCount) + (i < stripsAcross % subCount ? 1 : 0));
        } else if (options.includes('routerSled')) {
          routerSled = true;
        } else {
          throw new Error(`Panel ${panelWidth.toFixed(0)}mm exceeds planer max and catalog gives no wide-panel option`);
        }
      }

      // Strip order (catalog stripOrderRule): strip i across the full width is pattern[i mod n]
      const order = ctx.allowances.stripOrderRule;
      const patternSpecies = ctx.speciesPattern;
      const speciesAt = order?.species === 'pattern[i mod n]'
        ? Array.from({ length: stripsAcross }, (_, i) => patternSpecies[i % patternSpecies.length])
        : [...firstRow].sort((a, b) => ((a as { x?: number }).x ?? 0) - ((b as { x?: number }).x ?? 0)).map(s => s.species.name);
      const initials = (names: string[]) => names.map(n => n[0].toUpperCase()).join(' ');

      const planerMinLen = ctx.allowances.planerMinimum_mm?.length;
      if (typeof planerMinLen !== 'number') throw new Error('catalog planerMinimum_mm.length missing');
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      // planerTextRule.allowedIf: width <= planerMaxWidth_mm - planerMargin_mm
      const planerLimit = ctx.allowances.planerMaxWidth_mm - need(ctx.allowances.planerTextRule.planerMargin_mm, 'planerTextRule.planerMargin_mm');
      const ripOver = need(ctx.allowances.stripRipRule?.ripOver_mm, 'stripRipRule.ripOver_mm');
      for (let i = 0; i < panelCount; i++) {
        const actualSlices = slicesPer[i];
        const len = lenFor(actualSlices);
        let offset = 0;
        groups.forEach((n, j) => {
          const run = speciesAt.slice(offset, offset + n);
          offset += n;
          const counts = new Map<string, number>();
          for (const sp of run) counts.set(sp, (counts.get(sp) ?? 0) + 1);
          const strips = Array.from(counts, ([species, count]) => ({ species, width: firstStrip.width, count }));
          const w = n * firstStrip.width + roughOversize.width;
          const label = [
            panelCount > 1 ? `Panel ${letters[i]} (${i + 1} of ${panelCount} by length)` : `Panel ${letters[i]}`,
            groups.length > 1 ? `sub-panel ${j + 1}/${groups.length}` : '',
          ].filter(Boolean).join(', ');
          // Planer wording (catalog planerTextRule): only long grain, <= planer max width, >= planer minimum length
          const planerOk = !routerSled && w <= planerLimit && len >= planerMinLen;
          const flatten = planerOk
            ? `${ctx.endGrain || ctx.mixed ? STRIP_SET_PREFIX : ''}${ctx.allowances.planerTextRule.template.replace('{width}', sheetLen(w, unitSystem))}`
            : w > planerLimit
              ? `too wide for the planer at ${sheetLen(w, unitSystem)}: flatten on the router sled or drum sander`
              : `too short for the planer (under ${sheetLen(planerMinLen, unitSystem)}): flatten on the router sled or by hand`;
          const sled = w > sledMax
            ? `split first: panel ${sheetLen(w, unitSystem)} is wider than the ${sheetLen(sledMax, unitSystem)} sled, never freehand`
            : `sled must clear ${sheetLen(w, unitSystem)}`;
          const jointNote = wideFaceNote(ctx, w, unitSystem);
          // stripRipRule: rip ripOver_mm over, then joint the edge to final width
          const rip = `rip each strip ${shopSize(firstStrip.width + ripOver, unitSystem)}, then joint to ${shopSize(firstStrip.width, unitSystem)} wide`;
          const milling = grid
            ? `${rip}; strips milled ${shopSize(stripMillThickness, unitSystem)} thick; plane the glued panel to the square size ${shopSize(square, unitSystem)}`
            : rip;
          blanks.push({
            part: `${label}: ${speciesList} strip-set panel: glue ${n} whole strips (order: ${initials(run)}), ${milling}; ${flatten}; ${!ctx.endGrain && !ctx.angled ? `Crosscut to final length: ${shopSize(ctx.boardLength ?? sliceThickness, unitSystem)}` : `then ${ctx.angled ? 'angled cuts on the sled with a stop block and hold-down:' : crosscutMethod} ${actualSlices} ${ctx.angled ? 'piece' : 'slice'}${actualSlices === 1 ? '' : 's'} × ${shopSize(sliceThickness, unitSystem)} each (${sled})`}${jointNote}`,
            width: w,
            thickness,
            length: len,
            quantity: 1,
            species: speciesList,
            strips,
            panelLabel: label,
            stripOrder: initials(run),
            planerOk,
            sliceThickness,
            slices: actualSlices,
            panelId: letters[i],
            dims: {
              ripWidth_mm: firstStrip.width + ripOver, stripWidth_mm: firstStrip.width,
              ...(grid ? { stripMillThickness_mm: stripMillThickness, square_mm: square } : {}),
              panelWidth_mm: w, sliceThickness_mm: sliceThickness, jointerMaxWidth_mm: jointerMaxWidth,
            },
            subPanel: groups.length > 1 ? { index: j + 1, count: groups.length } : undefined,
          });
        });
      }
    } else {
      // Mixed strip widths (brick courses, scrap rows): one glued panel per course type. A course type is a row's
      // species + strip widths left to right, so the strips always sum to the board width; each row of that type is
      // one slice. Scrap is glued as one panel from its first row's pieces and every row is a slice of it.
      // Panel length = slices x (slice + kerf) + 2 x crosscutTrim (blankMinLength_mm floor), one length per panel.
      const maxLength = need(blankRule.blankMaxLength_mm, 'blankRule.blankMaxLength_mm');
      type S = typeof pattern.strips[0] & { x?: number; z?: number };
      const rows = new Map<string, S[]>();
      for (const st of pattern.strips as S[]) {
        const k = (st.z ?? 0).toFixed(3);
        rows.set(k, [...(rows.get(k) ?? []), st]);
      }
      const rowList = [...rows.values()].map(r => [...r].sort((p, q) => (p.x ?? 0) - (q.x ?? 0)));
      const sig = (r: S[]) => r.map(st => `${st.species.name}:${st.width.toFixed(1)}`).join('|');
      const scrap = ctx.style === 'scrap-chaotic';
      const groups = new Map<string, { strips: S[]; rows: number }>();
      for (const r of rowList) {
        const k = scrap ? 'all' : sig(r);
        const g = groups.get(k);
        if (g) g.rows++; else groups.set(k, { strips: r, rows: 1 });
      }
      const eg = ctx.endGrain ? ctx.allowances.endGrainGridRule as { panelThicknessEqualsCourseHeight?: string; stripMillThicknessOver_mm?: number } | undefined : undefined;
      const course = eg?.panelThicknessEqualsCourseHeight === ctx.style
        ? Math.min(...pattern.strips.map(st => Math.min(st.width, st.depth))) : undefined;
      const sliceT = ctx.endGrain ? firstStrip.height + flatteningAllowance : firstStrip.depth;
      const ripOver = need(ctx.allowances.stripRipRule?.ripOver_mm, 'stripRipRule.ripOver_mm');
      const thickness = course ?? (ctx.endGrain ? firstStrip.height + roughOversize.thickness + flatteningAllowance + sandingLoss : firstStrip.height + flatteningAllowance);
      const lenFor = (n: number) => Math.max(blankRule.blankMinLength_mm, n * (sliceT + kerf) + 2 * blankRule.crosscutTrim_mm);
      // End grain: each slice, turned end grain up, covers one course (brick: the course height; scrap: the panel
      // thickness) along the board, so slices = ceil(board length / cover), never one per pattern row.
      if (ctx.endGrain && ctx.boardLength) {
        const cover = course ?? thickness;
        const n = Math.ceil(ctx.boardLength / cover - 1e-9);
        for (const g of groups.values()) g.rows = 0;
        if (scrap) groups.get('all')!.rows = n;
        else {
          // brick: slice i lands in the pattern row under its course, in board order
          const rowAt = (pos: number) => rowList.find(r => {
            const z = r[0].z ?? 0, depth = Math.max(...r.map(st => st.depth));
            return pos >= z - 1e-9 && pos < z + depth - 1e-9;
          }) ?? rowList[rowList.length - 1];
          for (let i = 0; i < n; i++) groups.get(sig(rowAt(i * cover + cover / 2)))!.rows++;
        }
        for (const [k, g] of groups) if (g.rows === 0) groups.delete(k);
      }
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const rowPlanerLimit = ctx.allowances.planerMaxWidth_mm - need(ctx.allowances.planerTextRule.planerMargin_mm, 'planerTextRule.planerMargin_mm');
      const rowPlanerMin = need(ctx.allowances.planerMinimum_mm?.length, 'planerMinimum_mm.length');
      const sledMaxRow = need(blankRule.sledMaxWidth_mm, 'blankRule.sledMaxWidth_mm');
      // same planer wording as the strip-set panels: long-grain panel before slicing
      const rowFlatten = (w: number, len: number) => (w <= rowPlanerLimit && len >= rowPlanerMin
        ? `${ctx.endGrain || ctx.mixed ? STRIP_SET_PREFIX : ''}${ctx.allowances.planerTextRule.template.replace('{width}', sheetLen(w, unitSystem))}`
        : w > rowPlanerLimit
          ? `too wide for the planer at ${sheetLen(w, unitSystem)}: flatten on the router sled or drum sander`
          : `too short for the planer (under ${sheetLen(rowPlanerMin, unitSystem)}): flatten on the router sled or by hand`)
        + (w > sledMaxRow ? `; split first: panel ${sheetLen(w, unitSystem)} is wider than the ${sheetLen(sledMaxRow, unitSystem)} sled, never freehand` : '');
      let idx = 0;
      for (const g of groups.values()) {
        // split over-long panels by length into the fewest panels that fit; slices always add up
        let count = 1;
        while (lenFor(Math.ceil(g.rows / count)) > maxLength) count++;
        const widths = g.strips.map(st => st.width);
        // brick (3757189 M1, Board Master): panel = board width + half a block (the offset) + cleanup, so both
        // ragged ends trim back to the board width; the extra goes on as one more strip of the panel's species
        const extra = course !== undefined ? brickOffsetExtra(ctx.allowances.brickRule) : 0;
        const w = widths.reduce((p, q) => p + q, 0) + extra;
        const counts = new Map<string, { species: string; width: number; count: number }>();
        for (const st of g.strips) {
          const k = `${st.species.name}:${st.width.toFixed(2)}`;
          const c = counts.get(k);
          if (c) c.count++; else counts.set(k, { species: st.species.name, width: st.width, count: 1 });
        }
        const stripList = [...counts.values()];
        const stripText = stripList.map(c => `${c.count} × ${c.species} ${shopSize(c.width, unitSystem)} (rip ${shopSize(c.width + ripOver, unitSystem)}, then joint)`).join(' + ')
          + (extra ? ` + 1 × ${g.strips[g.strips.length - 1].species.name} ${shopSize(extra, unitSystem)} (rip ${shopSize(extra + ripOver, unitSystem)}, then joint; half-block offset + ${shopSize(ctx.allowances.brickRule!.offsetCleanup_mm, unitSystem)} cleanup)` : '');
        const millNote = course !== undefined
          ? `; strips milled ${shopSize(course + need(eg?.stripMillThicknessOver_mm, 'endGrainGridRule.stripMillThicknessOver_mm'), unitSystem)} thick, plane the panel to the course height ${shopSize(course, unitSystem)}`
          : '';
        const speciesList = [...new Set(g.strips.map(st => st.species.name))].join('/');
        for (let i = 0; i < count; i++) {
          const n = Math.floor(g.rows / count) + (i < g.rows % count ? 1 : 0);
          const id = letters[idx++];
          const len = lenFor(n);
          blanks.push({
            part: `Panel ${id}: ${speciesList} strip-set panel ${shopSize(w, unitSystem)} wide: ${stripText}${millNote}; ${rowFlatten(w, len)}; ${!ctx.endGrain && !ctx.angled ? `Crosscut to final length: ${shopSize(ctx.boardLength ?? sliceT, unitSystem)}` : `then ${ctx.angled ? 'angled cuts on the sled with a stop block and hold-down:' : 'crosscut sled with stop block (never fence)'} ${n} ${ctx.angled ? 'piece' : 'slice'}${n === 1 ? '' : 's'} × ${shopSize(sliceT, unitSystem)} each`}${wideFaceNote(ctx, w, unitSystem)}`,
            width: w, thickness, length: len, quantity: 1, species: speciesList,
            strips: extra ? [...stripList, { species: g.strips[g.strips.length - 1].species.name, width: extra, count: 1 }] : stripList, panelLabel: `Panel ${id}`, panelId: id, slices: n, sliceThickness: sliceT,
            dims: {
              ...(extra ? { brickOffsetExtra_mm: extra, brickCleanup_mm: ctx.allowances.brickRule!.offsetCleanup_mm } : {}),
              panelWidth_mm: w, sliceThickness_mm: sliceT, jointerMaxWidth_mm: jointerMaxWidth,
              ...(course !== undefined ? { course_mm: course } : {}),
              ...Object.fromEntries(stripList.flatMap((c, j) => [[`stripWidth${j}_mm`, c.width], [`ripWidth${j}_mm`, c.width + ripOver]])),
            },
          });
        }
      }
    }
  } else {
    // Legacy single-strip blanks
    const stripGroups: Map<string, { strips: typeof pattern.strips; sliceThickness: number }> = new Map();
    
    for (const strip of pattern.strips) {
      const width = strip.width + kerf + roughOversize.width;
      const thickness = strip.height + roughOversize.thickness + flatteningAllowance + sandingLoss;
      const sliceThickness = strip.depth;
      
      const key = `${strip.species.name}-${width.toFixed(1)}-${thickness.toFixed(1)}-${sliceThickness.toFixed(1)}`;
      
      if (!stripGroups.has(key)) {
        stripGroups.set(key, { strips: [], sliceThickness });
      }
      stripGroups.get(key)!.strips.push(strip);
    }
    
    for (const [key, group] of stripGroups.entries()) {
      const parts = key.split('-');
      const species = parts.slice(0, -3).join('-');
      const width = parseFloat(parts[parts.length - 3]);
      const thickness = parseFloat(parts[parts.length - 2]);
      const sliceThickness = group.sliceThickness;
      const sliceCount = group.strips.length;
      
      const minBlankLength = sliceCount * (sliceThickness + kerf) + 2 * blankRule.crosscutTrim_mm;
      const blankLength = Math.max(blankRule.blankMinLength_mm, minBlankLength);
      
      blanks.push({
        part: `${species} blank: rip, mill, then crosscut ${sliceCount} slices × ${shopSize(sliceThickness, unitSystem)} each`,
        width,
        thickness,
        length: blankLength,
        quantity: 1,
        species,
      });
    }
  }
  
  return blanks;
}

/**
 * Optimize cutting plan from available stock
 */
export function optimizeCuttingPlan(
  requiredParts: CutItem[],
  availableStock: StockBoard[],
  boardStyle: string = 'checkerboard'
): OptimizationResult {
  const cutPlans: CutPlan[] = [];
  // Glued panels are made from single-species strips: plan the strips, not the panel.
  // Copies, so the caller's parts are never mutated.
  const remainingParts: CutItem[] = requiredParts.flatMap(p => p.strips
    ? p.strips.map(st => ({
        part: `${st.species} strip for ${p.part.split(':')[0]}`,
        width: st.width,
        thickness: p.thickness,
        length: p.length,
        quantity: st.count * p.quantity,
        species: st.species,
      }))
    : [{ ...p }]);
  
  // Get allowances from catalog
  const allowances = getAllowances(boardStyle);
  const KERF = allowances.kerf;
  const ROUGH_OVERSIZE_WIDTH = allowances.roughOversize.width;
  const ROUGH_OVERSIZE_LENGTH = allowances.roughOversize.length;
  const PLANER_MINIMUM_THICKNESS = allowances.planerMinimum.thickness;
  
  // Sort stock by size (largest first for efficiency)
  const sortedStock = [...availableStock].sort((a, b) => {
    const volumeA = a.width * a.thickness * a.length * a.quantity;
    const volumeB = b.width * b.thickness * b.length * b.quantity;
    return volumeB - volumeA;
  });
  
  // Try to fit parts into stock
  for (const stock of sortedStock) {
    for (let qty = 0; qty < stock.quantity; qty++) {
      const cuts: CutItem[] = [];
      let usedLength = 0;
      
      // Try to fit parts into this board
      for (let i = remainingParts.length - 1; i >= 0; i--) {
        const part = remainingParts[i];
        
        // Check if part fits in this stock
        if (part.species === stock.species &&
            part.width + ROUGH_OVERSIZE_WIDTH <= stock.width &&
            part.thickness <= stock.thickness &&
            part.thickness >= PLANER_MINIMUM_THICKNESS) {
          
          // Lanes across the stock width (rip), times pieces along the remaining length
          const partLengthWithKerf = part.length + KERF + ROUGH_OVERSIZE_LENGTH;
          const availableLength = stock.length - usedLength;
          const lanes = Math.max(1, Math.floor(stock.width / (part.width + ROUGH_OVERSIZE_WIDTH + KERF)));
          const rows = Math.floor(availableLength / partLengthWithKerf);
          const fitsCount = rows * lanes;
          
          if (fitsCount > 0) {
            const cutCount = Math.min(fitsCount, part.quantity);
            
            cuts.push({
              ...part,
              quantity: cutCount,
            });
            
            usedLength += partLengthWithKerf * Math.ceil(cutCount / lanes);
            part.quantity -= cutCount;
            
            if (part.quantity === 0) {
              remainingParts.splice(i, 1);
            }
          }
        }
      }
      
      if (cuts.length > 0) {
        const wasteLength = stock.length - usedLength;
        const totalVolume = stock.width * stock.thickness * stock.length;
        const usedVolume = stock.width * stock.thickness * usedLength;
        const wastePercentage = (wasteLength / stock.length) * 100;
        const utilizationPercentage = (usedVolume / totalVolume) * 100;
        
        cutPlans.push({
          stockBoard: stock,
          cuts,
          wastePercentage,
          utilizationPercentage,
        });
      }
    }
  }
  
  // Calculate totals
  const totalStock = cutPlans.length;
  const totalWaste = cutPlans.reduce((sum, plan) => sum + plan.wastePercentage, 0) / Math.max(cutPlans.length, 1);
  const utilizationPercentage = cutPlans.reduce((sum, plan) => sum + plan.utilizationPercentage, 0) / Math.max(cutPlans.length, 1);
  
  // Generate milling steps
  const millingSteps = generateMillingSteps(requiredParts, availableStock);
  
  // Generate cut list
  const cutList = generateCutList(cutPlans);
  
  return {
    cutPlans,
    totalStock,
    totalWaste,
    utilizationPercentage,
    millingSteps,
    cutList,
  };
}

/**
 * Generate milling steps sequence
 */
function generateMillingSteps(
  parts: CutItem[],
  _stock: StockBoard[]
): MillingStep[] {
  const steps: MillingStep[] = [];
  
  // Step 1: Rough cut to length
  steps.push({
    stepNumber: 1,
    operation: 'rough-cut',
    description: 'Rough cut stock boards to approximate length, leaving 3mm oversize on each end.',
    settings: {
      'Oversize allowance': '3 mm per end',
    },
  });
  
  // Step 2: Joint one face
  steps.push({
    stepNumber: 2,
    operation: 'joint',
    description: 'Joint one face flat on the jointer. This will be your reference face.',
    settings: {
      'Passes': 'Multiple light passes',
      'Feed rate': 'Slow and steady',
    },
  });
  
  // Step 3: Joint one edge
  steps.push({
    stepNumber: 3,
    operation: 'joint',
    description: 'Joint one edge square to the reference face. Keep reference face against fence.',
    settings: {
      'Reference face': 'Against fence',
    },
  });
  
  // Step 4: Plane to thickness
  const targetThickness = parts.length > 0 ? parts[0].thickness : 38.1;
  steps.push({
    stepNumber: 4,
    operation: 'plane',
    description: 'Plane to final thickness. Take multiple light passes, no more than 1-2mm per pass.',
    settings: {
      'Target thickness': `${targetThickness.toFixed(1)} mm`,
      'Max pass depth': '1-2 mm',
    },
  });
  
  // Step 5: Rip to width
  const targetWidth = parts.length > 0 ? parts[0].width : 25.4;
  steps.push({
    stepNumber: 5,
    operation: 'rip',
    description: 'Rip strips to final width on table saw. Keep jointed edge against fence.',
    settings: {
      'Rip fence': `${targetWidth.toFixed(1)} mm`,
      'Blade height': `${(targetThickness + 5).toFixed(1)} mm`,
    },
  });
  
  // Step 6: Crosscut to length
  const targetLength = parts.length > 0 ? parts[0].length : 406.4;
  steps.push({
    stepNumber: 6,
    operation: 'crosscut',
    description: 'Crosscut strips to final length using stop block on crosscut sled for consistency.',
    settings: {
      'Stop block position': `${targetLength.toFixed(1)} mm`,
      'Blade height': `${(targetThickness + 5).toFixed(1)} mm`,
    },
  });
  
  return steps;
}

/**
 * Generate cut list from cut plans
 */
function generateCutList(cutPlans: CutPlan[]): CutListItem[] {
  const cutList: CutListItem[] = [];
  
  for (const plan of cutPlans) {
    for (const cut of plan.cuts) {
      cutList.push({
        part: cut.part,
        quantity: cut.quantity,
        width: cut.width,
        thickness: cut.thickness,
        length: cut.length,
        species: cut.species,
        notes: `From stock: ${plan.stockBoard.width}×${plan.stockBoard.thickness}×${plan.stockBoard.length}mm`,
      });
    }
  }
  
  return cutList;
}

/**
 * Calculate board feet for stock
 */
export function calculateBoardFeet(
  width: number,    // mm
  thickness: number, // mm
  length: number     // mm
): number {
  // Convert to inches
  const widthInches = width / 25.4;
  const thicknessInches = thickness / 25.4;
  const lengthInches = length / 25.4;
  
  // Board feet = (width × thickness × length) / 144
  return (widthInches * thicknessInches * lengthInches) / 144;
}

/**
 * Create default stock boards for testing
 */
export function createDefaultStock(): StockBoard[] {
  return [
    {
      id: 'stock-1',
      species: 'Walnut',
      width: 150,
      thickness: 50,
      length: 2400,
      quantity: 3,
      pricePerBF: null, // Never invent prices
    },
    {
      id: 'stock-2',
      species: 'Maple',
      width: 150,
      thickness: 50,
      length: 2400,
      quantity: 3,
      pricePerBF: null,
    },
  ];
}
