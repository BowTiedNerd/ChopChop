import { describe, it, expect } from 'vitest';
import { inchText, mmToInches, roundToHalfMm } from './format';

describe('inchText', () => {
  it('should format exact fractions without ≈', () => {
    const result = inchText(0.75);
    expect(result).toBe('0.750" (3/4")');
    expect(result).not.toContain('≈');
  });

  it('should format inexact fractions with ≈', () => {
    const result = inchText(1.663);
    expect(result).toContain('≈');
    expect(result).toContain('1.663"');
  });

  it('should format whole numbers', () => {
    const result = inchText(1.0);
    expect(result).toBe('1.000" (1")');
  });

  it('should format 0.5 inches as exact fraction', () => {
    const result = inchText(0.5);
    expect(result).toBe('0.500" (1/2")');
    expect(result).not.toContain('≈');
  });

  it('should format 0.1875 inches (3/16") as exact fraction', () => {
    const result = inchText(0.1875);
    expect(result).toContain('3/16"');
    expect(result).not.toContain('≈');
  });

  it('should format 0.188 inches with ≈ (close to but not exactly 3/16")', () => {
    const result = inchText(0.188);
    expect(result).toContain('≈');
  });
});

describe('mmToInches', () => {
  it('should convert mm to inches', () => {
    expect(mmToInches(25.4)).toBeCloseTo(1.0, 6);
    expect(mmToInches(12.7)).toBeCloseTo(0.5, 6);
  });
});

describe('roundToHalfMm', () => {
  it('should round to nearest 0.5 mm', () => {
    expect(roundToHalfMm(25.3)).toBe(25.5);
    expect(roundToHalfMm(25.2)).toBe(25.0);
    expect(roundToHalfMm(25.5)).toBe(25.5);
    expect(roundToHalfMm(25.7)).toBe(25.5);
    expect(roundToHalfMm(25.8)).toBe(26.0);
  });
});
