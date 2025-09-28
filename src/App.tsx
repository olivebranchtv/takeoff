import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { ProjectSave } from '@/types';
import BOMPanel from '@/components/BOMPanel';

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<Awaited<ReturnType<typeof loadPdf>> | null>(null);

  const {
    tool, setTool, zoom, setZoom, fileName, setFileName, pages, setPages,
    currentTag, setCurrentTag
  } = useStore();

  const openFile = useCallback(async (file: File) => {
    const doc = await loadPdf(file);
    setPdf(doc);
    setFileName(file.name);
    setPages([]); // reset per new doc
  }, [setFileName, setPages]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') openFile(f);
  }

  function onImport() {
    const s = prompt('Paste JSON:');
    if (!s) return;
    try {
      const data = importJSON(s);
      useStore.getState().fromProject(data);
      setPdf(null);
      alert('Imported. Now load the corresponding PDF file.');
    } catch (err:any) {
      alert('Invalid JSON: ' + err.message);
    }
  }

  function onExport() {
    const data = useStore.getState().toProject();
    const text = exportJSON(data);
    navigator.clipboard.writeText(text);
    alert('Copied JSON to clipboard.');
  }

  function tryLoadSaved() {
    const data = loadProject();
    if (data) {
      useStore.getState().fromProject(data);
      alert('Loaded local save. Now open the matching PDF file.');
    } else alert('No local save found.');
  }

  function saveLocal() {
    const data: ProjectSave = useStore.getState().toProject();
    saveProject(data);
    alert('Saved locally.');
  }

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
      <div className="toolbar">
        <div className="fileRow">
          <input ref={inputRef} type="file" accept="application/pdf" style={{display:'none'}}
            onChange={(e)=>{ const f = e.target.files?.[0]; if (f) openFile(f); }} />
          <button className="btn" onClick={()=>inputRef.current?.click()}>Open PDF</button>
          <span className="label">{fileName}</span>
        </div>

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

        <button className="btn" onClick={saveLocal}>Save</button>
        <button className="btn" onClick={tryLoadSaved}>Load</button>
        <button className="btn" onClick={onExport}>Export JSON</button>
        <button className="btn" onClick={onImport}>Import JSON</button>
      </div>

      <div className="viewer">
        <div className="sidebar">
          <div className="sectionTitle">Quick Tags</div>
          <div className="tagPalette">
            {['A','A1','EM','SP','GFCI','HW'].map(code=>(
              <button key={code} className="btn" onClick={()=>{ useStore.getState().setTool('count'); setCurrentTag(code); }}>{code}</button>
            ))}
          </div>
          <div className="sectionTitle">BOM</div>
          <BOMPanel />
          <div className="sectionTitle">Help</div>
          <ul className="help">
            <li>Open or drag a PDF</li>
            <li>Calibrate: pick 2 points → enter feet</li>
            <li>Count: click to place tags</li>
            <li>Measure: click start → click end</li>
            <li>Polyline: click vertices → double-click to finish</li>
            <li>Freeform: press-drag-release</li>
            <li>Delete key removes selected</li>
            <li>Undo: Ctrl/Cmd+Z • Redo: Ctrl+Y or Shift+Ctrl/Cmd+Z</li>
            <li>Save/Load are local only</li>
          </ul>
        </div>
        <PDFViewport pdf={pdf} />
      </div>

      <div className="hud">Tool: {tool} • Zoom: {Math.round(zoom*100)}%</div>
    </div>
  );
}