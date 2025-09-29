// src/App.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { loadPdfFromBytes } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { useStore } from '@/state/store';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { AnyTakeoffObject, ProjectSave, Tag } from '@/types';
import { pathLength } from '@/utils/geometry';

/* Tag shape used by the DB + project bar */
type TagLite = { id: string; code: string; name: string; color: string; category?: string };

/** Bundle stored in .skdproj (PDF is embedded) */
type SKDBundle = {
  kind: 'skdproj';
  version: 1;
  core: ProjectSave;
  projectTags: TagLite[];
  pdf?: { name: string; bytesBase64: string };
};

/* =========================================================================================
   helpers for base64 <-> ArrayBuffer
   ========================================================================================= */

/** Normalize base64 of all common variants:
 * - strips data: URLs
 * - converts base64url (-_) to standard (+/)
 * - removes whitespace
 * - fixes missing padding
 */
function normalizeBase64(input: string): string {
  let src = (input || '').trim();

  // If it's a data URL, keep only the payload after the comma
  const comma = src.indexOf(',');
  if (src.startsWith('data:') && comma !== -1) {
    src = src.slice(comma + 1);
  }

  // Remove whitespace/newlines
  src = src.replace(/\s+/g, '');

  // Convert base64url to base64
  src = src.replace(/-/g, '+').replace(/_/g, '/');

  // Fix missing padding
  const mod = src.length % 4;
  if (mod === 2) src += '==';
  else if (mod === 3) src += '=';
  return src;
}

function b64ToAb(b64: string): ArrayBuffer {
  const src = normalizeBase64(b64);
  const bin = atob(src);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** quick sanity check that bytes look like a PDF ("%PDF") somewhere near the start */
function looksLikePdf(bytes: Uint8Array): boolean {
  const searchLen = Math.min(bytes.length, 64);
  for (let i = 0; i <= searchLen - 5; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) return true;
  }
  return false;
}

/** Simple labels to avoid fragile pdf.js APIs. */
async function resolvePageLabels(doc: any): Promise<string[]> {
  const count = (doc?.numPages ?? 0) | 0;
  return Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
}

/** Preferred category order for pickers (others follow alphabetically) */
const MASTER_CATEGORY_ORDER = ['Lights', 'Receptacles'];

export default function App() {
  /* ---------- refs ---------- */
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const projFileRef = useRef<HTMLInputElement>(null);

  /* ---------- viewer/pdf ---------- */
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [pdfBytesBase64, setPdfBytesBase64] = useState<string | null>(null);

  /* ---------- Tag Manager modal ---------- */
  const [tagsOpen, setTagsOpen] = useState(false);

  /* ---------- File menu ---------- */
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lastSaveBase, setLastSaveBase] = useState<string | null>(null);

  /* ---------- per-project "Project Tags" ---------- */
  const [projectTags, setProjectTags] = useState<TagLite[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSel, setPickerSel] = useState<string>('');

  /* ---------- sidebar collapse ---------- */
  const [leftOpen, setLeftOpen] = useState<boolean>(true);

  /* ---------- store ---------- */
  const {
    tool, setTool,
    zoom, setZoom,
    fileName, setFileName,
    pages, setPages,
    pageCount, setPageCount,
    pageLabels, setPageLabels,
    activePage, setActivePage,
    tags,
    currentTag, setCurrentTag,
    setSelectedIds,
    setProjectName,
  } = useStore();

  /* =========================================================================================
     FILE MENU  — New / Open / Save / Save As / Print / Close
     ========================================================================================= */

  const makeBundle = useCallback<() => SKDBundle>(() => {
    const state = useStore.getState();
    const core: ProjectSave = {
      fileName: state.fileName,
      pages: state.pages.map(page => ({
        pageIndex: page.pageIndex,
        pixelsPerFoot: page.pixelsPerFoot,
        unit: page.unit || 'ft',
        objects: page.objects || []
      })),
      tags: state.tags
    };
    const bundle: SKDBundle = {
      kind: 'skdproj',
      version: 1,
      projectTags,
      core,
      pdf: pdfBytesBase64 ? { name: pdfName || fileName || 'document.pdf', bytesBase64: pdfBytesBase64 } : undefined
    };
    return bundle;
  }, [projectTags, pdfBytesBase64, pdfName, fileName]);

  const downloadBundle = useCallback((basename?: string) => {
    const base = (basename || lastSaveBase || 'project').replace(/\.(skdproj|json)$/i, '');
    const filename = `${base}.skdproj`;
    const blob = new Blob([JSON.stringify(makeBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setLastSaveBase(base);
  }, [makeBundle, lastSaveBase]);

  function doNewProject() {
    if (!confirm('Start a new project? Unsaved changes will be lost.')) return;
    setPdf(null);
    setPdfName('');
    setPdfBytesBase64(null);
    setFileName('');
    setPages([]);
    setPageCount(0);
    setPageLabels([]);
    setActivePage(0);
    useStore.getState().setSelectedIds([]);
    setCurrentTag('');
    setProjectTags([]);
    setProjectName('Untitled Project');
    setLastSaveBase(null);
  }

  /** open .skdproj and auto-restore embedded PDF */
  async function doOpenProject(file: File) {
    let text = '';
    try {
      text = await file.text();
      const parsed = JSON.parse(text);
      const bundle: SKDBundle =
        parsed && parsed.kind === 'skdproj'
          ? parsed
          : { kind: 'skdproj', version: 1, core: parsed as ProjectSave, projectTags: [], pdf: undefined };

      // Load the store portion
      try {
        const state = useStore.getState();
        
        // Restore pages with objects
        if (bundle.core.pages && Array.isArray(bundle.core.pages)) {
          state.setPages(bundle.core.pages.map(page => ({
            pageIndex: page.pageIndex,
            pixelsPerFoot: page.pixelsPerFoot,
            unit: page.unit || 'ft',
            calibrated: !!page.pixelsPerFoot,
            objects: page.objects || []
          })));
        }
        
        // Restore tags
        if (bundle.core.tags && Array.isArray(bundle.core.tags)) {
          state.importTags(bundle.core.tags);
        }
        
        // Set filename
        if (bundle.core.fileName) {
          state.setFileName(bundle.core.fileName);
        }
      } catch (err: any) {
        console.warn('[Open Project] fromProject warning:', err?.message || err);
      }

      // header project name
      try {
        const coreAny: any = bundle.core ?? {};
        const openedName =
          typeof coreAny.name === 'string' && coreAny.name.trim() ? coreAny.name :
          typeof coreAny.projectName === 'string' && coreAny.projectName.trim() ? coreAny.projectName :
          'Untitled Project';
        setProjectName(openedName);
      } catch { /* ignore */ }

      // restore project tags
      setProjectTags(Array.isArray(bundle.projectTags) ? bundle.projectTags : []);

      // restore PDF if present
      if (bundle.pdf && typeof bundle.pdf.bytesBase64 === 'string' && bundle.pdf.bytesBase64.length > 0) {
        try {
          console.log('[Open Project] Loading embedded PDF...');
          const ab = b64ToAb(bundle.pdf.bytesBase64);
          const u8 = new Uint8Array(ab);
          if (!looksLikePdf(u8)) throw new Error('Embedded bytes are not a PDF (missing %PDF- header)');
          
          console.log(`[Open Project] PDF bytes validated: ${u8.length} bytes`);
          const doc = await loadPdfFromBytes(u8);

          setPdf(doc);
          setPdfName(bundle.pdf.name || 'document.pdf');
          setFileName(bundle.pdf.name || 'document.pdf');
          setPdfBytesBase64(bundle.pdf.bytesBase64);

          setPages([]);
          setPageCount(doc.numPages);
          setPageLabels(await resolvePageLabels(doc));
          setActivePage(0);
          useStore.getState().setSelectedIds([]);
          
          console.log(`[Open Project] PDF loaded successfully: ${doc.numPages} pages`);
        } catch (err: any) {
          console.error('[Open Project] Could not load embedded PDF:', err?.message || err);
          setPdf(null);
          setFileName('');
          // Don't throw - allow project to load without PDF
        }
      } else {
        setPdf(null);
        setFileName('');
      }

      setLastSaveBase(file.name.replace(/\.skdproj$/i, '').replace(/\.json$/i, ''));
    } catch (e: any) {
      console.error('[Open Project] Invalid .skdproj:', e?.message || e, { filePreview: text.slice(0, 200) });
      alert(`Failed to open project: ${e?.message || 'Invalid file format'}`);
    }
  }

  function doSave() { downloadBundle(); }
  function doSaveAs() {
    const name = prompt('Save As (.skdproj basename):', lastSaveBase ?? 'project');
    if (!name) return;
    downloadBundle(name);
  }
  function doPrint() { window.print(); }
  function doCloseProject() { doNewProject(); }

  /* =========================================================================================
     OPEN PDF (embed bytes into project state)
     ========================================================================================= */
  const openPdf = useCallback(async (file: File) => {
    const buf = await file.arrayBuffer();

    // Store as base64 in the project bundle
    let b64 = '';
    {
      const v = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
      b64 = btoa(s);
    }

    setPdfBytesBase64(b64);
    setPdfName(file.name);

    // Always feed pdf.js a Uint8Array
    const doc = await loadPdfFromBytes(new Uint8Array(buf));
    setPdf(doc);
    setFileName(file.name);
    setPages([]);
    setPageCount(doc.numPages);
    setPageLabels(await resolvePageLabels(doc));
    setActivePage(0);
    useStore.getState().setSelectedIds([]);
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage, setSelectedIds]);

  /* =========================================================================================
     SIMPLE SUMMARY (BOM)
     ========================================================================================= */
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

  /* =========================================================================================
     ADD-FROM-DB PICKER (grouped by category, Lights/Receptacles first)
     ========================================================================================= */
  const PICKER_TOP_CATS = ['Lights', 'Receptacles'] as const;

  const pickerGroups = useMemo(() => {
    const remaining = (tags as Tag[])
      .filter(t => !projectTags.some(p => p.id === t.id));

    const byCat = new Map<string, Tag[]>();
    for (const t of remaining) {
      const cat = t.category || 'Uncategorized';
      const arr = byCat.get(cat) ?? [];
      arr.push(t);
      byCat.set(cat, arr);
    }
    for (const arr of byCat.values()) {
      arr.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }
    const cats = Array.from(byCat.keys());
    const ordered = [
      ...PICKER_TOP_CATS.filter(c => byCat.has(c as unknown as string)) as unknown as string[],
      ...cats.filter(c => !PICKER_TOP_CATS.includes(c as any)).sort((a, b) => a.localeCompare(b)),
    ];
    return ordered.map(cat => ({ category: cat, items: byCat.get(cat)! }));
  }, [tags, projectTags]);

  const flatPickerList = useMemo(
    () => pickerGroups.flatMap(g => g.items.map(t => ({
      id: t.id, code: t.code, name: t.name, color: t.color, category: t.category
    }))),
    [pickerGroups]
  );

  // Header label always prefers store's project name
  const headerProjectLabel = useStore(s => s.getProjectName());

  /* =========================================================================================
     RENDER
     ========================================================================================= */
  return (
    <div className="app_root" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {/* FILE MENU BAR */}
      <div style={{display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'#0d3b66', color:'#fff', position:'sticky', top:0, zIndex:50}}>
        <div style={{position:'relative'}}>
          <button className="btn" style={{color:'#fff', borderColor:'#2d5c8f', background:'#124a85'}} onClick={()=>setFileMenuOpen(v=>!v)}>File ▾</button>
          {fileMenuOpen && (
            <div
              style={{
                position:'fixed',
                top:56, left:12, background:'#fff', color:'#111',
                border:'1px solid #ddd', borderRadius:6, boxShadow:'0 8px 28px rgba(0,0,0,.18)',
                width:240, zIndex:1000
              }}
              onMouseLeave={()=>setFileMenuOpen(false)}
            >
              <MenuItem label="New" onClick={()=>{setFileMenuOpen(false); doNewProject();}} />
              <MenuItem label="Open…" onClick={()=>{ setFileMenuOpen(false); projFileRef.current?.click(); }} />
              <MenuItem label="Save" onClick={()=>{setFileMenuOpen(false); doSave();}} />
              <MenuItem label="Save As…" onClick={()=>{setFileMenuOpen(false); doSaveAs();}} />
              <MenuItem label="Print" onClick={()=>{setFileMenuOpen(false); doPrint();}} />
              <div style={{borderTop:'1px solid #eee'}} />
              <MenuItem label="Close Project" onClick={()=>{setFileMenuOpen(false); doCloseProject();}} />
            </div>
          )}
        </div>

        {/* Company + Project Name (click to rename) */}
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{fontSize:16, fontWeight:700}}>SKD Services</div>
          <div style={{opacity:.7}}>·</div>
          <button
            title="Click to rename project"
            onClick={()=>{ const next = prompt('Project name:', headerProjectLabel); if (next != null) setProjectName(next.trim() || 'Untitled Project'); }}
            className="btn"
            style={{
              background:'transparent',
              border:'1px dashed rgba(255,255,255,.35)',
              color:'#fff',
              padding:'2px 8px',
              borderRadius:6,
              cursor:'pointer',
              fontWeight:600,
              maxWidth:340,
              whiteSpace:'nowrap',
              overflow:'hidden',
              textOverflow:'ellipsis'
            }}
          >
            {headerProjectLabel}
          </button>
        </div>

        {/* hidden project file input (.skdproj) */}
        <input
          ref={projFileRef}
          type="file"
          accept=".skdproj,application/json"
          style={{display:'none'}}
          onChange={async (e)=>{ const input=e.currentTarget; const f=input.files?.[0]; input.value=''; if (f) await doOpenProject(f); }}
        />

        <div style={{flex:1}} />

        {/* quick open PDF right from the menu bar */}
        <input
          ref={pdfFileRef}
          type="file"
          accept="application/pdf"
          style={{display:'none'}}
          onChange={async (e)=>{ const input=e.currentTarget; const f=input.files?.[0]; input.value=''; if (f) await openPdf(f); }}
        />
        <button className="btn" onClick={()=>pdfFileRef.current?.click()}>Open PDF</button>
        <span style={{marginLeft:8, maxWidth:320, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={pdfName || fileName}>
          {pdfName || fileName}
        </span>
      </div>

      {/* TOOLBAR (tools + zoom) */}
      <div className="toolbar" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderBottom:'1px solid #e6e6e6', position:'sticky', top:48, background:'#fff', zIndex:40}}>
        {pageCount > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:6}}>
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

        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <button className={`btn ${tool==='hand'?'active':''}`} onClick={()=>setTool('hand')}>Hand</button>
          <button className={`btn ${tool==='count'?'active':''}`} onClick={()=>setTool('count')}>Count</button>
          <button className={`btn ${tool==='segment'?'active':''}`} onClick={()=>setTool('segment')}>Measure</button>
          <button className={`btn ${tool==='polyline'?'active':''}`} onClick={()=>setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool==='freeform'?'active':''}`} onClick={()=>setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool==='calibrate'?'active':''}`} onClick={()=>setTool('calibrate')}>Calibrate</button>

          <span className="badge">Tag:</span>
          <input value={currentTag} onChange={(e)=>setCurrentTag(e.target.value.toUpperCase())} style={{width:60, padding:'.25rem .4rem'}} />

          <button className="btn" onClick={()=>setZoom(zoom*0.9)}>-</button>
          <span className="badge">{Math.round(zoom*100)}%</span>
          <button className="btn" onClick={()=>setZoom(zoom*1.1)}>+</button>
        </div>

        <div style={{flex:1}} />

        <button className="btn" onClick={()=>setTagsOpen(true)}>Tags</button>
        <button className="btn" onClick={()=>{ const data: ProjectSave = useStore.getState().toProject(); saveProject(data); alert('Saved locally. Use File ▸ Save for .skdproj.'); }}>Save (Local)</button>
        <button className="btn" onClick={()=>{ const data = loadProject(); if (data){ useStore.getState().fromProject(data); setPdf(null); alert('Loaded local project. Use File ▸ Open for .skdproj.'); } else alert('No local save.');}}>Load (Local)</button>
        <button className="btn" onClick={()=>{ navigator.clipboard.writeText(exportJSON(useStore.getState().toProject())); alert('Copied JSON.'); }}>Export JSON</button>
        <button className="btn" onClick={()=>{ const s=prompt('Paste JSON:'); if(!s)return; try{ useStore.getState().fromProject(importJSON(s)); setPdf(null); alert('Imported. Open the matching PDF.'); }catch(e:any){ alert('Invalid JSON: '+e.message);} }}>Import JSON</button>
      </div>

      {/* PROJECT TAGS BAR */}
      <div className="quickbar" style={{display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderBottom:'1px solid #eee', position:'sticky', top:96, background:'#fff', zIndex:30}}>
        <div className="label" style={{minWidth:110, fontWeight:700}}>Project Tags</div>

        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', flex:1}}>
          {projectTags.length === 0 && <span style={{color:'#777'}}>None — add from Tag DB ▼</span>}
          {projectTags.map(t => {
            const active = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            return (
              <button
                key={t.id}
                className={`btn ${active ? 'active' : ''}`}
                onClick={()=>{ setTool('count'); setCurrentTag(t.code); }}
                title={`${t.code} — ${t.name}`}
                style={{display:'flex', alignItems:'center', gap:6, position:'relative'}}
              >
                <span style={{width:20, height:20, borderRadius:4, border:'1px solid #444', background: (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color}} />
                <span style={{minWidth:26, textAlign:'center', fontWeight: active ? 700 : 600}}>{t.code}</span>
                <span
                  onClick={(e)=>{ e.stopPropagation(); setProjectTags(list => list.filter(x => x.id !== t.id)); if (currentTag === t.code) setCurrentTag(''); }}
                  title="Remove from Project Tags"
                  style={{position:'absolute', top:-6, right:-6, width:18, height:18, lineHeight:'16px', textAlign:'center',
                          border:'1px solid #bbb', borderRadius:'50%', background:'#fff', cursor:'pointer', fontSize:11}}
                >×</span>
              </button>
            );
          })}
        </div>

        <div style={{position:'relative'}}>
          <button className="btn" onClick={()=>setPickerOpen(v=>!v)}>Add from DB</button>
          {pickerOpen && (
            <div
              style={{
                position:'fixed',
                top:140,
                right:12,
                background:'#fff',
                border:'1px solid #ddd',
                borderRadius:6,
                padding:8,
                width:360,
                zIndex:999
              }}
            >
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <select
                  className="btn"
                  value={pickerSel}
                  onChange={(e)=>setPickerSel(e.target.value)}
                  style={{flex:1}}
                >
                  <option value="">— Select tag —</option>
                  {pickerGroups.map(g => (
                    <optgroup key={g.category} label={g.category}>
                      {g.items.map(t => (
                        <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={()=>{
                    const pick = flatPickerList.find(t => t.id === pickerSel);
                    if (!pick) return;
                    setProjectTags(list => (list.some(x => x.id === pick.id) ? list : [...list, pick]));
                    setCurrentTag(pick.code);
                    setTool('count');
                    setPickerSel('');
                    setPickerOpen(false);
                  }}
                >
                  Add
                </button>
                <button className="btn" title="Close" onClick={()=>setPickerOpen(false)}>×</button>
              </div>
              <div style={{marginTop:6, fontSize:12, color:'#666'}}>Tip: open "Tags" to load the master DB first.</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN AREA: Sidebar (BOM) + Viewer */}
      <div className="viewer" style={{
        display:'grid',
        gridTemplateColumns: leftOpen ? '320px 1fr' : '0 1fr',
        transition:'grid-template-columns .18s ease',
        minHeight:0, flex:1, position:'relative'
      }}>
        {leftOpen ? (
          <button className="btn" onClick={()=>setLeftOpen(false)} style={{position:'absolute', top:8, left:8, zIndex:5}} title="Hide sidebar">‹ Hide</button>
        ) : (
          <button className="btn" onClick={()=>setLeftOpen(true)} style={{position:'absolute', top:8, left:8, zIndex:5}} title="Show sidebar">☰ BOM</button>
        )}

        <aside className="sidebar" style={{ borderRight:'1px solid #eee', overflow:'auto', opacity: leftOpen ? 1 : 0, pointerEvents: leftOpen ? 'auto' : 'none' }}>
          <SidebarBOM bom={bom} />
        </aside>

        <div style={{position:'relative', overflow:'auto'}}>
          {!pdf && (
            <div style={{padding:'2rem'}}>
              <div className="drop" style={{border:'2px dashed #bbb', borderRadius:8, padding:'2rem', color:'#666', textAlign:'center'}}>
                Drop a PDF to begin or use the file picker.
              </div>
            </div>
          )}
          {pdf && <PDFViewport pdf={pdf} />}
        </div>
      </div>

      <TagManager
        open={tagsOpen}
        onClose={()=>setTagsOpen(false)}
        onAddToProject={(t: Tag) => {
          setProjectTags(list => (list.some(x => x.id === t.id) ? list
            : [...list, { id: t.id, code: t.code, name: t.name, color: t.color, category: t.category }]));
          setCurrentTag(t.code);
          setTool('count');
          setTagsOpen(false);
        }}
      />
    </div>
  );
}

function SidebarBOM({ bom }:{
  bom: {
    totalTags: number; segLF: number; plLF: number; ffLF: number; totalLF: number;
    rows: { code:string; tags:number; meas:number; lf:number }[];
    calibratedCount: number; totalPages: number;
  }
}) {
  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', position:'sticky', top:0, background:'#fff', zIndex:2, borderBottom:'1px solid #f2f2f2'}}>
        <div className="label" style={{fontWeight:700}}>BOM Summary</div>
      </div>

      <div style={{padding:'10px'}}>
        <div style={{padding:'0 0 12px 0', color:'#666', fontSize:13}}>
          {bom.calibratedCount}/{bom.totalPages} page(s) calibrated.
        </div>

        <div style={{padding:'0 0 12px 0'}}>
          <div style={{marginBottom:8, fontWeight:600}}>Totals</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:6}}>
            <div>Total Tags:</div><div>{bom.totalTags}</div>
            <div>Segment LF:</div><div>{bom.segLF.toFixed(2)}</div>
            <div>Polyline LF:</div><div>{bom.plLF.toFixed(2)}</div>
            <div>Freeform LF:</div><div>{bom.ffLF.toFixed(2)}</div>
            <div style={{fontWeight:700}}>Total LF:</div><div style={{fontWeight:700}}>{bom.totalLF.toFixed(2)}</div>
          </div>
        </div>

        <div style={{padding:'0 0 20px 0'}}>
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
    </div>
  );
}

function MenuItem({label, onClick}:{label:string; onClick:()=>void}) {
  return (
    <div onClick={onClick} style={{padding:'10px 14px', cursor:'pointer'}} onKeyDown={(e)=>{ if (e.key==='Enter') onClick(); }} tabIndex={0}>
      {label}
    </div>
  );
}