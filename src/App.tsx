// src/App.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import type { PDFDoc } from '@/lib/pdf';
import { loadPdf } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { useStore } from '@/state/store';
import { exportJSON, importJSON, loadProject, saveProject } from '@/utils/persist';
import type { AnyTakeoffObject, ProjectSave } from '@/types';
import { pathLength } from '@/utils/geometry';

type TagLite = { id: string; code: string; name: string; color: string; category?: string };

function MenuItem({ label, onClick }: {label:string; onClick:()=>void}) {
  return (
    <button
      className="btn"
      style={{ display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'none', borderBottom:'1px solid #f2f2f2', background:'#fff', padding:'10px 12px' }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Small portal popover used by “Add from DB” */
function Popover({
  anchor,
  onClose,
  children,
  width = 320,
  maxHeight = '70vh'
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  maxHeight?: string | number;
}) {
  const [pos, setPos] = useState<{top:number; left:number}>({ top: 0, left: 0 });

  useEffect(() => {
    function position() {
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const L = Math.min(
        Math.max(8, r.left),
        Math.max(8, window.innerWidth - width - 8)
      );
      const T = Math.min(
        r.bottom + 8,
        Math.max(8, window.innerHeight - 8 - 200) // leave room
      );
      setPos({ top: T, left: L });
    }
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose, width]);

  return createPortal(
    <>
      {/* light backdrop for outside-click */}
      <div
        onMouseDown={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'transparent', zIndex: 9998
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width,
          maxHeight,
          overflow: 'auto',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          boxShadow: '0 10px 28px rgba(0,0,0,.18)',
          zIndex: 9999,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

export default function App() {
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const projFileRef = useRef<HTMLInputElement>(null);

  const [pdf, setPdf] = useState<PDFDoc | null>(null);

  const [tagsOpen, setTagsOpen] = useState(false);

  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lastSaveBase, setLastSaveBase] = useState<string | null>(null);

  // Project Tags (starts empty)
  const [projectTags, setProjectTags] = useState<TagLite[]>([]);

  // Add-from-DB popover
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSel, setPickerSel] = useState<string>('');

  // BOM collapse
  const [bomOpen, setBomOpen] = useState(true);

  // Store
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
  } = useStore();

  /** ================= FILE MENU (.skdproj) ================= */
  const makeBundle = useCallback(() => {
    const core: ProjectSave = useStore.getState().toProject();
    return { kind: 'skdproj', version: 1, projectTags, core };
  }, [projectTags]);

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
    setFileName('');
    setPages([]);
    setPageCount(0);
    setPageLabels([]);
    setActivePage(0);
    // optional store API – safe call
    useStore.getState().setSelectedIds?.([]);
    setCurrentTag('');
    setProjectTags([]);
    setLastSaveBase(null);
  }

  function doOpenProject(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = JSON.parse(text);
        const bundle = parsed?.kind === 'skdproj'
          ? parsed
          : { kind: 'skdproj', version: 1, core: parsed, projectTags: [] };
        useStore.getState().fromProject(bundle.core);
        setProjectTags(bundle.projectTags || []);
        setPdf(null);
        setFileName('');
        setLastSaveBase(file.name.replace(/\.skdproj$/i, '').replace(/\.json$/i, ''));
        alert('Project opened. Now open the matching PDF.');
      } catch (e: any) {
        alert('Invalid .skdproj: ' + e.message);
      }
    };
    reader.readAsText(file);
  }
  const doSave = () => downloadBundle();
  const doSaveAs = () => {
    const name = prompt('Save As (.skdproj basename):', lastSaveBase ?? 'project');
    if (name) downloadBundle(name);
  };
  const doPrint = () => window.print();
  const doCloseProject = () => doNewProject();

  /** ================= OPEN PDF ================= */
  const openPdf = useCallback(async (file: File) => {
    const doc = await loadPdf(file);
    setPdf(doc);
    setFileName(file.name);
    setPages([]);
    setPageCount(doc.numPages);

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
    useStore.getState().setSelectedIds?.([]);
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage]);

  /** ================= BOM summary (unchanged math) ================= */
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

  /** ================= helpers ================= */
  function colorForTag(t: TagLite) {
    return (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color;
  }
  const availableForPicker = tags
    .filter(t => !projectTags.some(p => p.code.toUpperCase() === (t.code || '').toUpperCase()))
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

  /** ================= RENDER ================= */
  return (
    <div className="app_root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* FILE MENU BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#0d3b66', color: '#fff', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ position: 'relative' }}>
          <button className="btn" style={{ color: '#fff', borderColor: '#2d5c8f', background: '#124a85' }} onClick={() => setFileMenuOpen(v => !v)}>File ▾</button>
          {fileMenuOpen && (
            <div
              style={{
                position: 'fixed', // fixed so it always opens over everything
                top: 52, left: 12,
                background: '#fff', color: '#111',
                border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 12px 28px rgba(0,0,0,.18)',
                width: 240, overflow: 'hidden', zIndex: 2000
              }}
              onMouseLeave={() => setFileMenuOpen(false)}
            >
              <MenuItem label="New" onClick={() => { setFileMenuOpen(false); doNewProject(); }} />
              <MenuItem label="Open…" onClick={() => { setFileMenuOpen(false); projFileRef.current?.click(); }} />
              <MenuItem label="Save" onClick={() => { setFileMenuOpen(false); doSave(); }} />
              <MenuItem label="Save As…" onClick={() => { setFileMenuOpen(false); doSaveAs(); }} />
              <MenuItem label="Print" onClick={() => { setFileMenuOpen(false); doPrint(); }} />
              <div style={{ borderTop: '1px solid #eee' }} />
              <MenuItem label="Close Project" onClick={() => { setFileMenuOpen(false); doCloseProject(); }} />
            </div>
          )}
        </div>

        {/* hidden project file input (.skdproj) */}
        <input
          ref={projFileRef}
          type="file"
          accept=".skdproj,application/json"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) doOpenProject(f); e.currentTarget.value = ''; }}
        />

        <div style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>SKD Services</div>
        <div style={{ flex: 1 }} />

        {/* quick open PDF */}
        <input
          ref={pdfFileRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) openPdf(f); e.currentTarget.value = ''; }}
        />
        <button className="btn" onClick={() => pdfFileRef.current?.click()}>Open PDF</button>
        <span style={{ marginLeft: 8, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fileName}>{fileName}</span>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #e6e6e6', position: 'sticky', top: 48, background: '#fff', zIndex: 900 }}>
        {/* Page nav */}
        {pageCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn" onClick={() => setActivePage(Math.max(0, activePage - 1))} disabled={activePage <= 0}>◀</button>
            <select className="btn" value={activePage} onChange={(e) => setActivePage(parseInt(e.target.value, 10))}>
              {Array.from({ length: pageCount }, (_, i) => (
                <option key={i} value={i}>{i + 1} — {pageLabels[i] || `Page ${i + 1}`}</option>
              ))}
            </select>
            <button className="btn" onClick={() => setActivePage(Math.min(pageCount - 1, activePage + 1))} disabled={activePage >= pageCount - 1}>▶</button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button className={`btn ${tool === 'hand' ? 'active' : ''}`} onClick={() => setTool('hand')}>Hand</button>
          <button className={`btn ${tool === 'count' ? 'active' : ''}`} onClick={() => setTool('count')}>Count</button>
          <button className={`btn ${tool === 'segment' ? 'active' : ''}`} onClick={() => setTool('segment')}>Measure</button>
          <button className={`btn ${tool === 'polyline' ? 'active' : ''}`} onClick={() => setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool === 'freeform' ? 'active' : ''}`} onClick={() => setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool === 'calibrate' ? 'active' : ''}`} onClick={() => setTool('calibrate')}>Calibrate</button>

          <span className="badge">Tag:</span>
          <input value={currentTag} onChange={(e) => setCurrentTag(e.target.value.toUpperCase())} style={{ width: 70, padding: '.25rem .4rem' }} />

          <button className="btn" onClick={() => setZoom(zoom * 0.9)}>-</button>
          <span className="badge">{Math.round(zoom * 100)}%</span>
          <button className="btn" onClick={() => setZoom(zoom * 1.1)}>+</button>

          <button className="btn" onClick={() => setTagsOpen(true)}>Tags</button>
          <button className="btn" onClick={() => { const data: ProjectSave = useStore.getState().toProject(); saveProject(data); alert('Saved locally. Use File ▸ Save for .skdproj.'); }}>Save (Local)</button>
          <button className="btn" onClick={() => { const data = loadProject(); if (data) { useStore.getState().fromProject(data); setPdf(null); alert('Loaded local project. Use File ▸ Open for .skdproj.'); } else alert('No local save.'); }}>Load (Local)</button>
          <button className="btn" onClick={() => { navigator.clipboard.writeText(exportJSON(useStore.getState().toProject())); alert('Copied JSON.'); }}>Export JSON</button>
          <button className="btn" onClick={() => { const s = prompt('Paste JSON:'); if (!s) return; try { useStore.getState().fromProject(importJSON(s)); setPdf(null); alert('Imported. Open the matching PDF.'); } catch (e: any) { alert('Invalid JSON: ' + e.message); } }}>Import JSON</button>
        </div>
      </div>

      {/* PROJECT TAGS BAR */}
      <div className="quickbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #eee', position: 'sticky', top: 96, background: '#fff', zIndex: 800 }}>
        <div className="label" style={{ minWidth: 110, fontWeight: 700 }}>Project Tags</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {projectTags.length === 0 && <span style={{ color: '#777' }}>None — add from Tag DB ▼</span>}
          {projectTags.map(t => {
            const active = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            return (
              <button
                key={t.id}
                className={`btn ${active ? 'active' : ''}`}
                onClick={() => { setTool('count'); setCurrentTag(t.code); }}
                title={`${t.code} — ${t.name}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}
              >
                <span style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #444', background: colorForTag(t) }} />
                <span style={{ minWidth: 26, textAlign: 'center', fontWeight: active ? 700 : 600 }}>{t.code}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); setProjectTags(list => list.filter(x => x.id !== t.id)); if (currentTag === t.code) setCurrentTag(''); }}
                  title="Remove from Project Tags"
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18, lineHeight: '16px', textAlign: 'center',
                    border: '1px solid #bbb', borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 11
                  }}
                >×</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative' }}>
          <button className="btn" ref={addBtnRef} onClick={() => setPickerOpen(true)}>Add from DB</button>
          {pickerOpen && (
            <Popover anchor={addBtnRef.current} onClose={() => setPickerOpen(false)}>
              <div style={{ padding: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="btn" value={pickerSel} onChange={(e) => setPickerSel(e.target.value)} style={{ flex: 1 }}>
                    <option value="">— Select tag —</option>
                    {availableForPicker.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                  </select>
                  <button
                    className="btn"
                    onClick={() => {
                      const pick = availableForPicker.find(t => t.id === pickerSel);
                      if (!pick) return;
                      setProjectTags(list => [...list, { id: pick.id, code: pick.code, name: pick.name, color: pick.color, category: pick.category }]);
                      setPickerSel(''); setPickerOpen(false);
                    }}
                  >Add</button>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                  Tip: open “Tags” to edit DB entries or import a master set.
                </div>
              </div>
            </Popover>
          )}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="viewer" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 0, flex: 1 }}>
        {/* BOM (collapsible) */}
        <div className="sidebar" style={{ borderRight: '1px solid #eee', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 6px 10px' }}>
            <button
              className="btn"
              onClick={() => setBomOpen(o => !o)}
              title="Collapse/Expand"
              style={{ fontWeight: 700 }}
            >
              {bomOpen ? '▾' : '▸'} BOM Summary
            </button>
            <button
              className="btn"
              onClick={() => {
                const rows = [
                  ['Total Tags', String(bom.totalTags)],
                  ['Segment LF', bom.segLF.toFixed(2)],
                  ['Polyline LF', bom.plLF.toFixed(2)],
                  ['Freeform LF', bom.ffLF.toFixed(2)],
                  ['Total LF', (bom.totalLF).toFixed(2)],
                  [],
                  ['Code', 'Tag Markers', 'Measurements', 'Linear Ft'],
                  ...bom.rows.map(r => [r.code, String(r.tags), String(r.meas), r.lf.toFixed(2)])
                ];
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'bom_summary.csv'; a.click(); URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>

          {bomOpen && (
            <>
              <div style={{ padding: '0 10px 12px 10px', color: '#666', fontSize: 13 }}>
                {bom.calibratedCount}/{bom.totalPages} page(s) calibrated.
              </div>

              <div style={{ padding: '0 10px 12px 10px' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Totals</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6 }}>
                  <div>Total Tags:</div><div>{bom.totalTags}</div>
                  <div>Segment LF:</div><div>{bom.segLF.toFixed(2)}</div>
                  <div>Polyline LF:</div><div>{bom.plLF.toFixed(2)}</div>
                  <div>Freeform LF:</div><div>{bom.ffLF.toFixed(2)}</div>
                  <div style={{ fontWeight: 700 }}>Total LF:</div><div style={{ fontWeight: 700 }}>{bom.totalLF.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ padding: '0 10px 20px 10px' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Counts by Code</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>Code</th>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>Tags</th>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>Meas</th>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>LF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.rows.map(r => (
                      <tr key={r.code} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '6px 4px', fontWeight: 600 }}>{r.code}</td>
                        <td style={{ padding: '6px 4px' }}>{r.tags}</td>
                        <td style={{ padding: '6px 4px' }}>{r.meas}</td>
                        <td style={{ padding: '6px 4px' }}>{r.lf.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Viewer */}
        <div style={{ minWidth: 0, overflow: 'auto', position: 'relative' }}>
          <PDFViewport pdf={pdf} />
        </div>
      </div>

      {/* Tag DB modal */}
      {tagsOpen && <TagManager onClose={() => setTagsOpen(false)} onAddToProject={(t) => {
        // add to Project Tags quickly from Tag DB modal
        if (!projectTags.some(p => p.id === t.id)) {
          setProjectTags(list => [...list, { id: t.id, code: t.code, name: t.name, color: t.color, category: t.category }]);
        }
      }} />}
    </div>
  );
}
