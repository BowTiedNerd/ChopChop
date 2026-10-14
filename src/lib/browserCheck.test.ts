/**
 * Browser check integration test
 * Runs puppeteer checks at 1280x800, 768x1024, 390x844
 * 
 * This test starts its own dev server and will FAIL if server cannot start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { startDevServer, DevServer } from './testServer';

let TEST_URL = '';
let devServer: DevServer | null = null;

const VIEWPORTS = [
  { width: 1280, height: 800, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 390, height: 844, name: 'mobile' },
];

const MIN_DRAWN_SIZE_PX = 10.67;
const SAMPLE_INTERVAL = 1.5;

describe('Browser Check (starts own dev server)', () => {
  let browser: Browser;

  beforeAll(async () => {
    
    devServer = await startDevServer();
    TEST_URL = devServer.url;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }, 40000); // 40 second timeout for setup

  afterAll(async () => {
    
    if (browser) {
      await browser.close();
    }
    
    if (devServer) await devServer.stop();
  });

  for (const viewport of VIEWPORTS) {
    describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      let page: Page;

      beforeAll(async () => {
        
        page = await browser.newPage();
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
        });

        // Load page - MUST succeed or test fails
        await page.goto(TEST_URL, { 
          waitUntil: 'networkidle2', 
          timeout: 10000 
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      afterAll(async () => {
        if (!page) {
          return;
        }
        await page.close();
      });

      it('should render text at minimum size (10.67px)', async () => {
        
        const violations = await checkTextSizes(page);
        
        if (violations.length > 0) {
          console.error(`Text size violations at ${viewport.name}:`, violations);
        }
        
        expect(violations.length).toBe(0);
      });

      it('should show scroll cue only when needed', async () => {
        
        const violations = await checkScrollCue(page);
        
        if (violations.length > 0) {
          console.error(`Scroll cue violations at ${viewport.name}:`, violations);
        }
        
        expect(violations.length).toBe(0);
      });

      it('should not overlap labels with geometry', async () => {
        
        const violations = await checkLabelOverlaps(page);
        
        // Fails on any overlap (mobile 390 px included); no warning-only mode
        const textCount = await page.evaluate(() => document.querySelectorAll('svg text').length);
        expect(textCount).toBeGreaterThan(0);
        expect(violations).toEqual([]);
      });
    });
  }
});

async function checkTextSizes(page: Page): Promise<string[]> {
  return await page.evaluate((minSize) => {
    const violations: string[] = [];
    const textElements = document.querySelectorAll('text, [font-size]');
    
    for (const text of textElements) {
      try {
        const computedStyle = window.getComputedStyle(text);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        if (text instanceof SVGGraphicsElement && text.getScreenCTM) {
          const ctm = text.getScreenCTM();
          if (ctm) {
            const scale = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
            const drawnSize = fontSize * scale;
            
            if (drawnSize < minSize && drawnSize > 0) {
              violations.push(
                `Text "${text.textContent?.substring(0, 30)}" has drawn size ${drawnSize.toFixed(2)} px (< ${minSize} px)`
              );
            }
          }
        }
      } catch (error) {
        throw new Error(`Could not measure element: ${String(error)}`);
      }
    }
    
    return violations;
  }, MIN_DRAWN_SIZE_PX);
}

async function checkScrollCue(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const violations: string[] = [];
    const cues = document.querySelectorAll('.scroll-cue');
    
    for (const cue of cues) {
      const container = cue.closest('.figure-container');
      if (!container) {
        violations.push('Scroll cue not in figure-container');
        continue;
      }
      
      const scrollBox = container.querySelector('.figure-scroll');
      if (!scrollBox) {
        violations.push('Scroll cue container missing figure-scroll');
        continue;
      }
      
      const cueRect = cue.getBoundingClientRect();
      const scrollRect = scrollBox.getBoundingClientRect();
      
      if (cueRect.top < scrollRect.bottom) {
        violations.push('Scroll cue overlaps figure (not in own strip below)');
      }
    }
    
    return violations;
  });
}

async function checkLabelOverlaps(page: Page): Promise<string[]> {
  return await page.evaluate((sampleInterval) => {
    const violations: string[] = [];
    const svg = document.querySelector('svg');
    
    if (!svg) return violations;
    
    const textElements = svg.querySelectorAll('text');
    
    for (const text of textElements) {
      try {
        const bbox = text.getBBox();
        const dimId = text.getAttribute('data-dim-id');
        
        for (let x = bbox.x; x < bbox.x + bbox.width; x += sampleInterval) {
          for (let y = bbox.y; y < bbox.y + bbox.height; y += sampleInterval) {
            const point = svg.createSVGPoint();
            point.x = x;
            point.y = y;
            
            const elements = svg.querySelectorAll('rect, path, line, circle');
            for (const element of elements) {
              if (dimId && element.getAttribute('data-dim-id') === dimId) {
                continue;
              }
              
              if (element.getAttribute('data-bg') === '1') {
                continue;
              }
              
              if (element instanceof SVGGeometryElement) {
                if (element.isPointInFill && element.isPointInFill(point)) {
                  const label = text.textContent?.substring(0, 20) || 'unknown';
                  violations.push(`Label "${label}" overlaps geometry`);
                  return violations;
                }
              }
            }
          }
        }
      } catch (error) {
        throw new Error(`Could not check element: ${String(error)}`);
      }
    }
    
    return violations;
  }, SAMPLE_INTERVAL);
}
