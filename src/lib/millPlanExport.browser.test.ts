/** Browser: "Export Mill Plan PDF" downloads a real mill-plan PDF with computed step text. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser } from 'puppeteer';
import { mkdtempSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { startDevServer, DevServer } from './testServer';

let server: DevServer;
let browser: Browser;

describe('Browser mill-plan export (own dev server, random port)', () => {
  beforeAll(async () => {
    server = await startDevServer();
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }, 120000);
  afterAll(async () => {
    if (browser) await browser.close();
    if (server) await server.stop();
  });

  it('clicking "Export Mill Plan PDF" downloads a mill plan', async () => {
    const dir = mkdtempSync(`${tmpdir()}/mill-dl-`);
    const page = await browser.newPage();
    const dialogs: string[] = [];
    page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
    const cdp = await page.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
    await page.goto(server.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Export Mill Plan PDF'));
      if (!b) throw new Error('mill plan button not found');
      (b as HTMLButtonElement).click();
    });
    const start = Date.now();
    let file = '';
    while (Date.now() - start < 60000 && !file && dialogs.length === 0) {
      file = readdirSync(dir).find(f => f.endsWith('.pdf')) ?? '';
      await new Promise(r => setTimeout(r, 500));
    }
    expect(dialogs.join(' | ')).toBe('');
    expect(file).toMatch(/^chopchop-mill-plan-/);
    const text = execFileSync('pdftotext', ['-layout', `${dir}/${file}`, '-'], { encoding: 'utf-8' });
    expect(text).toContain('Mill Plan');
    expect(text).toContain('Milling Sequence');
    expect(text).not.toContain('from cut list');
  }, 150000);
});
