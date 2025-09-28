import React from 'react';
import { useStore } from '@/state/store';
import { summarize, toCSV } from '@/utils/bom';

export default function BOMPanel() {
  const pages = useStore(s => s.pages);
  const summary = summarize(pages);
  function exportCsv() {
    const csv = toCSV(summary);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'takeoff_summary.csv'; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div>
      <h3 style={{margin:'0 0 .5rem'}}>BOM Summary</h3>
      <div style={{fontSize:12, lineHeight:1.4}}>
        <div><strong>Total Tags:</strong> {summary.totals.tags}</div>
        <div><strong>Total LF:</strong> {summary.totals.lf.toFixed(2)}</div>
        <div style={{marginTop:6}}>
          <div>Segment LF: {summary.lengthsFt.segment.toFixed(2)}</div>
          <div>Polyline LF: {summary.lengthsFt.polyline.toFixed(2)}</div>
          <div>Freeform LF: {summary.lengthsFt.freeform.toFixed(2)}</div>
        </div>
        <div className="sectionTitle">Counts by Code</div>
        <ul style={{margin:0, paddingLeft:'1rem'}}>
          {Object.entries(summary.counts).map(([code,count])=>(
            <li key={code}>{code}: {count}</li>
          ))}
          {Object.keys(summary.counts).length===0 && <li>—</li>}
        </ul>
      </div>
      <button className="btn" style={{marginTop:8}} onClick={exportCsv}>Export CSV</button>
    </div>
  );
}