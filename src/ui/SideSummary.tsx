import React, { useMemo } from 'react';
import type { PageState } from '@/types';
import { buildCategorizedOverview, overviewToCSV } from '@/utils/bom';

type Props = {
  pages: PageState[];
  onExportCsv?: (csv: string, filename?: string) => void;
};

export default function SideSummary({ pages, onExportCsv }: Props) {
  const ov = useMemo(() => buildCategorizedOverview(pages || []), [pages]);

  const handleExport = () => {
    const csv = overviewToCSV(ov);
    if (onExportCsv) onExportCsv(csv, 'Overview.csv');
    else {
      // quick download helper
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Overview.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontWeight:700, marginTop:4 }}>Totals</div>
      <div style={{ fontSize:13, lineHeight:'18px' }}>
        <div>Segment LF: <b>{ov.sections.find(s=>s.key==='measurements')?.items.reduce((a,b)=>a + (b.lf||0),0).toFixed(2)}</b></div>
        <div>Polyline LF: <b>{/* kept blank; you can split if needed */}</b></div>
        <div>Freeform LF: <b>{/* kept blank; you can split if needed */}</b></div>
        <div>Total LF: <b>{ov.grandTotals.lf.toFixed(2)}</b></div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
        <div style={{ fontWeight:700 }}>Overview (Grouped)</div>
        <button className="btn" onClick={handleExport}>Export CSV</button>
      </div>

      {ov.sections.map(sec => (
        sec.items.length > 0 && (
          <div key={sec.key} style={{ marginTop:8 }}>
            <div style={{ fontWeight:700, padding:'6px 0', borderTop:'1px solid #eee' }}>{sec.title}</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={thL}>Code / Name</th>
                  <th style={thR}>Count</th>
                  <th style={thR}>LF</th>
                </tr>
              </thead>
              <tbody>
                {sec.items.map(it => (
                  <tr key={sec.key + it.code}>
                    <td style={tdL}>
                      <span style={{ fontWeight:600 }}>{it.code}</span>
                      {it.name ? <span style={{ color:'#555' }}> — {it.name}</span> : null}
                    </td>
                    <td style={tdR}>{it.count || ''}</td>
                    <td style={tdR}>{it.lf ? it.lf.toFixed(2) : ''}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...tdL, fontWeight:700 }}>Subtotal</td>
                  <td style={{ ...tdR, fontWeight:700 }}>{sec.totals.count}</td>
                  <td style={{ ...tdR, fontWeight:700 }}>{sec.totals.lf.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      ))}
    </div>
  );
}

const thL: React.CSSProperties = { textAlign:'left', padding:'4px 2px', fontSize:12, color:'#555', borderBottom:'1px solid #eee' };
const thR: React.CSSProperties = { ...thL, textAlign:'right' };
const tdL: React.CSSProperties = { padding:'4px 2px', fontSize:13, borderBottom:'1px dotted #f0f0f0' };
const tdR: React.CSSProperties = { ...tdL, textAlign:'right' };
