import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { useStore } from '@/state/store';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { AnyTakeoffObject, ProjectSave } from '@/types';
import { pathLength } from '@/utils/geometry';

/* ---------- helpers to embed / restore PDFs ---------- */
function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBlob(b64: string, mime = 'application/pdf'): Blob {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(bufToBase64(r.result as ArrayBuffer));
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

/** Tag entry shown in the Project Tags bar */
type TagLite = { id: string; code: string; name: string; color: string; category?: string };

/** Project metadata captured on “New Project” */
type ProjectMeta = { name: string; client?: string; bid?: string };

/** .skdproj bundle */
type SkdProjBundle = {
  kind: 'skdproj';
  version: number;
  meta?: ProjectMeta;
  core: ProjectSave;
  projectTags: TagLite[];
  pdf?: { name: string; base64: string }; // embedded working pdf
};

export default function App() {
  // ---------- refs ----------
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const projFileRef = useRef<HTMLInputElement>(null);
  const fileBtnRef = useRef<HTMLButtonElement>(null);

  // ---------- viewer/pdf ----------
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [embeddedPdf, setEmbeddedPdf] = useState<{ name: string; base64: string } | null>(null);

  // ---------- Tag Manager modal ----------
  const [tagsOpen, setTagsOpen] = useState(false);

  // ---------- Project Meta modal ----------
  const [metaOpen, setMetaOpen] = useState(false);
  const [meta, setMeta] = useState<ProjectMeta>({ name: '' });

  // ---------- File menu ----------
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  // ---------- per-project “Project Tags” (starts empty) ----------
  const [projectTags, setProjectTags] = useState<TagLite[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSel, setPickerSel] = useState<string>('');
  const [lastSaveBase, setLastSaveBase] = useState<string | null>(null);

  // ---------- store ----------
  const {
    tool, setTool,
    zoom, setZoom,
    fileName, setFileName,
    pages, setPages,
    pageCount, setPageCount,
    pageLabels, setPageLabels,
    activePage, setActivePage,
    tags, currentTag, setCurrentTag,
    clearSelection, // use clearSelection instead of setSelectedIds
  } = useStore();

  // =========================================================================================
  // FILE MENU — New / Open (.skdproj) / Save (.skdproj) / Save As (.skdproj) / Print / Close
  // =========================================================================================
  const makeBundle = useCallback((): SkdProjBundle => {
    const core: ProjectSave = useStore.getState().toProject();
    return { kind: 'skdproj', version: 2, meta, projectTags, core, pdf: embeddedPdf ?? undefined };
  }, [meta, projectTags, embeddedPdf]);

  const downloadBundle = useCallback((basename?: string) => {
    const base = (basename || lastSaveBase || meta.name || 'project').replace(/\.(skdproj|json)$/i, '');
    const filename = `${base}.skdproj`;
    const blob = new Blob([JSON.stringify(makeBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setLastSaveBase(base);
  }, [makeBundle, lastSaveBase, meta.name]);

  function doNewProjectFlow() {
    // Show modal to collect metadata BEFORE clearing
    setMetaOpen(true);
  }

  function commitNewProject(newMeta: ProjectMeta) {
    // clear viewer + store + set meta
    setMeta(newMeta);
    setPdf(null);
    setEmbeddedPdf(null);
    setFileName('');
    setPages([]);
    setPageCount(0);
    setPageLabels([]);
    setActivePage(0);
    clearSelection();
    setCurrentTag('');
    setProjectTags([]);
    setLastSaveBase(newMeta.name || null);
  }

  function doOpenProject(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || '');
        const parsed = JSON.parse(text) as SkdProjBundle;

        const bundle: SkdProjBundle = parsed?.kind === 'skdproj'
          ? parsed
          : { kind: 'skdproj', version: 1, core: parsed as any, projectTags: [], meta: { name: file.name.replace(/\.skdproj$/i, '') } };

        // load store
        useStore.getState().fromProject(bundle.core);
        // restore meta + project tags
        setMeta(bundle.meta ?? { name: '' });
        setProjectTags(bundle.projectTags || []);
        // restore embedded pdf if present
        if (bundle.pdf?.base64) {
          const blob = base64ToBlob(bundle.pdf.base64);
          const named = new File([blob], bundle.pdf.name || 'drawing.pdf', { type: 'application/pdf' });
          const doc = await loadPdf(named);
          setPdf(doc);
          setFileName(named.name);
          setEmbeddedPdf({ name: named.name, base64: bundle.pdf.base64 });
          // rebuild labels
          const labels = Array.from({ length: doc.numPages }, (_, i) => `Page ${i+1}`);
          setPageLabels(labels);
          setPageCount(doc.numPages);
          setActivePage(0);
          clearSelection();
        } else {
          // No embedded pdf: ask user to open one
          setPdf(null);
          setFileName('');
          setEmbeddedPdf(null);
          alert('Project opened. Open the matching PDF (File ▸ Open PDF).');
        }

        setLastSaveBase(bundle.meta?.name || file.name.replace(/\.skdproj$/i, '').replace(/\.json$/i, ''));
      } catch (e: any) {
        alert('Invalid .skdproj: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function doSave() { downloadBundle(); }
  function doSaveAs() {
    const name = prompt('Save As (.skdproj basename):', lastSaveBase ?? meta.name ?? 'project');
    if (!name) return;
    downloadBundle(name);
  }
  function doPrint() { window.print(); }
  function doCloseProject() {
    if (!confirm('Close project? Unsaved changes will be lost.')) return;
    commitNewProject({ name: '' });
  }

  // =========================================================================================
  // OPEN PDF (and embed into bundle)
  // =========================================================================================
  const openPdf = useCallback(async (file: File) => {
    const doc = await loadPdf(file);
    setPdf(doc);
    setFileName(file.name);

    // embed bytes for saving into .skdproj
    const base64 = await readFileAsBase64(file);
    setEmbeddedPdf({ name: file.name, base64 });

    setPages([]);
    setPageCount(doc.numPages);

    // page labels if available, else Page N
    let labels: string[] = [];
    try {
      // @ts-ignore optional in pdf.js
      const raw = await (doc as any).getPageLabels?.();
      labels = raw && Array.isArray(raw)
        ? raw.map((l: string, i: number) => l || `Page ${i+1}`)
        : Array.from({ length: doc.numPages }, (_, i) => `Page ${i+1}`);
    } catch {
      labels = Array.from({ length: doc.numPages }, (_, i) => `Page ${i+1}`);
    }
    setPageLabels(labels);
    setActivePage(0);
    clearSelection();
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage, clearSelection]);

  // =========================================================================================
  // SIMPLE SUMMARY (BOM)
  // =========================================================================================
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
      totalTags, segLF, plLF, ffLF, totalLF: segLF + plLF + ffLF,
      rows,
      calibratedCount: pages.filter(p => (p.pixelsPerFoot || 0) > 0).length,
      totalPages: pages.length,
    };
  }, [pages]);

  // =========================================================================================
  // UI HELPERS
  // =========================================================================================
  const navCount = pageCount || (pdf?.numPages ?? 0);
  function colorForTag(t: TagLite) {
    return (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color;
  }
  const availableForPicker = tags
    .filter(t => !projectTags.some(p => p.code.toUpperCase() === (t.code || '').toUpperCase()))
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

  // =========================================================================================
  // RENDER
  // =========================================================================================
  return (
    <div className="app_root" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {/* FILE BAR (sticky, compact, body-level menu) */}
      <div
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
          background:'#0d3b66', color:'#fff', position:'sticky', top:0, zIndex:100,
          overflowX:'auto', whiteSpace:'nowrap'
        }}
      >
        <button ref={fileBtnRef} className="btn btn--primary" onClick={()=>setFileMenuOpen(true)}>File ▾</button>
        <div style={{fontSize:14, fontWeight:700, marginInlineEnd:8}}>SKD Services</div>

        {/* hidden project file input (.skdproj) */}
        <input
          ref={projFileRef}
          type="file"
          accept=".skdproj,application/json"
          style={{display:'none'}}
          onChange={(e)=>{ const f = e.target.files?.[0]; if (f) doOpenProject(f); e.currentTarget.value=''; }}
        />

        <div style={{flex:1}} />

        {/* quick open PDF right from the menu bar */}
        <input
          ref={pdfFileRef}
          type="file"
          accept="application/pdf"
          style={{display:'none'}}
          onChange={(e)=>{ const f=e.target.files?.[0]; if (f) openPdf(f); e.currentTarget.value=''; }}
        />
        <button className="btn" onClick={()=>pdfFileRef.current?.click()}>Open PDF</button>
        <span style={{marginLeft:8, maxWidth:240, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={fileName}>{fileName}</span>
      </div>

      {/* File menu overlay (fixed, topmost) */}
      {fileMenuOpen && (
        <FileMenuOverlay onClose={()=>setFileMenuOpen(false)}>
          <MenuItem label="New…" onClick={()=>{ setFileMenuOpen(false); doNewProjectFlow(); }} />
          <MenuItem label="Open Project…" onClick={()=>{ setFileMenuOpen(false); projFileRef.current?.click(); }} />
          <MenuItem label="Save Project" onClick={()=>{ setFileMenuOpen(false); doSave(); }} />
          <MenuItem label="Save Project As…" onClick={()=>{ setFileMenuOpen(false); doSaveAs(); }} />
          <MenuItem label="Print" onClick={()=>{ setFileMenuOpen(false); doPrint(); }} />
          <div style={{borderTop:'1px solid #eee'}} />
          <MenuItem label="Close Project" onClick={()=>{ setFileMenuOpen(false); doCloseProject(); }} />
        </FileMenuOverlay>
      )}

      {/* TOOLS BAR (sticky, compact, horizontal scroll) */}
      <div
        className="toolbar"
        style={{
          display:'flex', alignItems:'center', gap:6, padding:'6px 10px',
          borderBottom:'1px solid #e6e6e6', position:'sticky', top:34, background:'#fff', zIndex:90,
          overflowX:'auto', whiteSpace:'nowrap'
        }}
      >
        {/* Page nav */}
        {navCount > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:4}}>
            <button className="btn" onClick={()=>setActivePage(Math.max(0, activePage-1))} disabled={activePage<=0}>◀</button>
            <select className="btn" value={activePage} onChange={(e)=>setActivePage(parseInt(e.target.value,10))}>
              {Array.from({length: navCount}, (_, i) => (
                <option key={i} value={i}>{i+1} — {pageLabels[i] || `Page ${i+1}`}</option>
              ))}
            </select>
            <button className="btn" onClick={()=>setActivePage(Math.min(navCount-1, activePage+1))} disabled={activePage>=navCount-1}>▶</button>
          </div>
        )}

        <div style={{display:'flex', alignItems:'center', gap:4}}>
          <button className={`btn ${tool==='hand'?'active':''}`} onClick={()=>setTool('hand')}>Hand</button>
          <button className={`btn ${tool==='count'?'active':''}`} onClick={()=>setTool('count')}>Count</button>
          <button className={`btn ${tool==='segment'?'active':''}`} onClick={()=>setTool('segment')}>Measure</button>
          <button className={`btn ${tool==='polyline'?'active':''}`} onClick={()=>setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool==='freeform'?'active':''}`} onClick={()=>setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool==='calibrate'?'active':''}`} onClick={()=>setTool('calibrate')}>Calibrate</button>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:4}}>
          <span className="badge">Tag:</span>
          <input
            value={currentTag}
            onChange={(e)=>setCurrentTag(e.target.value.toUpperCase())}
            style={{width:54, padding:'.2rem .35rem'}}
          />
        </div>

        <div style={{display:'flex', alignItems:'center', gap:4}}>
          <button className="btn" onClick={()=>setZoom(zoom*0.9)}>-</button>
          <span className="badge">{Math.round(zoom*100)}%</span>
          <button className="btn" onClick={()=>setZoom(zoom*1.1)}>+</button>
        </div>

        <div style={{flex:1}} />

        <button className="btn" onClick={()=>setTagsOpen(true)}>Tags</button>
        <button className="btn" onClick={()=>{
          const data: ProjectSave = useStore.getState().toProject();
          saveProject(data);
          alert('Saved locally. Use File ▸ Save Project for .skdproj.');
        }}>Save (Local)</button>
        <button className="btn" onClick={()=>{
          const data = loadProject();
          if (data){ useStore.getState().fromProject(data); setPdf(null); setEmbeddedPdf(null); alert('Loaded local project. Use File ▸ Open Project for .skdproj.'); }
          else alert('No local save.');
        }}>Load (Local)</button>
        <button className="btn" onClick={()=>{ navigator.clipboard.writeText(exportJSON(useStore.getState().toProject())); alert('Copied JSON.'); }}>Export JSON</button>
        <button className="btn" onClick={()=>{
          const s=prompt('Paste JSON:');
          if(!s) return;
          try{ useStore.getState().fromProject(importJSON(s)); setPdf(null); setEmbeddedPdf(null); alert('Imported. Open / embed the matching PDF.'); }
          catch(e:any){ alert('Invalid JSON: '+e.message); }
        }}>Import JSON</button>
      </div>

      {/* PROJECT TAGS BAR (sticky, compact, horizontal scroll) */}
      <div
        className="quickbar"
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
          borderBottom:'1px solid #eee', position:'sticky', top:68, background:'#fff', zIndex:80,
          overflowX:'auto', whiteSpace:'nowrap'
        }}
      >
        <div className="label" style={{minWidth:100, fontWeight:700}}>Project Tags</div>

        {/* tag chips */}
        <div style={{display:'flex', gap:6, flexWrap:'nowrap', alignItems:'center'}}>
          {projectTags.length === 0 && <span style={{color:'#777'}}>None — add from Tag DB ▼</span>}
          {projectTags.map(t => {
            const active = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            return (
              <button
                key={t.id}
                className={`btn ${active ? 'active' : ''}`}
                onClick={()=>{ setTool('count'); setCurrentTag(t.code); }}
                title={`${t.code} — ${t.name}`}
                style={{display:'inline-flex', alignItems:'center', gap:6, position:'relative'}}
              >
                <span style={{width:18, height:18, borderRadius:4, border:'1px solid #444', background: colorForTag(t)}} />
                <span style={{minWidth:22, textAlign:'center', fontWeight: active ? 700 : 600}}>{t.code}</span>
                <span
                  onClick={(e)=>{ e.stopPropagation(); setProjectTags(list => list.filter(x => x.id !== t.id)); if (currentTag === t.code) setCurrentTag(''); }}
                  title="Remove"
                  style={{position:'absolute', top:-6, right:-6, width:16, height:16, lineHeight:'14px', textAlign:'center',
                          border:'1px solid #bbb', borderRadius:'50%', background:'#fff', cursor:'pointer', fontSize:10}}
                >×</span>
              </button>
            );
          })}
        </div>

        <div style={{flex:1}} />

        {/* add-from-DB picker */}
        <div style={{position:'relative', display:'inline-block'}}>
          <button className="btn" onClick={()=>setPickerOpen(v=>!v)}>Add from DB</button>
          {pickerOpen && (
            <div
              style={{
                position:'absolute', top:'110%', right:0, background:'#fff',
                border:'1px solid #ddd', borderRadius:6, padding:8, width:280, zIndex:200,
                boxShadow:'0 6px 22px rgba(0,0,0,.12)'
              }}
              onMouseLeave={()=>setPickerOpen(false)}
            >
              <div style={{display:'flex', gap:8}}>
                <select className="btn" value={pickerSel} onChange={(e)=>setPickerSel(e.target.value)} style={{flex:1}}>
                  <option value="">— Select tag —</option>
                  {availableForPicker.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
                <button className="btn" onClick={()=>{
                  const pick = availableForPicker.find(t => t.id === pickerSel);
                  if (!pick) return;
                  setProjectTags(list => [...list, { id: pick.id, code: pick.code, name: pick.name, color: pick.color, category: pick.category }]);
                  setPickerSel(''); setPickerOpen(false);
                }}>Add</button>
              </div>
              <div style={{marginTop:6, fontSize:12, color:'#666'}}>Tip: open “Tags” to edit DB entries or import a master set.</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN AREA: Sidebar (BOM) + Viewer */}
      <div className="viewer" style={{display:'grid', gridTemplateColumns:'320px 1fr', minHeight:0, flex:1}}>
        {/* BOM */}
        <div className="sidebar" style={{borderRight:'1px solid #eee', overflow:'auto'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px 6px 10px'}}>
            <div className="label" style={{fontWeight:700}}>BOM Summary</div>
            <button className="btn" onClick={()=>{
              const rows = [
                ['Project', meta.name || ''],
                ['Client', meta.client || ''],
                ['Bid #', meta.bid || ''],
                [],
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
              const a = document.createElement('a'); a.href=url; a.download='bom_summary.csv'; a.click(); URL.revokeObjectURL(url);
            }}>Export CSV</button>
          </div>

          <div style={{padding:'0 10px 10px 10px', color:'#666', fontSize:12}}>
            {bom.calibratedCount}/{bom.totalPages} page(s) calibrated.
          </div>

          <div style={{padding:'0 10px 12px 10px'}}>
            <div style={{marginBottom:6, fontWeight:600}}>Totals</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:4, fontSize:14}}>
              <div>Total Tags:</div><div>{bom.totalTags}</div>
              <div>Segment LF:</div><div>{bom.segLF.toFixed(2)}</div>
              <div>Polyline LF:</div><div>{bom.plLF.toFixed(2)}</div>
              <div>Freeform LF:</div><div>{bom.ffLF.toFixed(2)}</div>
              <div style={{fontWeight:700}}>Total LF:</div><div style={{fontWeight:700}}>{bom.totalLF.toFixed(2)}</div>
            </div>
          </div>

          <div style={{padding:'0 10px 16px 10px'}}>
            <div style={{marginBottom:6, fontWeight:600}}>Counts by Code</div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
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

        {/* VIEWPORT */}
        <div style={{position:'relative', overflow:'auto'}}>
          <PDFViewport pdf={pdf} />
        </div>
      </div>

      {/* Footer HUD */}
      <div className="hud" style={{borderTop:'1px solid #eee', padding:'6px 10px', fontSize:12, color:'#555'}}>
        Tool: {tool} • Zoom: {Math.round(zoom*100)}% • Page {navCount ? (activePage+1) : 0}/{navCount} {meta.name ? `• Project: ${meta.name}` : ''}
      </div>

      {/* Tag DB modal */}
      <TagManager open={tagsOpen} onClose={()=>setTagsOpen(false)} />

      {/* New Project modal */}
      {metaOpen && (
        <ProjectMetaModal
          initial={meta}
          onCancel={()=>setMetaOpen(false)}
          onCreate={(m)=>{
            setMetaOpen(false);
            commitNewProject(m);
          }}
        />
      )}

      <InlineStyles />
    </div>
  );
}

/* ------- body-level File menu overlay (always on top) ------- */
function FileMenuOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,.08)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position:'absolute', top:10, left:10, width:240,
          background:'#fff', color:'#111', border:'1px solid #ddd', borderRadius:8,
          boxShadow:'0 10px 28px rgba(0,0,0,.18)', overflow:'hidden'
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ------- New Project modal (name required; client/bid optional) ------- */
function ProjectMetaModal({
  initial,
  onCancel,
  onCreate
}: {
  initial: ProjectMeta;
  onCancel: () => void;
  onCreate: (meta: ProjectMeta) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [client, setClient] = useState(initial?.client ?? '');
  const [bid, setBid] = useState(initial?.bid ?? '');

  function submit() {
    if (!name.trim()) { alert('Project Name is required.'); return; }
    onCreate({ name: name.trim(), client: client.trim() || undefined, bid: bid.trim() || undefined });
  }

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.15)',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width:380, background:'#fff', border:'1px solid #ddd', borderRadius:10,
          boxShadow:'0 15px 40px rgba(0,0,0,.25)', padding:16
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{fontWeight:700, fontSize:16, marginBottom:10}}>New Project</div>
        <div style={{display:'grid', rowGap:10}}>
          <label style={{display:'grid', rowGap:4}}>
            <span style={{fontSize:13, color:'#444'}}>Project Name <span style={{color:'#d00'}}>*</span></span>
            <input className="btn" style={{width:'100%'}} value={name} onChange={e=>setName(e.target.value)} />
          </label>
          <label style={{display:'grid', rowGap:4}}>
            <span style={{fontSize:13, color:'#444'}}>Client (optional)</span>
            <input className="btn" style={{width:'100%'}} value={client} onChange={e=>setClient(e.target.value)} />
          </label>
          <label style={{display:'grid', rowGap:4}}>
            <span style={{fontSize:13, color:'#444'}}>Bid # (optional)</span>
            <input className="btn" style={{width:'100%'}} value={bid} onChange={e=>setBid(e.target.value)} />
          </label>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:14}}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={submit}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ------- little menu item helper ------- */
function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{padding:'10px 12px', cursor:'pointer', fontSize:14}}
      onMouseEnter={(e)=>{(e.currentTarget as HTMLDivElement).style.background='#f5f7fb';}}
      onMouseLeave={(e)=>{(e.currentTarget as HTMLDivElement).style.background='transparent';}}
    >
      {label}
    </div>
  );
}

/* ------- compact button/badge styles (keeps bars small) ------- */
function InlineStyles() {
  if (typeof document === 'undefined') return null;
  if (document.getElementById('app-inline-styles')) return null;
  const s = document.createElement('style');
  s.id = 'app-inline-styles';
  s.innerHTML = `
    .btn{
      border:1px solid #c9d2e0;background:#fff;padding:.28rem .45rem;border-radius:6px;
      cursor:pointer;font:500 13px/1.15 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif
    }
    .btn:hover{background:#f7f9fc}
    .btn.active{border-color:#0d6efd;color:#0d6efd;background:#eef5ff}
    .btn:disabled{opacity:.45;cursor:not-allowed}
    .btn--primary{color:#fff;border-color:#2d5c8f;background:#124a85}
    .badge{padding:0 .35rem;color:#555;font:600 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    select.btn{padding:.22rem .35rem}
  `;
  document.head.appendChild(s);
  return null;
}
