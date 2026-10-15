/** Every sample design (plus edge-case fixtures) for export-side arithmetic tests. */
import { createDefaultBoard, create16x24Board, createMetricBoard } from './defaults';
import { BoardDesign } from '../types';

export function sampleDesigns(): Array<[string, BoardDesign]> {
  const out: Array<[string, BoardDesign]> = [];
  const mk = (name: string, f: (d: BoardDesign) => void) => { const d = structuredClone(createDefaultBoard()); f(d); out.push([name, d]); };
  mk('checkerboard-default', () => {});
  out.push(['checkerboard-16x24', structuredClone(create16x24Board())]);
  for (const s of ['end-grain', 'chevron', 'brick-basketweave', 'herringbone', 'scrap-chaotic', 'tumbling-block-3d', 'edge-grain', 'face-grain', 'stripe-inlay']) {
    mk(s, d => {
      d.style = s as BoardDesign['style'];
      if (s === 'tumbling-block-3d') d.species = [{ name: 'Maple', color: '#F5E6D3' }, { name: 'Cherry', color: '#C04000' }, { name: 'Walnut', color: '#654321' }];
    });
  }
  // Blank-limit fixture: an end-grain board 450.8 mm long, 39.85 mm thick gives a 914.45 mm panel if the planner used
  // 915 instead of the catalog's 914.4 (18 slices x (44.85 + 3.175) + 50)
  mk('blank-limit-914.4', d => { d.style = 'end-grain'; d.dimensions.length = 450.8; d.dimensions.thickness = 39.85; });
  mk('planer-margin', d => { d.style = 'edge-grain'; d.dimensions = { length: 457.2, width: 301.625, thickness: 38.1 }; });
  out.push(['hand-hole', handHoleDesign()]);
  out.push(['features-combined', featuresCombinedDesign()]);
  out.push(['metric', metricDesign()]);
  return out;
}

/** Tumbling block needs light/mid/dark (catalog minSpecies 3): give a 2-species test design a third tone. */
export function withTones<T extends BoardDesign>(d: T): T {
  if (d.style !== 'tumbling-block-3d' || d.species.length >= 3) return d;
  const extra = [{ name: 'Maple', color: '#F5E6D3' }, { name: 'Cherry', color: '#C04000' }, { name: 'Walnut', color: '#654321' }]
    .filter(s => !d.species.some(x => x.name === s.name));
  return { ...d, species: [...d.species, ...extra].slice(0, 3) };
}

/** hand-hole.pdf: default inch checkerboard with hand-hole handles. */
export function handHoleDesign(): BoardDesign {
  const d = structuredClone(createDefaultBoard());
  d.handles = { enabled: true, type: 'hand-hole' };
  // inch juice groove and default rubber feet shown on the same sheet
  d.juiceGroove.enabled = true;
  d.rubberFeet.enabled = true;
  return d;
}

/** features-combined.pdf: metric edge-grain with juice groove, rubber feet and handles. */
export function featuresCombinedDesign(): BoardDesign {
  const d = structuredClone(createDefaultBoard());
  d.style = 'edge-grain';
  d.dimensions = { length: 450, width: 300, thickness: 38 };
  d.juiceGroove = { enabled: true, width: 10, depth: 8, fromEdge: 20, cornerRadius: 25.4 };
  d.rubberFeet = { enabled: true, diameter: 25.4, height: 9.5, inset: 25.4 };
  d.handles = { enabled: true, type: 'handle' };
  d.unitSystem = 'metric';
  return d;
}

/** metric.pdf: the metric default board with juice groove and rubber feet (same design generate-samples prints). */
export function metricDesign(): BoardDesign {
  const d = structuredClone(createMetricBoard());
  d.juiceGroove.enabled = true;
  d.rubberFeet.enabled = true;
  return d;
}
