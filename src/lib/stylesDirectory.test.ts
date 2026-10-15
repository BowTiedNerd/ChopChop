/**
 * styles/ Directory Validation
 * Ensures only authorized files exist and all steps have stepId
 */

import { describe, it, expect } from 'vitest';
import { readdirSync } from 'fs';
import { join } from 'path';
import { loadStyleCatalog } from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';

describe('styles/ Directory Validation', () => {
  const ALLOWED_FILES = new Set([
    'brick-basketweave.json',
    'checkerboard.json',
    'chevron.json',
    'edge-grain.json',
    'end-grain.json',
    'face-grain.json',
    'herringbone.json',
    'scrap-chaotic.json',
    'stripe-inlay.json',
    'tumbling-block-3d.json',
    'gen.py',
    'README.md',
  ]);

  it('should contain only authorized files (10 catalogs + gen.py + README)', () => {
    const stylesDir = join(process.cwd(), 'styles');
    const actualFiles = readdirSync(stylesDir);
    
    // Check for unauthorized files
    const unauthorizedFiles = actualFiles.filter(file => !ALLOWED_FILES.has(file));
    
    if (unauthorizedFiles.length > 0) {
      throw new Error(
        `Unauthorized files in styles/: ${unauthorizedFiles.join(', ')}\n` +
        `Only allowed: 10 plain-named catalogs, gen.py, README.md`
      );
    }
    
    expect(unauthorizedFiles.length).toBe(0);
  });

  it('should contain all 10 required catalog files', () => {
    const stylesDir = join(process.cwd(), 'styles');
    const actualFiles = new Set(readdirSync(stylesDir));
    
    const requiredCatalogs = [
      'brick-basketweave.json',
      'checkerboard.json',
      'chevron.json',
      'edge-grain.json',
      'end-grain.json',
      'face-grain.json',
      'herringbone.json',
      'scrap-chaotic.json',
      'stripe-inlay.json',
      'tumbling-block-3d.json',
    ];
    
    const missingCatalogs = requiredCatalogs.filter(file => !actualFiles.has(file));
    
    if (missingCatalogs.length > 0) {
      throw new Error(`Missing required catalogs: ${missingCatalogs.join(', ')}`);
    }
    
    expect(missingCatalogs.length).toBe(0);
  });

  it('should have stepId on every step in every catalog', () => {
    const stepsWithoutStepId: string[] = [];
    
    for (const style of BOARD_STYLES) {
      const catalog = loadStyleCatalog(style);
      
      for (const step of catalog.steps) {
        if (!step.stepId || step.stepId.trim() === '') {
          stepsWithoutStepId.push(
            `${style} step ${step.stepNumber}: "${step.title}" (stepId: ${JSON.stringify(step.stepId)})`
          );
        }
      }
    }
    
    if (stepsWithoutStepId.length > 0) {
      throw new Error(
        `Steps missing stepId:\n  - ${stepsWithoutStepId.join('\n  - ')}`
      );
    }
    
    expect(stepsWithoutStepId.length).toBe(0);
  });

  it('should have gen.py and README.md as support files', () => {
    const stylesDir = join(process.cwd(), 'styles');
    const actualFiles = new Set(readdirSync(stylesDir));
    
    expect(actualFiles.has('gen.py')).toBe(true);
    expect(actualFiles.has('README.md')).toBe(true);
  });

  it('should not contain any hash-suffixed files', () => {
    const stylesDir = join(process.cwd(), 'styles');
    const actualFiles = readdirSync(stylesDir);
    
    // Check for any files with hash pattern (e.g., _70bf, _23b0)
    const hashSuffixPattern = /_[a-f0-9]{4}\.(json|py)$/;
    const hashSuffixedFiles = actualFiles.filter(file => hashSuffixPattern.test(file));
    
    if (hashSuffixedFiles.length > 0) {
      throw new Error(
        `Found hash-suffixed files (should be plain names): ${hashSuffixedFiles.join(', ')}`
      );
    }
    
    expect(hashSuffixedFiles.length).toBe(0);
  });
});
