/**
 * Format a measurement in inches with 3 decimals and fraction
 * Use ≈ only when fraction is inexact
 * Examples: 
 *   1.663" (≈1 21/32")  - inexact
 *   0.750" (3/4")       - exact
 */
export function inchText(inches: number, precision: number = 64): string {
  const decimal = inches.toFixed(3);
  const fraction = toFraction(inches, precision);
  
  if (fraction.isExact) {
    return `${decimal}" (${fraction.text})`;
  } else {
    return `${decimal}" (≈${fraction.text})`;
  }
}

interface Fraction {
  text: string;
  isExact: boolean;
}

function toFraction(value: number, maxDenominator: number = 64): Fraction {
  const tolerance = 1e-6; // Very small tolerance for exact matching
  
  // Handle whole numbers
  const whole = Math.floor(value);
  const fractional = value - whole;
  
  if (Math.abs(fractional) < tolerance) {
    return {
      text: whole === 0 ? '0"' : `${whole}"`,
      isExact: true
    };
  }
  
  // Find best fraction (only power-of-2 denominators for standard fractions)
  let bestNum = 0;
  let bestDen = 1;
  let bestError = Math.abs(fractional);
  
  for (let den = 2; den <= maxDenominator; den *= 2) {
    const num = Math.round(fractional * den);
    const error = Math.abs(fractional - num / den);
    
    if (error < bestError) {
      bestNum = num;
      bestDen = den;
      bestError = error;
    }
  }
  
  // Check if the best approximation is exact (within tolerance)
  const isExact = bestError < tolerance;
  
  // Simplify fraction
  const gcd = greatestCommonDivisor(bestNum, bestDen);
  const num = bestNum / gcd;
  const den = bestDen / gcd;
  
  // Format
  let text = '';
  if (whole > 0) {
    if (num > 0) {
      text = `${whole} ${num}/${den}"`;
    } else {
      text = `${whole}"`;
    }
  } else {
    text = `${num}/${den}"`;
  }
  
  return { text, isExact };
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * Convert mm to inches
 */
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

/**
 * Convert inches to mm
 */
export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

/**
 * Round to nearest 0.5 mm (for metric layout distances)
 */
export function roundToHalfMm(mm: number): number {
  return Math.round(mm * 2) / 2;
}

/**
 * Format metric measurement
 */
export function metricText(mm: number, decimals: number = 1): string {
  return `${mm.toFixed(decimals)} mm`;
}

/**
 * Format dimension based on unit system
 */
export function formatDimension(mm: number, unit: 'imperial' | 'metric'): string {
  if (unit === 'metric') {
    return metricText(mm);
  } else {
    return inchText(mmToInches(mm));
  }
}

/**
 * Format hardware specs with nominal inch and exact mm
 * Example: 1" (25.4 mm) × 3/8" (9.5 mm)
 */
export function formatHardware(nominalInch: string, exactMm: number): string {
  return `${nominalInch} (${exactMm} mm)`;
}
