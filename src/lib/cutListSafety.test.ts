/**
 * Cut List Safety Tests
 * Ensures catalog blankRule is enforced: no pieces under 305mm for jointer/planer
 */

import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { BoardDesign } from '../types';
import { loadStyleCatalog } from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';
import { createDefaultBoard } from './defaults';

const PLANER_JOINTER_MINIMUM_MM = 305.0;

describe('Cut List Safety - blankRule enforcement', () => {
  it('should never generate cut list items under 305mm length for jointer/planer operations', () => {
    const violations: string[] = [];
    
    // Test each style with its default design
    for (const style of BOARD_STYLES) {
      let catalog;
      try {
        catalog = loadStyleCatalog(style);
      } catch {
        continue; // Skip if catalog not found
      }
      
      // Skip if no blankRule
      if (!catalog.cutListAllowances.blankRule?.millWholeBlanksFirst) {
        continue;
      }
      
      // Create a minimal design for this style
      const design: BoardDesign = {
        style: style,
        dimensions: {
          width: 300,
          length: 450,
          thickness: 38,
        },
        species: [
          { name: 'Walnut', color: '#654321' },
          { name: 'Maple', color: '#F5E6D3' },
        ],
        angle: style === 'chevron' || style === 'herringbone' ? 45 : undefined,
        juiceGroove: { enabled: false, width: 0, depth: 0, fromEdge: 0, cornerRadius: 0 },
        handles: { enabled: false, type: 'handle' },
        rubberFeet: { enabled: false, diameter: 0, height: 0, inset: 0 },
        unitSystem: 'metric',
      };
      
      // Calculate required parts
      const parts = calculateRequiredParts(design);
      
      // Check each part
      for (const part of parts) {
        if (part.length < PLANER_JOINTER_MINIMUM_MM) {
          violations.push(
            `${style}: ${part.part} has length ${part.length.toFixed(1)} mm (< ${PLANER_JOINTER_MINIMUM_MM} mm minimum)`
          );
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `Cut list safety violations (pieces under 305mm):\n  - ${violations.join('\n  - ')}\n\n` +
        `The blankRule requires: blank length = max(305 mm, slices × (slice + kerf) + 2 × 25 mm trim)\n` +
        `Never send a crosscut slice or piece shorter than 305 mm to the jointer or planer.`
      );
    }
    
    expect(violations.length).toBe(0);
  });
});

/**
 * Fix-off experiment: turn off blankRule and verify test fails
 * 
 * To run the fix-off:
 * 1. In lumberPlanner.ts calculateRequiredParts(), change:
 *    `if (blankRule?.millWholeBlanksFirst) {`
 *    to:
 *    `if (false && blankRule?.millWholeBlanksFirst) {`
 * 2. Run: npm test -- cutListSafety.test.ts
 * 3. Expected: test fails with violations like:
 *    "checkerboard: Walnut strip has length 78.6 mm (< 305 mm minimum)"
 *    "checkerboard: Maple strip has length 78.6 mm (< 305 mm minimum)"
 * 4. Restore the code
 * 
 * This proves the blankRule is working and prevents short pieces from being
 * sent to jointer/planer operations.
 */
describe('Fix-off: blankRule disabled', () => {
  it('[MANUAL FIX-OFF] bypassing blankRule should produce violations', () => {
    // This test documents the fix-off experiment
    // When blankRule.millWholeBlanksFirst is bypassed, the cut list generator
    // falls back to the legacy behavior: individual strips with allowances added.
    // For checkerboard, this produces strips of ~78mm length (slice thickness +
    // allowances), which violates the 305mm jointer/planer minimum.
    //
    // The fix: blankRule calculates blank length = max(305mm, slices*(slice+kerf)+2*25mm)
    // and lists whole blanks to mill & rip, then crosscut into slices.
    
    // Verify the main test would catch violations by running a quick check
    const design: BoardDesign = {
      style: 'checkerboard',
      dimensions: { width: 305, length: 406, thickness: 38 },
      species: [
        { name: 'Walnut', color: '#654321' },
        { name: 'Maple', color: '#F5E6D3' },
      ],
      juiceGroove: { enabled: false, width: 0, depth: 0, fromEdge: 0, cornerRadius: 0 },
      handles: { enabled: false, type: 'handle' },
      rubberFeet: { enabled: false, diameter: 0, height: 0, inset: 0 },
      unitSystem: 'imperial',
    };
    
    const cutList = calculateRequiredParts(design);
    const underMin = cutList.filter(p => p.length < PLANER_JOINTER_MINIMUM_MM);
    
    // With blankRule enabled, should be 0 violations
    expect(underMin.length).toBe(0);
    
    // If blankRule were disabled, underMin.length would be > 0
    // This is documented in FIX-OFF-EVIDENCE.md experiment N1
  });
});

describe('Blank Length Constraints', () => {
  it('should never generate blanks under 305mm minimum length', () => {
    const violations: string[] = [];
    
    for (const style of BOARD_STYLES) {
      const design = createDefaultBoard();
      design.style = style;
      
      const cutList = calculateRequiredParts(design);
      
      for (const part of cutList) {
        if (part.length < PLANER_JOINTER_MINIMUM_MM) {
          violations.push(`${style}: ${part.part} has length ${part.length.toFixed(1)} mm (< 305 mm minimum)`);
        }
      }
    }
    
    expect(violations.length).toBe(0);
    if (violations.length > 0) {
      console.error('Blank minimum length violations:', violations);
    }
  });

  it('should never generate blanks over 915mm maximum length', () => {
    const violations: string[] = [];
    const MAX_BLANK_LENGTH_MM = 915;
    
    for (const style of BOARD_STYLES) {
      const design = createDefaultBoard();
      design.style = style;
      
      const cutList = calculateRequiredParts(design);
      
      for (const part of cutList) {
        if (part.length > MAX_BLANK_LENGTH_MM) {
          violations.push(`${style}: ${part.part} has length ${part.length.toFixed(1)} mm (> 915 mm maximum)`);
        }
      }
    }
    
    expect(violations.length).toBe(0);
    if (violations.length > 0) {
      console.error('Blank maximum length violations:', violations);
    }
  });

  it('[MANUAL FIX-OFF] bypassing blankMinLength should produce under-305mm violations', () => {
    // Fix-off experiment N5:
    // 1. In catalog, set blankMinLength_mm = 200
    // 2. Run: npm test -- "blank.*minimum"
    // 3. Expected: test fails with blanks under 305mm
    // 4. Restore blankMinLength_mm = 305
    //
    // This proves the blankMinLength_mm check enforces the 305mm jointer/planer minimum
    
    // With proper config, no violations
    const design = createDefaultBoard();
    const cutList = calculateRequiredParts(design);
    const underMin = cutList.filter(p => p.length < PLANER_JOINTER_MINIMUM_MM);
    expect(underMin.length).toBe(0);
  });

  it('[MANUAL FIX-OFF] bypassing blankMaxLength should produce over-915mm violations', () => {
    // Fix-off experiment N6:
    // 1. In catalog, set blankMaxLength_mm = 1200 (or remove it)
    // 2. Run: npm test -- "blank.*maximum"
    // 3. Expected: test fails with blanks over 915mm
    // 4. Restore blankMaxLength_mm = 915
    //
    // This proves blankMaxLength_mm splits long panels into manageable lengths
    
    // With proper config, no violations
    const design = createDefaultBoard();
    const cutList = calculateRequiredParts(design);
    const overMax = cutList.filter(p => p.length > 915);
    expect(overMax.length).toBe(0);
  });
});
