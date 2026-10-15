#!/usr/bin/env tsx
/**
 * Generate metric sample design export for boardviz
 * Creates: 300x450x40 mm end-grain checkerboard with rubber feet
 */

import { BoardDesign } from '../src/types';
import { exportDesign } from './export';

const metricDesign: BoardDesign = {
  style: 'checkerboard',
  dimensions: {
    width: 300,
    length: 450,
    thickness: 40,
  },
  species: [
    { name: 'Walnut', color: '#654321' },
    { name: 'Maple', color: '#F5E6D3' },
  ],
  juiceGroove: {
    enabled: false,
    width: 0,
    depth: 0,
    fromEdge: 0,
    cornerRadius: 0,
  },
  handles: {
    enabled: false,
    type: 'handle',
  },
  rubberFeet: {
    enabled: true,
    diameter: 25.4,  // 1"
    height: 9.5,     // 3/8"
    inset: 38,       // 1.5"
  },
  unitSystem: 'metric',
};

// Export the design
console.log('Exporting metric sample design for boardviz...');
exportDesign({
  design: metricDesign,
  outputFile: 'visuals/samples/metric-checkerboard-300x450x40/export.json',
});

console.log('Metric sample export complete!');
console.log('Design: 300×450×40 mm end-grain checkerboard with rubber feet');
console.log('This export will be used by boardviz to generate agreement.json');
