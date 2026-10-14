/**
 * Pattern generators for all 10 board styles
 * Each pattern returns strip positions for SVG and 3D rendering
 */

import { BoardDesign, WoodSpecies } from '../types';

export interface StripPosition {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  species: WoodSpecies;
  rotation: number; // radians
}

export interface PatternResult {
  strips: StripPosition[];
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
}

/**
 * Generate pattern for any board style
 */
export function generatePattern(design: BoardDesign): PatternResult {
  switch (design.style) {
    case 'checkerboard':
      return generateCheckerboard(design);
    case 'brick-basketweave':
      return generateBrickBasketweave(design);
    case 'chevron':
      return generateChevron(design, design.angle || 45);
    case 'edge-grain':
      return generateEdgeGrain(design);
    case 'end-grain':
      return generateEndGrain(design);
    case 'face-grain':
      return generateFaceGrain(design);
    case 'herringbone':
      return generateHerringbone(design, design.angle || 45);
    case 'scrap-chaotic':
      return generateScrapChaotic(design);
    case 'stripe-inlay':
      return generateStripeInlay(design);
    case 'tumbling-block-3d':
      return generateTumblingBlock3D(design);
    default:
      return generateCheckerboard(design);
  }
}

/**
 * Checkerboard (end grain) - alternating square pattern
 */
function generateCheckerboard(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  // Calculate square size based on board dimensions (typically aim for 12-20 squares across width)
  const targetSquaresAcross = 12;
  const squareSize = width / targetSquaresAcross;
  
  const strips: StripPosition[] = [];
  const cols = Math.floor(width / squareSize);
  const rows = Math.floor(length / squareSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const speciesIndex = (row + col) % species.length;
      strips.push({
        x: col * squareSize,
        y: 0,
        z: row * squareSize,
        width: squareSize,
        height: thickness,
        depth: squareSize,
        species: species[speciesIndex],
        rotation: 0,
      });
    }
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Brick basketweave - interlocking brick pattern
 */
function generateBrickBasketweave(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  // Calculate brick dimensions based on board size (typically 1:3 ratio)
  const targetBricksAcross = Math.floor(width / 25.4); // Approximate number of bricks
  const brickWidth = width / targetBricksAcross;
  const brickLength = brickWidth * 3;
  
  const strips: StripPosition[] = [];
  let z = 0;
  let patternIndex = 0;
  
  while (z < length) {
    let x = 0;
    const isHorizontal = patternIndex % 2 === 0;
    
    while (x < width) {
      const speciesIndex = Math.floor(patternIndex / 2) % species.length;
      
      if (isHorizontal) {
        // Horizontal bricks
        strips.push({
          x,
          y: 0,
          z,
          width: Math.min(brickLength, width - x),
          height: thickness,
          depth: brickWidth,
          species: species[speciesIndex],
          rotation: 0,
        });
        x += brickLength;
      } else {
        // Vertical bricks
        strips.push({
          x,
          y: 0,
          z,
          width: brickWidth,
          height: thickness,
          depth: Math.min(brickLength, length - z),
          species: species[speciesIndex],
          rotation: 0,
        });
        x += brickWidth;
      }
    }
    
    z += isHorizontal ? brickWidth : brickLength;
    patternIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Chevron - V-shaped pattern at 45° (default)
 */
function generateChevron(design: BoardDesign, angle: number = 45): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  // Calculate strip width to fit board nicely (aim for 12-16 strips across width)
  const targetStrips = 14;
  const stripWidth = width / targetStrips;
  
  const strips: StripPosition[] = [];
  const angleRad = (angle * Math.PI) / 180;
  const centerZ = length / 2;
  
  // Left side (ascending)
  let z = 0;
  let speciesIndex = 0;
  while (z < centerZ) {
    for (let x = 0; x < width; x += stripWidth) {
      strips.push({
        x,
        y: 0,
        z,
        width: stripWidth,
        height: thickness,
        depth: stripWidth / Math.sin(angleRad),
        species: species[speciesIndex % species.length],
        rotation: angleRad,
      });
    }
    z += stripWidth / Math.tan(angleRad);
    speciesIndex++;
  }
  
  // Right side (descending)
  z = centerZ;
  while (z < length) {
    for (let x = 0; x < width; x += stripWidth) {
      strips.push({
        x,
        y: 0,
        z,
        width: stripWidth,
        height: thickness,
        depth: stripWidth / Math.sin(angleRad),
        species: species[speciesIndex % species.length],
        rotation: -angleRad,
      });
    }
    z += stripWidth / Math.tan(angleRad);
    speciesIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Edge grain - strips on edge
 */
function generateEdgeGrain(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  const stripWidth = 38.1; // 1.5"
  
  const strips: StripPosition[] = [];
  let x = 0;
  let speciesIndex = 0;
  
  while (x < width) {
    strips.push({
      x,
      y: 0,
      z: 0,
      width: Math.min(stripWidth, width - x),
      height: thickness,
      depth: length,
      species: species[speciesIndex % species.length],
      rotation: 0,
    });
    x += stripWidth;
    speciesIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * End grain - simple end grain strips
 */
function generateEndGrain(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  // Calculate strip width based on board dimensions
  const targetStrips = Math.round(width / 25.4); // Approximate even number
  const stripWidth = width / targetStrips;
  
  const strips: StripPosition[] = [];
  let x = 0;
  let speciesIndex = 0;
  
  while (x < width) {
    strips.push({
      x,
      y: 0,
      z: 0,
      width: Math.min(stripWidth, width - x),
      height: thickness,
      depth: length,
      species: species[speciesIndex % species.length],
      rotation: 0,
    });
    x += stripWidth;
    speciesIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Face grain - wide face grain boards
 */
function generateFaceGrain(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  const stripWidth = 76.2; // 3"
  
  const strips: StripPosition[] = [];
  let x = 0;
  let speciesIndex = 0;
  
  while (x < width) {
    strips.push({
      x,
      y: 0,
      z: 0,
      width: Math.min(stripWidth, width - x),
      height: thickness,
      depth: length,
      species: species[speciesIndex % species.length],
      rotation: 0,
    });
    x += stripWidth;
    speciesIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Herringbone - zigzag pattern at 45° (default)
 */
function generateHerringbone(design: BoardDesign, angle: number = 45): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  // Calculate strip dimensions based on board size
  const targetStripsWidth = 14;
  const stripWidth = width / targetStripsWidth;
  const stripLength = stripWidth * 6; // Maintain proportion
  
  const strips: StripPosition[] = [];
  const angleRad = (angle * Math.PI) / 180;
  
  let z = 0;
  let rowIndex = 0;
  
  while (z < length) {
    let x = 0;
    const isRightSlant = rowIndex % 2 === 0;
    
    while (x < width) {
      strips.push({
        x,
        y: 0,
        z,
        width: stripWidth,
        height: thickness,
        depth: Math.min(stripLength, length - z),
        species: species[rowIndex % species.length],
        rotation: isRightSlant ? angleRad : -angleRad,
      });
      x += stripWidth;
    }
    
    z += stripLength;
    rowIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Scrap chaotic - random arrangement of different sized pieces
 */
function generateScrapChaotic(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  
  const strips: StripPosition[] = [];
  const minSize = 50; // 50mm minimum
  const maxSize = 150; // 150mm maximum
  
  // Use seeded random for reproducibility
  let seed = 12345;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  let z = 0;
  while (z < length) {
    let x = 0;
    while (x < width) {
      const pieceWidth = minSize + random() * (maxSize - minSize);
      const pieceDepth = minSize + random() * (maxSize - minSize);
      const speciesIndex = Math.floor(random() * species.length);
      
      strips.push({
        x,
        y: 0,
        z,
        width: Math.min(pieceWidth, width - x),
        height: thickness,
        depth: Math.min(pieceDepth, length - z),
        species: species[speciesIndex],
        rotation: 0,
      });
      
      x += pieceWidth;
    }
    z += minSize + random() * (maxSize - minSize);
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Stripe inlay - alternating stripe pattern with contrasting inlay
 */
function generateStripeInlay(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  const mainStripWidth = 50.8; // 2"
  const inlayWidth = 6.35; // 1/4"
  
  const strips: StripPosition[] = [];
  let x = 0;
  let isInlay = false;
  
  while (x < width) {
    const stripWidth = isInlay ? inlayWidth : mainStripWidth;
    const speciesIndex = isInlay ? 1 % species.length : 0;
    
    strips.push({
      x,
      y: 0,
      z: 0,
      width: Math.min(stripWidth, width - x),
      height: thickness,
      depth: length,
      species: species[speciesIndex],
      rotation: 0,
    });
    
    x += stripWidth;
    isInlay = !isInlay;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}

/**
 * Tumbling block 3D - hexagonal pattern creating 3D illusion
 */
function generateTumblingBlock3D(design: BoardDesign): PatternResult {
  const { width, length, thickness } = design.dimensions;
  const species = design.species;
  const blockSize = 76.2; // 3" blocks
  
  const strips: StripPosition[] = [];
  
  // Create hexagonal blocks in 3 orientations (light, medium, dark effect)
  const hexHeight = blockSize * Math.sqrt(3) / 2;
  
  let z = 0;
  let rowIndex = 0;
  
  while (z < length) {
    let x = 0;
    const offset = (rowIndex % 2) * (blockSize / 2);
    x += offset;
    
    while (x < width) {
      // Each "block" is made of 3 rhombus pieces
      for (let face = 0; face < 3; face++) {
        strips.push({
          x: x + (face * blockSize / 3),
          y: 0,
          z,
          width: blockSize / 3,
          height: thickness,
          depth: hexHeight,
          species: species[face % species.length],
          rotation: (face * Math.PI / 3), // 60° rotations
        });
      }
      
      x += blockSize;
    }
    
    z += hexHeight;
    rowIndex++;
  }
  
  return { strips, bounds: { width, height: thickness, depth: length } };
}
