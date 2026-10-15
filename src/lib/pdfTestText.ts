/** Test helper: shown text of a jsPDF document (Tj operators), unescaped. Inflates compressed streams. */
import { inflateSync } from 'zlib';

export function pdfContent(raw: string): string {
  const parts: string[] = [raw];
  const re = /\/FlateDecode[^]*?stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) break;
    const dictStart = raw.lastIndexOf('obj', m.index);
    if (raw.slice(dictStart, m.index).includes('/Image')) { re.lastIndex = end; continue; }
    try {
      parts.push(inflateSync(Buffer.from(raw.slice(start, end), 'latin1')).toString('latin1'));
    } catch (e) {
      throw new Error(`could not inflate PDF stream at ${start}: ${String(e)}`);
    }
    re.lastIndex = end;
  }
  return parts.join('\n');
}

export function pdfShownText(raw: string): string {
  const out: string[] = [];
  for (const line of pdfContent(raw).split('\n')) {
    if (!line.endsWith('Tj') || line.length > 4000) continue;
    const m = /(?:^|\s)\((.*)\)\s*Tj$/.exec(line);
    if (m) out.push(m[1].replace(/\\(.)/g, '$1'));
  }
  return out.join(' ');
}
