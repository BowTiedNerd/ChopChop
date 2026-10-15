/**
 * Custom designer with second slice-and-reglue pass
 * Allows creating custom patterns by slicing a glued board and rearranging
 */

import { WoodSpecies } from '../types';
import { StripPosition, PatternResult } from './patterns';

export interface FirstPassConfig {
  stripWidth: number;      // mm
  stripThickness: number;  // mm
  stripLength: number;     // mm
  species: WoodSpecies[];  // Alternating species
  stripCount: number;
}

export interface SecondPassConfig {
  sliceAngle: number;      // degrees (0 = perpendicular, 45 = diagonal)
  sliceWidth: number;      // mm (thickness of new strips)
  arrangement: 'straight' | 'flipped' | 'alternating' | 'mirror';
  rotation: number;        // degrees (0, 90, 180, 270)
}

export interface CustomDesign {
  firstPass: FirstPassConfig;
  secondPass: SecondPassConfig;
  finalWidth: number;
  finalLength: number;
  finalThickness: number;
}

/**
 * Generate custom pattern with second pass
 */
export function generateCustomPattern(design: CustomDesign): PatternResult {
  // Step 1: Create first glue-up (simple strips)
  const firstPassBoard = createFirstPass(design.firstPass);
  
  // Step 2: Slice at angle and create second glue-up
  const finalBoard = createSecondPass(firstPassBoard, design.secondPass, design);
  
  return finalBoard;
}

/**
 * Create first pass glue-up (simple alternating strips)
 */
function createFirstPass(config: FirstPassConfig): PatternResult {
  const strips: StripPosition[] = [];
  
  for (let i = 0; i < config.stripCount; i++) {
    const speciesIndex = i % config.species.length;
    
    strips.push({
      x: i * config.stripWidth,
      y: 0,
      z: 0,
      width: config.stripWidth,
      height: config.stripThickness,
      depth: config.stripLength,
      species: config.species[speciesIndex],
      rotation: 0,
    });
  }
  
  const totalWidth = config.stripWidth * config.stripCount;
  
  return {
    strips,
    bounds: {
      width: totalWidth,
      height: config.stripThickness,
      depth: config.stripLength,
    },
  };
}

/**
 * Create second pass by slicing first board and rearranging
 */
function createSecondPass(
  firstPass: PatternResult,
  secondConfig: SecondPassConfig,
  finalDesign: CustomDesign
): PatternResult {
  const angleRad = (secondConfig.sliceAngle * Math.PI) / 180;
  const rotationRad = (secondConfig.rotation * Math.PI) / 180;
  
  // Calculate how many slices we can get from first board
  const firstBoardLength = firstPass.bounds.depth;
  let sliceCount: number;
  
  if (secondConfig.sliceAngle === 0) {
    // Perpendicular cuts
    sliceCount = Math.floor(firstBoardLength / secondConfig.sliceWidth);
  } else {
    // Angled cuts - more complex calculation
    const effectiveLength = firstBoardLength / Math.cos(angleRad);
    sliceCount = Math.floor(effectiveLength / secondConfig.sliceWidth);
  }
  
  // Create new strips from slices
  const newStrips: StripPosition[] = [];
  
  for (let i = 0; i < sliceCount; i++) {
    // Determine arrangement pattern
    let flipOffset = 0;
    let mirrorOffset = 0;
    
    switch (secondConfig.arrangement) {
      case 'flipped':
        flipOffset = i % 2 === 1 ? firstPass.bounds.width : 0;
        break;
      case 'alternating':
        flipOffset = i % 2 === 1 ? firstPass.bounds.width / 2 : 0;
        break;
      case 'mirror':
        mirrorOffset = i < sliceCount / 2 ? i : sliceCount - i - 1;
        break;
    }
    
    // Each slice contains all the species from first pass
    for (const originalStrip of firstPass.strips) {
      // Calculate new strip position based on slice
      const newX = originalStrip.x + flipOffset + mirrorOffset;
      const newZ = i * secondConfig.sliceWidth;
      
      // Create strip with pattern from first pass
      newStrips.push({
        x: newX,
        y: 0,
        z: newZ,
        width: originalStrip.width,
        height: secondConfig.sliceWidth, // New thickness after slicing
        depth: firstPass.bounds.width,    // Rotated dimension
        species: originalStrip.species,
        rotation: rotationRad,
      });
    }
  }
  
  return {
    strips: newStrips,
    bounds: {
      width: finalDesign.finalWidth,
      height: finalDesign.finalThickness,
      depth: finalDesign.finalLength,
    },
  };
}

/**
 * Calculate cut list for custom design
 */
export function calculateCustomCutList(design: CustomDesign): {
  firstPassStrips: Array<{ species: string; count: number; dimensions: string }>;
  secondPassSlices: Array<{ description: string; count: number }>;
} {
  const firstPassStrips = design.firstPass.species.map((species, i) => {
    const count = Math.ceil(design.firstPass.stripCount / design.firstPass.species.length);
    return {
      species: species.name,
      count: i === 0 ? count : count - (i === design.firstPass.species.length - 1 ? 0 : 1),
      dimensions: `${design.firstPass.stripWidth}mm × ${design.firstPass.stripThickness}mm × ${design.firstPass.stripLength}mm`,
    };
  });
  
  const sliceCount = Math.floor(
    design.firstPass.stripLength / design.secondPass.sliceWidth
  );
  
  const secondPassSlices = [{
    description: `Slice first glue-up at ${design.secondPass.sliceAngle}° into ${design.secondPass.sliceWidth}mm strips`,
    count: sliceCount,
  }];
  
  return {
    firstPassStrips,
    secondPassSlices,
  };
}

/**
 * Generate steps for custom design
 */
export function generateCustomSteps(design: CustomDesign): Array<{
  stepNumber: number;
  title: string;
  description: string;
  settings: Record<string, string>;
}> {
  return [
    {
      stepNumber: 1,
      title: 'First Pass: Mill strips',
      description: `Mill ${design.firstPass.stripCount} strips to ${design.firstPass.stripWidth}mm wide, ${design.firstPass.stripThickness}mm thick, ${design.firstPass.stripLength}mm long. Alternate species: ${design.firstPass.species.map(s => s.name).join(', ')}.`,
      settings: {
        'Strip width': `${design.firstPass.stripWidth}mm`,
        'Strip thickness': `${design.firstPass.stripThickness}mm`,
        'Strip length': `${design.firstPass.stripLength}mm`,
      },
    },
    {
      stepNumber: 2,
      title: 'First Pass: Glue-up',
      description: `Arrange strips in alternating species pattern. Apply glue to edges and clamp. Let dry 24 hours.`,
      settings: {},
    },
    {
      stepNumber: 3,
      title: 'Flatten first glue-up',
      description: `Plane first glue-up flat on both faces. Final thickness should be ${design.firstPass.stripThickness}mm.`,
      settings: {
        'Target thickness': `${design.firstPass.stripThickness}mm`,
      },
    },
    {
      stepNumber: 4,
      title: 'Second Pass: Slice',
      description: `Slice first glue-up into ${design.secondPass.sliceWidth}mm strips at ${design.secondPass.sliceAngle}° angle. Use sled or angled fence.`,
      settings: {
        'Slice width': `${design.secondPass.sliceWidth}mm`,
        'Angle': `${design.secondPass.sliceAngle}°`,
      },
    },
    {
      stepNumber: 5,
      title: 'Second Pass: Arrange',
      description: `Arrange slices in ${design.secondPass.arrangement} pattern. Rotate ${design.secondPass.rotation}° if needed.`,
      settings: {
        'Arrangement': design.secondPass.arrangement,
        'Rotation': `${design.secondPass.rotation}°`,
      },
    },
    {
      stepNumber: 6,
      title: 'Second Pass: Glue-up',
      description: `Apply glue to edges of arranged slices and clamp. Let dry 24 hours.`,
      settings: {},
    },
    {
      stepNumber: 7,
      title: 'Final milling',
      description: `Plane to final thickness (${design.finalThickness}mm), cut to final dimensions (${design.finalWidth}mm × ${design.finalLength}mm).`,
      settings: {
        'Final thickness': `${design.finalThickness}mm`,
        'Final width': `${design.finalWidth}mm`,
        'Final length': `${design.finalLength}mm`,
      },
    },
  ];
}

/**
 * Create default custom design for testing
 */
export function createDefaultCustomDesign(species: WoodSpecies[]): CustomDesign {
  return {
    firstPass: {
      stripWidth: 25.4,      // 1"
      stripThickness: 38.1,  // 1.5"
      stripLength: 400,      // ~16"
      species: species.slice(0, 2),
      stripCount: 12,
    },
    secondPass: {
      sliceAngle: 0,         // Perpendicular
      sliceWidth: 25.4,      // 1"
      arrangement: 'flipped',
      rotation: 90,          // Rotate 90° for checkerboard effect
    },
    finalWidth: 300,
    finalLength: 300,
    finalThickness: 35,
  };
}
