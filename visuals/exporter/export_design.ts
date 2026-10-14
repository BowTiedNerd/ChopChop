/**
 * boardviz export adapter. The PR #1 app has no design-export CLI, so this
 * thin adapter calls the app's OWN library code (copied verbatim from
 * cursor/chopchop-rebuild-a8a8 into ../app) and prints one JSON document:
 *   validateBoard -> refusal is fatal (exit 2, nothing printed on stdout)
 *   generatePattern, calculateRequiredParts, inchText/formatDimension
 *   plus the Board Master catalog (styles/*.json) for steps and allowances.
 * Usage: tsx export_design.ts <preset> [key=value ...]
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
type BoardStyle = string; type BoardDesign = any;

// The real app checkout (git clone of PR #1), never a copy. Override with CHOPCHOP_DIR.
const APP = process.env.CHOPCHOP_DIR || '/workspace/chopchop-ref';
const { createDefaultBoard, create16x24Board, createMetricBoard, STYLE_NAMES } = await import(APP + '/src/lib/defaults.ts');
const { validateBoard, validateAngle } = await import(APP + '/src/lib/validation.ts');
const { generatePattern } = await import(APP + '/src/lib/patterns.ts');
const { calculateRequiredParts } = await import(APP + '/src/lib/lumberPlanner.ts');
const { formatDimension } = await import(APP + '/src/utils/format.ts');
const { execSync } = await import('child_process');
const appHead = execSync('git -C ' + APP + ' rev-parse --short HEAD').toString().trim();

const here = dirname(fileURLToPath(import.meta.url));
const STYLES = Object.keys(STYLE_NAMES) as BoardStyle[];
const [preset, ...sets] = process.argv.slice(2);
function die(msg: string, code = 2): never { process.stderr.write('export refused: ' + msg + '\n'); process.exit(code); }

let design: BoardDesign;
if (preset === 'checkerboard-16x24') design = create16x24Board();
else if (preset === 'metric') design = createMetricBoard();
else if (STYLES.includes(preset as BoardStyle)) { design = createDefaultBoard(); design.style = preset as BoardStyle; }
else die('unknown style/preset ' + JSON.stringify(preset));
design = JSON.parse(JSON.stringify(design));
let angle: number | null = null;
for (const kv of sets) {
  const m = /^([a-zA-Z.]+)=(.+)$/.exec(kv); if (!m) die('bad --set ' + kv);
  const [, k, v] = m;
  if (k === 'angle') { angle = Number(v); continue; }
  const path = k.split('.'); let o: any = design;
  for (const p of path.slice(0, -1)) { if (!(p in o)) die('unknown key ' + k); o = o[p]; }
  const last = path[path.length - 1]; if (!(last in o)) die('unknown key ' + k);
  o[last] = typeof o[last] === 'number' ? Number(v) : typeof o[last] === 'boolean' ? v === 'true' : v;
}
const v = validateBoard(design);
if (angle !== null) { const a = validateAngle(design.style, angle); v.errors.push(...a.errors); v.valid = v.errors.length === 0; }
if (!v.valid) die(v.errors.join('; '));
const catalog = JSON.parse(readFileSync(join(here, 'catalog', design.style + '.json'), 'utf8'));
const pat = generatePattern(design);
const parts = calculateRequiredParts(design);
const u = design.unitSystem;
const f = (mm: number) => formatDimension(mm, u);
const out = {
  exporter: 'boardviz export_design.ts over ChopChop PR#1 src/lib (calcBoard equivalent)',
  appDir: APP, appHead, preset, sets, angle,
  design, styleName: STYLE_NAMES[design.style], validation: v,
  text: { width: f(design.dimensions.width), length: f(design.dimensions.length), thickness: f(design.dimensions.thickness),
          groove: design.juiceGroove.enabled ? { width: f(design.juiceGroove.width), depth: f(design.juiceGroove.depth), fromEdge: f(design.juiceGroove.fromEdge), cornerRadius: f(design.juiceGroove.cornerRadius) } : null,
          feet: design.rubberFeet.enabled ? { diameter: f(design.rubberFeet.diameter), height: f(design.rubberFeet.height), inset: f(design.rubberFeet.inset) } : null },
  pattern: { bounds: pat.bounds, strips: pat.strips.map(s => ({ x: s.x, z: s.z, w: s.width, d: s.depth, h: s.height, species: s.species.name, color: s.species.color, rotation: s.rotation })) },
  cutList: parts.map(p => ({ ...p, text: { width: f(p.width), thickness: f(p.thickness), length: f(p.length) } })),
  catalog: { draft: catalog.draft, displayName: catalog.displayName, angles: catalog.angles, steps: catalog.steps, cutListAllowances: catalog.cutListAllowances, kerfText: f(catalog.cutListAllowances.kerf_mm) },
};
process.stdout.write(JSON.stringify(out, null, 1));
