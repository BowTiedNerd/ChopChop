#!/usr/bin/env node

/**
 * Generate sample PDFs for different board configurations
 * 
 * Generates:
 * - checkerboard-default.pdf
 * - checkerboard-16x24.pdf
 * - chevron.pdf
 * - brick.pdf
 * - herringbone.pdf
 * - metric.pdf
 * - hand-hole.pdf
 * - tumbling-block-3d.pdf / tumbling-block-3d.json
 * - scrap-chaotic.pdf
 * - features-combined.pdf (juice groove + feet + finger grip)
 * - mill-plan.pdf
 */

import '../src/lib/rasterNode';
// Samples are committed and byte-compared in CI: fixed timestamp/ID unless the caller sets one
process.env.SOURCE_DATE_EPOCH ??= '1767225600';
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
import { buildExportDoc } from './export';

const SAMPLES_DIR = 'samples';

// Ensure samples directory exists
if (!existsSync(SAMPLES_DIR)) {
  mkdirSync(SAMPLES_DIR, { recursive: true });
}

/** JSON export alongside the PDF; fixed metadata so CI can byte-compare it */
function generateSampleJson(name: string, design: BoardDesign): void {
  const exportedAt = new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString();
  const { exportDoc } = buildExportDoc(design, { exportedAt, commitSha: 'sample' });
  const filePath = join(SAMPLES_DIR, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(exportDoc, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ Generated: ${filePath}`);
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

// End grain (default dimensions)
const endGrainBoard = createDefaultBoard();
endGrainBoard.style = 'end-grain';
generateSample('end-grain', endGrainBoard);

// Chevron
const chevronBoard = createDefaultBoard();
chevronBoard.style = 'chevron';
generateSample('chevron', chevronBoard);

// Brick basketweave
const brickBoard = createDefaultBoard();
brickBoard.style = 'brick-basketweave';
generateSample('brick', brickBoard);

// Tumbling block
const tumblingBoard = createDefaultBoard();
tumblingBoard.style = 'tumbling-block-3d';
// light / mid / dark (catalog tumblingBlockMethod.minSpecies 3)
tumblingBoard.species = [{ name: 'Maple', color: '#F5E6D3' }, { name: 'Cherry', color: '#C04000' }, { name: 'Walnut', color: '#654321' }] as typeof tumblingBoard.species;
generateSample('tumbling-block-3d', tumblingBoard);
generateSampleJson('tumbling-block-3d', tumblingBoard);

// Metric board
const metricBoard = createMetricBoard();
metricBoard.juiceGroove.enabled = true;
metricBoard.rubberFeet.enabled = true;
generateSample('metric', metricBoard);

// Herringbone
const herringboneBoard = createDefaultBoard();
herringboneBoard.style = 'herringbone';
herringboneBoard.angle = 45;
generateSample('herringbone', herringboneBoard);

// Hand-hole handles
const handHoleBoard = createDefaultBoard();
handHoleBoard.handles = {
  enabled: true,
  type: 'hand-hole',
};
generateSample('hand-hole', handHoleBoard);
generateSampleJson('hand-hole', handHoleBoard);

// Scrap chaotic
const scrapBoard = createDefaultBoard();
scrapBoard.style = 'scrap-chaotic';
scrapBoard.species = [
  { name: 'Walnut', color: '#654321' },
  { name: 'Maple', color: '#F5E6D3' },
  { name: 'Cherry', color: '#C04000' },
];
generateSample('scrap-chaotic', scrapBoard);
generateSampleJson('scrap-chaotic', scrapBoard);

// Features combined: juice groove + rubber feet + finger grip
const featuresBoard = createDefaultBoard();
featuresBoard.style = 'edge-grain';
featuresBoard.dimensions = {
  length: 450,
  width: 300,
  thickness: 38
};
featuresBoard.juiceGroove = {
  enabled: true,
  width: 10,
  depth: 8,
  fromEdge: 20,
  cornerRadius: 25.4  // 1" (25 mm) corner radius
};
featuresBoard.rubberFeet = {
  enabled: true,
  diameter: 25.4,  // 1" diameter
  height: 9.5,     // 3/8" height
  inset: 25.4
};
featuresBoard.handles = {
  enabled: true,
  type: 'handle',
};
featuresBoard.unitSystem = 'metric';
generateSample('features-combined', featuresBoard);

// Planer margin edge case: long-grain edge-grain board 11-7/8" (302 mm) wide, inside the planer's 305 mm but over
// the 299 mm limit (planerMaxWidth_mm - planerMargin_mm), so the planer-margin rule-off has something to fail on
const planerMarginBoard = createDefaultBoard();
planerMarginBoard.style = 'edge-grain';
planerMarginBoard.dimensions = { length: 457.2, width: 301.625, thickness: 38.1 };
generateSample('planer-margin', planerMarginBoard);
generateSampleJson('planer-margin', planerMarginBoard);

// Mill plan
console.log('Generating mill-plan...');
const millPlan = generateMillPlan(createDefaultBoard());
const millBuffer = millPlan.output('arraybuffer');
const millPath = join(SAMPLES_DIR, 'mill-plan.pdf');
writeFileSync(millPath, Buffer.from(millBuffer));
console.log(`  ✓ Generated: ${millPath}`);

console.log('\n✓ All sample PDFs generated successfully\n');
