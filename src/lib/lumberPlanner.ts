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
  subPanel?: { index: number; count: number };
}

export interface PanelContext {
  style: string;
  endGrain: boolean;
  speciesPattern: string[];
  allowances: {
    planerMaxWidth_mm: number;
    planerMinimum_mm?: { length: number };
    endGrainGridRule?: { panelThicknessEqualsSquareSize?: boolean; stripMillThicknessOver_mm?: number };
    stripOrderRule?: { species?: string };
    stripRipRule?: { ripOver_mm?: number; then?: string };
    planerTextRule: { template: string; planerMargin_mm?: number; neverForMixedGrain?: string[]; faceTooWideForJointerText?: string };
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
        allowances: {
          planerMaxWidth_mm: need(allowances.planerMaxWidth_mm, 'planerMaxWidth_mm'),
          planerMinimum_mm: allowances.planerMinimum_mm,
          endGrainGridRule: (allowances as unknown as Record<string, unknown>).endGrainGridRule as PanelContext['allowances']['endGrainGridRule'],
          stripOrderRule: (allowances as unknown as Record<string, unknown>).stripOrderRule as PanelContext['allowances']['stripOrderRule'],
          stripRipRule: (allowances as unknown as Record<string, unknown>).stripRipRule as PanelContext['allowances']['stripRipRule'],
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
        : firstStrip.height + roughOversize.thickness + flatteningAllowance + sandingLoss;
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
      const jointerText = need(ctx.allowances.planerTextRule.faceTooWideForJointerText, 'planerTextRule.faceTooWideForJointerText')
        .replace('{jointerMax}', sheetLen(jointerMaxWidth, unitSystem));
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
            ? ctx.allowances.planerTextRule.template.replace('{width}', sheetLen(w, unitSystem))
            : w > planerLimit
              ? `too wide for the planer at ${sheetLen(w, unitSystem)}: flatten on the router sled or drum sander`
              : `too short for the planer (under ${sheetLen(planerMinLen, unitSystem)}): flatten on the router sled or by hand`;
          const sled = w > sledMax
            ? `split first: panel ${sheetLen(w, unitSystem)} is wider than the ${sheetLen(sledMax, unitSystem)} sled, never freehand`
            : `sled must clear ${sheetLen(w, unitSystem)}`;
          const jointNote = w > jointerMaxWidth ? `; ${jointerText}` : '';
          // stripRipRule: rip ripOver_mm over, then joint the edge to final width
          const rip = `rip each strip ${shopSize(firstStrip.width + ripOver, unitSystem)}, then joint to ${shopSize(firstStrip.width, unitSystem)} wide`;
          const milling = grid
            ? `${rip}; strips milled ${shopSize(stripMillThickness, unitSystem)} thick; plane the glued panel to the square size ${shopSize(square, unitSystem)}`
            : rip;
          blanks.push({
            part: `${label}: ${speciesList} strip-set panel: glue ${n} whole strips (order: ${initials(run)}), ${milling}; ${flatten}; then ${crosscutMethod} ${actualSlices} slices × ${shopSize(sliceThickness, unitSystem)} each (${sled})${jointNote}`,
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
            panelId: letters[i],
            subPanel: groups.length > 1 ? { index: j + 1, count: groups.length } : undefined,
          });
        });
      }
    } else {
      // Different strip dimensions - more complex grouping
      // Fall back to per-strip blanks with width checks
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
        
        const maxLength = blankRule.blankMaxLength_mm;
        if (maxLength === undefined) throw new Error('catalog blankRule.blankMaxLength_mm missing');
        const lenFor = (n: number) => Math.max(blankRule.blankMinLength_mm, n * (sliceThickness + kerf) + 2 * blankRule.crosscutTrim_mm);
        // Over max length: split slices across the fewest panels that fit; never cap and drop slices
        let blankCount = 1;
        while (lenFor(Math.ceil(sliceCount / blankCount)) > maxLength) {
          blankCount++;
          if (blankCount > sliceCount) throw new Error(`${species}: one slice exceeds ${maxLength}mm`);
        }

        // Check width constraints
        let widthNote = '';
        if (width > planerMaxWidth) {
          widthNote = '; too wide for the planer: router sled or drum sander';
        } else if (width > jointerMaxWidth) {
          widthNote = `; ${need(ctx.allowances.planerTextRule.faceTooWideForJointerText, 'planerTextRule.faceTooWideForJointerText').replace('{jointerMax}', sheetLen(jointerMaxWidth, unitSystem))}`;
        }
        // End grain (brick): slice = board thickness + flattening allowance (not the face size);
        // endGrainGridRule.panelThicknessEqualsCourseHeight: plane the blank to the course height
        const eg = ctx.endGrain ? ctx.allowances.endGrainGridRule as { panelThicknessEqualsCourseHeight?: string; stripMillThicknessOver_mm?: number } | undefined : undefined;
        const course = eg?.panelThicknessEqualsCourseHeight === ctx.style
          ? Math.min(...pattern.strips.map(st => Math.min(st.width, st.depth))) : undefined;
        const egSlice = ctx.endGrain ? group.strips[0].height + flatteningAllowance : undefined;
        const outThickness = course ?? thickness;
        // stripRipRule: rip ripOver_mm over the strip width, then joint to final width
        const stripW = group.strips[0].width;
        const blankRipOver = need(ctx.allowances.stripRipRule?.ripOver_mm, 'stripRipRule.ripOver_mm');
        const ripNote = `rip each strip ${shopSize(stripW + blankRipOver, unitSystem)}, then joint to ${shopSize(stripW, unitSystem)} wide; `;
        
        for (let i = 0; i < blankCount; i++) {
          const n = Math.floor(sliceCount / blankCount) + (i < sliceCount % blankCount ? 1 : 0);
          const millNote = course !== undefined
            ? `mill ${shopSize(course + need(eg?.stripMillThicknessOver_mm, 'endGrainGridRule.stripMillThicknessOver_mm'), unitSystem)} thick, plane to the course height ${shopSize(course, unitSystem)}; `
            : '';
          blanks.push({
            part: `${species} blank: ${ripNote}${millNote}crosscut ${n} slices × ${shopSize(egSlice ?? sliceThickness, unitSystem)} each${widthNote}`,
            width,
            thickness: outThickness,
            length: lenFor(n),
            quantity: 1,
            species,
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
