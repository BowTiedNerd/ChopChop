/**
 * Browser regressions for the UI bugs found in the 2026-10-14 browser run.
 * Starts this checkout's own vite server on a random port and kills it afterwards.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { startDevServer, DevServer } from './testServer';

let server: DevServer;
let browser: Browser;
let page: Page;
const consoleErrors: string[] = [];

async function clickButton(p: Page, text: string) {
  const ok = await p.evaluate((t) => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes(t));
    if (!b) return false;
    (b as HTMLButtonElement).click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found: ${text}`);
}

describe('UI bug regressions (own dev server, random port)', () => {
  beforeAll(async () => {
    server = await startDevServer();
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push(String(e)));
    await page.goto(server.url, { waitUntil: 'networkidle0', timeout: 60000 });
  }, 120000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) await server.stop();
  });

  it('has no <rect> transform / SVG attribute errors in the console', async () => {
    const svgErrors = consoleErrors.filter(e => /transform|<rect>|attribute/i.test(e));
    expect(svgErrors).toEqual([]);
  });

  it('top view has no transform="undefined"', async () => {
    const bad = await page.evaluate(() => document.querySelectorAll('[transform="undefined"]').length);
    expect(bad).toBe(0);
  });

  it('Imperial mode shows inches in the dimension inputs', async () => {
    await page.select('#unitSystem', 'imperial');
    const w = await page.$eval('#width', el => (el as HTMLInputElement).value);
    expect(parseFloat(w)).toBeLessThan(100); // 12 (in), not 304.8 (mm)
  });

  it('Optimize Cutting Plan with default stock gives >0% and a cut list', async () => {
    await clickButton(page, 'Optimize Cutting Plan');
    await page.waitForFunction(() => /\d+\.\d%/.test(document.body.innerText), { timeout: 10000 });
    const pct = await page.evaluate(() => {
      const m = document.body.innerText.match(/Utili[sz]ation[^\d]*([\d.]+)%/i);
      return m ? parseFloat(m[1]) : NaN;
    });
    expect(pct).toBeGreaterThan(0);
    const rows = await page.evaluate(() => Array.from(document.querySelectorAll('table tbody tr')).length);
    expect(rows).toBeGreaterThan(0);
  });

  it('Custom Designer final dimensions fit inside the dialog at 390 px (no horizontal clipping)', async () => {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844 });
    await p.goto(server.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await clickButton(p, 'Open Custom Designer');
    await p.waitForFunction(() => document.body.innerText.includes('Final Dimensions'), { timeout: 10000 });
    const m = await p.evaluate(`(() => {
      const h = Array.from(document.querySelectorAll('h3')).find(x => x.textContent.includes('Final Dimensions'));
      let dlg = h.parentElement;
      while (dlg && getComputedStyle(dlg).overflowY !== 'auto') dlg = dlg.parentElement;
      const d = dlg.getBoundingClientRect();
      const inputs = Array.from(h.parentElement.querySelectorAll('input')).map(i => i.getBoundingClientRect());
      return { overflowX: dlg.scrollWidth - dlg.clientWidth, outside: inputs.filter(r => r.right > d.right || r.left < d.left).length, n: inputs.length };
    })()`) as { overflowX: number; outside: number; n: number };
    await p.close();
    expect(m.n).toBe(3);
    expect(m.outside).toBe(0);
    expect(m.overflowX).toBeLessThanOrEqual(0);
  });

});
