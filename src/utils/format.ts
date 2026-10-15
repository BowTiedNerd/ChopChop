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
 * No trailing .0 for whole numbers (32 mm, not 32.0 mm)
 */
export function metricText(mm: number, decimals: number = 1): string {
  const rounded = Number(mm.toFixed(decimals));
  // Remove trailing .0 by converting to number and back
  if (Math.floor(rounded) === rounded) {
    return `${Math.floor(rounded)} mm`;
  }
  return `${rounded.toFixed(decimals)} mm`;
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

/** Length in sheet units first, e.g. 16.0" (406 mm) or 406 mm (16.0") */
export function sheetLen(mm: number, unit: 'imperial' | 'metric'): string {
  return shopSize(mm, unit);
}


/** Shop fraction to the nearest 1/16", e.g. 1-11/16" */
export function sixteenthsText(mm: number, base = 16): string {
  const n = Math.round((mm / 25.4) * base);
  const whole = Math.floor(n / base);
  let num = n % base, den = base;
  while (num > 0 && num % 2 === 0) { num /= 2; den /= 2; }
  if (num === 0) return `${whole}"`;
  return whole > 0 ? `${whole}-${num}/${den}"` : `${num}/${den}"`;
}

/** Rounding steps the shop-size printer uses (tests derive their tolerance from these). */
export const INCH_FRACTION_DENOMINATOR = 32;   // inch sheets: fractions to 1/32"
export const METRIC_INCH_DECIMALS = 2;         // metric sheets: inch value as a 2-place decimal
export const MM_STEP = 1;                      // mm main value / inch-sheet mm from MM_WHOLE_FROM up
export const MM_WHOLE_FROM = 25;               // inch sheets: whole mm from 25 mm up
export const MM_SMALL_DECIMALS = 1;            // inch sheets: one decimal mm under 25 mm

/**
 * One shop size, sheet units first (Board Master units ruling). The value in parentheses is a
 * conversion of the printed main value, so it converts back to it within half the main rounding step.
 * inch sheets: 1-11/32" (34 mm); metric sheets: 25 mm (0.98"), never a fraction.
 */
/** One decimal, half up on the decimal value (6.35 -> 6.4; toFixed gives 6.3 from the binary 6.3499...). */
function oneDecimal(mm: number): string {
  const f = Math.pow(10, MM_SMALL_DECIMALS);
  return (Math.round(Number((mm * f).toPrecision(12))) / f).toFixed(MM_SMALL_DECIMALS);
}

export function shopSize(mm: number, unit: 'imperial' | 'metric'): string {
  if (unit === 'metric') {
    // one decimal under 25 mm (12.5, 5.0, 9.5, 3.2, 12.7), whole mm from 25 mm up; never (0 mm)
    const main = mm >= MM_WHOLE_FROM ? `${Math.round(mm / MM_STEP) * MM_STEP}` : oneDecimal(mm);
    return `${main} mm (${(mm / 25.4).toFixed(METRIC_INCH_DECIMALS)}")`;
  }
  const n = Math.round((mm / 25.4) * INCH_FRACTION_DENOMINATOR);
  const mainMm = (n / INCH_FRACTION_DENOMINATOR) * 25.4;
  // mm of the true size: whole mm from 25 mm up, one decimal under 25 mm (1/8" (3.2 mm)); never (0 mm)
  const mmText = mm >= MM_WHOLE_FROM ? `${Math.round(mm / MM_STEP) * MM_STEP}` : oneDecimal(mm);
  return `${sixteenthsText(mainMm, INCH_FRACTION_DENOMINATOR)} (${mmText} mm)`;
}

/** Catalog setting keys whose text is fixed and printed verbatim, never re-formatted (draft5o). */
export const VERBATIM_CATALOG_KEYS = ['Final pass depth'] as const;

/**
 * Catalog prose quotes sizes inch-first, e.g. 'plus 1/8" (3 mm)'. Re-print every quoted pair with shopSize in the
 * sheet's units, taking the fraction as the true size (inch sheets get 1/8" (3.2 mm), metric sheets 3 mm (0.13")).
 * Approximate values ('~1/64" (0.4 mm)') are fixed catalog text and are left as written.
 */
export function normalizeQuotedSizes(text: string, unit: 'imperial' | 'metric', trueMm: number[] = []): string {
  return text.replace(/(~?)(?:(\d+)-)?(\d+)(?:\/(\d+))?"\s*\((\d+(?:\.\d+)?) mm\)/g, (all, tilde, w, a, b, q) => {
    if (tilde) return all;
    const inches = b ? Number(w ?? 0) + Number(a) / Number(b) : Number(a);
    // a catalog true value (rough-stock allowance 3.0 mm) quoted as its fraction keeps its own mm
    const own = trueMm.find(t => Math.abs(t - Number(q)) < 1e-9 && Math.abs(t - inches * 25.4) <= 25.4 / 64);
    return shopSize(own ?? inches * 25.4, unit);
  });
}
