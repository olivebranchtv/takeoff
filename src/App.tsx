import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
// ⬇️ Use a relative import so Vite resolves it regardless of alias setup
import BomPanel from './components/BomPanel';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { ProjectSave } from '@/types';

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
