import React, { useMemo } from 'react';
import { useStore } from '@/state/store';
import { pathLength } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

type Props = { open: boolean; onToggle: () => void; };

type Summary = {
  totalTags: number;
  totalLF: number;
  byType: { segment: number; polyline: number; freeform: number };
  countsByCode: { code: string; count: number }[];
  calibratedPages: number;
  totalPages: number;
};

export default function BomPanel({ open, onToggle }: Props) {
  const { pages } = useStore();

  const data = useMemo<Summary>(() => {
    let totalTags = 0;
    let segLF = 0, plLF = 0, ffLF = 0;
    const counts = new Map<string, number>();
    let calibratedPages = 0;

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot;
      if (ppf && ppf > 0) calibratedPages++;
      for (const obj of (pg.objects ?? [])) {
        if (obj.type === 'count') {
          totalTags += 1;
          const c = (obj as any).code || '';
          counts.set(c, (counts.get(c) ?? 0) + 1);
        } else {
          const verts = (obj as any).vertices ?? [];
          const lenPx = pathLength(verts);
          const lf = ppf && ppf > 0 ? lenPx / ppf : 0;
          if (obj.type === 'segment') segLF += lf;
          else if (obj.type === 'polyline') plLF += lf;
          else if (obj.type === 'freeform') ffLF += lf;
        }
      }
    }

    const countsByCode = Array.from(counts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      totalTags,
      totalLF: segLF + plLF + ffLF,
      byType: { segment: segLF, polyline: plLF, freeform: ffLF },
      countsByCode,
      calibratedPages,
      totalPages: pages.length
    };
  }, [pages]);

  function exportCSV() {
    const rows: string[][] = [];
    rows.push(['Metric', 'Value']);
    rows.push(['Total Tags', String(data.totalTags)]);
    rows.push(['Total LF', data.totalLF.toFixed(2)]);
    rows.push(['Segment LF', data.byType.segment.toFixed(2)]);
    rows.push(['Polyline LF', data.byType.polyline.toFixed(2)]);
    rows.push(['Freeform LF', data.byType.freeform.toFixed(2)]);
    rows.push([]);
    rows.push(['Code', 'Count']);
    for (const row of data.countsByCode) rows.push([row.code, String(row.count)]);
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bom_summary.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 10px', borderBottom:'1px solid #eee', background:'#fff', position:'sticky', top:0, zIndex:1
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button className="btn" title={open ? 'Collapse' : 'Expand'} onClick={onToggle}>
            {open ? '▾' : '▸'}
          </button>
          <div className="label">BOM Summary</div>
        </div>
        <button className="btn" onClick={exportCSV}>Export CSV</button>
      </div>

      {open ? (
        <div style={{padding:'10px', overflow:'auto'}}>
          <div style={{fontSize:13, color:'#555', marginBottom:8}}>
            {data.calibratedPages}/{data.totalPages} page(s) calibrated.
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12}}>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Totals</div>
              <div style={{fontSize:14}}>
                <div><strong>Total Tags:</strong> {data.totalTags}</div>
                <div><strong>Total LF:</strong> {data.totalLF.toFixed(2)}</div>
              </div>
            </div>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Linear Feet</div>
              <div style={{fontSize:14}}>
                <div>Segment: {data.byType.segment.toFixed(2)}</div>
                <div>Polyline: {data.byType.polyline.toFixed(2)}</div>
                <div>Freeform: {data.byType.freeform.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="label" style={{marginBottom:6}}>Counts by Code</div>
            <div style={{maxHeight:300, overflow:'auto'}}>
              {data.countsByCode.length === 0 ? (
                <div style={{color:'#666', fontSize:13}}>No tags yet.</div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                  <thead>
                    <tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}>
                      <th style={{padding:'6px 4px'}}>Code</th>
                      <th style={{padding:'6px 4px'}}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.countsByCode.map(r => (
                      <tr key={r.code} style={{borderBottom:'1px solid #f4f4f4'}}>
                        <td style={{padding:'6px 4px', fontWeight:600}}>{r.code}</td>
                        <td style={{padding:'6px 4px'}}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{padding:'8px', color:'#666', fontSize:12}} />
      )}
    </div>
  );
}
