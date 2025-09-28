import type { PageState } from '@/types';
import { pathLength } from './geometry';

export type Summary = {
  counts: Record<string, number>;
  lengthsFt: { segment: number; polyline: number; freeform: number; };
  totals: { tags: number; lf: number; }
};
export function summarize(pages: PageState[]): Summary {
  const counts: Record<string, number> = {};
  const lengthsFt = { segment: 0, polyline: 0, freeform: 0 };
  for (const p of pages) {
    const ppf = p.pixelsPerFoot ?? 0;
    for (const obj of p.objects) {
      if (obj.type === 'count') {
        counts[obj.code] = (counts[obj.code] || 0) + 1;
      } else {
        const pxLen = pathLength(obj.vertices);
        const ft = ppf > 0 ? (pxLen / ppf) : 0;
        if (obj.type === 'segment') lengthsFt.segment += ft;
        if (obj.type === 'polyline') lengthsFt.polyline += ft;
        if (obj.type === 'freeform') lengthsFt.freeform += ft;
      }
    }
  }
  const tags = Object.values(counts).reduce((a,b)=>a+b,0);
  const lf = lengthsFt.segment + lengthsFt.polyline + lengthsFt.freeform;
  return { counts, lengthsFt, totals: { tags, lf } };
}
export function toCSV(summary: Summary): string {
  const rows: string[] = [];
  rows.push('Category,Key,Value');
  rows.push(`Totals,Tags,${summary.totals.tags}`);
  rows.push(`Totals,LinearFeet,${summary.totals.lf.toFixed(2)}`);
  rows.push(`Lengths,SegmentLF,${summary.lengthsFt.segment.toFixed(2)}`);
  rows.push(`Lengths,PolylineLF,${summary.lengthsFt.polyline.toFixed(2)}`);
  rows.push(`Lengths,FreeformLF,${summary.lengthsFt.freeform.toFixed(2)}`);
  rows.push('Counts,Code,Count');
  for (const [code, count] of Object.entries(summary.counts)) rows.push(`Counts,${code},${count}`);
  return rows.join('\n');
}