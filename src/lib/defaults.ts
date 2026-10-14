import { BoardDesign, JuiceGroove, RubberFeet, WoodSpecies } from '../types';
import { roundToHalfMm } from '../utils/format';

/**
 * Common wood species
 */
export const WOOD_SPECIES: WoodSpecies[] = [
  { name: 'Walnut', color: '#5B3A29' },
  { name: 'Maple', color: '#F3E7D3' },
  { name: 'Cherry', color: '#C84C35' },
  { name: 'Oak', color: '#D9B382' },
  { name: 'Ash', color: '#E8DCC4' },
];

/**
 * Default juice groove (metric)
 * Known label: "Perimeter loop, 12.5 mm wide × 5 mm deep, 19 mm from the edge, 
 *               corner radius 25.4 mm, top face."
 */
export const DEFAULT_JUICE_GROOVE_METRIC: JuiceGroove = {
  enabled: false,
  width: 12.5,
  depth: 5,
  fromEdge: 19,
  cornerRadius: 25.4, // 1" (25 mm) (Board QA: not 25.5, which prints 1" (26 mm))
};

/**
 * Default juice groove for 16x24 board (imperial)
 * Known label: "Perimeter loop, 0.500" (1/2") wide × 0.188" (3/16") deep, 
 *               0.750" (3/4") from the edge, corner radius 1.000" (1"), top face."
 */
export const DEFAULT_JUICE_GROOVE_16X24: JuiceGroove = {
  enabled: false,
  width: 12.7,      // 0.500"
  depth: 4.7625,    // 0.188"
  fromEdge: 19.05,  // 0.750"
  cornerRadius: 25.4, // 1.000"
};

/**
 * Default rubber feet (metric)
 * Known label: "4 rubber feet, 25.5 mm diameter × 9.5 mm high, 
 *               foot centres 32 mm in from the edges (underside)."
 * 
 * Note: 2.5.4 changes to: 1" (25.4 mm) × 3/8" (9.5 mm)
 */
export const DEFAULT_RUBBER_FEET_METRIC: RubberFeet = {
  enabled: false,
  diameter: roundToHalfMm(25.5), // 25.5 mm (will be 25.4 in 2.5.4)
  height: 9.5,      // 3/8"
  inset: 32,        // 32 mm
};

/**
 * Default board dimensions for checkerboard
 */
export const DEFAULT_DIMENSIONS_CHECKERBOARD = {
  width: 304.8,     // 12"
  length: 457.2,    // 18" (approximate)
  thickness: 38.1,  // 1.5"
};

/**
 * 16x24 board dimensions
 */
export const DIMENSIONS_16X24 = {
  width: 406.4,     // 16"
  length: 609.6,    // 24"
  thickness: 38.1,  // 1.5"
};

/**
 * Create default board design
 */
export function createDefaultBoard(): BoardDesign {
  return {
    style: 'checkerboard',
    dimensions: DEFAULT_DIMENSIONS_CHECKERBOARD,
    species: [WOOD_SPECIES[0], WOOD_SPECIES[1]], // Walnut and Maple
    juiceGroove: DEFAULT_JUICE_GROOVE_METRIC,
    handles: {
      enabled: false,
      type: 'handle',
    },
    rubberFeet: DEFAULT_RUBBER_FEET_METRIC,
    unitSystem: 'imperial',
  };
}

/**
 * Create 16x24 checkerboard design
 */
export function create16x24Board(): BoardDesign {
  return {
    style: 'checkerboard',
    dimensions: DIMENSIONS_16X24,
    species: [WOOD_SPECIES[0], WOOD_SPECIES[1]],
    juiceGroove: DEFAULT_JUICE_GROOVE_16X24,
    handles: {
      enabled: false,
      type: 'handle',
    },
    rubberFeet: {
      enabled: false,
      diameter: 25.4,   // 1"
      height: 9.5,      // 3/8"
      inset: 32,
    },
    unitSystem: 'imperial',
  };
}

/**
 * Create metric board design
 */
export function createMetricBoard(): BoardDesign {
  return {
    style: 'checkerboard',
    dimensions: {
      width: 300,
      length: 450,
      thickness: 40,
    },
    species: [WOOD_SPECIES[0], WOOD_SPECIES[1]],
    juiceGroove: DEFAULT_JUICE_GROOVE_METRIC,
    handles: {
      enabled: false,
      type: 'handle',
    },
    rubberFeet: DEFAULT_RUBBER_FEET_METRIC,
    unitSystem: 'metric',
  };
}

/**
 * Board style display names
 */
export const STYLE_NAMES: Record<string, string> = {
  'brick-basketweave': 'Brick Basketweave',
  'checkerboard': 'Checkerboard (End Grain)',
  'chevron': 'Chevron',
  'edge-grain': 'Edge Grain',
  'end-grain': 'End Grain',
  'face-grain': 'Face Grain',
  'herringbone': 'Herringbone',
  'scrap-chaotic': 'Scrap Chaotic',
  'stripe-inlay': 'Stripe Inlay',
  'tumbling-block-3d': 'Tumbling Block 3D',
};

/**
 * Hardware specifications with nominal inch and exact mm
 */
export const HARDWARE_SPECS = {
  feet: {
    diameter: { nominal: '1"', mm: 25.4 },
    height: { nominal: '3/8"', mm: 9.5 },
  },
  routerBits: {
    half: { nominal: '1/2"', mm: 12.7 },
    threeEighths: { nominal: '3/8"', mm: 9.5 },
  },
};
