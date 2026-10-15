#!/usr/bin/env tsx
/**
 * Export command for ChopChop designs
 * Contract:
 * - Run validation (validateBoard/validateAngle/validateStyle/validateOutputFolder)
 * - Exit 2 and write no files on refusal
 * - Record the commit SHA in export
 * - Export design to JSON and PDF
 */

import '../src/lib/rasterNode';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname } from 'path';
import { BoardDesign } from '../src/types';
import { validateBoard, validateAngle, validateOutputPath } from '../src/lib/validation';
import { accessSync, constants as fsConstants } from 'fs';
import { calculateRequiredParts } from '../src/lib/lumberPlanner';
import { generatePattern } from '../src/lib/patterns';
import { inchText } from '../src/utils/format';
import { PdfGenerator } from '../src/lib/pdf';

interface ExportOptions {
  designFile?: string;
  outputFile?: string;
  design?: BoardDesign;
}

function getCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    // Not a git checkout (e.g. tarball install): report it, don't fail the export
    console.error('Warning: git rev-parse failed:', error instanceof Error ? error.message : String(error));
    return 'unknown';
  }
}

/** Build the export document (shared by the CLI and generate-samples). */
export function buildExportDoc(design: BoardDesign, meta: { exportedAt: string; commitSha: string }) {
  // Generate pattern and cut list
  const pattern = generatePattern(design);
  const cutList = calculateRequiredParts(design);
  
  // Format dimensions for export
  const f = (mm: number) => {
    if (design.unitSystem === 'metric') {
      const rounded = Number(mm.toFixed(1));
      if (Math.floor(rounded) === rounded) {
        return `${Math.floor(rounded)} mm`;
      }
      return `${rounded.toFixed(1)} mm`;
    } else {
      return inchText(mm / 25.4);
    }
  };
  
  // Create export document
  const exportDoc = {
    version: '1.0.0',
    exportedAt: meta.exportedAt,
    commitSha: meta.commitSha,
    design: {
      style: design.style,
      dimensions: {
        width: f(design.dimensions.width),
        length: f(design.dimensions.length),
        thickness: f(design.dimensions.thickness),
      },
      species: design.species.map(s => s.name),
      angle: design.angle,
      modifiers: {
        juiceGroove: design.juiceGroove.enabled ? {
          width: f(design.juiceGroove.width),
          depth: f(design.juiceGroove.depth),
          fromEdge: f(design.juiceGroove.fromEdge),
          cornerRadius: f(design.juiceGroove.cornerRadius),
        } : null,
        handles: design.handles.enabled ? {
          type: design.handles.type,
        } : null,
        feet: design.rubberFeet.enabled ? {
          diameter: f(design.rubberFeet.diameter),
          height: f(design.rubberFeet.height),
          inset: f(design.rubberFeet.inset),
        } : null,
      },
      unitSystem: design.unitSystem,
    },
    pattern: {
      stripCount: pattern.strips.length,
      strips: pattern.strips.map(s => ({
        species: s.species.name,
        width: f(s.width),
        height: f(s.height),
        depth: f(s.depth),
      })),
    },
    cutList: cutList.map(item => ({
      part: item.part,
      quantity: item.quantity,
      width: f(item.width),
      thickness: f(item.thickness),
      length: f(item.length),
      species: item.species,
      // sub-panel rows of one panel share panelId (A, B, ...); subPanel = { index, count }
      ...(item.panelId ? { panelId: item.panelId } : {}),
      ...(item.subPanel ? { subPanel: item.subPanel } : {}),
      ...(item.dims ? { dims: item.dims } : {}),
      ...(item.slices !== undefined ? { slices: item.slices } : {}),
    })),
    // tumbling block (catalog tumblingBlockMethod): the numbers Board Visuals checks
    ...(cutList.find(i => i.tumbling) ? { tumblingBlock: (() => {
      const t = cutList.find(i => i.tumbling)!.tumbling!;
      const mm = (v: number) => Math.round(v * 1000) / 1000; // numbers in mm for Board Visuals
      return { ...t, diamondSide_mm: mm(t.diamondSide_mm), stripThickness_mm: mm(t.stripThickness_mm), logLength_mm: mm(t.logLength_mm), offset_mm: mm(t.offset_mm) };
    })() } : {}),
  };
  
  return { exportDoc, cutList };
}

function exportDesign(options: ExportOptions): void {
  let design: BoardDesign;
  
  // Load design
  if (options.design) {
    design = options.design;
  } else if (options.designFile) {
    const designJson = readFileSync(options.designFile, 'utf-8');
    design = JSON.parse(designJson);
  } else {
    console.error('Error: No design provided');
    process.exit(2);
  }
  
  // Validate output folder if writing to file
  if (options.outputFile) {
    try {
      validateOutputPath(options.outputFile, { existsSync, accessSync, W_OK: fsConstants.W_OK });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(2);
    }
  }
  
  // Validate design
  const validation = validateBoard(design);
  if (!validation.valid) {
    console.error('Design validation failed:');
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(2);
  }
  
  // Validate angle if specified
  if (design.angle !== undefined) {
    const angleValidation = validateAngle(design.style, design.angle);
    if (!angleValidation.valid) {
      console.error('Angle validation failed:');
      for (const error of angleValidation.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(2);
    }
  }
  
  const { exportDoc, cutList } = buildExportDoc(design, { exportedAt: new Date().toISOString(), commitSha: getCommitSha() });
  
  // Write JSON output
  const jsonOutput = JSON.stringify(exportDoc, null, 2);
  
  if (options.outputFile) {
    // Ensure output directory exists
    const outputDir = dirname(options.outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Build the PDF first: if it fails, write nothing and exit non-zero
    const pdfPath = options.outputFile.replace(/\.json$/, '.pdf');
    let pdfBuffer: Buffer;
    try {
      const pdfGenerator = new PdfGenerator(design);
      const doc = pdfGenerator.generateCutSheet(cutList);
      pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error: PDF generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    writeFileSync(options.outputFile, jsonOutput, 'utf-8');
    console.log(`Export written to ${options.outputFile}`);
    writeFileSync(pdfPath, pdfBuffer);
    console.log(`PDF written to ${pdfPath}`);
  } else {
    console.log(jsonOutput);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run export <design.json> [output.json]');
    console.error('       npm run export -- --design <design.json> [--output <output.json>]');
    process.exit(1);
  }
  
  const options: ExportOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--design') {
      options.designFile = args[++i];
    } else if (args[i] === '--output') {
      options.outputFile = args[++i];
    } else if (!options.designFile) {
      options.designFile = args[i];
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.outputFile = args[++i];
      }
    }
  }
  
  exportDesign(options);
}

export type { ExportOptions };
export { exportDesign };
