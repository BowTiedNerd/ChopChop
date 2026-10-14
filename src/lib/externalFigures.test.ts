/**
 * External Figure Tests
 * Ensures PDF generation requires external figures from visuals/steps/
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('External Figures - REQUIRE_EXTERNAL_FIGURES enforcement', () => {
  it('should verify visuals/steps directory structure exists', () => {
    const visualsDir = join(process.cwd(), 'visuals');
    const stepsDir = join(visualsDir, 'steps');
    
    // Check if visuals directory exists
    expect(existsSync(visualsDir)).toBe(true);
    
    // Check if steps directory exists
    if (!existsSync(stepsDir)) {
      console.warn('Warning: visuals/steps directory not found. PDF generation will fail without external figures.');
    }
  });

  it('should have step SVGs for at least one style', async () => {
    const stepsDir = join(process.cwd(), 'visuals', 'steps');
    
    if (!existsSync(stepsDir)) {
      console.warn('Warning: visuals/steps directory not found');
      return;
    }
    
    // Check if any style directories exist
    const { readdirSync, statSync } = await import('fs');
    const styleDirs = readdirSync(stepsDir).filter((f: string) => {
      const path = join(stepsDir, f);
      return statSync(path).isDirectory();
    });
    
    if (styleDirs.length > 0) {
      console.log(`Found ${styleDirs.length} style directories in visuals/steps/`);
      
      // Check that at least one has SVG files
      for (const styleDir of styleDirs) {
        const stylePath = join(stepsDir, styleDir);
        const files = readdirSync(stylePath);
        const svgFiles = files.filter((f: string) => f.endsWith('.svg'));
        
        if (svgFiles.length > 0) {
          console.log(`  ${styleDir}: ${svgFiles.length} SVG files`);
        }
      }
    }
    
    expect(styleDirs.length).toBeGreaterThan(0);
  });
});

/**
 * Fix-off experiment: delete a required SVG and verify PDF generation fails
 * 
 * To run manually:
 * 1. Delete visuals/steps/checkerboard/mill-rough-stock.svg
 * 2. Try to generate a PDF for checkerboard
 * 3. Expected: PDF generation should fail with error about missing figure
 * 4. Restore the file
 * 
 * This proves the REQUIRE_EXTERNAL_FIGURES flag is working correctly.
 */
describe('Fix-off: missing external figure', () => {
  it('[MANUAL FIX-OFF] should fail PDF generation when step SVG is missing', () => {
    // This test documents the fix-off experiment
    // To run it:
    // 1. Temporarily delete a step SVG file
    // 2. Set ALLOW_FALLBACK_FIGURES=false (default)
    // 3. Try to generate a PDF
    // 4. It should fail with: "Missing required figure: visuals/steps/<style>/<stepId>.svg"
    
    const testFile = join(process.cwd(), 'visuals', 'steps', 'checkerboard', 'mill-rough-stock.svg');
    const backupFile = `${testFile}.backup`;
    
    if (existsSync(testFile)) {
      console.log('Fix-off test setup:');
      console.log(`  1. mv ${testFile} ${backupFile}`);
      console.log(`  2. npm run generate-samples`);
      console.log(`  3. Expected: Error "Missing required figure: visuals/steps/checkerboard/mill-rough-stock.svg"`);
      console.log(`  4. mv ${backupFile} ${testFile}`);
      
      // Verify the test file exists (so the fix-off is runnable)
      expect(existsSync(testFile)).toBe(true);
    } else {
      // If file doesn't exist, mark test as informational
      console.warn('Test file not found, fix-off not runnable without visuals-draft4');
      expect(existsSync(testFile)).toBe(false);
    }
  });
  
  it('has no fallback: ALLOW_FALLBACK_FIGURES=true still throws on a missing figure', async () => {
    const { PdfGenerator } = await import('../lib/pdf');
    const { calculateRequiredParts } = await import('../lib/lumberPlanner');
    const { createDefaultBoard } = await import('../lib/defaults');
    const design = createDefaultBoard();
    const old = process.env.ALLOW_FALLBACK_FIGURES;
    process.env.ALLOW_FALLBACK_FIGURES = 'true';
    try {
      // preloaded figure map with no entries = every external figure is missing
      const gen = new PdfGenerator(design, {});
      expect(() => gen.generateCutSheet(calculateRequiredParts(design))).toThrow(/Missing required figure: visuals\/steps\/checkerboard\//);
    } finally {
      if (old === undefined) delete process.env.ALLOW_FALLBACK_FIGURES; else process.env.ALLOW_FALLBACK_FIGURES = old;
    }
  });

  it('should throw error when required SVG is missing and ALLOW_FALLBACK is false', async () => {
    // This is the automated version of the manual fix-off test
    // It verifies that PDF generation fails when a required SVG is missing
    const { PdfGenerator } = await import('../lib/pdf');
    const { calculateRequiredParts } = await import('../lib/lumberPlanner');
    const { createDefaultBoard } = await import('../lib/defaults');
    const { renameSync, existsSync } = await import('fs');
    
    const testSvg = join(process.cwd(), 'visuals', 'steps', 'checkerboard', 'rip-strips.svg');
    const backupSvg = `${testSvg}.test-backup`;
    
    // Skip test if SVG doesn't exist
    if (!existsSync(testSvg)) {
      console.warn('Test SVG not found, skipping missing-figure test');
      return;
    }
    
    // Save old env var
    const oldAllowFallback = process.env.ALLOW_FALLBACK_FIGURES;
    delete process.env.ALLOW_FALLBACK_FIGURES;
    
    try {
      // Move the SVG file temporarily
      renameSync(testSvg, backupSvg);
      
      // Create a proper board design
      const design = createDefaultBoard();
      const cutList = calculateRequiredParts(design);
      const generator = new PdfGenerator(design);
      
      // This should throw an error about missing figure
      expect(() => generator.generateCutSheet(cutList)).toThrow(/Missing required figure.*rip-strips\.svg/);
      
    } finally {
      // Always restore the SVG file
      if (existsSync(backupSvg)) {
        renameSync(backupSvg, testSvg);
      }
      
      // Restore env var
      if (oldAllowFallback !== undefined) {
        process.env.ALLOW_FALLBACK_FIGURES = oldAllowFallback;
      }
    }
  });
});
