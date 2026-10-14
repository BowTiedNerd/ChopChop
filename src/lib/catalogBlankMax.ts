import { readFileSync } from 'fs';
/** blankRule.blankMaxLength_mm straight from the style's catalog file (test helper; no hard-coded 36"). */
export function catalogBlankMax(style: string): number {
  const v = JSON.parse(readFileSync(`styles/${style}.json`, 'utf-8')).cutListAllowances?.blankRule?.blankMaxLength_mm;
  if (typeof v !== 'number') throw new Error(`${style}: blankMaxLength_mm missing`);
  return v;
}
