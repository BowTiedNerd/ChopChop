import { jsPDF } from 'jspdf';
import { BoardDesign, StepInstruction, CutListItem } from '../types';
import { inchText, metricText, sheetLen } from '../utils/format';
import { 
  generateTopViewFigure, 
  generateRipFenceFigure,
  generateGlueUpFigure,
  generateCrosscutFigure,
  generateCutListFigure,
  generatePlanerFigure
} from './stepFigures';
import { loadStyleCatalog } from './catalogLoader';
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
        let description = step.description;
        
        // Customize flatten-first-panel step based on actual panel widths
        const hasFlattenStep = catalog.steps.some(st => st.stepId === 'flatten-first-panel');
        if (this.cutList.length > 0) {
          if (step.stepId === 'flatten-first-panel' || (!hasFlattenStep && step.stepId === 'glue-up')) {
            const lines = this.customizeFlattenDescription('', catalog);
            description = step.stepId === 'glue-up' && lines ? `${description}\n${lines}` : (lines || description);
          }
          if (/crosscut|angled-cuts/.test(step.stepId)) {
            const sled = this.crosscutSledLines(catalog);
            if (sled) description = `${description}\n${sled}`;
          }
        }
        
        return {
          stepNumber: step.stepNumber,
          stepId: step.stepId,
          title: step.title,
          description,
          settings: step.settings,
          safetyBanners: step.safetyBanners,
          figure: undefined, // Will be generated based on figureType
          figureType: step.figureType,
        } as StepInstruction;
      });
    }
  }

  /** Strip-set panel items in the cut list */
  private panelItems() {
    return this.cutList.filter(item => item.part.includes('strip-set panel'));
  }

  /**
   * One flatten line per panel, sheet units first, e.g. Panel 1/2: 16.0" (406 mm) wide.
   * No planer for panels wider than catalog panelMaxPlanerWidth_mm.
   */
  private customizeFlattenDescription(genericDescription: string, catalog: StyleCatalog): string {
    const blankRule = catalog.cutListAllowances?.blankRule;
    const panels = this.panelItems();
    if (!blankRule || panels.length === 0) return genericDescription;
    const max = blankRule.panelMaxPlanerWidth_mm;
    if (max === undefined) throw new Error(`${this.design.style}: catalog panelMaxPlanerWidth_mm missing`);
    const unit = this.design.unitSystem;
    return panels.map((p, i) => {
      const w = sheetLen(p.width, unit);
      const how = p.width <= max
        ? 'plane flat (within planer capacity)'
        : 'too wide for the planer: flatten on the router sled or drum sander';
      return `Flatten panel ${i + 1}/${panels.length}, ${w} wide: ${how}.`;
    }).join('\n');
  }

  /** Sled width each crosscut needs; over catalog sledMaxWidth_mm, split first. */
  private crosscutSledLines(catalog: StyleCatalog): string {
    const blankRule = catalog.cutListAllowances?.blankRule;
    const panels = this.panelItems();
    if (!blankRule || panels.length === 0) return '';
    const sledMax = blankRule.sledMaxWidth_mm;
    if (sledMax === undefined) throw new Error(`${this.design.style}: catalog sledMaxWidth_mm missing`);
    const unit = this.design.unitSystem;
    return panels.map((p, i) => p.width > sledMax
      ? `Panel ${i + 1}/${panels.length}: ${sheetLen(p.width, unit)} is wider than the ${sheetLen(sledMax, unit)} sled. Split it first into sub-panels of whole strips; never crosscut freehand.`
      : `Panel ${i + 1}/${panels.length}: sled must clear ${sheetLen(p.width, unit)}.`).join('\n');
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

    this.yPosition += 5;
  }

  /**
   * Format juice groove description
   */
  private formatGroove(): string {
    const { width, depth, fromEdge, cornerRadius } = this.design.juiceGroove;
    const unit = this.design.unitSystem;

    if (unit === 'metric') {
      return `Perimeter loop, ${width} mm wide × ${depth} mm deep, ${fromEdge} mm from the edge, corner radius ${cornerRadius} mm, top face.`;
    } else {
      return `Perimeter loop, ${inchText(width / 25.4)} wide × ${inchText(depth / 25.4)} deep, ${inchText(fromEdge / 25.4)} from the edge, corner radius ${inchText(cornerRadius / 25.4)}, top face.`;
    }
  }

  /**
   * Format rubber feet description
   */
  private formatFeet(): string {
    const { inset } = this.design.rubberFeet;
    const unit = this.design.unitSystem;

    // Always use the correct hardware spec: 1" (25.4 mm) × 3/8" (9.5 mm)
    if (unit === 'metric') {
      return `4 rubber feet, 1" (25.4 mm) diameter × 3/8" (9.5 mm) high, foot centres ${inset} mm in from the edges (underside).`;
    } else {
      return `4 rubber feet, 1" (25.4 mm) diameter × 3/8" (9.5 mm) high, foot centres ${inchText(inset / 25.4)} in from the edges (underside).`;
    }
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
    const colWidths = [40, 15, 30, 30, 30, 35];
    let xPos = this.margin;

    for (let i = 0; i < headers.length; i++) {
      this.doc.text(headers[i], xPos, this.yPosition);
      xPos += colWidths[i];
    }
    this.yPosition += 6;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    for (const item of cutList) {
      if (this.yPosition > this.pageHeight - 20) {
        this.addPageBreak();
      }

      xPos = this.margin;
      const unit = this.design.unitSystem;
      
      const row = [
        item.part,
        item.quantity.toString(),
        this.formatDim(item.width, unit),
        this.formatDim(item.thickness, unit),
        this.formatDim(item.length, unit),
        item.species,
      ];

      for (let i = 0; i < row.length; i++) {
        this.doc.text(row[i], xPos, this.yPosition);
        xPos += colWidths[i];
      }
      this.yPosition += 5;
    }

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
    const unit = this.design.unitSystem;
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
    
    // Require external figures by default (boardviz generates them)
    // Set ALLOW_FALLBACK_FIGURES=true to generate figures inline (dev/test only)
    const ALLOW_FALLBACK = process.env.ALLOW_FALLBACK_FIGURES === 'true';
    if (!ALLOW_FALLBACK) {
      throw new Error(`Missing required figure: visuals/steps/${this.design.style}/${step.stepId}.svg (figureType: ${figureType})`);
    }
    
    // Fallback: generate figure based on catalog figureType (dev/test only)
    switch (figureType) {
      case 'rip-fence': {
        // Get fence distance from settings or use strip width
        const fenceSetting = step.settings['Fence to blade'] || step.settings['Rip fence'];
        const fenceDistance = fenceSetting ? this.parseDistance(fenceSetting) : 25.4;
        const bladeHeight = this.design.dimensions.thickness + 5;
        const figure = generateRipFenceFigure(fenceDistance, bladeHeight, unit);
        return figure.svg;
      }
      
      case 'crosscut': {
        // Get stop position from settings
        const stopSetting = step.settings['Stop block position'] || step.settings['Slice length'];
        const stopPosition = stopSetting ? this.parseDistance(stopSetting) : this.design.dimensions.length;
        const figure = generateCrosscutFigure(stopPosition, unit);
        return figure.svg;
      }
      
      case 'mill':
      case 'planer': {
        // Get planer depth from settings
        const depth = this.design.dimensions.thickness;
        const figure = generatePlanerFigure(depth, unit);
        return figure.svg;
      }
      
      case 'glue-up': {
        const figure = generateGlueUpFigure(this.design, step.stepNumber);
        return figure.svg;
      }
      
      case 'top-view': {
        const figure = generateTopViewFigure(this.design);
        return figure.svg;
      }
      
      default:
        return null;
    }
  }
  
  /**
   * Parse distance from setting string (e.g., "25.4 mm" or "1.5\"")
   */
  private parseDistance(setting: string): number {
    // Extract number from string like "25.4 mm" or "strip width from cut list"
    const match = setting.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
    return 25.4; // Default fallback
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
    const lines = this.doc.splitTextToSize(text, 160);
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
    if (unit === 'metric') {
      return metricText(mm, 1);
    } else {
      return inchText(mm / 25.4);
    }
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
  
  let specs: string[];
  if (unit === 'metric') {
    specs = [
      `Dimensions: ${width} mm × ${length} mm × ${thickness} mm`,
      `Style: ${design.style}`,
      `Species: ${design.species.map(s => s.name).join(', ')}`,
    ];
  } else {
    specs = [
      `Dimensions: ${inchText(width / 25.4)} × ${inchText(length / 25.4)} × ${inchText(thickness / 25.4)}`,
      `Style: ${design.style}`,
      `Species: ${design.species.map(s => s.name).join(', ')}`,
    ];
  }
  
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
  catalogSteps = loadStyleCatalog(design.style as CatalogStyleName).steps;

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
