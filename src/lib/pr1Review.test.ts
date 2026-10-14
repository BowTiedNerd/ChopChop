import { readFileSync } from 'fs';
import { pdfShownText, pdfContent } from './pdfTestText';
/**
 * PR1-REVIEW Missing Tests
 * Tests from the Board QA PR1 review that were identified as missing
 */

import { describe, it, expect } from 'vitest';
import { generatePattern } from './patterns';
import { createDefaultBoard } from './defaults';
import { PdfGenerator } from './pdf';
import { validateBoard, validateOutputFolder } from './validation';
import { BOARD_STYLES } from '../types/catalog';

// Shared: the default checkerboard cut sheet, raw and with inflated content streams
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { readdirSync } from 'fs';
let cached: { raw: string; content: string } | null = null;
function defaultPdf() {
  if (!cached) {
    const d = createDefaultBoard();
    const raw = Buffer.from(new PdfGenerator(d).generateCutSheet(calculateRequiredParts(d)).output('arraybuffer')).toString('latin1');
    cached = { raw, content: pdfContent(raw) };
  }
  return cached;
}
/** [fontSize, shownText] for every Tj, tracking the last Tf */
function sizedText(content: string): Array<[number, string]> {
  const out: Array<[number, string]> = [];
  let size = NaN;
  for (const line of content.split('\n')) {
    for (const m of line.matchAll(/\/F\d+\s+([\d.]+)\s+Tf/g)) size = parseFloat(m[1]);
    const t = /(?:^|\s)\((.*)\)\s*Tj$/.exec(line);
    if (t) out.push([size, t[1]]);
  }
  return out;
}


describe('PR1-REVIEW #1: PDF minimum text size', () => {
  it('should enforce 8pt minimum in PDFs', () => {
    const texts = sizedText(defaultPdf().content);
    expect(texts.length).toBeGreaterThan(50);
    const tooSmall = texts.filter(([size]) => !(size >= 8)).map(([size, t]) => `${size}pt: ${t.slice(0, 40)}`);
    expect(tooSmall).toEqual([]);
  });

  it('should use 8pt minimum for footer text', () => {
    // No fallback: the footer must be found and its size parsed
    const footers = sizedText(defaultPdf().content).filter(([, t]) => t.includes('ChopChop'));
    expect(footers.length).toBeGreaterThan(0);
    for (const [size] of footers) expect(size).toBeGreaterThanOrEqual(8);
  });
});

describe('PR1-REVIEW #2: CTM and scale validation', () => {
  it('should not apply transform scale to dimension or step-figure labels', () => {
    const svgs = readdirSync('visuals/steps/checkerboard').filter(f => f.endsWith('.svg'))
      .map(f => readFileSync(`visuals/steps/checkerboard/${f}`, 'utf-8'));
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      const scaledText = svg.match(/<text[^>]*transform="[^"]*scale\(/g) ?? [];
      expect(scaledText).toEqual([]);
    }
  });

  it('places every step figure at actual size (no shrink-to-fit, not scaled below readable size)', () => {
    // Each SVG px is drawn at 0.75 pt (96 dpi), so image width in the PDF = svg width × 0.75
    const widths = Array.from(defaultPdf().content.matchAll(/([\d.]+) 0 0 ([\d.]+) [\d.-]+ [\d.-]+ cm\s*\/I\d+ Do/g)).map(m => parseFloat(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    const steps = loadStyleCatalog('checkerboard').steps.filter(st => st.figureType);
    for (const st of steps) {
      const svg = readFileSync(`visuals/steps/checkerboard/${st.stepId}.svg`, 'utf-8');
      const w = parseFloat(/<svg\b[^>]*\bwidth="([\d.]+)/.exec(svg)![1]);
      expect(widths.some(x => Math.abs(x - w * 0.75) < 0.5), `${st.stepId} drawn at ${w * 0.75}pt`).toBe(true);
    }
  });
});

describe('PR1-REVIEW #3: No [Step Diagram] placeholders in PDFs', () => {
  it('should verify PDFs contain real figures, not placeholders', () => {
    const { raw } = defaultPdf();
    expect(raw).not.toContain('[Step Diagram]');
    expect((raw.match(/\/Subtype \/Image/g) ?? []).length).toBeGreaterThan(0);
  });
  
  it('should enforce 11pt minimum on step figure labels', async () => {
    // Step figures must use 11pt or larger for all labels
    // This test verifies the rip fence figure creates proper labels
    const { generateRipFenceFigure } = await import('./stepFigures');
    
    // Generating a rip fence figure should work (uses 11pt)
    const figure = generateRipFenceFigure(25.4, 20, 'metric');
    expect(figure.svg).toContain('RIP FENCE');
    const sizes = Array.from(figure.svg.matchAll(/font-size="([\d.]+)"/g)).map(m => parseFloat(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const sz of sizes) expect(sz).toBeGreaterThanOrEqual(11);
  });
  
  it('should not place labels on blade geometry', async () => {
    // Labels must not overlap with blade at x=200
    // This test verifies RIP FENCE label is positioned away from blade
    const { generateRipFenceFigure } = await import('./stepFigures');
    
    const figure = generateRipFenceFigure(25.4, 20, 'metric');
    
    // Find the label position in the SVG
    // Labels are text elements with content "RIP FENCE"
    const labelMatch = figure.svg.match(/<text[^>]*x="([^"]+)"[^>]*>RIP FENCE</);
    expect(labelMatch).not.toBeNull();
    const labelX = parseFloat(labelMatch![1]);
    // Blade is at x=200, label should not be there (allow 10px tolerance)
    expect(Math.abs(labelX - 200)).toBeGreaterThan(10);
  });
});

describe('PR1-REVIEW #4: Banner tests', () => {
  it('should never truncate safety banners', async () => {
    // Safety banners must appear in full, no ellipsis or truncation
    // This test generates a PDF and checks it's the expected size
    // Truncated banners produce smaller PDFs
    const design = createDefaultBoard();
    const { calculateRequiredParts } = await import('./lumberPlanner');
    const cutList = calculateRequiredParts(design);
    const { loadStyleCatalog } = await import('./catalogLoader');
    const catalog = loadStyleCatalog(design.style);
    
    // Count total banner characters
    let totalBannerChars = 0;
    for (const step of catalog.steps) {
      for (const banner of step.safetyBanners) {
        totalBannerChars += banner.length;
      }
    }
    
    // Generate PDF
    const generator = new PdfGenerator(design);
    const doc = generator.generateCutSheet(cutList);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Every banner must appear in full in the PDF text (wrapped lines rejoined)
    const raw = pdfBuffer.toString('latin1');
    const shown = pdfShownText(raw);
    const norm = (t: string) => t.replace(/\s+/g, ' ').trim();
    for (const step of catalog.steps) {
      for (const banner of step.safetyBanners) {
        const words = norm(banner).split(' ');
        expect(shown, `banner missing tail: ${banner}`).toContain(words.slice(-3).join(' '));
        expect(shown).not.toContain('…');
      }
    }
    
    // Verify we have substantial banner content
    expect(totalBannerChars).toBeGreaterThan(500);
  });

  it('should print all safety banners, not just first', () => {
    const shown = pdfShownText(defaultPdf().raw);
    const steps = loadStyleCatalog('checkerboard').steps.filter(st => st.safetyBanners.length > 1);
    expect(steps.length).toBeGreaterThan(0);
    for (const st of steps) for (const b of st.safetyBanners) {
      expect(shown).toContain(b.split(' ').slice(0, 4).join(' '));
    }
  });
});

describe('PR1-REVIEW #5: Settings in step text', () => {
  it('should include settings in step descriptions', () => {
    const shown = pdfShownText(defaultPdf().raw);
    const withSettings = loadStyleCatalog('checkerboard').steps.filter(st => Object.keys(st.settings).length > 0);
    expect(withSettings.length).toBeGreaterThan(0);
    for (const st of withSettings) {
      const [key, value] = Object.entries(st.settings)[0];
      expect(shown).toContain(`${key}: ${value}`.slice(0, 30));
    }
  });
});

describe('PR1-REVIEW #6: Other caps test', () => {
  it('should verify strip cap removed (no 8-strip limit)', () => {
    // stepFigures.ts previously had maxStrips=8, now shows all
    // This was fixed by removing the cap
    const design = createDefaultBoard();
    const pattern = generatePattern(design);
    
    // No artificial cap: 12 across × 18 rows on the default 12x18 board
    expect(pattern.strips.length).toBe(12 * 18);
  });

  it('should verify step cap removed (no 3-step limit)', () => {
    // CustomDesigner.tsx previously had steps.slice(0,3), now shows all
    // This was fixed by removing the slice
    const src = readFileSync('src/components/CustomDesigner.tsx', 'utf-8');
    expect(src).not.toMatch(/steps\.slice\(/);
    expect(src).toMatch(/steps\.map\(/);
  });
});



describe('PR1-REVIEW #9: Angle geometry difference', () => {
  it('should produce different geometry for 30° vs 45° chevron', () => {
    const design = createDefaultBoard();
    design.style = 'chevron';
    
    design.angle = 30;
    const pattern30 = generatePattern(design);
    
    design.angle = 45;
    const pattern45 = generatePattern(design);
    
    // Different angles should produce different strip depths
    // At 30°, strips are longer than at 45°
    expect(pattern30.strips.length).toBeGreaterThan(0);
    expect(pattern45.strips.length).toBeGreaterThan(0);
    
    // Verify patterns differ (different strip arrangement)
    const depth30 = pattern30.strips[0]?.depth || 0;
    const depth45 = pattern45.strips[0]?.depth || 0;
    
    // 30° should have different depth than 45°
    expect(depth30).not.toBe(depth45);
  });
});

describe('PR1-REVIEW #10: Refusal tests', () => {
  it('should refuse chevron at 19 degrees', () => {
    const design = createDefaultBoard();
    design.style = 'chevron';
    design.angle = 19;
    
    const validation = validateBoard(design);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('angle'))).toBe(true);
  });

  it('should refuse gapped chevron', () => {
    const design = createDefaultBoard();
    design.style = 'chevron';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (design as any).gap = 5; // Add gap field
    
    const validation = validateBoard(design);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('gap'))).toBe(true);
  });
});

describe('PR1-REVIEW #11: Concurrency test', () => {
  it('should produce identical exports except timestamps', async () => {
    const { buildExportDoc } = await import('../../scripts/export');
    const d = createDefaultBoard();
    const [a, b] = await Promise.all([
      Promise.resolve(buildExportDoc(d, { exportedAt: '2026-01-01T00:00:00Z', commitSha: 'x' }).exportDoc),
      Promise.resolve(buildExportDoc(d, { exportedAt: '2026-01-02T00:00:00Z', commitSha: 'x' }).exportDoc),
    ]);
    expect({ ...a, exportedAt: '' }).toEqual({ ...b, exportedAt: '' });
    expect(a.exportedAt).not.toBe(b.exportedAt);
  });
});

describe('PR1-REVIEW #12: Undefined folder test', () => {
  it('should reject undefined output folder in export', () => {
    // validateOutputFolder should throw on undefined
    expect(() => validateOutputFolder(undefined)).toThrow();
    expect(() => validateOutputFolder('undefined')).toThrow();
    expect(() => validateOutputFolder('/valid/path')).not.toThrow();
  });
});

describe('PR1-REVIEW #13: Crosscut sled requirement', () => {
  it('should require crosscut sled with stop block for panel slices', () => {
    const panels = calculateRequiredParts(createDefaultBoard()).filter(p => p.part.includes('strip-set panel'));
    expect(panels.length).toBeGreaterThan(0);
    for (const p of panels) expect(p.part).toMatch(/crosscut sled with stop block \(never fence\)/);
  });
});

describe('PR1-REVIEW #14: Sweep test', () => {
  it('should test all board styles in sweep', () => {
    // All 10 board styles should be tested
    expect(BOARD_STYLES.length).toBe(10);
    
    // Verify all styles validate
    const design = createDefaultBoard();
    for (const style of BOARD_STYLES) {
      design.style = style;
      const validation = validateBoard(design);
      expect(validation.valid).toBe(true);
    }
  });
});
