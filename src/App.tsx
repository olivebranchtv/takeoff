// src/App.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { useStore } from '@/state/store';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { AnyTakeoffObject, ProjectSave } from '@/types';
import { pathLength } from '@/utils/geometry';

export default function App() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(true);

  const {
    // global state (from store)
    tool, setTool,
    zoom, setZoom,
    fileName, setFileName,
    pages, setPages,
    pageCount, setPageCount,
    pageLabels, setPageLabels,
    activePage, setActivePage,
    tags, currentTag, setCurrentTag,
    setSelectedIds,
  } = useStore();

  /* -------------------- OPEN PDF -------------------- */
  const openFile = useCallback(async (file: File) => {
    const doc = await loadPdf(file);
    setPdf(doc);
    setFileName(file.name);
    setPages([]); // reset page objects/state
    setPageCount(doc.numPages);

    // Try to read embedded page labels; fall back to "Page N"
    let labels: string[] = [];
    try {
      // @ts-ignore optional in pdf.js
      const raw = await (doc as any).getPageLabels?.();
      labels = raw && Array.isArray(raw)
        ? raw.map((l: string, i: number) => l || `Page ${i + 1}`)
        : Array.from({ length: doc.numPages }, (_, i) => `Page ${i + 1}`);
    } catch {
      labels = Array.from({ length: doc.numPages }, (_, i) => `Page ${i + 1}`);
    }
    setPageLabels(labels);
    setActivePage(0);
    setSelectedIds([]);
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage, setSelectedIds]);

  /* -------------------- IMPORT / EXPORT -------------------- */
  function onImport() {
    const s = prompt('Paste JSON:'); if (!s) return;
    try {
      const data = importJSON(s);
      useStore.getState().fromProject(data);
      setPdf(null);
      alert('Imported project. Now open the matching PDF file.');
    } catch (err: any) {
      alert('Invalid JSON: ' + err.message);
    }
  }
  function onExport() {
    const data = useStore.getState().toProject();
    const text = exportJSON(data);
    navigator.clipboard.writeText(text);
    alert('Copied project JSON to clipboard.');
  }
  function onSave() {
    const data: ProjectSave = useStore.getState().toProject();
    saveProject(data);
    alert('Saved locally.');
  }
  function onLoad() {
    const data = loadProject();
    if (!data) { alert('No local save found.'); return; }
    useStore.getState().fromProject(data);
    setPdf(null);
    alert('Loaded local project. Open the matching PDF file.');
  }

  /* -------------------- SIMPLE BOM (embedded) -------------------- */
  const bom = useMemo(() => {
    let totalTags = 0;
    let segLF = 0, plLF = 0, ffLF = 0;
    const byCode = new Map<string, { tags: number; meas: number; lf: number }>();

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot || 0;

      for (const obj of (pg.objects ?? [])) {
        if (obj.type === 'count') {
          totalTags++;
          const code = (obj as any).code || '';
          const box = byCode.get(code) ?? { tags: 0, meas: 0, lf: 0 };
          box.tags += 1;
          byCode.set(code, box);
          continue;
        }

        const verts = (obj as AnyTakeoffObject).vertices ?? [];
        const lenPx = pathLength(verts);
        const lf = ppf > 0 ? lenPx / ppf : 0;

        if (obj.type === 'segment') segLF += lf;
        else if (obj.type === 'polyline') plLF += lf;
        else if (obj.type === 'freeform') ffLF += lf;

        const code = (obj as any).code || '';
        if (code) {
          const box = byCode.get(code) ?? { tags: 0, meas: 0, lf: 0 };
          box.meas += 1;
          box.lf += lf;
          byCode.set(code, box);
        }
      }
    }

    const rows = Array.from(byCode.entries())
      .map(([code, v]) => ({ code, tags: v.tags, meas: v.meas, lf: v.lf }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      totalTags,
      segLF, plLF, ffLF,
      totalLF: segLF + plLF + ffLF,
      rows,
      calibratedCount: pages.filter(p => (p.pixelsPerFoot || 0) > 0).length,
      totalPages: pages.length,
    };
  }, [pages]);

  /* -------------------- RENDER -------------------- */
  return (
    <div className="app_root" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {/* Toolbar */}
      <div className="toolbar" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderBottom:'1px solid #e6e6e6', position:'sticky', top:0, background:'#fff', zIndex:5}}>
        {/* Open */}
        <input ref={fileRef} type="file" accept="application/pdf" style={{display:'none'}}
               onChange={(e)=>{ const f=e.target.files?.[0]; if (f) openFile(f); }} />
        <button className="btn" onClick={()=>fileRef.current?.click()}>Open PDF</button>
        <span className="label" style={{marginLeft:8, minWidth:160, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{fileName}</span>

        {/* Page nav */}
        {pageCount > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:6, marginLeft:12}}>
            <button className="btn" onClick={()=>setActivePage(Math.max(0, activePage-1))} disabled={activePage<=0}>◀</button>
            <select className="btn" value={activePage} onChange={(e)=>setActivePage(parseInt(e.target.value,10))}>
              {Array.from({length: pageCount}, (_, i) => (
                <option key={i} value={i}>{i+1} — {pageLabels[i] || `Page ${i+1}`}</option>
              ))}
            </select>
            <button className="btn" onClick={()=>setActivePage(Math.min(pageCount-1, activePage+1))} disabled={activePage>=pageCount-1}>▶</button>
          </div>
        )}

        <div style={{flex:1}} />

        {/* Tools */}
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <button className={`btn ${tool==='hand'?'active':''}`} onClick={()=>setTool('hand')}>Hand</button>
          <button className={`btn ${tool==='count'?'active':''}`} onClick={()=>setTool('count')}>Count</button>
          <button className={`btn ${tool==='segment'?'active':''}`} onClick={()=>setTool('segment')}>Measure</button>
          <button className={`btn ${tool==='polyline'?'active':''}`} onClick={()=>setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool==='freeform'?'active':''}`} onClick={()=>setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool==='calibrate'?'active':''}`} onClick={()=>setTool('calibrate')}>Calibrate</button>

          <span className="badge">Tag:</span>
          <input
            value={currentTag}
            onChange={(e)=>setCurrentTag(e.target.value.toUpperCase())}
            style={{width:60, padding:'.25rem .4rem'}}
          />

          <button className="btn" onClick={()=>setZoom(zoom*0.9)}>-</button>
          <span className="badge">{Math.round(zoom*100)}%</span>
          <button className="btn" onClick={()=>setZoom(zoom*1.1)}>+</button>
        </div>

        <div style={{flex:1}} />

        <button className="btn" onClick={()=>setTagsOpen(true)}>Tags</button>
        <button className="btn" onClick={onSave}>Save</button>
        <button className="btn" onClick={onLoad}>Load</button>
        <button className="btn" onClick={onExport}>Export JSON</button>
        <button className="btn" onClick={onImport}>Import JSON</button>
      </div>

      {/* Project Tags */}
      <div className="quickbar" style={{display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderBottom:'1px solid #eee', position:'sticky', top:42, background:'#fff', zIndex:4}}>
        <div className="label" style={{minWidth:100, fontWeight:600}}>Project Tags</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', maxHeight:48, overflow:'auto'}}>
          {tags.map(t => {
            const isActive = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            const color = (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color;
            return (
              <button
                key={t.id}
                className={`btn ${isActive ? 'active' : ''}`}
                onClick={() => { setTool('count'); setCurrentTag(t.code); }}
                title={`${t.code} — ${t.name}`}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  boxShadow: isActive ? '0 0 0 2px #0d6efd inset' : undefined,
                  background: isActive ? '#eef5ff' : undefined
                }}
              >
                <span style={{width:20, height:20, borderRadius:4, border:'1px solid #444', background: color}}/>
                <span style={{minWidth:26, textAlign:'center', fontWeight: isActive ? 700 : 600}}>{t.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main viewer area */}
      <div className="viewer" style={{display:'grid', gridTemplateColumns: bomOpen ? '320px 1fr' : '0 1fr', transition:'grid-template-columns .2s', minHeight:0, flex:1}}>
        {/* BOM panel */}
        <div className="sidebar" style={{borderRight:'1px solid #eee', overflow:'auto'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 10px 6px 10px'}}>
            <div className="label" style={{fontWeight:600}}>BOM Summary</div>
            <div style={{display:'flex', gap:6}}>
              <button className="btn" onClick={()=>setBomOpen(!bomOpen)}>{bomOpen ? 'Hide' : 'Show'}</button>
              <button className="btn" onClick={()=>{
                // very simple CSV export of summary
                const rows = [
                  ['Total Tags', String(bom.totalTags)],
                  ['Segment LF', bom.segLF.toFixed(2)],
                  ['Polyline LF', bom.plLF.toFixed(2)],
                  ['Freeform LF', bom.ffLF.toFixed(2)],
                  ['Total LF', (bom.totalLF).toFixed(2)],
                  [],
                  ['Code','Tag Markers','Measurements','Linear Ft'],
                  ...bom.rows.map(r => [r.code, String(r.tags), String(r.meas), r.lf.toFixed(2)])
                ];
                const csv = rows.map(r=>r.join(',')).join('\n');
                const blob = new Blob([csv], {type:'text/csv'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'bom_summary.csv'; a.click();
                URL.revokeObjectURL(url);
              }}>Export CSV</button>
            </div>
          </div>

          <div style={{padding:'0 10px 12px 10px', color:'#666', fontSize:13}}>
            {bom.calibratedCount}/{bom.totalPages} page(s) calibrated.
          </div>

          <div style={{padding:'0 10px 12px 10px'}}>
            <div style={{marginBottom:8, fontWeight:600}}>Totals</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:6}}>
              <div>Total Tags:</div><div>{bom.totalTags}</div>
              <div>Segment LF:</div><div>{bom.segLF.toFixed(2)}</div>
              <div>Polyline LF:</div><div>{bom.plLF.toFixed(2)}</div>
              <div>Freeform LF:</div><div>{bom.ffLF.toFixed(2)}</div>
              <div style={{fontWeight:700}}>Total LF:</div><div style={{fontWeight:700}}>{bom.totalLF.toFixed(2)}</div>
            </div>
          </div>

          <div style={{padding:'0 10px 20px 10px'}}>
            <div style={{marginBottom:8, fontWeight:600}}>Counts by Code</div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <thead>
                <tr style={{borderBottom:'1px solid #eee'}}>
                  <th style={{textAlign:'left', padding:'6px 4px'}}>Code</th>
                  <th style={{textAlign:'left', padding:'6px 4px'}}>Tags</th>
                  <th style={{textAlign:'left', padding:'6px 4px'}}>Meas</th>
                  <th style={{textAlign:'left', padding:'6px 4px'}}>LF</th>
                </tr>
              </thead>
              <tbody>
                {bom.rows.map(r=>(
                  <tr key={r.code} style={{borderBottom:'1px solid #f3f3f3'}}>
                    <td style={{padding:'6px 4px', fontWeight:600}}>{r.code}</td>
                    <td style={{padding:'6px 4px'}}>{r.tags}</td>
                    <td style={{padding:'6px 4px'}}>{r.meas}</td>
                    <td style={{padding:'6px 4px'}}>{r.lf.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF viewport */}
        <div style={{position:'relative', overflow:'auto'}}>
          <PDFViewport pdf={pdf} />
        </div>
      </div>

      {/* Footer HUD */}
      <div className="hud" style={{borderTop:'1px solid #eee', padding:'6px 10px', fontSize:12, color:'#555'}}>
        Tool: {tool} • Zoom: {Math.round(zoom*100)}% • Page {pageCount ? (activePage+1) : 0}/{pageCount}
      </div>

      {/* Tag manager modal */}
      <TagManager open={tagsOpen} onClose={()=>setTagsOpen(false)} />
    </div>
  );
}

/* ---------- light button styles (keep your existing CSS if you have it) ---------- */
/* If you already style .btn/.badge elsewhere, this inline fallback won’t hurt. */
declare global { interface HTMLElementTagNameMap { } }
const style = document.createElement('style');
style.innerHTML = `
  .btn{border:1px solid #ccc;background:#fff;padding:.35rem .55rem;border-radius:6px;cursor:pointer}
  .btn:hover{background:#f7f7f7}
  .btn.active{border-color:#0d6efd;color:#0d6efd;background:#eef5ff}
  .badge{padding:0 .35rem;color:#555}
`;
if (typeof document !== 'undefined' && !document.getElementById('app-inline-styles')) {
  style.id = 'app-inline-styles'; document.head.appendChild(style);
}
