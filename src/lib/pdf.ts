import { jsPDF } from 'jspdf';
import { BoardDesign, StepInstruction, CutListItem } from '../types';
import { inchText, metricText } from '../utils/format';

const BANNER_FONT = 11;
const BANNER_LINE = 14;
const MIN_TEXT_SIZE = 8; // pt minimum for footers and notes
const SETTING_TAG_CAP = 2;

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
  generateCutSheet(cutList: CutListItem[], steps: StepInstruction[]): jsPDF {
    this.addTitle('Cut Sheet');
    this.addBoardSummary();
    this.addCutList(cutList);
    this.addSteps(steps);
    this.addFooter();
    
    return this.doc;
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

    if (this.design.juiceGroove.enabled) {
      summaryLines.push(`Juice Groove: ${this.formatGroove()}`);
    }

    if (this.design.rubberFeet.enabled) {
      summaryLines.push(`Rubber Feet: ${this.formatFeet()}`);
    }

    for (const line of summaryLines) {
      this.doc.text(line, this.margin + 5, this.yPosition);
      this.yPosition += 5;
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
    const { diameter, height, inset } = this.design.rubberFeet;
    const unit = this.design.unitSystem;

    if (unit === 'metric') {
      // 2.5.4 format: 1" (25.4 mm) × 3/8" (9.5 mm)
      return `4 rubber feet, ${diameter} mm diameter × ${height} mm high, foot centres ${inset} mm in from the edges (underside).`;
    } else {
      return `4 rubber feet, ${inchText(diameter / 25.4)} diameter × ${inchText(height / 25.4)} high, foot centres ${inchText(inset / 25.4)} in from the edges (underside).`;
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
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Step ${step.stepNumber}: ${step.title}`, this.margin, this.yPosition);
    this.yPosition += 7;

    // Description
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const descLines = this.doc.splitTextToSize(step.description, 170);
    this.doc.text(descLines, this.margin, this.yPosition);
    this.yPosition += descLines.length * 5;

    // Settings (with cap at 2 + "N more settings")
    if (Object.keys(step.settings).length > 0) {
      this.yPosition += 3;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Settings:', this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFont('helvetica', 'normal');
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

    // Figure (if available)
    if (step.figure) {
      this.addFigure(step.figure);
    }

    this.yPosition += 10;
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
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(lines, this.margin + 5, this.yPosition);
    this.yPosition += boxHeight + 2;
    this.doc.setFont('helvetica', 'normal');
  }

  /**
   * Add figure (SVG as image or placeholder)
   */
  private addFigure(_svg: string): void {
    this.yPosition += 5;
    // SVG would be rendered here
    // For now, add placeholder
    this.doc.setFontSize(9);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text('[Step Diagram]', this.margin, this.yPosition);
    this.doc.setTextColor(0, 0, 0);
    this.yPosition += 20;
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
export function generateMillPlan(_design: BoardDesign): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  doc.setFontSize(18);
  doc.text('Mill Plan', 20, 20);

  doc.setFontSize(10);
  doc.text('Milling sequence and setup instructions', 20, 30);

  // Add footer
  doc.setFontSize(MIN_TEXT_SIZE);
  doc.text('Prices are your own entries', 20, 270);

  return doc;
}
