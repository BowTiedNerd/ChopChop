import { jsPDF } from 'jspdf';
import { BoardDesign, StepInstruction, CutListItem } from '../types';
import { inchText, metricText } from '../utils/format';
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

  constructor(design: BoardDesign) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });
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
    try {
      const catalog = loadStyleCatalog(this.design.style as CatalogStyleName);
      
      return catalog.steps.map(step => {
        let description = step.description;
        
        // Customize flatten-first-panel step based on actual panel widths
        if (step.stepId === 'flatten-first-panel' && this.cutList.length > 0) {
          description = this.customizeFlattenDescription(step.description, catalog);
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
    } catch {
      // Fallback to empty steps if catalog not found
      return [];
    }
  }

  /**
   * Customize flatten step description based on actual panel widths
   */
  private customizeFlattenDescription(genericDescription: string, catalog: StyleCatalog): string {
    const blankRule = catalog.cutListAllowances?.blankRule;
    if (!blankRule) return genericDescription;
    
    const panelMaxWidth = blankRule.panelMaxPlanerWidth_mm || 305;
    const options = blankRule.panelWideOption || ['routerSled'];
    
    // Find all strip-set panels in cut list
    const panels = this.cutList.filter(item => 
      item.part.includes('strip-set panel')
    );
    
    if (panels.length === 0) return genericDescription;
    
    // Build panel-specific descriptions
    const descriptions: string[] = [];
    
    for (const panel of panels) {
      const panelWidth = panel.width;
      const unit = this.design.unitSystem;
      
      if (panelWidth <= panelMaxWidth) {
        // Narrow panel - plane it
        const widthText = unit === 'metric' 
          ? `${Math.round(panelWidth)} mm`
          : `${inchText(panelWidth / 25.4)}`;
        descriptions.push(
          `Plane or sand the ${widthText}-wide panel flat (still long grain, planer allowed).`
        );
      } else {
        // Wide panel - use router sled or split
        const widthText = unit === 'metric'
          ? `${Math.round(panelWidth)} mm`
          : `${inchText(panelWidth / 25.4)}`;
        
        if (options.includes('splitSubPanels')) {
          // Calculate sub-panels from the actual cut list part description
          const splitMatch = panel.part.match(/split into (\d+) sub-panels/);
          if (splitMatch) {
            descriptions.push(
              `Flatten this ${widthText} panel: split into ${splitMatch[1]} sub-panels of at most ${panelMaxWidth} mm each, plane each sub-panel, then glue them together.`
            );
          } else {
            descriptions.push(
              `Flatten this ${widthText} panel on the router sled or drum sander.`
            );
          }
        } else {
          descriptions.push(
            `Flatten this ${widthText} panel on the router sled or drum sander.`
          );
        }
      }
    }
    
    return descriptions.join(' ');
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
    // Only attempt to load external figures in Node.js (not browser)
    if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
      return null;
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
    const widthMatch = svg.match(/width="(\d+)"/);
    const heightMatch = svg.match(/height="(\d+)"/);
    
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
      
      // Create data URI for SVG
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      
      try {
        // Add SVG as image to PDF
        this.doc.addImage(
          svgDataUri,
          'SVG',
          this.margin,
          this.yPosition,
          displayWidth,
          displayHeight
        );
        
        this.yPosition += displayHeight + 5;
      } catch {
        // Fallback if SVG rendering fails
        this.doc.setFontSize(9);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text('[Step Diagram]', this.margin, this.yPosition);
        this.doc.setTextColor(0, 0, 0);
        this.yPosition += 20;
      }
    } else {
      // Fallback for malformed SVG
      this.doc.setFontSize(9);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('[Step Diagram]', this.margin, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 20;
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

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
  try {
    const catalog = loadStyleCatalog(design.style as CatalogStyleName);
    catalogSteps = catalog.steps;
  } catch {
    catalogSteps = [];
  }

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
