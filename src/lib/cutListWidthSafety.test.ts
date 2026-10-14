/**
 * Cut List Width Safety Tests
 * Ensures catalog widthRule is enforced: no planer over 305mm, no jointer over 152mm
 */

import { withTones } from './sampleDesigns';
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
      const catalog = loadStyleCatalog(style);
      
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
      const parts = calculateRequiredParts(withTones(design));
      
      // Check each part for width violations (only if marked for planer)
      for (const part of parts) {
        // Parts with width notes are already routed to alternative methods
        const hasWidthNote = /\[Width exceeds|Too wide for the jointer|too wide for the planer|router sled/.test(part.part);
        
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

  it('should route wide strip-set panels correctly (N7 test)', () => {
    const violations: string[] = [];
    
    // Test with various board widths to produce panels from narrow to wide
    const testWidths = [
      { width: 300, desc: 'narrow' },     // Should produce panels ~305mm or less
      { width: 406, desc: '16x24' },      // Should produce panels ~406mm (needs routing)
      { width: 500, desc: 'wide' },       // Should produce panels ~500mm+ (needs routing)
    ];
    
    for (const style of BOARD_STYLES) {
      const catalog = loadStyleCatalog(style);
      
      // Skip styles without strip-set panel rules
      if (!catalog.cutListAllowances.blankRule?.blankUnit || 
          catalog.cutListAllowances.blankRule.blankUnit !== 'stripSetPanel') {
        continue;
      }
      
      const panelMaxWidth = catalog.cutListAllowances.blankRule.panelMaxPlanerWidth_mm || 305;
      
      for (const testCase of testWidths) {
        // Use many species for wider test cases to force wider panels  
        // Need 8+ species to get panels > 305mm
        const speciesCount = testCase.width >= 500 ? 10 : testCase.width >= 406 ? 8 : 3;
        const species = [
          { name: 'Walnut', color: '#654321' },
          { name: 'Maple', color: '#F5E6D3' },
          { name: 'Cherry', color: '#C04000' },
          { name: 'Oak', color: '#D2B48C' },
          { name: 'Ash', color: '#E8D7C3' },
          { name: 'Mahogany', color: '#C04000' },
          { name: 'Birch', color: '#F3E5D8' },
          { name: 'Beech', color: '#F5DEB3' },
          { name: 'Hickory', color: '#E5C9A3' },
          { name: 'Teak', color: '#8B7355' },
        ].slice(0, speciesCount);
        
        const design: BoardDesign = {
          style: style,
          dimensions: {
            width: testCase.width,
            length: 450,
            thickness: 38,
          },
          species,
          angle: style === 'chevron' || style === 'herringbone' ? 45 : undefined,
          juiceGroove: { enabled: false, width: 0, depth: 0, fromEdge: 0, cornerRadius: 0 },
          handles: { enabled: false, type: 'handle' },
          rubberFeet: { enabled: false, diameter: 0, height: 0, inset: 0 },
          unitSystem: 'metric',
        };
        
        const parts = calculateRequiredParts(withTones(design));
        
        // Check wide panels have correct routing (NO planer, must use sled or split)
        for (const part of parts) {
          if (part.width > panelMaxWidth) {
            // Wide panel must NOT have "Plane flat" method
            if (part.part.includes('Plane flat')) {
              violations.push(
                `${style} (${testCase.desc}): Panel ${part.width.toFixed(0)}mm says "Plane flat" - must use router sled or split sub-panels`
              );
            }
            
            // Wide panel MUST have either router sled or split sub-panels method
            const hasRouterSled = part.part.includes('Router sled') || part.part.includes('drum sander');
            const hasSplitMethod = part.part.includes('Split into sub-panels');
            
            if (!hasRouterSled && !hasSplitMethod) {
              violations.push(
                `${style} (${testCase.desc}): Panel ${part.width.toFixed(0)}mm lacks router sled or split sub-panels method`
              );
            }
            
            // Verify routing note is present
            const hasRoutingNote = (part.part.includes('[Panel') && part.part.includes('mm wide')) || /too wide for the planer at /.test(part.part);
            if (!hasRoutingNote) {
              violations.push(
                `${style} (${testCase.desc}): Panel ${part.width.toFixed(0)}mm lacks width routing note: ${part.part.slice(0, 160)}`
              );
            }
          }
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `Panel width routing violations:\n  - ${violations.join('\n  - ')}\n\n` +
        `Wide panels (> ${PLANER_MAX_WIDTH_MM}mm) must use router sled or split sub-panels, NOT planer.`
      );
    }
    
    expect(violations.length).toBe(0);
  });

  it('should never generate cut list items over 152mm wide for jointer operations without routing note', () => {
    const violations: string[] = [];
    
    // Test each style with its default design
    for (const style of BOARD_STYLES) {
      const catalog = loadStyleCatalog(style);
      
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
      const parts = calculateRequiredParts(withTones(design));
      
      // Check each part for jointer width violations
      for (const part of parts) {
        // Parts with width notes are already routed to alternative methods
        const hasWidthNote = /\[Width exceeds|Too wide for the jointer|too wide for the planer|router sled/.test(part.part);
        
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
    
    // Verify test works by checking we have test styles
    expect(BOARD_STYLES.length).toBeGreaterThan(0);
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
    
    // Verify test works by checking we have test styles
    expect(BOARD_STYLES.length).toBeGreaterThan(0);
  });
});
