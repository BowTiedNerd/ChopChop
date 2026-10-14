/**
 * Browser PDF export: fetch the step SVGs, rasterize them to 300 dpi PNG on a canvas,
 * then build the PDF with the same PdfGenerator the CLI uses.
 */
import { jsPDF } from 'jspdf';
import { BoardDesign } from '../types';
import { PdfGenerator, setSvgRasterizer, FIGURE_DPI } from './pdf';
import { calculateRequiredParts } from './lumberPlanner';
import { loadStyleCatalog } from './catalogLoader';
import { CatalogStyleName } from '../types/catalog';

// URLs of every step figure, emitted by vite (dev and production build); fetched on export
const figureUrls = import.meta.glob('../../visuals/steps/*/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

function svgSize(svg: string): { w: number; h: number } {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const w = parseFloat(root.match(/\bwidth="([\d.]+)/)?.[1] ?? '');
  const h = parseFloat(root.match(/\bheight="([\d.]+)/)?.[1] ?? '');
  if (!w || !h) throw new Error('Step figure SVG has no width/height');
  return { w, h };
}

async function rasterize(svg: string): Promise<Uint8Array> {
  const { w, h } = svgSize(svg);
  const scale = FIGURE_DPI / 96;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load step figure SVG into an image'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function buildPdfInBrowser(design: BoardDesign): Promise<jsPDF> {
  const steps = loadStyleCatalog(design.style as CatalogStyleName).steps.filter(s => s.figureType);
  const figures: Record<string, string> = {};
  const pngs = new Map<string, Uint8Array>();
  for (const step of steps) {
    const key = `../../visuals/steps/${design.style}/${step.stepId}.svg`;
    const url = figureUrls[key];
    if (!url) throw new Error(`Missing required figure: visuals/steps/${design.style}/${step.stepId}.svg`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetching ${url} failed: HTTP ${res.status}`);
    const svg = await res.text();
    figures[step.stepId] = svg;
    pngs.set(svg, await rasterize(svg));
  }
  // Pass 1 collects the figures the generator draws itself (cut list, top view) so they can be
  // rasterized asynchronously too; pass 2 builds the real PDF with every PNG ready.
  const cutList = calculateRequiredParts(design);
  const pending: string[] = [];
  const onePx = await rasterize('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
  setSvgRasterizer(svg => {
    if (!pngs.has(svg)) pending.push(svg);
    return pngs.get(svg) ?? onePx;
  });
  try {
    new PdfGenerator(design, figures).generateCutSheet(cutList);
  } finally {
    setSvgRasterizer(null);
  }
  for (const svg of pending) pngs.set(svg, await rasterize(svg));
  setSvgRasterizer(svg => {
    const png = pngs.get(svg);
    if (!png) throw new Error('Figure was not pre-rasterized');
    return png;
  });
  try {
    return new PdfGenerator(design, figures).generateCutSheet(cutList);
  } finally {
    setSvgRasterizer(null);
  }
}
