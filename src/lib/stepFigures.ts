/**
 * Step figure generators for PDF instructions
 * Each figure type corresponds to a woodworking operation
 */

import { SvgBuilder } from './svg';
import { BoardDesign } from '../types';
import { generatePattern } from './patterns';
import { formatDimension } from '../utils/format';

export type FigureType = 
  | 'cut-list'
  | 'rip-fence'
  | 'crosscut'
  | 'glue-up'
  | 'planer'
  | 'top-view';

export interface StepFigure {
  type: FigureType;
  svg: string;
  width: number;
  height: number;
}

/**
 * Generate top view figure
 */
export function generateTopViewFigure(design: BoardDesign): StepFigure {
  const { width, length } = design.dimensions;
  const scale = 0.5; // Scale down for PDF
  
  const svgWidth = width * scale + 100;
  const svgHeight = length * scale + 100;
  
  const builder = new SvgBuilder(svgWidth, svgHeight);
  
  // Generate pattern
  const pattern = generatePattern(design);
  
  const boardX = 50;
  const boardY = 50;
  
  // Draw each strip in the pattern
  for (const strip of pattern.strips) {
    const x = boardX + strip.x * scale;
    const y = boardY + strip.z * scale;
    const w = strip.width * scale;
    const h = strip.depth * scale;
    
    builder.rect(x, y, w, h, {
      fill: strip.species.color,
      stroke: '#666',
      'stroke-width': 0.5,
    });
  }
  
  // Draw board outline
  builder.rect(boardX, boardY, width * scale, length * scale, {
    fill: 'none',
    stroke: '#333',
    'stroke-width': 2,
  });
  
  // Add dimensions
  const unit = design.unitSystem;
  builder.dimension({
    x1: boardX,
    y1: boardY - 20,
    x2: boardX + width * scale,
    y2: boardY - 20,
    value: formatDimension(width, unit),
    id: 'width',
  });
  
  builder.dimension({
    x1: boardX + width * scale + 20,
    y1: boardY,
    x2: boardX + width * scale + 20,
    y2: boardY + length * scale,
    value: formatDimension(length, unit),
    id: 'length',
  });
  
  const svg = builder.toSVG();
  return {
    type: 'top-view',
    svg,
    width: svgWidth,
    height: svgHeight,
  };
}

/**
 * Generate rip fence setup figure
 */
export function generateRipFenceFigure(
  fenceDistance: number,
  bladeHeight: number,
  unit: 'imperial' | 'metric'
): StepFigure {
  const builder = new SvgBuilder(400, 300);
  
  // Table saw top view
  builder.panel('saw-table', 50, 50, 300, 200);
  
  // Blade
  builder.rect(200, 100, 4, 100, {
    fill: '#333',
    stroke: '#000',
    'stroke-width': 1,
  });
  
  // Fence
  const fenceX = 200 - fenceDistance * 0.5;
  builder.rect(fenceX, 50, 8, 200, {
    fill: '#999',
    stroke: '#333',
    'stroke-width': 2,
  });
  
  // Fence label
  builder.text(fenceX - 50, 150, 'RIP FENCE', 11, {
    'font-weight': 'bold',
  });
  
  // Dimension line showing fence distance
  builder.dimension({
    x1: fenceX + 8,
    y1: 180,
    x2: 200,
    y2: 180,
    value: formatDimension(fenceDistance, unit),
    id: 'fence-distance',
  });
  
  // Settings note
  builder.text(60, 270, `Blade height: ${formatDimension(bladeHeight, unit)}`, 11);
  
  const svg = builder.toSVG();
  return {
    type: 'rip-fence',
    svg,
    width: 400,
    height: 300,
  };
}

/**
 * Generate glue-up figure showing strip arrangement
 */
export function generateGlueUpFigure(design: BoardDesign, stepNumber: number): StepFigure {
  const { width } = design.dimensions;
  const scale = 0.3;
  
  const builder = new SvgBuilder(600, 400);
  
  // Title
  builder.text(50, 30, `Glue-Up Step ${stepNumber}`, 14, {
    'font-weight': 'bold',
  });
  
  // Generate pattern
  const pattern = generatePattern(design);
  
  // Show all strips
  const startY = 60;
  const stripHeight = 30;
  
  for (let i = 0; i < pattern.strips.length; i++) {
    const strip = pattern.strips[i];
    const y = startY + i * (stripHeight + 5);
    
    builder.rect(100, y, width * scale, stripHeight, {
      fill: strip.species.color,
      stroke: '#333',
      'stroke-width': 1,
    });
    
    // Strip label
    builder.text(50, y + 20, `${i + 1}`, 11);
  }
  
  // Clamp indicators
  builder.text(100 + width * scale + 20, startY + 100, 'Apply clamps', 11, {
    fill: '#c00',
  });
  builder.text(100 + width * scale + 20, startY + 120, 'evenly spaced', 11, {
    fill: '#c00',
  });
  
  const svg = builder.toSVG();
  return {
    type: 'glue-up',
    svg,
    width: 600,
    height: 400,
  };
}

/**
 * Generate crosscut setup figure
 */
export function generateCrosscutFigure(
  stopBlockPosition: number,
  unit: 'imperial' | 'metric'
): StepFigure {
  const builder = new SvgBuilder(500, 300);
  
  // Sled base
  builder.panel('saw-table', 50, 100, 400, 150);
  
  // Fence
  builder.rect(50, 100, 400, 10, {
    fill: '#999',
    stroke: '#333',
    'stroke-width': 2,
  });
  
  // Stop block
  const stopX = 50 + stopBlockPosition * 0.5;
  builder.rect(stopX, 90, 20, 30, {
    fill: '#8B4513',
    stroke: '#333',
    'stroke-width': 2,
  });
  
  // Stop block label
  builder.text(stopX - 30, 80, 'STOP BLOCK', 11, {
    'font-weight': 'bold',
  });
  
  // Dimension
  builder.dimension({
    x1: 50,
    y1: 70,
    x2: stopX,
    y2: 70,
    value: formatDimension(stopBlockPosition, unit),
    id: 'stop-position',
  });
  
  // Stock
  builder.rect(80, 120, 100, 40, {
    fill: '#D2691E',
    stroke: '#333',
    'stroke-width': 1,
  });
  
  builder.text(90, 145, 'Stock', 11);
  
  const svg = builder.toSVG();
  return {
    type: 'crosscut',
    svg,
    width: 500,
    height: 300,
  };
}

/**
 * Generate cut list table figure
 */
export function generateCutListFigure(design: BoardDesign): StepFigure {
  const builder = new SvgBuilder(600, 400);
  
  // Title
  builder.text(50, 30, 'Cut List', 14, {
    'font-weight': 'bold',
  });
  
  // Header row
  const startY = 60;
  const rowHeight = 30;
  const colWidths = [150, 80, 80, 80, 100];
  
  builder.panel('cutlist-header', 50, startY, 500, rowHeight);
  
  const headers = ['Part', 'Width', 'Thickness', 'Length', 'Species'];
  let x = 60;
  for (let i = 0; i < headers.length; i++) {
    builder.text(x, startY + 20, headers[i], 11, {
      fill: 'white',
      'font-weight': 'bold',
    });
    x += colWidths[i];
  }
  
  // Data rows (sample)
  const unit = design.unitSystem;
  const rows = [
    ['Board strips', 
     formatDimension(25.4, unit), 
     formatDimension(design.dimensions.thickness, unit),
     formatDimension(design.dimensions.length, unit), 
     design.species[0]?.name || 'Walnut'],
  ];
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const y = startY + (rowIndex + 1) * rowHeight;
    const panelRole = rowIndex % 2 === 0 ? 'cutlist-row-1' : 'cutlist-row-2';
    builder.panel(panelRole, 50, y, 500, rowHeight);
    
    let x = 60;
    for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex++) {
      builder.text(x, y + 20, rows[rowIndex][colIndex], 11);
      x += colWidths[colIndex];
    }
  }
  
  const svg = builder.toSVG();
  return {
    type: 'cut-list',
    svg,
    width: 600,
    height: 400,
  };
}

/**
 * Generate planer setup figure
 */
export function generatePlanerFigure(
  depth: number,
  unit: 'imperial' | 'metric'
): StepFigure {
  const builder = new SvgBuilder(500, 350);
  
  // Planer bed
  builder.panel('planer-panel', 50, 200, 400, 100);
  
  // Stock
  builder.rect(100, 150, 300, 50, {
    fill: '#D2691E',
    stroke: '#333',
    'stroke-width': 2,
  });
  
  // Cutterhead
  builder.rect(150, 100, 200, 20, {
    fill: '#333',
    stroke: '#000',
    'stroke-width': 1,
  });
  
  builder.text(360, 115, 'head', 11, {
    fill: '#666',
  });
  
  // Depth indicator
  builder.dimension({
    x1: 420,
    y1: 150,
    x2: 420,
    y2: 200,
    value: formatDimension(depth, unit),
    id: 'planer-depth',
  });
  
  // Safety note
  builder.text(50, 330, 'Take multiple passes, removing no more than 1-2mm per pass', 11, {
    fill: '#c00',
  });
  
  const svg = builder.toSVG();
  return {
    type: 'planer',
    svg,
    width: 500,
    height: 350,
  };
}
