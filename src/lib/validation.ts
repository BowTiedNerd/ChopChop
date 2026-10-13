import { BoardDesign, ValidationResult, AngleConstraints, BoardStyle } from '../types';

const KERF_MM = 3.175; // 1/8" kerf

/**
 * Angle constraints for different styles
 */
const ANGLE_CONSTRAINTS: Record<string, AngleConstraints> = {
  'chevron': { min: 20, max: 60 },
  'herringbone': { min: 30, max: 60 },
};

/**
 * Validate board design
 * Every sweep goes through full validation
 */
export function validateBoard(design: BoardDesign): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate dimensions
  if (design.dimensions.width <= 0) {
    errors.push('Board width must be greater than 0');
  }
  if (design.dimensions.length <= 0) {
    errors.push('Board length must be greater than 0');
  }
  if (design.dimensions.thickness <= 0) {
    errors.push('Board thickness must be greater than 0');
  }
  
  // Validate species
  if (design.species.length === 0) {
    errors.push('At least one wood species must be selected');
  }
  
  // Style-specific validation
  const styleErrors = validateStyle(design);
  errors.push(...styleErrors);
  
  // Validate juice groove if enabled
  if (design.juiceGroove.enabled) {
    const grooveErrors = validateJuiceGroove(design);
    errors.push(...grooveErrors);
  }
  
  // Validate feet if enabled
  if (design.rubberFeet.enabled) {
    const feetErrors = validateFeet(design);
    errors.push(...feetErrors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate style-specific constraints
 */
function validateStyle(design: BoardDesign): string[] {
  const errors: string[] = [];
  const style = design.style;
  
  // Check angle constraints for chevron and herringbone
  if (style in ANGLE_CONSTRAINTS) {
    // Angle would be specified in design options (not in current type)
    // This is a placeholder for angle validation
    // In actual implementation, angle would be part of style-specific options
  }
  
  return errors;
}

/**
 * Validate juice groove placement
 */
function validateJuiceGroove(design: BoardDesign): string[] {
  const errors: string[] = [];
  const { width, length } = design.dimensions;
  const { width: grooveWidth, fromEdge, cornerRadius } = design.juiceGroove;
  
  // Check if groove fits within board
  const minWidth = (fromEdge + grooveWidth + cornerRadius) * 2;
  const minLength = (fromEdge + grooveWidth + cornerRadius) * 2;
  
  if (width < minWidth) {
    errors.push(`Board width too small for juice groove. Minimum width: ${minWidth.toFixed(1)} mm`);
  }
  
  if (length < minLength) {
    errors.push(`Board length too small for juice groove. Minimum length: ${minLength.toFixed(1)} mm`);
  }
  
  return errors;
}

/**
 * Validate rubber feet placement
 */
function validateFeet(design: BoardDesign): string[] {
  const errors: string[] = [];
  const { width, length } = design.dimensions;
  const { diameter, inset } = design.rubberFeet;
  
  // Check if feet fit within board
  const minWidth = (inset + diameter / 2) * 2;
  const minLength = (inset + diameter / 2) * 2;
  
  if (width < minWidth) {
    errors.push(`Board width too small for rubber feet. Minimum width: ${minWidth.toFixed(1)} mm`);
  }
  
  if (length < minLength) {
    errors.push(`Board length too small for rubber feet. Minimum length: ${minLength.toFixed(1)} mm`);
  }
  
  return errors;
}

/**
 * Validate angle for pattern styles
 * Chevron: 20-60°, Herringbone: 30-60°
 */
export function validateAngle(style: BoardStyle, angle: number): ValidationResult {
  const errors: string[] = [];
  
  if (style in ANGLE_CONSTRAINTS) {
    const { min, max } = ANGLE_CONSTRAINTS[style];
    
    if (angle < min || angle > max) {
      errors.push(`${style} angle must be between ${min}° and ${max}° (got ${angle}°)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Calculate stripe count including 2×kerf, no tolerance subtraction
 * Spec: "stripe count includes 2×kerf and does not subtract tolerance"
 */
export function calculateStripeCount(
  boardLength: number,
  stripeWidth: number,
  includeKerf: boolean = true
): number {
  if (includeKerf) {
    const effectiveWidth = stripeWidth + (2 * KERF_MM);
    return Math.floor(boardLength / effectiveWidth);
  }
  
  return Math.floor(boardLength / stripeWidth);
}

/**
 * Validate that output folder is defined
 * Spec: "undefined output folder is an error (never `undefined/`)"
 */
export function validateOutputFolder(folder: string | undefined): void {
  if (!folder || folder === 'undefined') {
    throw new Error('Output folder must be defined, got: ' + folder);
  }
}

/**
 * Check for concurrent export consistency
 * Concurrent exports must be identical except timestamps
 */
export function compareExports(export1: any, export2: any): boolean {
  // Remove timestamp fields before comparison
  const cleanExport = (obj: any) => {
    const { timestamp, createdAt, ...rest } = obj;
    return rest;
  };
  
  const clean1 = JSON.stringify(cleanExport(export1));
  const clean2 = JSON.stringify(cleanExport(export2));
  
  return clean1 === clean2;
}

/**
 * Probe inset for low-angle chevron fix
 * Spec: "low-angle chevron coming out 1.5" wide (old fix: probe inset 1e-9)"
 */
export const PROBE_INSET = 1e-9;
