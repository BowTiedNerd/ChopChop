import { BoardDesign, ValidationResult, AngleConstraints, BoardStyle } from '../types';
import { getKerf } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

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
  if (style in ANGLE_CONSTRAINTS && design.angle !== undefined) {
    const { min, max } = ANGLE_CONSTRAINTS[style];
    if (design.angle < min || design.angle > max) {
      errors.push(`${style} angle must be between ${min}° and ${max}° (got ${design.angle}°)`);
    }
  }
  
  // Chevron with gap is not supported
  if (style === 'chevron' && (design as { gap?: number }).gap) {
    errors.push('Chevron with gap is not supported');
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
  includeKerf: boolean = true,
  style: BoardStyle = 'checkerboard'
): number {
  if (includeKerf) {
    // Get kerf from catalog for the style
    const kerf = getKerf(style as CatalogStyleName);
    const effectiveWidth = stripeWidth + (2 * kerf);
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
 * Validate an output FILE path: its folder must be defined (no "undefined"/"null" segment),
 * outside virtual filesystems, and writable (checked on the nearest existing ancestor).
 */
export function validateOutputPath(
  file: string | undefined,
  fsApi: { existsSync: (p: string) => boolean; accessSync: (p: string, mode?: number) => void; W_OK: number },
): void {
  if (!file || file === 'undefined') throw new Error('Output file must be defined, got: ' + file);
  const parts = file.split('/');
  const slash = file.lastIndexOf('/');
  const dir = slash < 0 ? '.' : slash === 0 ? '/' : file.slice(0, slash);
  validateOutputFolder(dir);
  if (parts.slice(0, -1).some(seg => seg === 'undefined' || seg === 'null')) {
    throw new Error(`Output folder contains an undefined segment: ${dir}`);
  }
  if (/^\/(proc|sys|dev)(\/|$)/.test(dir)) throw new Error(`Output folder is on a virtual filesystem: ${dir}`);
  let probe = dir;
  while (!fsApi.existsSync(probe)) {
    const up = probe.includes('/') ? probe.slice(0, probe.lastIndexOf('/')) || '/' : '.';
    if (up === probe) break;
    probe = up;
  }
  try {
    fsApi.accessSync(probe, fsApi.W_OK);
  } catch (e) {
    throw new Error(`Output folder is not writable: ${probe} (${e instanceof Error ? e.message : String(e)})`);
  }
}

/**
 * Check for concurrent export consistency
 * Concurrent exports must be identical except timestamps
 */
export function compareExports(export1: Record<string, unknown>, export2: Record<string, unknown>): boolean {
  // Remove timestamp fields before comparison
  const cleanExport = (obj: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
