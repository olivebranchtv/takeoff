import type { PageState } from '@/types';
import { pathLength } from './geometry';

/** =========================
 *  ITEMIZED BOM SUPPORT
 *  ========================= */
export type BomMode = 'itemized' | 'summarized';

export type BomRow = {
  id: string;                       // unique object id (or generated)
  tagCode: string;                  // e.g., "C"
  shape: 'count' | 'segment' | 'polyline' | 'freeform';
  qty: number;                      // itemized = 1
  lengthFt?: number;                // for non-count shapes
  pageIndex: number;                // source page
  index?: number;                   // sequence per tagCode (1..n) when itemized
  // optional enrichments if your objects include them
  tagName?: string;
  category?: string;
  note?: string;
};

/**
 * Build BOM rows from page objects.
 * - 'itemized': every object = its own row (qty = 1)
 * - 'summarized': groups by tagCode + shape, sums qty and lengthFt
 */
export function buildBOMRows(pages: PageState[], mode: BomMode = 'itemized'): BomRow[] {
  const rows: BomRow[] = [];

  for (const p of pages) {
    const ppf = p.pixelsPerFoot ?? 0;
    for (const obj of p.objects ?? []) {
      const tagCode = String((obj as any).code || (obj as any).tagCode || '').toUpperCase();
      if (!tagCode) continue;

      // Normalize shape
      const t = (obj as any).type || (obj as any).kind || (obj as any).shape;
      const shape: BomRow['shape'] =
        t === 'count' ? 'count' :
        t === 'segment' ? 'segment' :
        t === 'polyline' ? 'polyline' :
        'freeform';

      // Compute length (feet) for non-counts
      let lengthFt: number | undefined = undefined;
      if (shape !== 'count') {
        // prefer stored length if present, else compute from vertices
        const stored = (obj as any).lengthFt ?? (obj as any).lengthFeet;
        if (typeof stored === 'number') {
          lengthFt = stored;
        } else {
          const verts = (obj as any).vertices || [];
          const pxLen = Array.isArray(verts) ? pathLength(verts) : 0;
          lengthFt = ppf > 0 ? pxLen / ppf : 0;
        }
      }

      rows.push({
        id: (obj as any).id || crypto.randomUUID(),
        tagCode,
        shape,
        qty: 1,
        lengthFt: shape === 'count' ? undefined : (lengthFt ?? 0),
        pageIndex: p.pageIndex,
        tagName: (obj as any).tagName,
        category: (obj as any).category,
        note: (obj as any).note ?? (obj as any).comment,
      });
    }
  }

  if (mode === 'itemized') {
    // Add sequence numbers per tagCode so five C measurements become C-1..C-5
    const seq: Record<string, number> = {};
    return rows.map(r => ({ ...r, index: (seq[r.tagCode] = (seq[r.tagCode] || 0) + 1) }));
  }

  // summarized
  const key = (r: BomRow) => `${r.tagCode}::${r.shape}`;
  const grouped = new Map<string, BomRow>();
  for (const r of rows) {
    const k = key(r);
    const g = grouped.get(k);
    if (!g) {
      grouped.set(k, { ...r, qty: 1, lengthFt: r.lengthFt ?? (r.shape === 'count' ? undefined : 0), index: undefined, pageIndex: -1 });
    } else {
      g.qty += 1;
      if (typeof r.lengthFt === 'number') g.lengthFt = (g.lengthFt ?? 0) + r.lengthFt;
    }
  }
  return Array.from(grouped.values());
}

/** CSV export for the itemized BOM (each object = one row). */
export function toCSVItemized(rows: BomRow[]): string {
  const header = ['Tag','Index','Shape','Qty','LengthFt','Page','Name','Category','Note'];
  const body = rows.map(r => [
    r.tagCode,
    r.index ?? '',
    r.shape,
    r.qty,
    (typeof r.lengthFt === 'number' ? r.lengthFt.toFixed(2) : ''),
    r.pageIndex,
    r.tagName ?? '',
    r.category ?? '',
    (r.note ?? '').toString().replace(/\n/g, ' ').trim(),
  ]);
  return [header, ...body].map(cols => cols.join(',')).join('\n');
}

/** =========================
 *  YOUR ORIGINAL SUMMARY (kept)
 *  ========================= */
export type Summary = {
  counts: Record<string, number>;
  lengthsFt: { segment: number; polyline: number; freeform: number; };
  totals: { tags: number; lf: number; }
};

export function summarize(pages: PageState[]): Summary {
  // Use summarized BOM rows so we stay consistent with length math above
  const grouped = buildBOMRows(pages, 'summarized');

  const counts: Record<string, number> = {};
  const lengthsFt = { segment: 0, polyline: 0, freeform: 0 as number };

  for (const g of grouped) {
    if (g.shape === 'count') {
      counts[g.tagCode] = (counts[g.tagCode] || 0) + g.qty;
    } else {
      // sum LF by shape
      const add = g.lengthFt ?? 0;
      if (g.shape === 'segment') lengthsFt.segment += add;
      if (g.shape === 'polyline') lengthsFt.polyline += add;
      if (g.shape === 'freeform') lengthsFt.freeform += add;
    }
  }

  const tags = Object.values(counts).reduce((a,b)=>a+b,0);
  const lf = lengthsFt.segment + lengthsFt.polyline + lengthsFt.freeform;
  return { counts, lengthsFt, totals: { tags, lf } };
}

/** Kept for backward compatibility: CSV for the roll-up summary. */
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
