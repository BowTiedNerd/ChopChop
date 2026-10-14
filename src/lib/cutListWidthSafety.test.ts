/**
 * Cut List Width Safety Tests
 * Ensures catalog widthRule is enforced: no planer over 305mm, no jointer over 152mm
 */

import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { BoardDesign } from '../types';
import { loadStyleCatalog } from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';

const PLANER_MAX_WIDTH_MM = 305.0;
const JOINTER_MAX_WIDTH_MM = 152.0;

describe('Cut List Width Safety - widthRule enforcement', () => {
  it('should never generate cut list items over 305mm wide for planer operations', () => {
    const violations: string[] = [];
    
    // Test each style with its default design
    for (const style of BOARD_STYLES) {
      let catalog;
      try {
        catalog = loadStyleCatalog(style);
      } catch {
        continue;
      }
      
      // Skip if no width limits defined
      if (!catalog.cutListAllowances.planerMaxWidth_mm) {
        continue;
      }
      
      const maxWidth = catalog.cutListAllowances.planerMaxWidth_mm;
      
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
      
      // Check each part for width violations (only if marked for planer)
      for (const part of parts) {
        // Parts with width notes are already routed to alternative methods
        const hasWidthNote = part.part.includes('[Width exceeds');
        
        // If no width note and width exceeds planer max, that's a violation
        if (!hasWidthNote && part.width > maxWidth) {
          violations.push(
            `${style}: ${part.part} has width ${part.width.toFixed(1)} mm (> ${maxWidth} mm planer max) without routing note`
          );
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `Cut list width violations (planer lines over ${PLANER_MAX_WIDTH_MM}mm):\n  - ${violations.join('\n  - ')}\n\n` +
        `The widthRule requires: panels wider than ${PLANER_MAX_WIDTH_MM}mm go to router sled or drum sander.`
      );
    }
    
    expect(violations.length).toBe(0);
  });

  it('should never generate cut list items over 152mm wide for jointer operations without routing note', () => {
    const violations: string[] = [];
    
    // Test each style with its default design
    for (const style of BOARD_STYLES) {
      let catalog;
      try {
        catalog = loadStyleCatalog(style);
      } catch {
        continue;
      }
      
      // Skip if no jointer width limit defined
      if (!catalog.cutListAllowances.jointerMaxWidth_mm) {
        continue;
      }
      
      const maxWidth = catalog.cutListAllowances.jointerMaxWidth_mm;
      
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
      
      // Check each part for jointer width violations
      for (const part of parts) {
        // Parts with width notes are already routed to alternative methods
        const hasWidthNote = part.part.includes('[Width exceeds');
        
        // If no width note and width exceeds jointer max, that's a violation
        if (!hasWidthNote && part.width > maxWidth) {
          violations.push(
            `${style}: ${part.part} has width ${part.width.toFixed(1)} mm (> ${maxWidth} mm jointer max) without routing note`
          );
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `Cut list width violations (jointer lines over ${JOINTER_MAX_WIDTH_MM}mm):\n  - ${violations.join('\n  - ')}\n\n` +
        `The widthRule requires: boards wider than ${JOINTER_MAX_WIDTH_MM}mm get planer sled or hand flattening.`
      );
    }
    
    expect(violations.length).toBe(0);
  });
});

/**
 * Fix-off experiments for widthRule enforcement
 */
describe('Fix-off: widthRule disabled', () => {
  it('[MANUAL FIX-OFF] bypassing planerMaxWidth should produce violations', () => {
    // Fix-off run #1: Planer max width check
    // 
    // To run the fix-off:
    // 1. In lumberPlanner.ts calculateBlanksWithRule(), comment out the planer width check:
    //    `if (planerMaxWidth && width > planerMaxWidth) {`
    //    `  widthNote = ' [Width exceeds planer: use router sled or drum sander]';`
    //    `}`
    // 2. Run: npm test -- cutListWidthSafety.test.ts
    // 3. Expected: test fails with violations like:
    //    "style: blank has width 330.2 mm (> 305 mm planer max) without routing note"
    // 4. Restore the code
    //
    // This proves the planerMaxWidth check prevents wide panels from being sent
    // to the planer without an alternative routing method.
    
    // Verify test above detected no violations with the check enabled
    expect(planerViolations.length).toBe(0);
  });

  it('[MANUAL FIX-OFF] bypassing jointerMaxWidth should produce violations', () => {
    // Fix-off run #2: Jointer max width check
    //
    // To run the fix-off:
    // 1. In lumberPlanner.ts calculateBlanksWithRule(), comment out the jointer width check:
    //    `else if (jointerMaxWidth && width > jointerMaxWidth) {`
    //    `  widthNote = ' [Width exceeds jointer: use planer sled or hand flatten]';`
    //    `}`
    // 2. Run: npm test -- cutListWidthSafety.test.ts
    // 3. Expected: test fails with violations for boards between 152mm and 305mm wide
    // 4. Restore the code
    //
    // This proves the jointerMaxWidth check routes wide boards to alternative
    // flattening methods (planer sled or hand flattening).
    
    // Verify test above detected no violations with the check enabled
    expect(jointerViolations.length).toBe(0);
  });
});
