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
  createMetricBoard,
  WOOD_SPECIES 
} from '../src/lib/defaults';
import { BoardDesign, CutListItem, StepInstruction } from '../src/types';

const SAMPLES_DIR = 'samples';

// Ensure samples directory exists
if (!existsSync(SAMPLES_DIR)) {
  mkdirSync(SAMPLES_DIR, { recursive: true });
}

// Sample cut list
const sampleCutList: CutListItem[] = [
  {
    part: 'Board strips (Walnut)',
    quantity: 10,
    width: 25.4,
    thickness: 38.1,
    length: 406.4,
    species: 'Walnut',
  },
  {
    part: 'Board strips (Maple)',
    quantity: 10,
    width: 25.4,
    thickness: 38.1,
    length: 406.4,
    species: 'Maple',
  },
];

// Sample steps
const sampleSteps: StepInstruction[] = [
  {
    stepNumber: 1,
    title: 'Mill rough stock',
    description: 'Joint edges on the jointer. Plane to final thickness using multiple passes.',
    settings: {
      'Planer depth': '38.1 mm (1.5")',
      'Feed rate': 'Slow',
      'Blade height': '40 mm',
    },
    safetyBanners: [
      'WARNING: Keep hands away from cutterhead. Use push blocks.',
      'CAUTION: Ensure stock is flat before planing.',
    ],
  },
  {
    stepNumber: 2,
    title: 'Rip strips to width',
    description: 'Set rip fence to 25.4 mm (1"). Cut all strips to uniform width.',
    settings: {
      'Rip fence': '25.4 mm (1")',
      'Blade height': '45 mm',
    },
    safetyBanners: [
      'WARNING: Use push stick. Keep hands clear of blade.',
    ],
  },
  {
    stepNumber: 3,
    title: 'Crosscut strips to length',
    description: 'Use stop block on crosscut sled. Cut all strips to exact length.',
    settings: {
      'Stop block position': '406.4 mm (16")',
      'Blade height': '45 mm',
    },
    safetyBanners: [
      'WARNING: Never reach over the blade.',
    ],
  },
  {
    stepNumber: 4,
    title: 'Glue-up checkerboard pattern',
    description: 'Arrange strips in alternating pattern. Apply even pressure with clamps. Let dry 24 hours.',
    settings: {},
    safetyBanners: [],
  },
];

function generateSample(name: string, design: BoardDesign): void {
  console.log(`Generating ${name}...`);
  
  const generator = new PdfGenerator(design);
  const pdf = generator.generateCutSheet(sampleCutList, sampleSteps);
  
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
