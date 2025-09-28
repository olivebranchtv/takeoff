import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { ProjectSave, AnyTakeoffObject } from '@/types';
import { pathLength } from '@/utils/geometry';

/* -------------------------------------------------------
   Inline BOM PANEL (detailed + per-code rollups)
   Now includes per-code "Measurements" count
------------------------------------------------------- */
type BomProps = { open: boolean; onToggle: () => void };

type LineRow = {
  id: string;
  pageIndex: number; // for delete/navigation
  pageLabel: string; // display only
  code: string;
  feet: number;
  px: number;
};

function BomPanel({ open, onToggle }: BomProps) {
  const {
    pages,
    pageLabels,
    setActivePage,
    selectOnly,
    deleteSelected,
  } = useStore();

  const {
    segments, polylines, freeforms,
    totalTags, segLF, plLF, ffLF, totalLF,
    byCode,
    calibratedPages, totalPages
  } = React.useMemo(() => {
    const segments: LineRow[] = [];
    const polylines: LineRow[] = [];
    const freeforms: LineRow[] = [];
    let totalTags = 0;
    let segLF = 0, plLF = 0, ffLF = 0;
    let calibratedPages = 0;

    // by-code rollup: tag markers + measurements + linear ft
    const byCode = new Map<string, { tags: number; meas: number; lf: number }>();

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot;
      if (ppf && ppf > 0) calibratedPages++;

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
        const lf = ppf && ppf > 0 ? lenPx / ppf : 0;
        const row: LineRow = {
          id: obj.id,
          pageIndex: obj.pageIndex,
          pageLabel: (pageLabels[obj.pageIndex] || `Page ${obj.pageIndex + 1}`),
          code: (obj as any).code || '',
          feet: lf,
          px: lenPx
        };

        if (obj.type === 'segment') {
          segLF += lf;
          segments.push(row);
        } else if (obj.type === 'polyline') {
          plLF += lf;
          polylines.push(row);
        } else if (obj.type === 'freeform') {
          ffLF += lf;
          freeforms.push(row);
        }

        // roll up measurements + linear ft by code (if tagged)
        const code = (obj as any).code || '';
        if (code) {
          const box = byCode.get(code) ?? { tags: 0, meas: 0, lf: 0 };
          box.meas += 1; // <-- each measurement object counts as 1
          box.lf += lf;
          byCode.set(code, box);
        }
      }
    }

    // sort by page then code
    const byPageCode = (a:LineRow,b:LineRow)=>(a.pageIndex-b.pageIndex)||a.code.localeCompare(b.code);
    segments.sort(byPageCode);
    polylines.sort(byPageCode);
    freeforms.sort(byPageCode);

    return {
      segments, polylines, freeforms,
      totalTags, segLF, plLF, ffLF, totalLF: segLF + plLF + ffLF,
      byCode: Array.from(byCode.entries())
        .map(([code, v]) => ({ code, tags: v.tags, meas: v.meas, lf: v.lf }))
        .sort((a, b) => a.code.localeCompare(b.code)),
      calibratedPages,
      totalPages: pages.length
    };
  }, [pages, pageLabels]);

  function exportCSV() {
    const rows: string[][] = [];
    rows.push(['Totals','','','','','']);
    rows.push(['Total Tags', String(totalTags), '', '', '', '']);
    rows.push(['Segment LF', segLF.toFixed(2), '', '', '', '']);
    rows.push(['Polyline LF', plLF.toFixed(2), '', '', '', '']);
    rows.push(['Freeform LF', ffLF.toFixed(2), '', '', '', '']);
    rows.push(['Total LF', totalLF.toFixed(2), '', '', '', '']);
    rows.push([]);

    rows.push(['By Code','Tag Markers','Measurements','Linear Ft','','']);
    for (const r of byCode) rows.push([r.code, String(r.tags), String(r.meas), r.lf.toFixed(2), '', '']);
    rows.push([]);

    const pushList = (title: string, list: LineRow[]) => {
      rows.push([title,'Page','Code','Feet','Pixels','']);
      for (const r of list) rows.push(['', r.pageLabel, r.code, r.feet.toFixed(2), String(Math.round(r.px)), '']);
      rows.push([]);
    };
    pushList('Segments', segments);
    pushList('Polylines', polylines);
    pushList('Freeforms', freeforms);

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bom_detailed.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const Section = ({title, items}:{title:string; items:LineRow[]}) => (
    <div className="card" style={{marginTop:10}}>
      <div className="label" style={{marginBottom:6}}>{title}</div>
      <div style={{maxHeight:220, overflow:'auto'}}>
        {items.length === 0 ? (
          <div style={{color:'#666', fontSize:13}}>No records.</div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
            <thead>
              <tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}>
                <th style={{padding:'6px 4px'}}>Page</th>
                <th style={{padding:'6px 4px'}}>Code</th>
                <th style={{padding:'6px 4px'}}>Feet</th>
                <th style={{padding:'6px 4px'}}>Pixels</th>
                <th style={{padding:'6px 4px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} style={{borderBottom:'1px solid #f4f4f4'}}>
                  <td style={{padding:'6px 4px'}}>{r.pageLabel}</td>
                  <td style={{padding:'6px 4px', fontWeight:600}}>{r.code}</td>
                  <td style={{padding:'6px 4px'}}>{r.feet ? r.feet.toFixed(2) : '—'}</td>
                  <td style={{padding:'6px 4px'}}>{Math.round(r.px)}</td>
                  <td style={{padding:'6px 4px', whiteSpace:'nowrap'}}>
                    <button
                      className="btn"
                      title="Go to page"
                      onClick={()=>setActivePage(r.pageIndex)}
                      style={{marginRight:6}}
                    >
                      Go
                    </button>
                    <button
                      className="btn"
                      title="Delete measurement"
                      onClick={()=>{
                        // select then delete to reuse store logic
                        selectOnly(r.id);
                        deleteSelected(r.pageIndex);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

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
            {calibratedPages}/{totalPages} page(s) calibrated.
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12}}>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Totals</div>
              <div style={{fontSize:14}}>
                <div><strong>Total Tags:</strong> {totalTags}</div>
                <div><strong>Total LF:</strong> {totalLF.toFixed(2)}</div>
              </div>
            </div>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Linear Feet</div>
              <div style={{fontSize:14}}>
                <div>Segment: {segLF.toFixed(2)}</div>
                <div>Polyline: {plLF.toFixed(2)}</div>
                <div>Freeform: {ffLF.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="label" style={{marginBottom:6}}>By Code</div>
            <div style={{maxHeight:220, overflow:'auto'}}>
              {byCode.length === 0 ? (
                <div style={{color:'#666', fontSize:13}}>No codes yet.</div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                  <thead>
                    <tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}>
                      <th style={{padding:'6px 4px'}}>Code</th>
                      <th style={{padding:'6px 4px'}}>Tag Markers</th>
                      <th style={{padding:'6px 4px'}}>Measurements</th>
                      <th style={{padding:'6px 4px'}}>Linear Ft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCode.map(r => (
                      <tr key={r.code} style={{borderBottom:'1px solid #f4f4f4'}}>
                        <td style={{padding:'6px 4px', fontWeight:600}}>{r.code}</td>
                        <td style={{padding:'6px 4px'}}>{r.tags}</td>
                        <td style={{padding:'6px 4px'}}>{r.meas}</td>
                        <td style={{padding:'6px 4px'}}>{r.lf.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <Section title="Segments"  items={segments} />
          <Section title="Polylines" items={polylines} />
          <Section title="Freeforms" items={freeforms} />
        </div>
      ) : (
        <div style={{padding:'8px', color:'#666', fontSize:12}} />
      )}
    </div>
  );
}

/* -------------------------------------------------------
   App shell (sticky toolbars, quick tags, viewer)
   Quick Tags now highlight the selected code
------------------------------------------------------- */
export default function App() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<Awaited<ReturnType<typeof loadPdf>> | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(true);

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
          <input value={currentTag} onChange={e=>useStore.getState().setCurrentTag(e.target.value.toUpperCase())} style={{width:60, padding:'.25rem .4rem'}} />
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

      {/* Sticky QUICK TAGS (now highlight active selection) */}
      <div className="quickbar sticky-under">
        <div className="label" style={{marginRight:6}}>Quick Tags</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', maxHeight:48, overflow:'auto'}}>
          {tags.map(t => {
            const isActive = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            return (
              <button
                key={t.id}
                title={`${t.code} — ${t.name}`}
                className={`btn ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                onClick={()=>{
                  // keep behavior: selecting a quick tag also sets Count tool
                  useStore.getState().setTool('count');
                  useStore.getState().setCurrentTag(t.code);
                }}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  boxShadow: isActive ? '0 0 0 2px #0d6efd inset' : undefined,
                  background: isActive ? '#eef5ff' : undefined
                }}
              >
                <span style={{
                  width:20, height:20, borderRadius:4, border:'1px solid #444',
                  background: (t.category?.toLowerCase().includes('light') ? '#FFA500' : t.color)
                }}/>
                <span style={{minWidth:26, textAlign:'center', fontWeight: isActive ? 700 : 500}}>
                  {t.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEWER + BOM */}
      <div className="viewer">
        <div className="sidebar" style={{ width: 300 }}>
          <BomPanel open={true} onToggle={()=>{}} />
        </div>
        <PDFViewport pdf={pdf} />
      </div>

      <div className="hud">Tool: {tool} • Zoom: {Math.round(zoom*100)}% • Page {pageCount>0? (activePage+1):0}/{pageCount}</div>

      <TagManager open={tagsOpen} onClose={()=>setTagsOpen(false)} />
    </div>
  );
}
