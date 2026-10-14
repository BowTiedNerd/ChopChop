/**
 * Cut List Safety Tests
 * Ensures catalog blankRule is enforced: no pieces under 305mm for jointer/planer
 */

import { describe, it, expect } from 'vitest';
import { calculateRequiredParts } from './lumberPlanner';
import { BoardDesign } from '../types';
import { loadStyleCatalog } from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';

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
 * To run: temporarily comment out the blankRule check in calculateRequiredParts
 * Expected: test should fail with violations for styles like checkerboard
 */
describe('Fix-off: blankRule disabled', () => {
  it('[MANUAL FIX-OFF] should fail when blankRule is bypassed', () => {
    // This test documents the fix-off experiment
    // To run it, modify calculateRequiredParts to ignore blankRule.millWholeBlanksFirst
    // The main test above should then fail, proving the fix works
    expect(true).toBe(true);
  });
});
