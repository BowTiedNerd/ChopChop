import { describe, it, expect } from 'vitest';
import {
  validateBoard,
  validateAngle,
  calculateStripeCount,
  validateOutputFolder,
  compareExports,
} from './validation';
import { createDefaultBoard } from './defaults';

describe('validateBoard', () => {
  it('should validate a valid board design', () => {
    const board = createDefaultBoard();
    const result = validateBoard(board);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject board with zero width', () => {
    const board = createDefaultBoard();
    board.dimensions.width = 0;
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Board width must be greater than 0');
  });

  it('should reject board with no species', () => {
    const board = createDefaultBoard();
    board.species = [];
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one wood species must be selected');
  });

  it('should validate juice groove placement', () => {
    const board = createDefaultBoard();
    board.juiceGroove.enabled = true;
    board.dimensions.width = 50; // Too small for groove
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('too small for juice groove'))).toBe(true);
  });

  it('should validate rubber feet placement', () => {
    const board = createDefaultBoard();
    board.rubberFeet.enabled = true;
    board.dimensions.width = 40; // Too small for feet
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('too small for rubber feet'))).toBe(true);
  });
});

describe('validateAngle', () => {
  it('should accept chevron angle within range (20-60°)', () => {
    const result = validateAngle('chevron', 45);
    expect(result.valid).toBe(true);
  });

  it('should reject chevron angle below minimum (19°)', () => {
    const result = validateAngle('chevron', 19);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('chevron angle must be between 20° and 60° (got 19°)');
  });

  it('should reject chevron angle above maximum (61°)', () => {
    const result = validateAngle('chevron', 61);
    expect(result.valid).toBe(false);
  });

  it('should accept herringbone angle within range (30-60°)', () => {
    const result = validateAngle('herringbone', 45);
    expect(result.valid).toBe(true);
  });

  it('should reject herringbone angle below minimum (29°)', () => {
    const result = validateAngle('herringbone', 29);
    expect(result.valid).toBe(false);
  });
});

describe('calculateStripeCount', () => {
  it('should calculate stripe count including 2×kerf', () => {
    const boardLength = 400; // mm
    const stripeWidth = 25.4; // mm (1 inch)
    // kerf = 3.175 mm (1/8 inch) - used in calculation
    
    const count = calculateStripeCount(boardLength, stripeWidth, true);
    
    // Expected: floor(400 / (25.4 + 2*3.175)) = floor(400 / 31.75) = 12
    expect(count).toBe(12);
  });

  it('should calculate stripe count without kerf when disabled', () => {
    const boardLength = 400;
    const stripeWidth = 25.4;
    
    const count = calculateStripeCount(boardLength, stripeWidth, false);
    
    // Expected: floor(400 / 25.4) = 15
    expect(count).toBe(15);
  });
});

describe('validateOutputFolder', () => {
  it('should accept valid folder path', () => {
    expect(() => validateOutputFolder('/path/to/output')).not.toThrow();
  });

  it('should reject undefined folder', () => {
    expect(() => validateOutputFolder(undefined)).toThrow('Output folder must be defined');
  });

  it('should reject "undefined" string', () => {
    expect(() => validateOutputFolder('undefined')).toThrow('Output folder must be defined');
  });
});

describe('compareExports', () => {
  it('should consider exports identical except for timestamps', () => {
    const export1 = {
      design: { width: 400, length: 600 },
      timestamp: '2024-01-01T00:00:00Z',
      createdAt: 1234567890,
    };
    
    const export2 = {
      design: { width: 400, length: 600 },
      timestamp: '2024-01-02T00:00:00Z',
      createdAt: 9876543210,
    };
    
    expect(compareExports(export1, export2)).toBe(true);
  });

  it('should detect different exports', () => {
    const export1 = {
      design: { width: 400, length: 600 },
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    const export2 = {
      design: { width: 500, length: 600 },
      timestamp: '2024-01-02T00:00:00Z',
    };
    
    expect(compareExports(export1, export2)).toBe(false);
  });
});
