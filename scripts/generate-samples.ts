#!/usr/bin/env node

/**
 * Generate sample PDFs for different board configurations
 * 
 * Generates:
 * - checkerboard-default.pdf
 * - checkerboard-16x24.pdf
 * - chevron.pdf
 * - brick.pdf
 * - metric.pdf
 * - mill-plan.pdf
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PdfGenerator, generateMillPlan } from '../src/lib/pdf';
import { 
  createDefaultBoard, 
  create16x24Board, 
  createMetricBoard
} from '../src/lib/defaults';
import { BoardDesign } from '../src/types';
import { calculateRequiredParts } from '../src/lib/lumberPlanner';

const SAMPLES_DIR = 'samples';

// Ensure samples directory exists
if (!existsSync(SAMPLES_DIR)) {
  mkdirSync(SAMPLES_DIR, { recursive: true });
}

function generateSample(name: string, design: BoardDesign): void {
  console.log(`Generating ${name}...`);
  
  // Calculate actual cut list from design
  const cutList = calculateRequiredParts(design);
  
  const generator = new PdfGenerator(design);
  const pdf = generator.generateCutSheet(cutList);
  
  const buffer = pdf.output('arraybuffer');
  const filePath = join(SAMPLES_DIR, `${name}.pdf`);
  writeFileSync(filePath, Buffer.from(buffer));
  
  console.log(`  ✓ Generated: ${filePath}`);
}

// Generate samples
console.log('\nGenerating sample PDFs...\n');

// Default checkerboard
const defaultBoard = createDefaultBoard();
generateSample('checkerboard-default', defaultBoard);

// 16x24 checkerboard
const board16x24 = create16x24Board();
board16x24.juiceGroove.enabled = true;
generateSample('checkerboard-16x24', board16x24);

// Chevron
const chevronBoard = createDefaultBoard();
chevronBoard.style = 'chevron';
generateSample('chevron', chevronBoard);

// Brick basketweave
const brickBoard = createDefaultBoard();
brickBoard.style = 'brick-basketweave';
generateSample('brick', brickBoard);

// Metric board
const metricBoard = createMetricBoard();
metricBoard.juiceGroove.enabled = true;
metricBoard.rubberFeet.enabled = true;
generateSample('metric', metricBoard);

// Mill plan
console.log('Generating mill-plan...');
const millPlan = generateMillPlan(createDefaultBoard());
const millBuffer = millPlan.output('arraybuffer');
const millPath = join(SAMPLES_DIR, 'mill-plan.pdf');
writeFileSync(millPath, Buffer.from(millBuffer));
console.log(`  ✓ Generated: ${millPath}`);

console.log('\n✓ All sample PDFs generated successfully\n');
