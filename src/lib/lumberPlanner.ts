/**
 * Lumber planner and milling/cutting optimizer
 * Calculates optimal cutting from user's available stock
 */

import { BoardDesign, CutListItem } from '../types';
import { generatePattern } from './patterns';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

export interface StockBoard {
  id: string;
  species: string;
  width: number;       // mm
  thickness: number;   // mm
  length: number;      // mm
  quantity: number;
  pricePerBF?: number | null; // May be null per spec
}

export interface CutPlan {
  stockBoard: StockBoard;
  cuts: CutItem[];
  wastePercentage: number;
  utilizationPercentage: number;
}

export interface CutItem {
  part: string;
  width: number;
  thickness: number;
  length: number;
  quantity: number;
  species: string;
}

export interface MillingStep {
  stepNumber: number;
  operation: 'rough-cut' | 'joint' | 'plane' | 'rip' | 'crosscut';
  description: string;
  settings: Record<string, string>;
}

export interface OptimizationResult {
  cutPlans: CutPlan[];
  totalStock: number;
  totalWaste: number;
  utilizationPercentage: number;
  millingSteps: MillingStep[];
  cutList: CutListItem[];
}

/**
 * Get allowances for a specific style from catalog
 */
function getAllowances(style: string) {
  try {
    const catalog = loadStyleCatalog(style as CatalogStyleName);
    return {
      kerf: catalog.cutListAllowances.kerf_mm,
      roughOversize: catalog.cutListAllowances.roughToFinalOversize_mm,
      planerMinimum: catalog.cutListAllowances.planerMinimum_mm,
      flatteningAllowance: catalog.cutListAllowances.flatteningAllowance_mm,
      sandingLoss: catalog.cutListAllowances.sandingLoss_mm,
    };
  } catch {
    // Fallback to shop defaults if style not found
    return {
      kerf: 3.175,
      roughOversize: { thickness: 3.0, width: 6.0, length: 50.0 },
      planerMinimum: { length: 305.0, thickness: 6.5 },
      flatteningAllowance: 3.0,
      sandingLoss: 0.5,
    };
  }
}

/**
 * Calculate required parts from board design
 */
export function calculateRequiredParts(design: BoardDesign): CutItem[] {
  const pattern = generatePattern(design);
  const parts: Map<string, CutItem> = new Map();
  
  // Load catalog for allowances
  let catalog;
  try {
    catalog = loadStyleCatalog(design.style as CatalogStyleName);
  } catch {
    catalog = null;
  }
  
  // Calculate allowances
  const kerf = catalog?.cutListAllowances?.kerf_mm || 3.175;
  const roughOversize = catalog?.cutListAllowances?.roughToFinalOversize_mm || { thickness: 3, width: 6, length: 50 };
  const flatteningAllowance = catalog?.cutListAllowances?.flatteningAllowance_mm || 1.5;
  const sandingLoss = catalog?.cutListAllowances?.sandingLoss_mm || 0.5;
  
  // Group strips by dimensions and species, adding allowances
  for (const strip of pattern.strips) {
    // Add allowances to strip dimensions
    const width = strip.width + kerf + roughOversize.width;
    const thickness = strip.height + roughOversize.thickness + flatteningAllowance + sandingLoss;
    const length = strip.depth + kerf + roughOversize.length;
    
    const key = `${strip.species.name}-${width.toFixed(1)}-${thickness.toFixed(1)}-${length.toFixed(1)}`;
    
    if (parts.has(key)) {
      const existing = parts.get(key)!;
      existing.quantity++;
    } else {
      parts.set(key, {
        part: `${strip.species.name} strip`,
        width: width,
        thickness: thickness,
        length: length,
        quantity: 1,
        species: strip.species.name,
      });
    }
  }
  
  return Array.from(parts.values());
}

/**
 * Optimize cutting plan from available stock
 */
export function optimizeCuttingPlan(
  requiredParts: CutItem[],
  availableStock: StockBoard[],
  boardStyle: string = 'checkerboard'
): OptimizationResult {
  const cutPlans: CutPlan[] = [];
  const remainingParts = [...requiredParts];
  
  // Get allowances from catalog
  const allowances = getAllowances(boardStyle);
  const KERF = allowances.kerf;
  const ROUGH_OVERSIZE_WIDTH = allowances.roughOversize.width;
  const ROUGH_OVERSIZE_LENGTH = allowances.roughOversize.length;
  const PLANER_MINIMUM_THICKNESS = allowances.planerMinimum.thickness;
  
  // Sort stock by size (largest first for efficiency)
  const sortedStock = [...availableStock].sort((a, b) => {
    const volumeA = a.width * a.thickness * a.length * a.quantity;
    const volumeB = b.width * b.thickness * b.length * b.quantity;
    return volumeB - volumeA;
  });
  
  // Try to fit parts into stock
  for (const stock of sortedStock) {
    for (let qty = 0; qty < stock.quantity; qty++) {
      const cuts: CutItem[] = [];
      let usedLength = 0;
      
      // Try to fit parts into this board
      for (let i = remainingParts.length - 1; i >= 0; i--) {
        const part = remainingParts[i];
        
        // Check if part fits in this stock
        if (part.species === stock.species &&
            part.width + ROUGH_OVERSIZE_WIDTH <= stock.width &&
            part.thickness + PLANER_MINIMUM_THICKNESS <= stock.thickness) {
          
          // Check how many we can fit lengthwise
          const partLengthWithKerf = part.length + KERF + ROUGH_OVERSIZE_LENGTH;
          const availableLength = stock.length - usedLength;
          const fitsCount = Math.floor(availableLength / partLengthWithKerf);
          
          if (fitsCount > 0) {
            const cutCount = Math.min(fitsCount, part.quantity);
            
            cuts.push({
              ...part,
              quantity: cutCount,
            });
            
            usedLength += partLengthWithKerf * cutCount;
            part.quantity -= cutCount;
            
            if (part.quantity === 0) {
              remainingParts.splice(i, 1);
            }
          }
        }
      }
      
      if (cuts.length > 0) {
        const wasteLength = stock.length - usedLength;
        const totalVolume = stock.width * stock.thickness * stock.length;
        const usedVolume = stock.width * stock.thickness * usedLength;
        const wastePercentage = (wasteLength / stock.length) * 100;
        const utilizationPercentage = (usedVolume / totalVolume) * 100;
        
        cutPlans.push({
          stockBoard: stock,
          cuts,
          wastePercentage,
          utilizationPercentage,
        });
      }
    }
  }
  
  // Calculate totals
  const totalStock = cutPlans.length;
  const totalWaste = cutPlans.reduce((sum, plan) => sum + plan.wastePercentage, 0) / Math.max(cutPlans.length, 1);
  const utilizationPercentage = cutPlans.reduce((sum, plan) => sum + plan.utilizationPercentage, 0) / Math.max(cutPlans.length, 1);
  
  // Generate milling steps
  const millingSteps = generateMillingSteps(requiredParts, availableStock);
  
  // Generate cut list
  const cutList = generateCutList(cutPlans);
  
  return {
    cutPlans,
    totalStock,
    totalWaste,
    utilizationPercentage,
    millingSteps,
    cutList,
  };
}

/**
 * Generate milling steps sequence
 */
function generateMillingSteps(
  parts: CutItem[],
  _stock: StockBoard[]
): MillingStep[] {
  const steps: MillingStep[] = [];
  
  // Step 1: Rough cut to length
  steps.push({
    stepNumber: 1,
    operation: 'rough-cut',
    description: 'Rough cut stock boards to approximate length, leaving 3mm oversize on each end.',
    settings: {
      'Oversize allowance': '3 mm per end',
    },
  });
  
  // Step 2: Joint one face
  steps.push({
    stepNumber: 2,
    operation: 'joint',
    description: 'Joint one face flat on the jointer. This will be your reference face.',
    settings: {
      'Passes': 'Multiple light passes',
      'Feed rate': 'Slow and steady',
    },
  });
  
  // Step 3: Joint one edge
  steps.push({
    stepNumber: 3,
    operation: 'joint',
    description: 'Joint one edge square to the reference face. Keep reference face against fence.',
    settings: {
      'Reference face': 'Against fence',
    },
  });
  
  // Step 4: Plane to thickness
  const targetThickness = parts.length > 0 ? parts[0].thickness : 38.1;
  steps.push({
    stepNumber: 4,
    operation: 'plane',
    description: 'Plane to final thickness. Take multiple light passes, no more than 1-2mm per pass.',
    settings: {
      'Target thickness': `${targetThickness.toFixed(1)} mm`,
      'Max pass depth': '1-2 mm',
    },
  });
  
  // Step 5: Rip to width
  const targetWidth = parts.length > 0 ? parts[0].width : 25.4;
  steps.push({
    stepNumber: 5,
    operation: 'rip',
    description: 'Rip strips to final width on table saw. Keep jointed edge against fence.',
    settings: {
      'Rip fence': `${targetWidth.toFixed(1)} mm`,
      'Blade height': `${(targetThickness + 5).toFixed(1)} mm`,
    },
  });
  
  // Step 6: Crosscut to length
  const targetLength = parts.length > 0 ? parts[0].length : 406.4;
  steps.push({
    stepNumber: 6,
    operation: 'crosscut',
    description: 'Crosscut strips to final length using stop block on crosscut sled for consistency.',
    settings: {
      'Stop block position': `${targetLength.toFixed(1)} mm`,
      'Blade height': `${(targetThickness + 5).toFixed(1)} mm`,
    },
  });
  
  return steps;
}

/**
 * Generate cut list from cut plans
 */
function generateCutList(cutPlans: CutPlan[]): CutListItem[] {
  const cutList: CutListItem[] = [];
  
  for (const plan of cutPlans) {
    for (const cut of plan.cuts) {
      cutList.push({
        part: cut.part,
        quantity: cut.quantity,
        width: cut.width,
        thickness: cut.thickness,
        length: cut.length,
        species: cut.species,
        notes: `From stock: ${plan.stockBoard.width}×${plan.stockBoard.thickness}×${plan.stockBoard.length}mm`,
      });
    }
  }
  
  return cutList;
}

/**
 * Calculate board feet for stock
 */
export function calculateBoardFeet(
  width: number,    // mm
  thickness: number, // mm
  length: number     // mm
): number {
  // Convert to inches
  const widthInches = width / 25.4;
  const thicknessInches = thickness / 25.4;
  const lengthInches = length / 25.4;
  
  // Board feet = (width × thickness × length) / 144
  return (widthInches * thicknessInches * lengthInches) / 144;
}

/**
 * Create default stock boards for testing
 */
export function createDefaultStock(): StockBoard[] {
  return [
    {
      id: 'stock-1',
      species: 'Walnut',
      width: 150,
      thickness: 50,
      length: 2400,
      quantity: 3,
      pricePerBF: null, // Never invent prices
    },
    {
      id: 'stock-2',
      species: 'Maple',
      width: 150,
      thickness: 50,
      length: 2400,
      quantity: 3,
      pricePerBF: null,
    },
  ];
}
