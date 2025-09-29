// src/components/TagManager.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import type { Tag } from '@/types';
import { downloadTagsFile } from '@/utils/persist';
import { DEFAULT_MASTER_TAGS } from '@/constants/masterTags';

type Props = {
  open: boolean;
  onClose: () => void;
  onAddToProject?: (tag: Tag) => void;
};

type Draft = Omit<Tag, 'id'>;

const emptyDraft: Draft = { code: '', name: '', category: '', color: '#FFA500' };

/** Category sort priority, then everything else alphabetically */
const MASTER_CATEGORY_ORDER = [
  'Lights',
  'Receptacles',
  'Switches',
  'Stub-Ups',
  'Fire Alarm',
  'Breakers',
  'Panels',
  'Disconnects',
  'Raceways & Pathways',
  'Conductors & Feeders',
  'Data/Communications',
  'Security',
  'AV / Sound',
  'BAS/Controls',
  'Site Power',
  'Demolition / Temporary',
  'Miscellaneous',
];

const CUSTOM_CAT_VALUE = '__CUSTOM__';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function TagManager({ open, onClose, onAddToProject }: Props) {
  const store = useStore() as any;
  const { tags, palette, addTag, updateTag, deleteTag, importTags, exportTags } = store;

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [catSelect, setCatSelect] = useState<string>(''); // dropdown value
  const [customCategory, setCustomCategory] = useState<string>(''); // for “Custom…”
  const fileRef = useRef<HTMLInputElement>(null);

  const editorCardRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // ---------- DRAGGABLE MODAL POSITION ----------
  const [pos, setPos] = useState<{ left: number; top: number }>(() => {
    // sensible initial position near top/center
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const width = Math.min(1000, vw * 0.92);
    return { left: Math.max(12, (vw - width) / 2), top: 48 };
  });
  const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const startDrag = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
  };
  const onDrag = (e: MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const vw = window.innerWidth, vh = window.innerHeight;
    // keep within viewport bounds with a bit of margin
    setPos({
      left: clamp(dragStart.current.left + dx, 8, vw - 320),
      top: clamp(dragStart.current.top + dy, 8, vh - 120)
    });
  };
  const endDrag = () => {
    dragStart.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
  };

  // reset UI when opened/closed & recenter when opening
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDraft(emptyDraft);
      setEditId(null);
      setError('');
      setCatSelect('');
      setCustomCategory('');
      return;
    }
    // recenter horizontally when opening (keeps last top)
    const vw = window.innerWidth;
    const width = Math.min(1000, vw * 0.92);
    setPos(p => ({ left: Math.max(12, (vw - width) / 2), top: Math.max(16, p.top) }));
  }, [open]);

  // close with ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Build the category list from: master + existing tags
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_MASTER_TAGS.forEach(t => t.category && set.add(t.category));
    (tags as Tag[]).forEach(t => t.category && set.add(t.category));
    return Array.from(set);
  }, [tags]);

  // Sorted categories: first in MASTER_CATEGORY_ORDER (if present), then others alphabetically
  const sortedCategories = useMemo(() => {
    const ordered = MASTER_CATEGORY_ORDER.filter(c => allCategories.includes(c));
    const rest = allCategories
      .filter(c => !MASTER_CATEGORY_ORDER.includes(c))
      .sort((a, b) => a.localeCompare(b));
    return [...ordered, ...rest];
  }, [allCategories]);

  // normalized + filtered list, then grouped by category
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(tags as Tag[])];
    const filtered = !q
      ? list
      : list.filter(
          t =>
            (t.code || '').toLowerCase().includes(q) ||
            (t.name || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q)
        );

    // Group by category
    const byCat = new Map<string, Tag[]>();
    for (const t of filtered) {
      const cat = t.category || '';
      const arr = byCat.get(cat) || [];
      arr.push(t);
      byCat.set(cat, arr);
    }

    // Sort each category's tags by code alphabetically
    for (const [k, arr] of byCat.entries()) {
      arr.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      byCat.set(k, arr);
    }

    // Order categories per sortedCategories, then any “unknown” cats alphabetically
    const known = sortedCategories.filter(c => byCat.has(c));
    const unknown = Array.from(byCat.keys())
      .filter(c => !sortedCategories.includes(c))
      .sort((a, b) => a.localeCompare(b));
    const finalOrder = [...known, ...unknown];

    return finalOrder.map(cat => ({ category: cat, items: byCat.get(cat) || [] }));
  }, [tags, query, sortedCategories]);

  // If not open, render nothing (after all hooks have run)
  if (!open) return null;

  // ---- actions ----
  function startNew() {
    setEditId(null);
    setDraft(d => ({ ...emptyDraft, color: d.color || '#FFA500' }));
    setError('');
    setCatSelect('');
    setCustomCategory('');
    requestAnimationFrame(() => {
      editorCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      codeInputRef.current?.focus();
    });
  }

  function startEdit(t: Tag) {
    setEditId(t.id);
    setDraft({ code: t.code, name: t.name, category: t.category, color: t.color });
    setError('');
    // initialize dropdown according to the existing category
    const cat = t.category || '';
    if (cat && sortedCategories.includes(cat)) {
      setCatSelect(cat);
      setCustomCategory('');
    } else if (cat) {
      setCatSelect(CUSTOM_CAT_VALUE);
      setCustomCategory(cat);
    } else {
      setCatSelect('');
      setCustomCategory('');
    }
    requestAnimationFrame(() => {
      editorCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      codeInputRef.current?.focus();
    });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft(emptyDraft);
    setCatSelect('');
    setCustomCategory('');
    setError('');
  }

  // EXACT-MATCH duplicate check (EM is allowed even if EM-RH exists)
  function validate(next: Draft): string {
    const code = next.code.trim();
    if (!code) return 'Code is required.';
    if (!/^[a-z0-9\-/# ]+$/i.test(code)) {
      return 'Use letters, numbers, space, hyphen, slash, # only.';
    }
    if (!next.category.trim()) return 'Category is required.';

    const normCode = code.toUpperCase();
    const dup = (tags as Tag[]).find(
      t => (t.code || '').trim().toUpperCase() === normCode
    );
    if (!editId && dup) return `Code “${normCode}” already exists.`;
    return '';
  }

  function resolvedCategory(): string {
    if (catSelect === CUSTOM_CAT_VALUE) return customCategory.trim();
    return catSelect || draft.category || '';
  }

  function add() {
    const category = resolvedCategory();
    const next: Draft = {
      ...draft,
      code: draft.code.trim().toUpperCase(),
      category,
    };
    const msg = validate(next);
    if (msg) {
      setError(msg);
      return;
    }
    addTag(next);
    setDraft(d => ({ ...d, code: '', name: '' }));
    setError('');
    codeInputRef.current?.focus();
  }

  function saveEdit() {
    if (!editId) return;
    const category = resolvedCategory();
    const next: Draft = {
      ...draft,
      code: draft.code.trim().toUpperCase(),
      category,
    };
    const msg = validate(next);
    if (msg && msg.includes('already exists')) {
      const conflict = (tags as Tag[]).find(
        t => (t.code || '').trim().toUpperCase() === next.code.toUpperCase()
      );
      if (!conflict || conflict.id !== editId) {
        setError(msg);
        return;
      }
    } else if (msg) {
      setError(msg);
      return;
    }

    updateTag(editId, next);
    cancelEdit();
  }

  function remove(id: string) {
    const tag = (tags as Tag[]).find(t => t.id === id);
    if (!tag) return;
    if (confirm(`Delete tag ${tag.code}?`)) deleteTag(id);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error('Expected an array of tags');
        importTags(parsed as Tag[]);
        alert('Tags imported.');
      } catch (err: any) {
        alert('Invalid tags file: ' + err.message);
      }
    };
    reader.readAsText(f);
  }

  function addToProject(tag: Tag) {
    if (onAddToProject) {
      onAddToProject(tag);
      return;
    }
    const tried =
      store?.addProjectTag?.(tag) ??
      store?.addProjectTagById?.(tag.id) ??
      store?.addTagToProject?.(tag);
    if (tried !== undefined) return;
    alert('Add-to-Project is not wired yet.');
  }

  function loadDefaults() {
    let added = 0;
    DEFAULT_MASTER_TAGS.forEach(mt => {
      const exists = (tags as Tag[]).find(
        t => (t.code || '').toUpperCase() === mt.code.toUpperCase()
      );
      if (!exists) {
        addTag({
          code: mt.code,
          name: mt.name,
          category: mt.category,
          color: mt.color,
        });
        added++;
      }
    });
    alert(
      `Default master tags loaded. Added ${added} new tag(s). Total master: ${DEFAULT_MASTER_TAGS.length}.`
    );
  }

  const headerNote =
    'Lights category always renders orange on the plan, regardless of saved color.';

  return (
    <div style={S.backdrop} onMouseDown={onClose}>
      {/* Draggable modal */}
      <div
        style={{ ...S.modal, left: pos.left, top: pos.top, position: 'fixed' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Title Bar — drag handle */}
        <div style={S.titleBar} onMouseDown={startDrag}>
          <div>
            <div style={S.title}>Tag Database</div>
            <div style={S.subtitle}>{headerNote}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn" onClick={loadDefaults}>Load Defaults</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
            <button className="btn" onClick={() => downloadTagsFile('tags.json', exportTags())}>Export JSON</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Toolbar */}
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
        <div style={S.card} ref={editorCardRef}>
          <div style={S.formRow}>
            {/* Color grid */}
            <div style={{ minWidth: 210 }}>
              <div style={S.label}>Color</div>
              <div style={S.colorGrid}>
                {palette.map((c: string) => {
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
                        boxShadow: selected ? '0 0 0 1px #fff inset' : 'none',
                      }}
                      aria-label={`Pick ${c}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '130px 220px 1fr', gap: 12, alignItems: 'center', flex: 1 }}>
              <div>
                <div style={S.label}>Code</div>
                <input
                  ref={codeInputRef}
                  value={draft.code}
                  onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                  placeholder="A1"
                  style={S.input}
                  onKeyDown={(e)=>{ if (e.key==='Enter') (editId ? saveEdit() : add()); }}
                />
                {error && error.toLowerCase().includes('code') && <div style={S.error}>{error}</div>}
              </div>

              <div>
                <div style={S.label}>Category</div>
                <div style={{ display:'flex', gap:8 }}>
                  <select
                    value={catSelect || (sortedCategories.includes(draft.category) ? draft.category : (draft.category ? CUSTOM_CAT_VALUE : ''))}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCatSelect(v);
                      if (v === CUSTOM_CAT_VALUE) {
                        setCustomCategory(draft.category && !sortedCategories.includes(draft.category) ? draft.category : '');
                      } else {
                        setDraft(d => ({ ...d, category: v }));
                        setCustomCategory('');
                      }
                    }}
                    style={S.input}
                  >
                    <option value="">— Select —</option>
                    {sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value={CUSTOM_CAT_VALUE}>Custom…</option>
                  </select>
                  { (catSelect === CUSTOM_CAT_VALUE) && (
                    <input
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="New category"
                      style={{ ...S.input, flex: 1 }}
                    />
                  )}
                </div>
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
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

          {/* general error (non-code) */}
          {!!error && !error.toLowerCase().includes('code') && <div style={S.error}>{error}</div>}
        </div>

        {/* Grouped Table */}
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
              {filteredGroups.map(group => (
                <React.Fragment key={group.category || '(Uncategorized)'}>
                  {/* Category Header Row */}
                  <tr>
                    <td colSpan={5} style={{ padding:'10px 6px', background:'#fafafa', borderTop:'1px solid #eee', fontWeight:700 }}>
                      {group.category || 'Uncategorized'}
                    </td>
                  </tr>
                  {/* Items */}
                  {group.items.map((t: Tag) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ width:20, height:20, borderRadius:4, background:t.color, border:'1px solid #999', margin:'0 auto' }} />
                      </td>
                      <td style={{ fontWeight:600 }}>{t.code}</td>
                      <td>{t.category}</td>
                      <td>{t.name}</td>
                      <td>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          <button
                            className="btn"
                            title="Add to current project"
                            aria-label={`Add ${t.code} to current project`}
                            onClick={() => addToProject(t)}
                          >+</button>
                          <button className="btn" onClick={() => startEdit(t)}>Edit</button>
                          <button className="btn" onClick={() => remove(t.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {group.items.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ color:'#777', padding:'10px 6px' }}>No items in this category.</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign:'center', color:'#666', padding:'14px 0' }}>
                    No tags match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="application/json" onChange={onPickFile} style={{ display:'none' }} />
      </div>
    </div>
  );
}

/* ---------- Inline styles ---------- */
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999
    // NOTE: no centering here; modal uses its own left/top for dragging
  },
  modal: {
    background:'#fff', width:1000, maxWidth:'92vw', maxHeight:'90vh',
    overflow:'hidden', borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,0.25)',
    display:'flex', flexDirection:'column'
  },
  titleBar: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    padding:'14px 16px 8px', borderBottom:'1px solid #eee', background:'#fafafa',
    cursor:'move', userSelect:'none'
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
    marginTop:8, color:'#b00020', fontSize:13, fontWeight:600
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
    width: 200,
    textAlign: 'left',
    padding: '10px 6px',
    fontSize: 12,
    color: '#555',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    background: '#fff',
  },
  thActions: {
    width: 210,
    textAlign: 'right',
    padding: '10px 6px',
    fontSize: 12,
    color: '#555',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    background: '#fff',
  },
};
