/** Test helper: shown text of an uncompressed jsPDF document (Tj operators), unescaped. */
export function pdfShownText(raw: string): string {
  const out: string[] = [];
  for (const line of raw.split('\n')) {
    if (!line.endsWith('Tj') || line.length > 4000) continue;
    const m = /(?:^|\s)\((.*)\)\s*Tj$/.exec(line);
    if (m) out.push(m[1].replace(/\\(.)/g, '$1'));
  }
  return out.join(' ');
}
