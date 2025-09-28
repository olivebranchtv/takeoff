import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import type { Tag } from '@/types';
import { downloadTagsFile } from '@/utils/persist';

type Props = { open: boolean; onClose: () => void };
type Draft = Omit<Tag, 'id'>;

const emptyDraft: Draft = { code: '', name: '', category: '', color: '#FFA500' };

export default function TagManager({ open, onClose }: Props) {
  // ---- hooks (must be called every render, regardless of `open`) ----
  const {
    tags, palette, addTag, updateTag, deleteTag, importTags, exportTags
  } = useStore();

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDraft(emptyDraft);
      setEditId(null);
      setError('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...tags].sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') || a.code.localeCompare(b.code)
    );
    if (!q) return list;
    return list.filter(t =>
      t.code.toLowerCase().includes(q) ||
      (t.name || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  }, [tags, query]);

  // If not open, render nothing (after all hooks have run)
  if (!open) return null;

  // ---- actions ----
  function startNew() {
    setEditId(null);
    setDraft(d => ({ ...emptyDraft, color: d.color || '#FFA500' }));
    setError('');
  }
  function startEdit(t: Tag) {
    setEditId(t.id);
    setDraft({ code: t.code, name: t.name, category: t.category, color: t.color });
    setError('');
  }
  function cancelEdit() {
    setEditId(null);
    setDraft(emptyDraft);
    setError('');
  }

  function validate(next: Draft): string {
    if (!next.code.trim()) return 'Code is required.';
    if (!/^[a-z0-9\-]+$/i.test(next.code.trim())) return 'Use letters/numbers/hyphen only for Code.';
    const dup = tags.find(t => t.code.toUpperCase() === next.code.trim().toUpperCase());
    if (!editId && dup) return `Code “${next.code.toUpperCase()}” already exists.`;
    return '';
  }

  function add() {
    const next: Draft = { ...draft, code: draft.code.trim().toUpperCase() };
    const msg = validate(next);
    if (msg) { setError(msg); return; }
    addTag(next);
    setDraft(d => ({ ...d, code: '', name: '' }));
    setError('');
  }

  function saveEdit() {
    if (!editId) return;
    const next: Draft = { ...draft, code: draft.code.trim().toUpperCase() };
    const msg = validate(next);
    if (msg && msg.includes('already exists')) {
      const conflict = tags.find(t => t.code.toUpperCase() === next.code.toUpperCase());
      if (!conflict || conflict.id !== editId) { setError(msg); return; }
    } else if (msg) { setError(msg); return; }

    updateTag(editId, next);
    cancelEdit();
  }

  function remove(id: string) {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    if (confirm(`Delete tag ${tag.code}?`)) deleteTag(id);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error('Expected an array of tags');
        importTags(parsed as Tag[]);
        alert('Tags imported.');
      } catch (err:any) { alert('Invalid tags file: ' + err.message); }
    };
    reader.readAsText(f);
  }

  const headerNote =
    'Lights category always renders orange on the plan, regardless of saved color.';

  return (
    <div style={S.backdrop} onMouseDown={onClose}>
      <div style={S.modal} onMouseDown={e => e.stopPropagation()}>
        {/* Title Bar */}
        <div style={S.titleBar}>
          <div>
            <div style={S.title}>Tag Database</div>
            <div style={S.subtitle}>{headerNote}</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
            <button className="btn" onClick={() => downloadTagsFile('tags.json', exportTags())}>Export JSON</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Toolbar (search + new) */}
        <div style={S.toolbar}>
          <input
            placeholder="Search by code, name, or category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={S.search}
          />
          <button className="btn" onClick={startNew}>New Tag</button>
        </div>

        {/* Editor Card */}
        <div style={S.card}>
          <div style={S.formRow}>
            {/* Color grid */}
            <div style={{minWidth: 210}}>
              <div style={S.label}>Color</div>
              <div style={S.colorGrid}>
                {palette.map(c => {
                  const selected = draft.color === c;
                  return (
                    <button
                      key={c}
                      title={c}
                      onClick={() => setDraft(d => ({ ...d, color: c }))}
                      style={{
                        ...S.swatch,
                        background: c,
                        border: selected ? '3px solid #333' : '1px solid #bbb',
                        boxShadow: selected ? '0 0 0 1px #fff inset' : 'none'
                      }}
                      aria-label={`Pick ${c}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Fields */}
            <div style={{display:'grid', gridTemplateColumns:'130px 220px 1fr', gap:12, alignItems:'center', flex:1}}>
              <div>
                <div style={S.label}>Code</div>
                <input
                  value={draft.code}
                  onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                  placeholder="A1"
                  style={S.input}
                  onKeyDown={(e)=>{ if (e.key==='Enter') (editId ? saveEdit() : add()); }}
                />
              </div>
              <div>
                <div style={S.label}>Category</div>
                <input
                  value={draft.category}
                  onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                  placeholder="Lights / Switches / Receptacles ..."
                  style={S.input}
                  onKeyDown={(e)=>{ if (e.key==='Enter') (editId ? saveEdit() : add()); }}
                />
              </div>
              <div>
                <div style={S.label}>Name</div>
                <input
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Fixture A1 - 2x4 LED"
                  style={S.input}
                  onKeyDown={(e)=>{ if (e.key==='Enter') (editId ? saveEdit() : add()); }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex', alignItems:'flex-end', gap:8}}>
              {editId ? (
                <>
                  <button className="btn" onClick={saveEdit}>Save</button>
                  <button className="btn" onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <button className="btn" onClick={add}>Add Tag</button>
              )}
            </div>
          </div>

          {error && <div style={S.error}>{error}</div>}
        </div>

        {/* Table */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.thNarrow}>Color</th>
                <th style={S.thCode}>Code</th>
                <th style={S.thCat}>Category</th>
                <th>Name</th>
                <th style={S.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{
                      width:20, height:20, borderRadius:4,
                      background: t.color, border:'1px solid #999', margin:'0 auto'
                    }}/>
                  </td>
                  <td style={{fontWeight:600}}>{t.code}</td>
                  <td>{t.category}</td>
                  <td>{t.name}</td>
                  <td>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <button className="btn" onClick={() => startEdit(t)}>Edit</button>
                      <button className="btn" onClick={() => remove(t.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign:'center', color:'#666', padding:'14px 0'}}>
                    No tags match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Hidden file input for imports */}
        <input ref={fileRef} type="file" accept="application/json" onChange={onPickFile} style={{display:'none'}} />
      </div>
    </div>
  );
}

/* ---------- Inline styles ---------- */
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999,
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  modal: {
    background:'#fff', width:1000, maxWidth:'92vw', maxHeight:'90vh',
    overflow:'hidden', borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,0.25)',
    display:'flex', flexDirection:'column'
  },
  titleBar: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    padding:'14px 16px 8px', borderBottom:'1px solid #eee', background:'#fafafa'
  },
  title: { fontSize:20, fontWeight:700, marginBottom:4 },
  subtitle: { fontSize:12, color:'#666' },
  toolbar: {
    display:'flex', gap:8, alignItems:'center',
    padding:'10px 16px', borderBottom:'1px solid #f2f2f2', background:'#fff'
  },
  search: {
    flex:1, padding:'8px 10px', border:'1px solid #ccc', borderRadius:8, fontSize:14
  },
  card: {
    padding:'12px 16px', borderBottom:'1px solid #f2f2f2', background:'#fff'
  },
  formRow: {
    display:'grid',
    gridTemplateColumns:'210px 1fr auto',
    gap:16,
    alignItems:'start'
  },
  label: { fontSize:12, fontWeight:600, color:'#444', marginBottom:6 },
  input: {
    width:'100%', padding:'8px 10px', border:'1px solid #ccc', borderRadius:8, fontSize:14
  },
  colorGrid: {
    display:'grid', gridTemplateColumns:'repeat(10, 24px)', gap:6
  },
  swatch: {
    width:20, height:20, borderRadius:4, cursor:'pointer'
  },
  error: {
    marginTop:10, color:'#b00020', fontSize:13, fontWeight:600
  },
  tableWrap: {
    overflow:'auto', padding:'0 16px 16px'
  },
  table: {
    width:'100%', borderCollapse:'separate', borderSpacing:0
  },
  thNarrow: {
    width:70, textAlign:'center', padding:'10px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff'
  },
  thCode: {
    width:100, textAlign:'left', padding:'10px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff'
  },
  thCat: {
    width:200, textAlign:'left', padding:'10px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff'
  },
  thActions: {
    width:170, textAlign:'right', padding:'10px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff'
  },
};
