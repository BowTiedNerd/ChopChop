/** Node-only SVG -> PNG rasterizer for PDF figures (jsPDF cannot addImage SVG). */
import { Resvg } from '@resvg/resvg-js';
import { setSvgRasterizer } from './pdf';

setSvgRasterizer((svg: string, widthPx: number) => {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(widthPx) }, background: 'white', font: { loadSystemFonts: true } });
  return r.render().asPng();
});
