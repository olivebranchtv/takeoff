import type { PageState, MeasureOptions } from '@/types';
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
  lengthFt?: number;                // raw geometry LF for non-count shapes
  pageIndex: number;                // source page
  index?: number;                   // sequence per tagCode (1..n) when itemized

  // optional enrichments if your objects include them
  tagName?: string;
  category?: string;
  note?: string;

  // ===== NEW: raceway/enrichment computed from object.measure =====
  /** EMT conduit size */
  emtSize?: string;
  /** number of vertices/points on the run (for segment/polyline/freeform) */
  points?: number;
  /** LF including extra footage per point (raceway) */
  racewayLf?: number;
  /** Total conductor LF across all groups */
  conductorLfTotal?: number;
  /** Sum of boxes (boxesPerPoint * points) */
  boxes?: number;
  /** Up to 3 conductor groups (count + size + insulation + material + construction) copied from measure */
  conductors?: Array<{ count: number; size: string; insulation: string; material: string; construction: string }>;
};

/** Helper: compute lineal feet from vertices using page calibration. */
function lfFromVertices(ppf: number | undefined, vertices: Array<{x:number;y:number}> | undefined): number {
  const pxLen = Array.isArray(vertices) ? pathLength(vertices) : 0;
  return ppf && ppf > 0 ? pxLen / ppf : 0;
}

/** Compute enrichment from measure + geometry. */
function computeRacewayStats(
  obj: any,
  ppf: number | undefined
): Pick<BomRow, 'lengthFt' | 'emtSize' | 'points' | 'racewayLf' | 'conductorLfTotal' | 'boxes' | 'conductors'> {
  const type = obj?.type;
  if (type === 'count') {
    return { lengthFt: undefined, emtSize: undefined, points: undefined, racewayLf: undefined, conductorLfTotal: undefined, boxes: undefined, conductors: undefined };
  }

  const vertices = (obj?.vertices ?? []) as Array<{x:number;y:number}>;
  const points = Array.isArray(vertices) ? vertices.length : 0;
  const lengthFt = lfFromVertices(ppf, vertices);

  const m: MeasureOptions | undefined = obj?.measure;
  if (!m) {
    // No measure block: keep legacy LF only
    return {
      lengthFt,
      emtSize: undefined,
      points,
      racewayLf: lengthFt,
      conductorLfTotal: 0,
      boxes: 0,
      conductors: undefined,
    };
  }

  const extraRaceway = Number(m.extraRacewayPerPoint || 0);
  const extraConductor = Number(m.extraConductorPerPoint || 0);
  const boxesPerPoint = Number(m.boxesPerPoint || 0);

  const racewayLf = lengthFt + extraRaceway * points;
  const emtSize = m.emtSize || '';

  // conductor groups (up to 3) with full details
  const conductors = (m.conductors ?? [])
    .slice(0, 3)
    .map(g => {
      // Migrate old format to new format
      let insulation = String(g.insulation || 'THHN');
      let material = String(g.material || 'Copper');
      let construction = String((g as any).construction || 'Str');

      // Migrate insulation: "THHN/THWN-2" → "THHN"
      if (insulation.includes('/') || insulation.includes('-')) {
        insulation = insulation.split('/')[0].replace(/-\d+$/, '');
      }
      // Migrate material: "CU" → "Copper", "AL" → "Aluminum"
      if (material === 'CU') material = 'Copper';
      if (material === 'AL') material = 'Aluminum';

      return {
        count: Number(g.count || 0),
        size: String(g.size || ''),
        insulation,
        material,
        construction
      };
    });

  // total conductor LF = sum over groups (count × (racewayLf + extraConductorPerPoint × points))
  let conductorLfTotal = 0;
  for (const g of conductors) {
    if (g.count > 0) conductorLfTotal += g.count * (racewayLf + extraConductor * points);
  }

  const boxes = boxesPerPoint * points;

  return { lengthFt, emtSize, points, racewayLf, conductorLfTotal, boxes, conductors };
}

/**
 * Build BOM rows from page objects.
 * - 'itemized': every object = its own row (qty = 1)
 * - 'summarized': groups by tagCode + shape, sums qty and lengthFt
 *
 * NOTE: This function remains backward-compatible. It now adds optional
 * raceway/conductor fields if the object had a .measure block.
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

      // Compute geometry length and raceway/conductor enrichment
      let lengthFt: number | undefined = undefined;
      let emtSize: string | undefined = undefined;
      let points: number | undefined = undefined;
      let racewayLf: number | undefined = undefined;
      let conductorLfTotal: number | undefined = undefined;
      let boxes: number | undefined = undefined;
      let conductors: BomRow['conductors'] = undefined;

      if (shape !== 'count') {
        // prefer stored length if present, else compute from vertices
        const stored = (obj as any).lengthFt ?? (obj as any).lengthFeet;
        if (typeof stored === 'number') {
          lengthFt = stored;
          // Still compute enrichment relative to stored length
          const vtx = (obj as any).vertices || [];
          const pts = Array.isArray(vtx) ? vtx.length : 0;
          points = pts;

          const m = (obj as any).measure as MeasureOptions | undefined;
          if (m) {
            emtSize = m.emtSize || '';
            const extraRaceway = Number(m.extraRacewayPerPoint || 0);
            const extraConductor = Number(m.extraConductorPerPoint || 0);
            const boxesPerPoint = Number(m.boxesPerPoint || 0);

            racewayLf = lengthFt + extraRaceway * pts;

            const mGroups = (m.conductors ?? []).slice(0, 3).map(g => {
              // Migrate old format to new format
              let insulation = String(g.insulation || 'THHN');
              let material = String(g.material || 'Copper');
              let construction = String((g as any).construction || 'Str');

              // Migrate insulation: "THHN/THWN-2" → "THHN"
              if (insulation.includes('/') || insulation.includes('-')) {
                insulation = insulation.split('/')[0].replace(/-\d+$/, '');
              }
              // Migrate material: "CU" → "Copper", "AL" → "Aluminum"
              if (material === 'CU') material = 'Copper';
              if (material === 'AL') material = 'Aluminum';

              return {
                count: Number(g.count || 0),
                size: String(g.size || ''),
                insulation,
                material,
                construction
              };
            });
            conductors = mGroups;

            let cTotal = 0;
            for (const g of mGroups) if (g.count > 0) cTotal += g.count * (racewayLf + extraConductor * pts);
            conductorLfTotal = cTotal;

            boxes = boxesPerPoint * pts;
          } else {
            racewayLf = lengthFt;
            conductorLfTotal = 0;
            boxes = 0;
          }
        } else {
          const calc = computeRacewayStats(obj, ppf);
          lengthFt = calc.lengthFt;
          emtSize = calc.emtSize;
          points = calc.points;
          racewayLf = calc.racewayLf;
          conductorLfTotal = calc.conductorLfTotal;
          boxes = calc.boxes;
          conductors = calc.conductors;
        }
      }

      const row = {
        id: (obj as any).id || crypto.randomUUID(),
        tagCode,
        shape,
        qty: 1,
        lengthFt: shape === 'count' ? undefined : (lengthFt ?? 0),
        pageIndex: p.pageIndex,
        tagName: (obj as any).tagName,
        category: (obj as any).category,
        note: (obj as any).note ?? (obj as any).comment,

        // new fields
        emtSize: shape === 'count' ? undefined : emtSize,
        points,
        racewayLf: shape === 'count' ? undefined : racewayLf,
        conductorLfTotal: shape === 'count' ? undefined : conductorLfTotal,
        boxes: shape === 'count' ? undefined : boxes,
        conductors,
      };

      if (shape !== 'count' && conductors && conductors.length > 0) {
        console.log(`📋 BOM Row [${tagCode}]: EMT=${emtSize}, racewayLf=${racewayLf}, conductors=`, conductors);
      }

      rows.push(row);
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
      grouped.set(k, {
        ...r,
        qty: 1,
        index: undefined,
        pageIndex: -1,
        // ensure numeric fields are seeded
        lengthFt: r.shape === 'count' ? undefined : (r.lengthFt ?? 0),
        racewayLf: r.shape === 'count' ? undefined : (r.racewayLf ?? 0),
        conductorLfTotal: r.shape === 'count' ? undefined : (r.conductorLfTotal ?? 0),
        boxes: r.shape === 'count' ? undefined : (r.boxes ?? 0),
        // conductors cannot be meaningfully "summed" as arrays; omit in summary
        conductors: undefined,
      });
    } else {
      g.qty += 1;
      if (g.shape !== 'count') {
        if (typeof r.lengthFt === 'number') g.lengthFt = (g.lengthFt ?? 0) + r.lengthFt;
        if (typeof r.racewayLf === 'number') g.racewayLf = (g.racewayLf ?? 0) + r.racewayLf;
        if (typeof r.conductorLfTotal === 'number') g.conductorLfTotal = (g.conductorLfTotal ?? 0) + r.conductorLfTotal;
        if (typeof r.boxes === 'number') g.boxes = (g.boxes ?? 0) + r.boxes;
      }
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
      // sum LF by shape (use racewayLf if present, else fall back to lengthFt)
      const add = (typeof g.racewayLf === 'number' ? g.racewayLf : (g.lengthFt ?? 0));
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

/* ============================================================
 * NEW: CSVs that include raceway / conductor enrichment
 * ============================================================ */

/** Itemized CSV including raceway/conductor fields. */
export function toCSVItemizedWithRaceway(rows: BomRow[]): string {
  const header = [
    'Tag','Index','Shape','Qty','GeomLF','RacewayLF','ConductorLF','Boxes','Points',
    'Cond1Count','Cond1Size','Cond2Count','Cond2Size','Cond3Count','Cond3Size',
    'Page','Name','Category','Note'
  ];
  const body = rows.map(r => {
    const c = r.conductors ?? [];
    const c1 = c[0] ?? {count:0,size:''};
    const c2 = c[1] ?? {count:0,size:''};
    const c3 = c[2] ?? {count:0,size:''};
    return [
      r.tagCode,
      r.index ?? '',
      r.shape,
      r.qty,
      (typeof r.lengthFt === 'number' ? r.lengthFt.toFixed(2) : ''),
      (typeof r.racewayLf === 'number' ? r.racewayLf.toFixed(2) : ''),
      (typeof r.conductorLfTotal === 'number' ? r.conductorLfTotal.toFixed(2) : ''),
      (typeof r.boxes === 'number' ? r.boxes : ''),
      (typeof r.points === 'number' ? r.points : ''),
      c1.count || '',
      c1.size || '',
      c2.count || '',
      c2.size || '',
      c3.count || '',
      c3.size || '',
      r.pageIndex,
      r.tagName ?? '',
      r.category ?? '',
      (r.note ?? '').toString().replace(/\n/g, ' ').trim(),
    ];
  });
  return [header, ...body].map(cols => cols.join(',')).join('\n');
}

/** Summarized CSV including raceway/conductor totals. */
export function toCSVSummarizedWithRaceway(rows: BomRow[]): string {
  const header = ['Tag','Shape','Qty','GeomLF','RacewayLF','ConductorLF','Boxes','Name','Category'];
  const body = rows.map(r => [
    r.tagCode, r.shape, r.qty,
    (typeof r.lengthFt === 'number' ? r.lengthFt.toFixed(2) : ''),
    (typeof r.racewayLf === 'number' ? r.racewayLf.toFixed(2) : ''),
    (typeof r.conductorLfTotal === 'number' ? r.conductorLfTotal.toFixed(2) : ''),
    (typeof r.boxes === 'number' ? r.boxes : ''),
    r.tagName ?? '',
    r.category ?? '',
  ]);
  return [header, ...body].map(cols => cols.join(',')).join('\n');
}

/** Optional helper to filter a fixtures-only CSV for vendors.
 *  You can pass a tagLookup (code -> category) built from your tag DB to ensure
 *  we only include lighting counts. If no lookup is provided, we include all counts.
 */
export function toCSVFixturesOnly(
  rows: BomRow[],
  tagLookup?: (code: string) => string | undefined
): string {
  const onlyCounts = rows.filter(r => r.shape === 'count').filter(r => {
    if (!tagLookup) return true;
    const cat = (tagLookup(r.tagCode) || '').toLowerCase();
    return cat.includes('light'); // treat categories containing 'light' as fixtures
  });

  const header = ['Tag','Index','Qty','Page','Name','Category','Note'];
  const body = onlyCounts.map(r => [
    r.tagCode,
    r.index ?? '',
    r.qty,
    r.pageIndex,
    r.tagName ?? '',
    r.category ?? (tagLookup ? (tagLookup(r.tagCode) || '') : ''),
    (r.note ?? '').toString().replace(/\n/g, ' ').trim(),
  ]);
  return [header, ...body].map(cols => cols.join(',')).join('\n');
}
