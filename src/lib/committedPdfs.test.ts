/** Reads the COMMITTED sample PDFs with pdftotext (what a woodworker actually sees). */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';

const text = (name: string) => execFileSync('pdftotext', ['-layout', `samples/${name}.pdf`, '-'], { encoding: 'utf-8' });
const flat = (name: string) => text(name).replace(/\s+/g, ' ');

describe('Committed PDFs: crosscut step prints the computed slice size (draft5h)', () => {
  it('end-grain and default checkerboard: 38.1 mm + 5 mm = 1-11/16" (43 mm)', () => {
    for (const n of ['end-grain', 'checkerboard-default']) {
      expect(flat(n), n).toContain('Slice size: 1-11/16" (43 mm)');
    }
  });
  it('metric: sheet units first, 40 mm + 5 mm = 45 mm (1-3/4")', () => {
    expect(flat('metric')).toContain('Slice size: 45 mm (1-3/4")');
  });
});
