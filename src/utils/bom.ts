import type { PageState } from '@/types';
import { pathLength } from './geometry';

/* =============================
 *  SHARED HELPERS
 * ============================= */
type Shape = 'count' | 'segment' | 'polyline' | 'freeform';

const norm = (s: any) => String(s ?? '').trim();
const shapeOf = (obj: any): Shape => {
  const t = obj?.type ?? obj?.kind ?? obj?.shape;
  return t === 'count' ? 'count'
       : t === 'segment' ? 'segment'
       : t === 'polyline' ? 'polyline'
       : 'freeform';
};
const computeLengthFt = (obj: any, ppf: number): number => {
  if (shapeOf(obj) === 'count') return 0;
  if (typeof obj?.lengthFt === 'number') return obj.lengthFt;
  if (typeof obj?.lengthFeet === 'number') return obj.lengthFeet;
  const verts = Array.isArray(obj?.vertices) ? obj.vertices : [];
  const pxLen = pathLength(verts);
  return ppf > 0 ? pxLen / ppf : 0;
};

/** =========================
 *  ITEMIZED BOM SUPPORT
 *  ========================= */
export type BomMode = 'itemized' | 'summarized';

export type BomRow = {
  id: string;                       // unique object id (or generated)
  tagCode: string;                  // e.g., "C"
  shape: Shape;
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
      const tagCode = norm((obj as any).code || (obj as any).tagCode).toUpperCase();
      if (!tagCode) continue;

      const shape = shapeOf(obj);

      // Compute length (feet) for non-counts
      let lengthFt: number | undefined = undefined;
      if (shape !== 'count') {
        const stored = (obj as any).lengthFt ?? (obj as any).lengthFeet;
        if (typeof stored === 'number') {
          lengthFt = stored;
        } else {
          lengthFt = computeLengthFt(obj, ppf);
        }
      }

      rows.push({
        id: (obj as any).id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
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
 *  PROFESSIONAL SIDE-PANEL OVERVIEW (grouped)
 *  ========================= */
export type OverviewItem = {
  code: string;
  name?: string;
  count: number; // for 'count' shapes
  lf: number;    // summed LF for measured shapes
};
export type OverviewSection = {
  key: 'lighting' | 'measurements' | 'devices' | 'panels' | 'misc';
  title: string;
  items: OverviewItem[];
  totals: { count: number; lf: number };
};
export type CategorizedOverview = {
  sections: OverviewSection[];
  grandTotals: { count: number; lf: number };
};

const SECTION_ORDER: OverviewSection['key'][] = ['lighting','measurements','devices','panels','misc'];
const TITLES: Record<OverviewSection['key'], string> = {
  lighting: 'Lighting Fixtures',
  measurements: 'Measurements',
  devices: 'Devices',
  panels: 'Panels & Equipment',
  misc: 'Miscellaneous',
};
const bucketFor = (obj: any): OverviewSection['key'] => {
  const s = shapeOf(obj);
  if (s !== 'count') return 'measurements';
  const cat = norm(obj?.category).toLowerCase();
  if (cat.includes('light')) return 'lighting';
  if (
    cat.includes('recept') || cat.includes('outlet') ||
    cat.includes('switch') || cat.includes('data') ||
    cat.includes('comm') || cat.includes('security') || cat.includes('av')
  ) return 'devices';
  if (
    cat.includes('panel') || cat.includes('disconnect') ||
    cat.includes('breaker') || cat.includes('motor') || cat.includes('mms') ||
    cat.includes('gear')
  ) return 'panels';
  return 'misc';
};

export function buildCategorizedOverview(pages: PageState[]): CategorizedOverview {
  type Acc = Record<OverviewSection['key'], Map<string, OverviewItem>>;
  const acc: Acc = {
    lighting: new Map(), measurements: new Map(),
    devices: new Map(), panels: new Map(), misc: new Map()
  };

  for (const p of pages) {
    const ppf = p.pixelsPerFoot ?? 0;
    for (const obj of p.objects ?? []) {
      const code = norm((obj as any).code ?? (obj as any).tagCode).toUpperCase();
      if (!code) continue;
      const bucket = bucketFor(obj);
      const map = acc[bucket];

      const item = map.get(code) || { code, name: norm((obj as any).tagName ?? (obj as any).name), count: 0, lf: 0 };
      if (shapeOf(obj) === 'count') item.count += 1;
      else item.lf += computeLengthFt(obj, ppf);
      map.set(code, item);
    }
  }

  const sections: OverviewSection[] = SECTION_ORDER.map(key => {
    const items = Array.from(acc[key].values()).sort((a, b) => a.code.localeCompare(b.code));
    const totals = items.reduce((t, it) => ({ count: t.count + it.count, lf: t.lf + it.lf }), { count: 0, lf: 0 });
    return { key, title: TITLES[key], items, totals };
  });

  const grandTotals = sections.reduce((t, s) => ({ count: t.count + s.totals.count, lf: t.lf + s.totals.lf }), { count: 0, lf: 0 });
  return { sections, grandTotals };
}

export function overviewToCSV(ov: CategorizedOverview): string {
  const lines: string[] = [];
  lines.push('Section,Code,Name,Count,LinearFeet');
  for (const sec of ov.sections) {
    if (!sec.items.length) continue;
    lines.push(`${sec.title},,,${sec.totals.count},${sec.totals.lf.toFixed(2)}`);
    for (const it of sec.items) {
      lines.push([sec.title, it.code, it.name ?? '', it.count, it.lf ? it.lf.toFixed(2) : ''].join(','));
    }
  }
  lines.push(['Grand Totals','','',ov.grandTotals.count,ov.grandTotals.lf.toFixed(2)].join(','));
  return lines.join('\n');
}

/** =========================
 *  ORIGINAL SUMMARY (kept; uses same math)
 *  ========================= */
export type Summary = {
  counts: Record<string, number>;
  lengthsFt: { segment: number; polyline: number; freeform: number; };
  totals: { tags: number; lf: number; }
};

export function summarize(pages: PageState[]): Summary {
  const grouped = buildBOMRows(pages, 'summarized');

  const counts: Record<string, number> = {};
  const lengthsFt = { segment: 0, polyline: 0, freeform: 0 };

  for (const g of grouped) {
    if (g.shape === 'count') {
      counts[g.tagCode] = (counts[g.tagCode] || 0) + g.qty;
    } else {
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

/** Roll-up CSV (back-compat). */
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