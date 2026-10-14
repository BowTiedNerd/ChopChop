/** Browser: "Export Cut Sheet PDF" downloads a real PDF with embedded step figures. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser } from 'puppeteer';
import { mkdtempSync, readdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { startDevServer, DevServer } from './testServer';

let server: DevServer;
let browser: Browser;

describe('Browser PDF export (own dev server, random port)', () => {
  beforeAll(async () => {
    server = await startDevServer();
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }, 120000);
  afterAll(async () => {
    if (browser) await browser.close();
    if (server) await server.stop();
  });

  it('downloads a cut-sheet PDF that contains images and no placeholders', async () => {
    const dir = mkdtempSync(`${tmpdir()}/pdf-dl-`);
    const page = await browser.newPage();
    const dialogs: string[] = [];
    page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
    const cdp = await page.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
    await page.goto(server.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Export Cut Sheet PDF'));
      if (!b) throw new Error('export button not found');
      (b as HTMLButtonElement).click();
    });
    const start = Date.now();
    let file = '';
    while (Date.now() - start < 90000 && !file && dialogs.length === 0) {
      file = readdirSync(dir).find(f => f.endsWith('.pdf')) ?? '';
      await new Promise(r => setTimeout(r, 500));
    }
    expect(dialogs.join(" | ")).toBe("");
    expect(file).not.toBe('');
    const raw = readFileSync(`${dir}/${file}`).toString('latin1');
    expect(raw.startsWith('%PDF-')).toBe(true);
    expect((raw.match(/\/Subtype \/Image/g) ?? []).length).toBeGreaterThan(0);
    expect(raw).not.toContain('[Step Diagram]');
  }, 150000);
});
