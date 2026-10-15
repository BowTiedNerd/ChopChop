import { jsPDF } from 'jspdf';
import { BoardDesign, StepInstruction, CutListItem } from '../types';
import { sheetLen, shopSize, sixteenthsText, normalizeQuotedSizes, VERBATIM_CATALOG_KEYS } from '../utils/format';
import { TUMBLING_BEVEL_WARNING, STRIP_SET_PREFIX, TUMBLING_GLUE_UP, TUMBLING_TILT, catalogText } from './lumberPlanner';
import { generateTopViewFigure, generateCutListFigure } from './stepFigures';
import { loadStyleCatalog } from './catalogLoader';
import { calculateRequiredParts } from './lumberPlanner';
import { CatalogStyleName, StyleCatalog } from '../types/catalog';
import * as fs from 'fs';
import * as path from 'path';

/** The standard PDF fonts are WinAnsi; characters outside it (e.g. ≈) print as garbage like "H. */
export function pdfSafe(t: string): string {
  return t.replace(/≈/g, '~').replace(/[″]/g, '"').replace(/[–—]/g, '-');
}

/** SVG -> PNG bytes at the given pixel width. Registered by src/lib/rasterNode.ts (Node) or the app (browser). */
export type SvgRasterizer = (svg: string, widthPx: number) => Uint8Array;
let svgRasterizer: SvgRasterizer | null = null;
export function setSvgRasterizer(r: SvgRasterizer | null): void {
  svgRasterizer = r;
}
export const FIGURE_DPI = 300;

function newDoc(): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
  // Reproducible output (CI byte-compares regenerated samples): honour SOURCE_DATE_EPOCH
  const epoch = typeof process !== 'undefined' ? process.env?.SOURCE_DATE_EPOCH : undefined;
  if (epoch) {
    doc.setCreationDate(new Date(Number(epoch) * 1000));
    doc.setFileId('00000000000000000000000000000000');
  }
  const origText = doc.text.bind(doc);
  const origSplit = doc.splitTextToSize.bind(doc);
  const clean = (t: unknown): unknown => (typeof t === 'string' ? pdfSafe(t) : Array.isArray(t) ? t.map(clean) : t);
  (doc as unknown as { text: (...a: unknown[]) => jsPDF }).text = (t: unknown, ...rest: unknown[]) =>
    (origText as unknown as (...a: unknown[]) => jsPDF)(clean(t), ...rest);
  (doc as unknown as { splitTextToSize: (...a: unknown[]) => unknown }).splitTextToSize = (t: unknown, ...rest: unknown[]) =>
    (origSplit as unknown as (...a: unknown[]) => unknown)(clean(t), ...rest);
  return doc;
}

const BANNER_FONT = 11;
const BANNER_LINE = 14;
const MIN_TEXT_SIZE = 8; // pt minimum for footers and notes
const SETTING_TAG_CAP = 2;

// DejaVu Sans font family (using helvetica as fallback, jsPDF default)
// Note: For full DejaVu embedding, would need base64 encoded font file
const FONT_FAMILY = 'helvetica'; // DejaVu Sans equivalent

export interface PdfOptions {
  design: BoardDesign;
  cutList: CutListItem[];
  steps: StepInstruction[];
  includeWarnings?: boolean;
}

/**
 * Generate cut sheet PDF
 * Includes cut list, step-by-step instructions with diagrams, safety banners, setting tags
 */
export class PdfGenerator {
  private doc: jsPDF;
  private design: BoardDesign;
  private cutList: CutListItem[] = [];
  private currentPage: number = 1;
  private yPosition: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;

  private preloadedFigures?: Record<string, string>;

  constructor(design: BoardDesign, preloadedFigures?: Record<string, string>) {
    this.preloadedFigures = preloadedFigures;
    this.doc = newDoc();
    this.design = design;
  }

  /**
   * Generate complete cut sheet PDF
   */
  generateCutSheet(cutList: CutListItem[]): jsPDF {
    this.cutList = cutList; // Store for use in step customization
    
    this.addTitle('Cut Sheet');
    this.addBoardSummary();
    
    // Add cut list figure
    const cutListFigure = generateCutListFigure(this.design);
    this.addFigure(cutListFigure.svg);
    
    this.addCutList(cutList);
    
    // Add top view figure
    const topViewFigure = generateTopViewFigure(this.design);
    this.yPosition += 5;
    this.doc.setFontSize(12);
    this.doc.setFont(FONT_FAMILY, 'bold');
    this.doc.text('Board Layout (Top View)', this.margin, this.yPosition);
    this.yPosition += 7;
    this.doc.setFont(FONT_FAMILY, 'normal');
    this.addFigure(topViewFigure.svg);
    
    // Load steps from catalog
    const catalogSteps = this.loadStepsFromCatalog();
    this.addSteps(catalogSteps);
    this.addFooter();
    
    return this.doc;
  }
  
  /**
   * Load steps from catalog for current design style
   */
  private loadStepsFromCatalog(): StepInstruction[] {
    {
      const catalog = loadStyleCatalog(this.design.style as CatalogStyleName);
      
      return catalog.steps.map(step => {
        const unitSys = this.design.unitSystem;
        // the rough-stock allowance ("final thickness plus 1/8\" (3 mm)") keeps its true catalog 3.0 mm; other 1/8" pairs (bits, kerf) stay 3.175
        let description = step.description.split(/(?=final thickness plus )/).map((part, i) => normalizeQuotedSizes(part, unitSys, i > 0 ? [catalog.cutListAllowances.roughToFinalOversize_mm.thickness] : [])).join('');
        
        // Customize flatten-first-panel step based on actual panel widths
        const hasFlattenStep = catalog.steps.some(st => st.stepId === 'flatten-first-panel');
        if (this.cutList.length > 0) {
          if (step.stepId === 'flatten-first-panel' || (!hasFlattenStep && step.stepId === 'glue-up')) {
            const lines = this.customizeFlattenDescription('', catalog);
            description = step.stepId === 'glue-up' && lines ? `${description}\n${lines}` : (lines || description);
          }
          if (step.stepId === 'flatten-and-sand') {
            description = this.finalFlattenDescription(description, catalog);
          }
          if (step.stepId === 'crosscut-slices') {
            const allowance = catalog.cutListAllowances.flatteningAllowance_mm;
            if (typeof allowance !== 'number') throw new Error(`${this.design.style}: catalog flatteningAllowance_mm missing`);
            const slice = this.design.dimensions.thickness + allowance;
            const u = this.design.unitSystem;
            description = `${description}\nSlice size: ${shopSize(slice, u)}.\nFinal thickness: ${shopSize(this.design.dimensions.thickness, u)}.\nEnd-grain allowance: ${shopSize(allowance, u)}.\nSlices: ${this.sliceCountLine()}.`;
          }
          if (/^trim/.test(step.stepId)) {
            const w = this.design.dimensions.width, sledMax = catalog.cutListAllowances.blankRule?.sledMaxWidth_mm;
            if (sledMax === undefined) throw new Error(`${this.design.style}: catalog sledMaxWidth_mm missing`);
            description = `${description}\n${w > sledMax
              ? `Sled width: the glue-up is ${sheetLen(w, this.design.unitSystem)}, wider than the ${sheetLen(sledMax, this.design.unitSystem)} sled; trim with a track saw or router and straightedge, never freehand.`
              : `Sled width: sled must clear the glue-up, ${sheetLen(w, this.design.unitSystem)}.`}`;
            if (!this.isEndGrain(catalog) && w <= sledMax) description = `${description}\nSet a stop block for the final length, ${shopSize(this.design.dimensions.length, this.design.unitSystem)}, and crosscut on the sled; never use the rip fence as a stop.`;
          }
          if (this.design.style === 'brick-basketweave' && step.stepId === 'offset-slices') {
            const u = this.design.unitSystem, W = this.design.dimensions.width;
            const panelW = calculateRequiredParts(this.design).find(r => r.panelId)?.width ?? W;
            description = `${description}\nThe panels are ${shopSize(panelW, u)} wide (board width + half a block + ${shopSize((catalog.cutListAllowances as unknown as { brickRule: { offsetCleanup_mm: number } }).brickRule.offsetCleanup_mm, u)} cleanup). After glue-up, trim both ragged ends on the crosscut sled with a stop block, down to the board width ${shopSize(W, u)}.`;
          }
          if (step.stepId === 'angled-cuts') {
            description = `${description}\nSet a stop block on the angled sled for the piece width and clamp each cut with the hold-down; never use the rip fence as a stop.\nPieces: ${this.sliceCountLine()}.`;
          }
          if (step.stepId === 'edge-profile' && this.design.handles.enabled && this.design.handles.type !== 'handle') {
            description = `${description}\nHand hole: rout a ${this.handHoleText()}.`;
          }
          // scrap (Board Master ruling): every other slice turned 180° end-for-end, ends kept flush, no offset
          if (this.design.style === 'scrap-chaotic' && step.stepId === 'glue-up-2') {
            description = `${description}\nTurn every other slice 180° end-for-end; keep the ends flush, with no offset, so the panel gets no longer.`;
          }
          if (this.tumbling(catalog)) description = this.tumblingStep(step.stepId, description, catalog);
          if (/crosscut|angled-cuts/.test(step.stepId)) {
            const sled = this.crosscutSledLines(catalog, step.stepId);
            if (sled) description = `${description}\n${sled}`;
          }
        }
        
        return {
          stepNumber: step.stepNumber,
          stepId: step.stepId,
          // Board Master: tumbling step 2 mills the three tone boards, it rips nothing narrow
          title: this.tumbling(catalog) && step.stepId === 'rip-strips' ? 'Mill tone boards' : step.title,
          description,
          // normalize the catalog's own quoted sizes first, then fill in computed values (already formatted from the
          // true size): re-formatting a computed value from its rounded fraction would print 29/32" (23.0 mm) for 23.37 mm
          settings: this.tumblingSettings(step.stepId, this.resolveSettings(Object.fromEntries(Object.entries(step.settings ?? {})
            .map(([k, v]) => [k, (VERBATIM_CATALOG_KEYS as readonly string[]).includes(k) ? v : normalizeQuotedSizes(v, unitSys)])), catalog) ?? {}, catalog),
          // mixed-grain / end-grain final flatten never sees the planer: drop the planer infeed warning there
          safetyBanners: this.bannersFor(step.stepId, description, step.safetyBanners, catalog),
          figure: undefined, // Will be generated based on figureType
          figureType: step.figureType,
        } as StepInstruction;
      });
    }
  }

  /** Replace catalog "from cut list" placeholders with the computed value the cut list prints. */
  private resolveSettings(settings: Record<string, string> | undefined, catalog: StyleCatalog): Record<string, string> | undefined {
    if (!settings || this.cutList.length === 0) return settings;
    const unit = this.design.unitSystem;
    // every distinct rip width the cut list prints (brick has two: 78 mm and 27 mm); tumbling block: the diamond side on the thin-rip jig
    const all = this.cutList.map(i => i.part).join('\n');
    const rips = [...new Set([...all.matchAll(/rip (?:each strip )?(\S+ \([\d.]+ mm\)|[\d.]+ mm \([\d.]+"\))/g)].map(m => m[1]))];
    const tb = this.cutList.find(i => i.tumbling)?.tumbling;
    const strip = tb ? `thin-rip jig set to the diamond side ${shopSize(tb.diamondSide_mm, unit)}`
      : rips.length ? rips.join(' and ') : shopSize(Math.min(...this.cutList.map(i => i.width)), unit);
    const fa = catalog.cutListAllowances.flatteningAllowance_mm;
    if (typeof fa !== 'number') throw new Error(`${this.design.style}: catalog flatteningAllowance_mm missing`);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings)) {
      if (!/from (the )?cut list/.test(v)) { out[k] = v; continue; }
      out[k] = /slice/i.test(k) ? shopSize(this.design.dimensions.thickness + fa, unit) : strip;
    }
    return out;
  }

  /** Tumbling log glue-up: no bar-clamp spacing (Board Master). */
  private tumblingSettings(stepId: string, settings: Record<string, string>, catalog: StyleCatalog): Record<string, string> {
    if (!this.tumbling(catalog) || !/^glue-up/.test(stepId) || !('Clamp spacing' in settings)) return settings;
    const { ['Clamp spacing']: _drop, ...rest } = settings;
    void _drop;
    return { ...rest, Clamping: stepId === 'glue-up' ? 'light, even pressure in the 60° cradle or with tape; no bar-clamp spacing.' : 'light, even pressure on a flat caul; no bar-clamp spacing.' };
  }

  /** Safety banners per step: no planer infeed warning on a step that never uses the planer (router sled / drum
   *  sander only, or a mixed-grain final flatten); tumbling bevel rip gets its featherboard warning instead of the
   *  rip-fence one (Board Master, verbatim). */
  private bannersFor(stepId: string, description: string, banners: string[], catalog: StyleCatalog): string[] {
    let out = banners;
    const noPlaner = (stepId === 'flatten-and-sand' && this.mixedSheet(catalog))
      || (/router sled|drum sander/i.test(description) && !/Planer OK/.test(description));
    if (noPlaner) out = out.filter(b => !/infeed and outfeed/i.test(b));
    if (this.tumbling(catalog) && stepId === 'bevel-strips') {
      out = out.map(b => /never against the rip fence alone/i.test(b) ? `WARNING: ${TUMBLING_BEVEL_WARNING}` : b);
    }
    return out;
  }

  /** Hand-hole slot from catalog features.handHole: 4" × 1" (102 × 25 mm), 1/2" (12.7 mm) end radius. */
  private handHoleText(): string {
    const h = (loadStyleCatalog(this.design.style as CatalogStyleName) as unknown as { features?: { handHole?: { length_mm: number; width_mm: number; endRadius_mm: number; edgeInset_mm: number } } }).features?.handHole;
    if (!h) throw new Error(`${this.design.style}: catalog features.handHole missing`);
    const u = this.design.unitSystem;
    const pair = u === 'metric'
      ? `${Math.round(h.length_mm)} × ${Math.round(h.width_mm)} mm (${(h.length_mm / 25.4).toFixed(2)}" × ${(h.width_mm / 25.4).toFixed(2)}")`
      : `${sixteenthsText(h.length_mm, 32)} × ${sixteenthsText(h.width_mm, 32)} (${Math.round(h.length_mm)} × ${Math.round(h.width_mm)} mm)`;
    return `slot ${pair}, ${shopSize(h.endRadius_mm, u)} end radius, centred ${shopSize(h.edgeInset_mm, u)} in from the end`;
  }

  /** Total slices (or angled pieces) the cut list crosscuts, with the per-panel/log counts. */
  private sliceCountLine(): string {
    const rows = this.cutList.filter(i => typeof i.slices === 'number');
    const total = rows.reduce((a, i) => a + (i.slices as number), 0);
    return `${total} in all (${rows.map(i => `${this.labelOf(i).replace(/:.*$/, '')} ${i.slices}`).join(', ')})`;
  }

  private tumbling(catalog: StyleCatalog) {
    const m = (catalog.cutListAllowances as unknown as { tumblingBlockMethod?: { rowGlueUp: string; bladeTilt_deg: number; diamondAngles_deg: number[]; minStockWidthForBevelRip_mm: number; tiltDirection: string; glueUp: string } }).tumblingBlockMethod;
    return this.design.style === 'tumbling-block-3d' ? m : undefined;
  }

  /** Tumbling block steps follow catalog tumblingBlockMethod exactly (one method: diamond strips, offset logs, slices). */
  private tumblingStep(stepId: string, description: string, catalog: StyleCatalog): string {
    const m = this.tumbling(catalog)!;
    const t = this.cutList.find(i => i.tumbling)?.tumbling;
    if (!t) throw new Error('tumbling block: cut list has no tumbling data');
    const u = this.design.unitSystem;
    const [a60, a120] = m.diamondAngles_deg;
    switch (stepId) {
      case 'rip-strips':
        return `Mill one board per tone (light ${t.tones.light}, mid ${t.tones.mid}, dark ${t.tones.dark}) to ${shopSize(t.stripThickness_mm, u)} thick (diamond side ${shopSize(t.diamondSide_mm, u)} × sin 60°) and at least ${shopSize(m.minStockWidthForBevelRip_mm, u)} wide, ${shopSize(t.logLength_mm, u)} long. Rip nothing narrow yet.`;
      case 'bevel-strips':
        return `Bevel the wide stock first: tilt the blade ${m.bladeTilt_deg}° and bevel one edge of each wide board. Then cut each ${a60}°/${a120}° diamond (side ${shopSize(t.diamondSide_mm, u)}) off with a thin-rip jig, the keeper (the diamond) falling away from the fence: ${catalogText(TUMBLING_TILT, m.tiltDirection, 'tiltDirection')}. Re-bevel the wide board's edge before each next diamond. Never bevel a strip that is already narrow. ${t.stripsPerTone} diamond strip${t.stripsPerTone === 1 ? '' : 's'} per tone.`;
      case 'glue-up':
        return `Glue the diamond strips into ${t.logCount === 1 ? 'one log' : `${t.logCount} logs`} one hexagon row wide: ${t.hexPerSlice} hexagons side by side, one diamond strip of each tone per hexagon, ${shopSize(t.logLength_mm, u)} long, ${catalogText(TUMBLING_GLUE_UP, m.glueUp, 'glueUp')}. Logs are never planed.`;
      case 'glue-up-2':
        // catalog rowGlueUp: nest row strips, alternate rows offset half a hexagon, pairs on a flat caul, trim on the sled
        return `Nest the row strips (slices) with alternate rows offset by half a hexagon, ${shopSize(t.offset_mm, u)}. Glue them in pairs, then join the pairs, on a flat caul with light, even pressure. Trim the zig-zag edges on the sled with a stop block and hold-down. ${t.tileRows} rows used, ${t.spare} spare.`;
      case 'crosscut-slices':
        return [`Crosscut ${t.logCount === 1 ? 'the log' : 'each log'} into ${t.slicesPerLog} slices on a crosscut sled with a stop block; each slice is a whole row strip of ${t.hexPerSlice} hexagons.`,
          `Cut height: ${shopSize(t.cutHeight_mm, u)} (log height, 2 × diamond side) on the table-saw crosscut sled. Blade height: set the blade ${shopSize(t.bladeAbove_mm, u)} above the log, ${shopSize(t.bladeHeight_mm, u)}.`,
          'If a slice is not cut through in one pass, finish it on the bandsaw; never flip the log for a second pass on the sled.', ...description.split('\n').slice(1)].join('\n');
      default:
        return description;
    }
  }

  /** Strip-set panel items in the cut list */
  private panelItems() {
    return this.cutList.filter(item => item.part.includes('strip-set panel'));
  }

  /** Planer wording per catalog planerTextRule: only long grain, width <= planer max, length >= planer minimum. */
  private planerRoute(width: number, length: number, endGrain: boolean, catalog: StyleCatalog): string {
    const a = catalog.cutListAllowances as unknown as {
      planerMaxWidth_mm?: number; planerMinimum_mm?: { length?: number };
      planerTextRule?: { template?: string; planerMargin_mm?: number };
    };
    const unit = this.design.unitSystem;
    const max = a.planerMaxWidth_mm, min = a.planerMinimum_mm?.length, tpl = a.planerTextRule?.template;
    if (max === undefined || min === undefined || !tpl) throw new Error(`${this.design.style}: catalog planer rule missing`);
    const margin = a.planerTextRule?.planerMargin_mm;
    if (margin === undefined) throw new Error(`${this.design.style}: catalog planerTextRule.planerMargin_mm missing`);
    const w = sheetLen(width, unit);
    if (endGrain) return `end grain: router sled or drum sander, never the planer`;
    if (width > max - margin) return `too wide for the planer at ${w}: router sled or drum sander`;
    if (length < min) return `too short for the planer at ${sheetLen(length, unit)} long: router sled or drum sander`;
    const ok = tpl.replace('{width}', w);
    return this.mixedSheet(catalog) ? `${STRIP_SET_PREFIX}${ok}` : ok;
  }

  /** Mixed-grain or end-grain sheet: the final glue-up never sees the planer (catalog neverForMixedGrain / end grain up). */
  private mixedSheet(catalog: StyleCatalog): boolean {
    const mixed = (catalog.cutListAllowances as unknown as { planerTextRule?: { neverForMixedGrain?: string[] } }).planerTextRule?.neverForMixedGrain ?? [];
    return mixed.includes(this.design.style) || this.isEndGrain(catalog);
  }

  private isEndGrain(catalog: StyleCatalog): boolean {
    // end grain: an explicit flip step, or slices glued end grain up (scrap-chaotic)
    return catalog.steps.some(st => st.stepId === 'rotate-slices' || /end grain up/i.test(st.description));
  }

  private labelOf(item: { part: string }): string {
    return item.part.split(':')[0];
  }

  /** One flatten line per panel with its real width and route. */
  private customizeFlattenDescription(_generic: string, catalog: StyleCatalog): string {
    const panels = this.panelItems();
    const unit = this.design.unitSystem;
    if (panels.length === 0) {
      // no strip-set panel rows (brick): the first glued panel is the full board width
      const w = this.design.dimensions.width;
      const L = Math.max(...this.cutList.map(i => i.length));
      return `Flatten the first glued panel, ${sheetLen(w, unit)} wide:\n${this.planerRoute(w, L, false, catalog)}.`;
    }
    return panels.map(p => `Flatten ${this.labelOf(p)}, ${sheetLen(p.width, unit)} wide:\n${this.planerRoute(p.width, p.length, false, catalog)}.`).join('\n');
  }

  /** Final/assembled flatten: real glue-up width and route, replacing the generic planer sentence. */
  private finalFlattenDescription(generic: string, catalog: StyleCatalog): string {
    const d = this.design.dimensions;
    const unit = this.design.unitSystem;
    // planerTextRule.neverForMixedGrain: mixed grain directions in the final glue-up never go through the planer
    const mixed = (catalog.cutListAllowances as unknown as { planerTextRule?: { neverForMixedGrain?: string[] } })
      .planerTextRule?.neverForMixedGrain;
    if (!mixed) throw new Error(`${this.design.style}: catalog planerTextRule.neverForMixedGrain missing`);
    const route = mixed.includes(this.design.style)
      ? 'mixed grain: router sled or drum sander, never the planer'
      : this.planerRoute(d.width, d.length, this.isEndGrain(catalog), catalog);
    const rest = generic.slice(Math.max(0, generic.indexOf('Sand ')));
    return `Flatten the final glue-up, ${sheetLen(d.width, unit)} wide:\n${route}.\nThen sand: ${rest.replace(/^Sand /, '')}`.trim();
  }

  /** Sled width each crosscut needs; over catalog sledMaxWidth_mm, split first. */
  private crosscutSledLines(catalog: StyleCatalog, stepId = ''): string {
    const blankRule = catalog.cutListAllowances?.blankRule;
    const sledMax = blankRule?.sledMaxWidth_mm;
    if (sledMax === undefined) throw new Error(`${this.design.style}: catalog sledMaxWidth_mm missing`);
    const unit = this.design.unitSystem;
    const logs = this.cutList.filter(i => i.tumbling && i.slices);
    if (logs.length) return `Sled width: sled must clear the log, ${sheetLen(Math.max(...logs.map(l => l.width)), unit)} (sled at most ${sheetLen(logs[0].tumbling!.sledMax_mm, unit)}; a row is never split).`;
    const panels = this.panelItems();
    if (panels.length === 0) {
      // no strip-set panels: after a glue-up the sled crosscuts the glued panel (full board width);
      // before any glue-up it cuts the widest cut-list stock
      const idx = catalog.steps.findIndex(st => st.stepId === stepId);
      const glued = catalog.steps.slice(0, Math.max(idx, 0)).some(st => /^glue-up/.test(st.stepId));
      const widest = glued ? this.design.dimensions.width : Math.max(...this.cutList.map(i => i.width));
      return widest > sledMax
        ? `Sled width: stock is ${sheetLen(widest, unit)}, wider than the ${sheetLen(sledMax, unit)} sled. Rip it narrower first; never crosscut freehand.`
        : `Sled width: sled must clear ${sheetLen(widest, unit)}.`;
    }
    return panels.map(p => p.width > sledMax
      ? `${this.labelOf(p)}: ${sheetLen(p.width, unit)} is wider than the ${sheetLen(sledMax, unit)} sled. Split it first into sub-panels of whole strips; never crosscut freehand.`
      : `${this.labelOf(p)}${/order: ([^)]+)/.exec(p.part) ? ` (order: ${/order: ([^)]+)/.exec(p.part)![1]})` : ''}: sled must clear ${sheetLen(p.width, unit)}.`).join('\n');
  }

  /**
   * Add title to current page
   */
  private addTitle(title: string): void {
    this.doc.setFontSize(18);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 10;
  }

  /**
   * Add board summary
   */
  private addBoardSummary(): void {
    this.doc.setFontSize(12);
    this.doc.text('Board Design Summary', this.margin, this.yPosition);
    this.yPosition += 7;

    this.doc.setFontSize(10);
    const { width, length, thickness } = this.design.dimensions;
    const unit = this.design.unitSystem;
    
    const summaryLines = [
      `Style: ${this.design.style}`,
      `Dimensions: ${this.formatDim(width, unit)} × ${this.formatDim(length, unit)} × ${this.formatDim(thickness, unit)}`,
      `Species: ${this.design.species.map(s => s.name).join(', ')}`,
    ];

    for (const line of summaryLines) {
      const wrappedLines = this.doc.splitTextToSize(line, 170);
      this.doc.text(wrappedLines, this.margin + 5, this.yPosition);
      this.yPosition += wrappedLines.length * 5;
    }
    
    if (this.design.juiceGroove.enabled) {
      const grooveText = `Juice Groove: ${this.formatGroove()}`;
      const wrappedGroove = this.doc.splitTextToSize(grooveText, 170);
      this.doc.text(wrappedGroove, this.margin + 5, this.yPosition);
      this.yPosition += wrappedGroove.length * 5;
    }

    if (this.design.rubberFeet.enabled) {
      const feetText = `Rubber Feet: ${this.formatFeet()}`;
      const wrappedFeet = this.doc.splitTextToSize(feetText, 170);
      this.doc.text(wrappedFeet, this.margin + 5, this.yPosition);
      this.yPosition += wrappedFeet.length * 5;
    }

    if (this.design.handles.enabled) {
      const names = { 'handle': 'handle', 'hand-hole': 'hand hole', 'hand-hole-slot': 'hand-hole slot' } as const;
      const hh = this.design.handles.type !== 'handle' ? this.handHoleText() : '';
      const wrapped = this.doc.splitTextToSize(`Handles: ${names[this.design.handles.type]}${hh ? `, ${hh}` : ''}`, 170);
      this.doc.text(wrapped, this.margin + 5, this.yPosition);
      this.yPosition += wrapped.length * 5;
    }

    this.yPosition += 5;
  }

  /**
   * Format juice groove description
   */
  private formatGroove(): string {
    const { width, depth, fromEdge, cornerRadius } = this.design.juiceGroove;
    const unit = this.design.unitSystem;

    return `Perimeter loop, ${shopSize(width, unit)} wide × ${shopSize(depth, unit)} deep, ${shopSize(fromEdge, unit)} from the edge, corner radius ${shopSize(cornerRadius, unit)}, top face.`;
  }

  /**
   * Format rubber feet description
   */
  private formatFeet(): string {
    const { inset } = this.design.rubberFeet;
    const unit = this.design.unitSystem;

    // Hardware spec: 1" (25.4 mm) diameter × 3/8" (9.5 mm) high, printed in sheet units
    return `4 rubber feet, ${shopSize(25.4, unit)} diameter × ${shopSize(9.525, unit)} high, foot centres ${shopSize(inset, unit)} in from the edges (underside).`;
  }

  /**
   * Add cut list table
   */
  private addCutList(cutList: CutListItem[]): void {
    this.doc.setFontSize(12);
    this.doc.text('Cut List', this.margin, this.yPosition);
    this.yPosition += 7;

    // Table headers
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const headers = ['Part', 'Qty', 'Width', 'Thickness', 'Length', 'Species'];
    const colWidths = [80, 8, 20, 20, 20, 22];
    let xPos = this.margin;

    for (let i = 0; i < headers.length; i++) {
      this.doc.text(headers[i], xPos, this.yPosition);
      xPos += colWidths[i];
    }
    this.yPosition += 6;

    // Table rows: every cell wraps inside its own column (no overflow into the next one)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    const lineH = 3.6;
    for (const item of cutList) {
      const unit = this.design.unitSystem;
      const row = [
        item.part,
        item.quantity.toString(),
        shopSize(item.width, unit),
        shopSize(item.thickness, unit),
        shopSize(item.length, unit),
        item.species,
      ];
      // part text wraps per '; ' clause so a clause such as the planer line stays on one line when it fits
      const wrap = (t: string, w: number) => this.doc.splitTextToSize(t, w) as string[];
      const cells = row.map((t, i) => i === 0
        ? t.split('; ').flatMap((seg, k, all) => wrap(seg + (k < all.length - 1 ? ';' : ''), colWidths[i] - 2))
        : wrap(t, colWidths[i] - 2));
      const h = Math.max(...cells.map(c => c.length)) * lineH + 1.5;
      if (this.yPosition + h > this.pageHeight - 20) {
        this.addPageBreak();
        this.doc.setFontSize(8);
      }
      xPos = this.margin;
      for (let i = 0; i < cells.length; i++) {
        cells[i].forEach((line, k) => this.doc.text(line, xPos, this.yPosition + k * lineH));
        xPos += colWidths[i];
      }
      this.yPosition += h;
    }
    this.doc.setFontSize(10);

    this.yPosition += 5;
  }

  /**
   * Add step-by-step instructions
   */
  private addSteps(steps: StepInstruction[]): void {
    for (const step of steps) {
      if (this.yPosition > this.pageHeight - 60) {
        this.addPageBreak();
      }

      this.addStep(step);
    }
  }

  /**
   * Add individual step with figure and safety banners
   */
  private addStep(step: StepInstruction): void {
    // Step title
    this.doc.setFontSize(12);
    this.doc.setFont(FONT_FAMILY, 'bold');
    this.doc.text(`Step ${step.stepNumber}: ${step.title}`, this.margin, this.yPosition);
    this.yPosition += 7;

    // Description
    this.doc.setFontSize(10);
    this.doc.setFont(FONT_FAMILY, 'normal');
    const descLines = this.doc.splitTextToSize(step.description, 170);
    this.doc.text(descLines, this.margin, this.yPosition);
    this.yPosition += descLines.length * 5;

    // Settings (with cap at 2 + "N more settings")
    if (Object.keys(step.settings).length > 0) {
      this.yPosition += 3;
      this.doc.setFont(FONT_FAMILY, 'bold');
      this.doc.text('Settings:', this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFont(FONT_FAMILY, 'normal');
      const settingEntries = Object.entries(step.settings);
      const visibleSettings = settingEntries.slice(0, SETTING_TAG_CAP);
      
      for (const [key, value] of visibleSettings) {
        this.doc.text(`  ${key}: ${value}`, this.margin, this.yPosition);
        this.yPosition += 5;
      }

      if (settingEntries.length > SETTING_TAG_CAP) {
        this.doc.setFontSize(9);
        this.doc.text(`  + ${settingEntries.length - SETTING_TAG_CAP} more settings, see step text`, this.margin, this.yPosition);
        this.yPosition += 5;
        this.doc.setFontSize(10);
      }
    }

    // Safety banners (every banner on its own figure, no cap)
    if (step.safetyBanners.length > 0) {
      for (const banner of step.safetyBanners) {
        this.addSafetyBanner(banner);
      }
    }

    // Generate appropriate figure based on step
    const figure = this.generateStepFigure(step);
    if (figure) {
      this.addFigure(figure);
    } else if (step.figure) {
      // Use provided figure if available
      this.addFigure(step.figure);
    }

    this.yPosition += 10;
  }

  /**
   * Generate appropriate figure for step based on figureType from catalog
   * Rule: non-null figureType MUST have visuals/<styleId>/<stepId>.svg (gated for RC1)
   */
  private generateStepFigure(step: StepInstruction): string | null {
    const figureType = step.figureType;
    
    if (!figureType) {
      // figureType:null steps may use built-in figures
      return null;
    }
    
    // Check for external SVG file first (visuals/ seam)
    const externalSvg = this.loadExternalStepFigure(step.stepId);
    if (externalSvg) {
      return externalSvg;
    }
    
    // No fallback: a missing boardviz figure is always fatal (Board QA minor 3).
    throw new Error(`Missing required figure: visuals/steps/${this.design.style}/${step.stepId}.svg (figureType: ${figureType})`);
  }
  
  /**
   * Load external step figure SVG if it exists
   * Looks for visuals/steps/<styleId>/<stepId>.svg
   * Returns null if file doesn't exist
   * Throws on any read error (permissions, encoding, etc.)
   */
  private loadExternalStepFigure(stepId: string): string | null {
    // Browser: figures are preloaded with fetch (see browserPdf.ts) and handed in
    if (this.preloadedFigures) {
      return this.preloadedFigures[stepId] ?? null;
    }
    if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
      throw new Error('No figures preloaded: in the browser use buildPdfInBrowser()');
    }

    const styleId = this.design.style;
    // Path matches boardviz output: visuals/steps/<styleId>/<stepId>.svg
    const figureDir = path.join(process.cwd(), 'visuals', 'steps', styleId);
    const figurePath = path.join(figureDir, `${stepId}.svg`);
    
    // Check if file exists
    if (!fs.existsSync(figurePath)) {
      return null;
    }

    // File exists - any read error should fail the export
    try {
      const svgContent = fs.readFileSync(figurePath, 'utf-8');
      console.log(`Loaded external figure: ${figurePath}`);
      return svgContent;
    } catch (error) {
      throw new Error(`Failed to read figure ${figurePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add safety banner
   * Spec: BANNER_FONT 11, BANNER_LINE 14, every banner on its own figure, no cap
   */
  private addSafetyBanner(text: string): void {
    this.yPosition += 3;
    this.doc.setFillColor(255, 200, 200);
    
    this.doc.setFontSize(BANNER_FONT);
    const lines = this.doc.splitTextToSize(normalizeQuotedSizes(text, this.design.unitSystem), 160);
    const boxHeight = lines.length * BANNER_LINE / 3.5;
    
    this.doc.rect(this.margin, this.yPosition - 4, 170, boxHeight, 'F');
    this.doc.setFont(FONT_FAMILY, 'bold');
    this.doc.text(lines, this.margin + 5, this.yPosition);
    this.yPosition += boxHeight + 2;
    this.doc.setFont(FONT_FAMILY, 'normal');
  }

  /**
   * Add figure (SVG rendered into PDF)
   */
  private addFigure(svg: string): void {
    this.yPosition += 5;
    
    // Parse SVG to get dimensions
    const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
    const vb = root.match(/viewBox="[\d.\s-]+?\s([\d.]+)\s+([\d.]+)"/);
    const widthMatch = root.match(/\bwidth="([\d.]+)(?:px)?"/) ?? (vb ? [vb[0], vb[1]] : null);
    const heightMatch = root.match(/\bheight="([\d.]+)(?:px)?"/) ?? (vb ? [vb[0], vb[2]] : null);
    
    if (widthMatch && heightMatch) {
      const svgWidth = parseFloat(widthMatch[1]);
      const svgHeight = parseFloat(heightMatch[1]);
      
      // No scaling - use actual size
      const scale = 1;
      const displayWidth = svgWidth * scale * 0.2645833; // Convert px to mm
      const displayHeight = svgHeight * scale * 0.2645833;
      
      // Check if figure fits on current page
      if (this.yPosition + displayHeight > this.pageHeight - 20) {
        this.addPageBreak();
      }
      
      if (!svgRasterizer) {
        throw new Error('No SVG rasterizer registered: import src/lib/rasterNode (Node) before generating PDFs');
      }
      // 300 dpi PNG (svg px are 96 dpi)
      const png = svgRasterizer(svg, (svgWidth * FIGURE_DPI) / 96);
      let bin = '';
      for (let i = 0; i < png.length; i++) bin += String.fromCharCode(png[i]);
      const pngUri = 'data:image/png;base64,' + btoa(bin);
      this.doc.addImage(pngUri, 'PNG', this.margin, this.yPosition, displayWidth, displayHeight, undefined, 'FAST');
      this.yPosition += displayHeight + 5;
    } else {
      throw new Error(`Malformed step figure SVG (no width/height/viewBox): ${svg.slice(0, 160)}`);
    }
  }

  /**
   * Add footer with minimum 8pt text
   */
  private addFooter(): void {
    this.doc.setFontSize(MIN_TEXT_SIZE);
    this.doc.setTextColor(100, 100, 100);
    
    const footerText = 'Generated by ChopChop Cutting Board Designer';
    this.doc.text(footerText, this.margin, this.pageHeight - 10);
    
    const pricesNote = 'Prices are your own entries';
    this.doc.text(pricesNote, 210 - this.margin - 60, this.pageHeight - 10);
    
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Add page break
   */
  private addPageBreak(): void {
    this.doc.addPage();
    this.currentPage++;
    this.yPosition = 20;
  }

  /**
   * Format dimension based on unit system
   */
  private formatDim(mm: number, unit: string): string {
    return shopSize(mm, unit as 'imperial' | 'metric');
  }

  /** Step texts computed from this cut list (same customization as the cut sheet). */
  stepsFor(cutList: CutListItem[]): StepInstruction[] {
    this.cutList = cutList;
    return this.loadStepsFromCatalog();
  }

  /**
   * Get the generated PDF document
   */
  getDocument(): jsPDF {
    return this.doc;
  }

  /**
   * Save PDF to file
   */
  save(filename: string): void {
    this.doc.save(filename);
  }
}

/**
 * Generate mill plan PDF
 */
export function generateMillPlan(design: BoardDesign): jsPDF {
  const doc = newDoc();

  let yPos = 20;
  const margin = 20;
  const maxWidth = 170;

  doc.setFontSize(18);
  doc.text('Mill Plan', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  const subtitle = doc.splitTextToSize('Milling sequence and setup instructions', maxWidth);
  doc.text(subtitle, margin, yPos);
  yPos += subtitle.length * 5 + 5;

  // Board specifications
  doc.setFontSize(12);
  doc.setFont(FONT_FAMILY, 'bold');
  doc.text('Board Specifications', margin, yPos);
  yPos += 7;
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  
  const unit = design.unitSystem;
  const { width, length, thickness } = design.dimensions;
  
  const specs: string[] = [
    `Dimensions: ${shopSize(width, unit)} × ${shopSize(length, unit)} × ${shopSize(thickness, unit)}`,
    `Style: ${design.style}`,
    `Species: ${design.species.map(s => s.name).join(', ')}`,
  ];
  
  for (const spec of specs) {
    const lines = doc.splitTextToSize(spec, maxWidth);
    doc.text(lines, margin + 5, yPos);
    yPos += lines.length * 5;
  }
  yPos += 5;

  // Load catalog steps for milling sequence
  let catalogSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    settings: Record<string, string>;
  }> = [];
  // same computed widths, routes, sled widths and slice sizes as the cut sheet, never the generic catalog sentence
  catalogSteps = new PdfGenerator(design).stepsFor(calculateRequiredParts(design)).map(st => ({
    stepNumber: st.stepNumber, title: st.title, description: st.description, settings: st.settings ?? {},
  }));

  // Decision: the mill plan is a text checklist; the figures live in the cut sheet PDF.
  doc.text('Figures: see the cut sheet PDF (this mill plan is text only).', margin, yPos);
  yPos += 8;

  if (catalogSteps.length > 0) {
    doc.setFontSize(12);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('Milling Sequence', margin, yPos);
    yPos += 7;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(10);

    for (const step of catalogSteps) {
      // Check for page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Step number and title
      doc.setFont(FONT_FAMILY, 'bold');
      const stepTitle = `${step.stepNumber}. ${step.title}`;
      const titleLines = doc.splitTextToSize(stepTitle, maxWidth);
      doc.text(titleLines, margin, yPos);
      yPos += titleLines.length * 5;
      doc.setFont(FONT_FAMILY, 'normal');

      // Description
      const descLines = doc.splitTextToSize(step.description, maxWidth - 5);
      doc.text(descLines, margin + 5, yPos);
      yPos += descLines.length * 5;

      // Settings
      if (Object.keys(step.settings).length > 0) {
        yPos += 2;
        for (const [key, value] of Object.entries(step.settings)) {
          const settingLine = `  • ${key}: ${value}`;
          const settingLines = doc.splitTextToSize(settingLine, maxWidth - 5);
          doc.text(settingLines, margin + 5, yPos);
          yPos += settingLines.length * 5;
        }
      }

      yPos += 3;
    }
  }

  // Add footer
  doc.setFontSize(MIN_TEXT_SIZE);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text('Prices are your own entries', margin, 270);
  }

  return doc;
}
