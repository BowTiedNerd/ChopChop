/**
 * Sample Coverage Tests
 * Ensures the sample PDF set covers all required features and patterns
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { pdfShownText } from './pdfTestText';
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
  
  it('each sample PDF actually shows the feature it is meant to cover', () => {
    const text = (name: string) => pdfShownText(readFileSync(join(SAMPLES_DIR, `${name}.pdf`)).toString('latin1'));
    const expectations: Array<[string, RegExp[]]> = [
      ['checkerboard-default', [/Style: checkerboard/, /Flatten panel 1\//]],
      ['checkerboard-16x24', [/Style: checkerboard/, /16\.000" \(16"\) × 24\.000"/]],
      ['chevron', [/Style: chevron/]],
      ['herringbone', [/Style: herringbone/]],
      ['scrap-chaotic', [/Style: scrap-chaotic/]],
      ['hand-hole', [/Handles: hand hole/]],
      ['metric', [/Dimensions: \d+ mm × \d+ mm × \d+ mm/]],
      ['features-combined', [/Juice Groove:/, /Rubber Feet:/, /finger grip/i]],
    ];
    const missing: string[] = [];
    for (const [name, patterns] of expectations) {
      const t = text(name);
      for (const re of patterns) if (!re.test(t)) missing.push(`${name}: ${re}`);
    }
    expect(missing).toEqual([]);
  });
});
