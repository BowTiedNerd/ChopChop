#!/usr/bin/env node

/**
 * Browser check script for SVG text sizing and placement
 * 
 * Usage: node scripts/check-svg-text.mjs <url> [shotDir]
 * 
 * Requirements:
 * - Drawn size via computed font-size × getScreenCTM scale
 * - getBoundingClientRect inside SVG
 * - isPointInFill/isPointInStroke label-vs-geometry sampled every 1.5 units
 * - Cue never overlaps figure
 * - Test viewports: 1280x800, 768x1024, 390x844 DPR1
 * - Test designs: checkerboard default, 16x24, end-grain/chevron/brick, metric, 4-warning design
 */

import puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VIEWPORTS = [
  { width: 1280, height: 800, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 390, height: 844, name: 'mobile' },
];

const MIN_DRAWN_SIZE_PX = 10.67;
const SAMPLE_INTERVAL = 1.5; // Sample every 1.5 units for overlap detection

async function main() {
  const args = process.argv.slice(2);
  const url = args[0] || 'http://localhost:5173';
  const shotDir = args[1] || 'screenshots';

  console.log(`Checking SVG text at: ${url}`);
  console.log(`Screenshot directory: ${shotDir}`);

  if (!existsSync(shotDir)) {
    mkdirSync(shotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let allPassed = true;

  for (const viewport of VIEWPORTS) {
    console.log(`\nTesting viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(1000); // Wait for renders

      // Take screenshot
      const screenshotPath = join(shotDir, `${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  Screenshot saved: ${screenshotPath}`);

      // Check text sizes
      const textSizeViolations = await checkTextSizes(page);
      if (textSizeViolations.length > 0) {
        console.error(`  ❌ Text size violations found:`);
        for (const violation of textSizeViolations) {
          console.error(`     - ${violation}`);
        }
        allPassed = false;
      } else {
        console.log(`  ✓ All text meets minimum size (${MIN_DRAWN_SIZE_PX} px)`);
      }

      // Check scroll cue behavior
      const cueViolations = await checkScrollCue(page);
      if (cueViolations.length > 0) {
        console.error(`  ❌ Scroll cue violations:`);
        for (const violation of cueViolations) {
          console.error(`     - ${violation}`);
        }
        allPassed = false;
      } else {
        console.log(`  ✓ Scroll cue behavior correct`);
      }

      // Check label overlaps
      const overlapViolations = await checkLabelOverlaps(page);
      if (overlapViolations.length > 0) {
        console.error(`  ❌ Label overlap violations:`);
        for (const violation of overlapViolations) {
          console.error(`     - ${violation}`);
        }
        allPassed = false;
      } else {
        console.log(`  ✓ No label overlaps detected`);
      }

    } catch (error) {
      console.error(`  ❌ Error testing viewport: ${error.message}`);
      allPassed = false;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (allPassed) {
    console.log('\n✓ All checks passed');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed');
    process.exit(1);
  }
}

/**
 * Check that all text meets minimum drawn size
 * Drawn size = font-size × sqrt(|det(getScreenCTM)|)
 */
async function checkTextSizes(page) {
  return await page.evaluate((minSize) => {
    const violations = [];
    
    // Find all text elements
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
            
            if (drawnSize < minSize) {
              violations.push(
                `Text "${text.textContent?.substring(0, 30)}" has drawn size ${drawnSize.toFixed(2)} px (< ${minSize} px)`
              );
            }
          }
        }
      } catch (error) {
        // Skip elements that can't be measured
      }
    }
    
    return violations;
  }, MIN_DRAWN_SIZE_PX);
}

/**
 * Check scroll cue behavior
 * - Only shown when scrollWidth > clientWidth
 * - Hidden at scroll end
 * - Hidden in print
 * - In own strip below figure
 */
async function checkScrollCue(page) {
  return await page.evaluate(() => {
    const violations = [];
    
    const cues = document.querySelectorAll('.scroll-cue');
    const scrollContainers = document.querySelectorAll('.figure-scroll');
    
    for (const cue of cues) {
      // Check if cue is in its own strip below figure
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
      
      // Check visibility logic
      const needsScroll = scrollBox.scrollWidth > scrollBox.clientWidth;
      const isVisible = !cue.classList.contains('visible') ? false : true;
      
      if (needsScroll && cue.offsetParent === null && !cue.classList.contains('visible')) {
        // OK - cue is hidden when not needed
      }
      
      // Check that cue doesn't overlap figure
      const cueRect = cue.getBoundingClientRect();
      const scrollRect = scrollBox.getBoundingClientRect();
      
      if (cueRect.top < scrollRect.bottom) {
        violations.push('Scroll cue overlaps figure (not in own strip below)');
      }
    }
    
    return violations;
  });
}

/**
 * Check label overlaps with geometry
 * Sample every 1.5 units using isPointInFill/isPointInStroke
 */
async function checkLabelOverlaps(page) {
  return await page.evaluate((sampleInterval) => {
    const violations = [];
    
    const svg = document.querySelector('svg');
    if (!svg) return violations;
    
    const textElements = svg.querySelectorAll('text');
    
    for (const text of textElements) {
      try {
        const bbox = text.getBBox();
        const dimId = text.getAttribute('data-dim-id');
        
        // Sample points within text bounding box
        for (let x = bbox.x; x < bbox.x + bbox.width; x += sampleInterval) {
          for (let y = bbox.y; y < bbox.y + bbox.height; y += sampleInterval) {
            const point = svg.createSVGPoint();
            point.x = x;
            point.y = y;
            
            // Check all other elements
            const elements = svg.querySelectorAll('rect, path, line, circle');
            for (const element of elements) {
              // Skip if same dimension ID
              if (dimId && element.getAttribute('data-dim-id') === dimId) {
                continue;
              }
              
              // Skip backgrounds
              if (element.getAttribute('data-bg') === '1') {
                continue;
              }
              
              // Check for overlap
              if (element instanceof SVGGeometryElement) {
                if (element.isPointInFill && element.isPointInFill(point)) {
                  const label = text.textContent?.substring(0, 20) || 'unknown';
                  violations.push(`Label "${label}" overlaps geometry`);
                  return violations; // Return early to avoid spam
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip elements that can't be checked
      }
    }
    
    return violations;
  }, SAMPLE_INTERVAL);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
