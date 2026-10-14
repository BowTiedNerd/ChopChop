#!/usr/bin/env tsx
/**
 * Export command for ChopChop designs
 * Contract:
 * - Run validation (validateBoard/validateAngle)
 * - Exit 2 and write no files on refusal
 * - Record the commit SHA in export
 * - Export design to JSON
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { BoardDesign } from '../src/types';
import { validateBoard } from '../src/lib/validation';
import { calculateRequiredParts } from '../src/lib/lumberPlanner';
import { generatePattern } from '../src/lib/patterns';
import { inchText } from '../src/utils/format';

interface ExportOptions {
  designFile?: string;
  outputFile?: string;
  design?: BoardDesign;
}

function getCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
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
  
  // Validate design
  const validation = validateBoard(design);
  if (!validation.valid) {
    console.error('Design validation failed:');
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(2);
  }
  
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
    exportedAt: new Date().toISOString(),
    commitSha: getCommitSha(),
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
    })),
  };
  
  // Write output
  const output = JSON.stringify(exportDoc, null, 2);
  
  if (options.outputFile) {
    writeFileSync(options.outputFile, output, 'utf-8');
    console.log(`Export written to ${options.outputFile}`);
  } else {
    console.log(output);
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
