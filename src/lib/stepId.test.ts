/**
 * stepId validation tests
 * Ensures every step's stepId matches catalog and is unique within its style
 */

import { describe, it, expect } from 'vitest';
import { loadStyleCatalog } from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';

describe('stepId Validation', () => {
  for (const style of BOARD_STYLES) {
    describe(`${style} catalog`, () => {
      it('should have unique stepIds within the style', () => {
        const catalog = loadStyleCatalog(style);
        const stepIds = catalog.steps.map(step => step.stepId);
        const uniqueStepIds = new Set(stepIds);
        
        if (stepIds.length !== uniqueStepIds.size) {
          const duplicates = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
          throw new Error(`Duplicate stepIds found in ${style}: ${duplicates.join(', ')}`);
        }
        
        expect(uniqueStepIds.size).toBe(stepIds.length);
      });

      it('should have non-empty stepIds for all steps', () => {
        const catalog = loadStyleCatalog(style);
        
        for (const step of catalog.steps) {
          expect(step.stepId).toBeTruthy();
          expect(typeof step.stepId).toBe('string');
          expect(step.stepId.length).toBeGreaterThan(0);
        }
      });

      it('should have stepIds matching kebab-case convention', () => {
        const catalog = loadStyleCatalog(style);
        const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        
        for (const step of catalog.steps) {
          expect(step.stepId).toMatch(kebabCasePattern);
        }
      });

      it('should maintain stepNumber sequence (display order)', () => {
        const catalog = loadStyleCatalog(style);
        const stepNumbers = catalog.steps.map(step => step.stepNumber);
        
        // Should start at 1
        expect(stepNumbers[0]).toBe(1);
        
        // Should be consecutive
        for (let i = 1; i < stepNumbers.length; i++) {
          expect(stepNumbers[i]).toBe(stepNumbers[i - 1] + 1);
        }
      });

      it('should have matching stepIds between catalog and loaded steps', () => {
        const catalog = loadStyleCatalog(style);
        
        // Verify catalog itself
        for (const step of catalog.steps) {
          expect(step).toHaveProperty('stepId');
          expect(step).toHaveProperty('stepNumber');
          expect(step).toHaveProperty('title');
        }
        
        // Verify stepIds are consistent
        const stepIdMap = new Map<number, string>();
        for (const step of catalog.steps) {
          stepIdMap.set(step.stepNumber, step.stepId);
        }
        
        // Re-load and verify consistency
        const reloadedCatalog = loadStyleCatalog(style);
        for (const step of reloadedCatalog.steps) {
          expect(stepIdMap.get(step.stepNumber)).toBe(step.stepId);
        }
      });
    });
  }

  it('should have unique stepIds across all styles for export disambiguation', () => {
    const allStepIds = new Map<string, string[]>();
    
    for (const style of BOARD_STYLES) {
      const catalog = loadStyleCatalog(style);
      
      for (const step of catalog.steps) {
        const fullId = `${style}/${step.stepId}`;
        
        if (!allStepIds.has(fullId)) {
          allStepIds.set(fullId, []);
        }
        allStepIds.get(fullId)!.push(style);
      }
    }
    
    // Each style/stepId combination should appear exactly once
    for (const [fullId, styles] of allStepIds.entries()) {
      expect(styles.length).toBe(1);
    }
  });
});
