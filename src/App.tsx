import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { ProjectSave, AnyTakeoffObject } from '@/types';
import { pathLength } from '@/utils/geometry';

/* -------------------------------------------------------
   Inline BOM PANEL (no import needed)
------------------------------------------------------- */
type BomProps = { open: boolean; onToggle: () => void };
type BomSummary = {
  totalTags: number;
  totalLF: number;
  byType: { segment: number; polyline: number; freeform: number };
  countsByCode: { code: string; count: number }[];
  calibratedPages: number;
  totalPages: number;
};

function BomPanel({ open, onToggle }: BomProps) {
  const { pages } = useStore();

  const data: BomSummary = React.useMemo(() => {
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
          const verts = (obj as AnyTakeoffObject).vertices ?? [];
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

/* -------------------------------------------------------
   App
------------------------------------------------------- */
export default function App() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<Awaited<ReturnType<typeof loadPdf>> | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(true); // collapsible BOM

  const {
    tool, setTool, zoom, setZoom, fileName, setFileName, setPages,
    currentTag, setCurrentTag, activePage, setActivePage, pageCount, setPageCount,
    pageLabels, setPageLabels, tags
  } = useStore();

  const openFile = useCallback(async (file: File) => {
    const doc = await loadPdf(file);
    setPdf(doc);
    setFileName(file.name);
    setPages([]);
    setPageCount(doc.numPages);

    let labels: string[] = [];
    try {
      // @ts-ignore
      const raw = await (doc as any).getPageLabels?.();
      labels = raw && Array.isArray(raw)
        ? raw.map((l: string, i: number) => l || `Page ${i+1}`)
        : Array.from({length: doc.numPages}, (_,i)=>`Page ${i+1}`);
    } catch {
      labels = Array.from({length: doc.numPages}, (_,i)=>`Page ${i+1}`);
    }
    setPageLabels(labels);
    setActivePage(0);
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') openFile(f);
  }

  function onImport() {
    const s = prompt('Paste JSON:'); if (!s) return;
    try { const data = importJSON(s); useStore.getState().fromProject(data); setPdf(null); alert('Imported. Now load the corresponding PDF file.'); }
    catch (err:any) { alert('Invalid JSON: ' + err.message); }
  }

  function onExport() {
    const data = useStore.getState().toProject();
    const text = exportJSON(data);
    navigator.clipboard.writeText(text);
    alert('Copied JSON to clipboard.');
  }

  function tryLoadSaved() {
    const data = loadProject();
    if (data) { useStore.getState().fromProject(data); alert('Loaded local save. Now open the matching PDF file.'); }
    else alert('No local save found.');
  }
  function saveLocal() {
    const data: ProjectSave = useStore.getState().toProject();
    saveProject(data); alert('Saved locally.');
  }

  const labelFor = (i: number) => pageLabels[i] || `Page ${i+1}`;

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
      {/* Sticky TOP TOOLBAR */}
      <div className="toolbar sticky-top">
        <div className="fileRow">
          <input ref={fileRef} type="file" accept="application/pdf" style={{display:'none'}}
                 onChange={(e)=>{ const f = e.target.files?.[0]; if (f) openFile(f); }} />
          <button className="btn" onClick={()=>fileRef.current?.click()}>Open PDF</button>
          <span className="label">{fileName}</span>
        </div>

        {pageCount > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:8, marginLeft:12}}>
            <button className="btn" onClick={()=>setActivePage(activePage-1)} disabled={activePage<=0}>◀</button>
            <select className="btn" value={activePage} onChange={(e)=>setActivePage(parseInt(e.target.value,10))}>
              {Array.from({length: pageCount}, (_, i) => (<option key={i} value={i}>{i+1} — {labelFor(i)}</option>))}
            </select>
            <button className="btn" onClick={()=>setActivePage(activePage+1)} disabled={activePage>=pageCount-1}>▶</button>
          </div>
        )}

        <div style={{flex:1}} />

        <div className="zoomBox">
          <button className={`btn ${tool==='hand'?'active':''}`} onClick={()=>setTool('hand')}>Hand</button>
          <button className={`btn ${tool==='count'?'active':''}`} onClick={()=>setTool('count')}>Count</button>
          <button className={`btn ${tool==='segment'?'active':''}`} onClick={()=>setTool('segment')}>Measure</button>
          <button className={`btn ${tool==='polyline'?'active':''}`} onClick={()=>setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool==='freeform'?'active':''}`} onClick={()=>setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool==='calibrate'?'active':''}`} onClick={()=>setTool('calibrate')}>Calibrate</button>
          <span className="badge">Tag:</span>
          <input value={currentTag} onChange={e=>setCurrentTag(e.target.value.toUpperCase())} style={{width:60, padding:'.25rem .4rem'}} />
          <button className="btn" onClick={()=>setZoom(zoom*0.9)}>-</button>
          <span className="badge">{Math.round(zoom*100)}%</span>
          <button className="btn" onClick={()=>setZoom(zoom*1.1)}>+</button>
        </div>

        <div style={{flex:1}} />

        <button className="btn" onClick={()=>setTagsOpen(true)}>Tags</button>
        <button className="btn" onClick={saveLocal}>Save</button>
        <button className="btn" onClick={tryLoadSaved}>Load</button>
        <button className="btn" onClick={onExport}>Export JSON</button>
        <button className="btn" onClick={onImport}>Import JSON</button>
      </div>

      {/* Sticky QUICK TAGS under toolbar */}
      <div className="quickbar sticky-under">
        <div className="label" style={{marginRight:6}}>Quick Tags</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', maxHeight:48, overflow:'auto'}}>
          {tags.map(t => (
            <button key={t.id} title={`${t.code} — ${t.name}`}
              className="btn"
              onClick={()=>{ useStore.getState().setTool('count'); setCurrentTag(t.code); }}
              style={{display:'flex', alignItems:'center', gap:6}}
            >
              <span style={{
                width:20, height:20, borderRadius:4, border:'1px solid #444',
                background: (t.category?.toLowerCase().includes('light') ? '#FFA500' : t.color)
              }}/>
              <span style={{minWidth:26, textAlign:'center'}}>{t.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VIEWER with collapsible BOM */}
      <div className="viewer">
        <div className="sidebar" style={{ width: bomOpen ? 300 : 36 }}>
          <BomPanel open={bomOpen} onToggle={()=>setBomOpen(v=>!v)} />
        </div>
        <PDFViewport pdf={pdf} />
      </div>

      <div className="hud">Tool: {tool} • Zoom: {Math.round(zoom*100)}% • Page {pageCount>0? (activePage+1):0}/{pageCount}</div>

      <TagManager open={tagsOpen} onClose={()=>setTagsOpen(false)} />
    </div>
  );
}
