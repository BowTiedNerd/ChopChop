/** Board QA: styles/ is exactly what styles/gen.py generates (no hand edits, no stale gen.py). */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, copyFileSync, readdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('styles/gen.py regenerates styles/ byte for byte', () => {
  it('no diff', () => {
    const dir = mkdtempSync(join(tmpdir(), 'catgen-'));
    copyFileSync('styles/gen.py', join(dir, 'gen.py'));
    execFileSync('python3', ['gen.py'], { cwd: dir });
    const gen = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    const have = readdirSync('styles').filter(f => f.endsWith('.json')).sort();
    expect(gen).toEqual(have);
    for (const f of gen) expect(readFileSync(join(dir, f)).equals(readFileSync(join('styles', f))), f).toBe(true);
  });
});
