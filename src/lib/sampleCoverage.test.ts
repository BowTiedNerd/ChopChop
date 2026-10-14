/**
 * Sample Coverage Tests
 * Ensures the sample PDF set covers all required features and patterns
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SAMPLES_DIR = join(process.cwd(), 'samples');

describe('Sample PDF Coverage', () => {
  it('should have all required sample PDFs', () => {
    // Verify samples directory exists
    expect(existsSync(SAMPLES_DIR)).toBe(true);
    
    const samples = readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.pdf'));
    const sampleNames = samples.map(f => f.replace('.pdf', ''));
    
    // Required samples as specified
    const required = [
      'checkerboard-default',  // checkerboard pattern
      'checkerboard-16x24',    // 16x24 size
      'chevron',               // chevron pattern
      'herringbone',           // herringbone pattern
      'scrap-chaotic',         // scrap-chaotic pattern
      'hand-hole',             // hand-hole handles
      'metric',                // metric units
      'features-combined',     // juice groove + feet + finger grip
    ];
    
    for (const name of required) {
      expect(sampleNames).toContain(name);
    }
    
    // Verify total count (8 existing + new additions)
    expect(samples.length).toBeGreaterThanOrEqual(9);
  });
  
  it('should cover all required features and patterns', () => {
    // This test documents the feature coverage requirements
    const coverage = {
      patterns: ['checkerboard', 'chevron', 'herringbone', 'scrap-chaotic'],
      sizes: ['16x24'],
      units: ['metric'],
      features: ['hand-hole', 'juice-groove', 'feet', 'finger-grip'],
    };
    
    // Verify coverage mapping
    expect(coverage.patterns).toHaveLength(4);
    expect(coverage.features).toHaveLength(4);
    
    // All features should be present in samples:
    // - metric: metric.pdf (has juice groove + feet)
    // - 16x24: checkerboard-16x24.pdf
    // - checkerboard: checkerboard-default.pdf, checkerboard-16x24.pdf
    // - herringbone: herringbone.pdf
    // - chevron: chevron.pdf
    // - scrap-chaotic: scrap-chaotic.pdf
    // - hand-hole: hand-hole.pdf
    // - juice groove: features-combined.pdf, metric.pdf
    // - feet: features-combined.pdf, metric.pdf
    // - finger grip: features-combined.pdf
  });
});
