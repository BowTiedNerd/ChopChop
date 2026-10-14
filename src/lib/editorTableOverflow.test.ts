/**
 * Editor stock table must not cause page-level horizontal scroll at 390×844.
 * Starts its own Vite server on a random free port.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';

const VIEWPORT = { width: 390, height: 844 };

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Could not bind a free port'));
        return;
      }
      const port = addr.port;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

async function waitForServer(url: string, timeoutMs: number): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (err) {
      console.error('Waiting for dev server:', err instanceof Error ? err.message : err);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

describe('Editor table overflow at 390×844', () => {
  let browser: Browser;
  let page: Page;
  let devServer: ChildProcess | null = null;
  let testUrl = '';

  beforeAll(async () => {
    if (process.env.SKIP_BROWSER_TESTS === 'true') {
      console.log('Skipping editor table overflow tests (SKIP_BROWSER_TESTS=true)');
      return;
    }

    const port = await getFreePort();
    testUrl = `http://127.0.0.1:${port}/`;

    devServer = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    const ready = await waitForServer(testUrl, 30000);
    if (!ready) {
      throw new Error(`Dev server failed to start at ${testUrl}`);
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1,
    });
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.stock-table');
  }, 45000);

  afterAll(async () => {
    if (process.env.SKIP_BROWSER_TESTS === 'true') return;
    if (page) await page.close();
    if (browser) await browser.close();
    if (devServer) {
      devServer.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });

  it('document.scrollWidth is at most 390 with the stacked stock table', async () => {
    if (process.env.SKIP_BROWSER_TESTS === 'true') return;

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(VIEWPORT.width);
  });

  it('every stock input is labeled and inside the viewport width', async () => {
    if (process.env.SKIP_BROWSER_TESTS === 'true') return;

    const result = await page.evaluate((viewportWidth) => {
      const inputs = Array.from(document.querySelectorAll('.stock-table input'));
      const unlabeled: string[] = [];
      const overflowed: string[] = [];

      for (const input of inputs) {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        if (!label || !label.textContent?.trim()) {
          unlabeled.push(id || input.getAttribute('type') || 'input');
        }
        const rect = input.getBoundingClientRect();
        if (rect.right > viewportWidth + 1 || rect.left < -1) {
          overflowed.push(id || 'input');
        }
      }

      return {
        inputCount: inputs.length,
        unlabeled,
        overflowed,
      };
    }, VIEWPORT.width);

    expect(result.inputCount).toBeGreaterThan(0);
    expect(result.unlabeled).toEqual([]);
    expect(result.overflowed).toEqual([]);
  });

  it('fails the 390px scrollWidth check when the 6-column stock grid is restored', async () => {
    if (process.env.SKIP_BROWSER_TESTS === 'true') return;

    // Control: the overflow assertion is real. Restoring the old 6-up row
    // without inner scroll must make the page wider than 390.
    await page.addStyleTag({
      content: `
        html, body, #root, .app-container, .editor-section, .stock-table {
          max-width: none !important;
          overflow: visible !important;
        }
        .stock-table { overflow: visible !important; }
        .stock-row {
          display: grid !important;
          grid-template-columns: 1fr 1fr 1fr 1fr 80px 80px !important;
          width: max-content !important;
        }
        .stock-row input {
          min-width: 100px !important;
          width: 100px !important;
        }
      `,
    });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeGreaterThan(VIEWPORT.width);

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.stock-table');
  });
});
