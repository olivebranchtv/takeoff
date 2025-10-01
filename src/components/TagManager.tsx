// src/components/TagManager.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import type { Tag } from '@/types';
import { downloadTagsFile } from '@/utils/persist';
import { DEFAULT_MASTER_TAGS } from '@/constants/masterTags';
import { getAssemblyIdForTag } from '@/utils/tagAssemblyMapping';

type Props = {
  open: boolean;
  onClose: () => void;
  onAddToProject?: (tag: Tag) => void;
};

type Draft = Omit<Tag, 'id'>;
const emptyDraft: Draft = { code: '', name: '', category: '', color: '#FFA500' };

// Tag categories for organizing electrical symbols on drawings (NOT material categories)
// These categories represent types of electrical devices/equipment shown on plans
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

export default function TagManager({ open, onClose, onAddToProject }: Props) {
  const store = useStore() as any;
  const { tags, palette, addTag, updateTag, deleteTag, importTags, exportTags, assemblies } = store;

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [catSelect, setCatSelect] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const editorCardRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Draggable modal
  const [pos, setPos] = useState<{x:number;y:number}>({ x: 48, y: 48 });
  const dragRef = useRef<{active:boolean; sx:number; sy:number; ox:number; oy:number}>({
    active:false, sx:0, sy:0, ox:0, oy:0
  });

  // Category anchors for jump
  const groupRefs = useRef(new Map<string, HTMLTableRowElement>());
  const scrollToCategory = (cat: string | undefined) => {
    const row = groupRefs.current.get(cat || 'Uncategorized');
    row?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Reset UI & ensure defaults exist (but never overwrite user edits)
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDraft(emptyDraft);
      setEditId(null);
      setError('');
      setCatSelect('');
      setCustomCategory('');
      onDragEnd(); // safety: remove listeners when closed
      return;
    }
    try {
      const existing = new Set<string>((tags as Tag[]).map(t => (t.code || '').toUpperCase()));
      const missing = DEFAULT_MASTER_TAGS.filter(t => !existing.has((t.code || '').toUpperCase()));
      if (missing.length) importTags(missing);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Also cleanup listeners if component unmounts
  useEffect(() => () => onDragEnd(), []);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_MASTER_TAGS.forEach(t => t.category && set.add(t.category));
    (tags as Tag[]).forEach(t => t.category && set.add(t.category));
    return Array.from(set);
  }, [tags]);

  const sortedCategories = useMemo(() => {
    const ordered = MASTER_CATEGORY_ORDER.filter(c => allCategories.includes(c));
    const rest = allCategories.filter(c => !MASTER_CATEGORY_ORDER.includes(c)).sort((a, b) => a.localeCompare(b));
    return [...ordered, ...rest];
  }, [allCategories]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? (tags as Tag[]).filter(
          t =>
            (t.code || '').toLowerCase().includes(q) ||
            (t.name || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q)
        )
      : (tags as Tag[]);

    const byCat = new Map<string, Tag[]>();
    for (const t of filtered) {
      const cat = t.category || 'Uncategorized';
      const arr = byCat.get(cat) || [];
      arr.push(t);
      byCat.set(cat, arr);
    }
    for (const [k, arr] of byCat.entries()) arr.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    const known = sortedCategories.filter(c => byCat.has(c));
    const unknown = Array.from(byCat.keys()).filter(c => !sortedCategories.includes(c)).sort((a,b)=>a.localeCompare(b));
    const final = [...known, ...unknown];

    return final.map(cat => ({ category: cat, items: byCat.get(cat) || [] }));
  }, [tags, query, sortedCategories]);

  useEffect(() => { groupRefs.current = new Map(); }, [filteredGroups]);

  if (!open) return null;

  // ============ helpers ============
  const norm = (s: string) => (s || '').trim().toUpperCase();

  /** Upsert-by-code (case-insensitive). Overwrites any existing/default tag with same code. */
  function upsertByCode(next: Draft, currentEditId?: string | null) {
    const codeKey = norm(next.code);
    const existing = (tags as Tag[]).find(t => norm(t.code) === codeKey);

    if (existing) {
      // Update the canonical record (existing)
      updateTag(existing.id, {
        code: codeKey,
        name: next.name || '',
        category: (next.category || '').trim(),
        color: next.color || '#FFA500',
      });

      // If user was editing a different duplicate record, remove it to avoid twins
      if (currentEditId && currentEditId !== existing.id) {
        try { deleteTag(currentEditId); } catch {}
      }
      return existing.id;
    } else {
      // No canonical record yet → add new
      addTag({
        code: codeKey,
        name: next.name || '',
        category: (next.category || '').trim(),
        color: next.color || '#FFA500',
      });
      return null;
    }
  }

  // actions
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
      if (cat) scrollToCategory(cat);
    });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft(emptyDraft);
    setCatSelect('');
    setCustomCategory('');
    setError('');
  }

  // Minimal validation (no duplicate blocking—overwrites are allowed)
  function validate(next: Draft): string {
    if (!next.code.trim()) return 'Code is required.';
    if (!/^[a-z0-9\-/# ]+$/i.test(next.code.trim())) return 'Use letters, numbers, space, hyphen, slash, # only.';
    if (!(next.category || '').trim()) return 'Category is required.';
    return '';
  }

  function resolvedCategory(): string {
    if (catSelect === CUSTOM_CAT_VALUE) return customCategory.trim();
    return catSelect || draft.category || '';
  }

  function add() {
    const category = resolvedCategory();
    const next: Draft = { ...draft, code: draft.code.trim().toUpperCase(), category };
    const msg = validate(next);
    if (msg) { setError(msg); return; }

    upsertByCode(next, null);
    setDraft(d => ({ ...d, code: '', name: '' }));
    setError('');
    codeInputRef.current?.focus();
    if (category) scrollToCategory(category);
  }

  function saveEdit() {
    if (!editId) return;
    const category = resolvedCategory();
    const next: Draft = { ...draft, code: draft.code.trim().toUpperCase(), category };
    const msg = validate(next);
    if (msg) { setError(msg); return; }

    const canonicalId = upsertByCode(next, editId);
    if (category) scrollToCategory(category);
    // Clear editor after successful save
    cancelEdit();

    // Optional: small toast/alert to confirm overwrite behavior
    // alert('Saved. This code now overrides the default in the master database.');
  }

  function remove(id: string) {
    const tag = (tags as Tag[]).find(t => t.id === id);
    if (!tag) return;
    if (confirm(`Delete tag ${tag.code}?`)) deleteTag(id);
  }

  function autoPopulateAssemblies() {
    if (!confirm('Auto-assign assemblies to all tags based on their codes and categories?\n\nNote: Lights category will be SKIPPED (use pricing database only for customer-supplied fixtures).')) return;

    let updated = 0;
    let skipped = 0;
    (tags as Tag[]).forEach((tag: Tag) => {
      // Skip Lights category entirely (customer-supplied fixtures)
      const isLightCategory = tag.category?.toLowerCase().includes('light');
      if (isLightCategory) {
        skipped++;
        return;
      }

      // Only auto-assign if no assembly is currently set
      if (!(tag as any).assemblyId) {
        const assemblyId = getAssemblyIdForTag(tag.code, tag.category);
        if (assemblyId) {
          updateTag(tag.id, { ...tag, assemblyId } as any);
          updated++;
        }
      }
    });

    alert(`Auto-assigned assemblies to ${updated} tags.\nSkipped ${skipped} Lights category tags (use pricing database for customer-supplied fixtures).`);
  }

  function clearLightAssemblies() {
    if (!confirm('Remove assemblies from all generic light tags (A-Z)? This is required for customer-supplied fixtures to work correctly.\n\nThis will clear assemblies from tags like "A", "B", "C", "D", etc. in the Lights category.')) return;

    let cleared = 0;
    (tags as Tag[]).forEach((tag: Tag) => {
      // Check if it's a Lights category tag with a single letter code or letter+number
      const isLightCategory = tag.category?.toLowerCase().includes('light');
      const isGenericCode = /^[A-Z]$/.test(tag.code) || /^[A-Z]\d+$/.test(tag.code) || /^[A-Z]\d*-[A-Z]+$/.test(tag.code);

      if (isLightCategory && isGenericCode && (tag as any).assemblyId) {
        // Remove the assembly by explicitly passing assemblyId: undefined
        updateTag(tag.id, { assemblyId: undefined } as any);
        cleared++;
      }
    });

    alert(`Cleared assemblies from ${cleared} generic light tags. These will now use pricing database only (for customer-supplied fixtures).`);
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
    const exists =
      (tags as Tag[]).some(
        t => t.id === tag.id || (t.code || '').toUpperCase() === (tag.code || '').toUpperCase()
      );
    if (!exists) {
      addTag({
        code: (tag.code || '').toUpperCase(),
        name: tag.name || '',
        category: tag.category || '',
        color: tag.color || '#FFA500'
      });
    }
    if (onAddToProject) { onAddToProject(tag); return; }
    const tried =
      (store as any)?.addProjectTag?.(tag) ??
      (store as any)?.addProjectTagById?.(tag.id) ??
      (store as any)?.addTagToProject?.(tag);
    if (tried !== undefined) return;
    alert('Add-to-Project is not wired yet.');
  }

  function loadDefaults() {
    let added = 0;
    DEFAULT_MASTER_TAGS.forEach(mt => {
      const exists = (tags as Tag[]).find(t => (t.code || '').toUpperCase() === mt.code.toUpperCase());
      if (!exists) {
        addTag({ code: mt.code, name: mt.name, category: mt.category, color: mt.color });
        added++;
      }
    });
    alert(`Default master tags loaded. Added ${added} new tag(s). Total master: ${DEFAULT_MASTER_TAGS.length}.`);
  }

  const headerNote = 'Edits here permanently override defaults for matching codes in the master database.';

  // Drag handlers (drag anywhere on title bar)
  function onDragStart(e: React.MouseEvent) {
    dragRef.current = { active:true, sx:e.clientX, sy:e.clientY, ox:pos.x, oy:pos.y };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }
  function onDragMove(e: MouseEvent) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setPos({ x: Math.max(8, dragRef.current.ox + dx), y: Math.max(8, dragRef.current.oy + dy) });
  }
  function onDragEnd() {
    dragRef.current.active = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  }

  return (
    <div style={S.backdrop} onMouseDown={onClose}>
      <div
        style={{ ...S.modal, left: pos.x, top: pos.y }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={S.titleBar} onMouseDown={onDragStart}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={S.dragHandle} />
            <div>
              <div style={S.title}>Tag Database</div>
              <div style={S.subtitle}>{headerNote}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap:'wrap' }}>
            <button className="btn" onClick={loadDefaults}>Load Defaults</button>
            <button className="btn" onClick={autoPopulateAssemblies} title="Auto-assign assemblies to tags that don't have them">Auto-Assign Assemblies</button>
            <button
              className="btn"
              onClick={clearLightAssemblies}
              title="Remove assemblies from generic light tags (A-Z) for customer-supplied fixtures"
              style={{ background: '#fbbf24', color: '#000' }}
            >
              Clear Light Assemblies
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
            <button className="btn" onClick={() => downloadTagsFile('tags.json', exportTags())}>Export JSON</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={S.toolbar}>
          <input
            placeholder="Search by code, name, or category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={S.search}
          />
          <select
            style={S.jump}
            defaultValue=""
            onChange={e => {
              const cat = e.target.value;
              if (!cat) return;
              scrollToCategory(cat);
              e.currentTarget.value = '';
            }}
          >
            <option value="">Jump to category…</option>
            {sortedCategories.map(c => <option value={c} key={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={startNew}>New Tag</button>
        </div>

        {/* BIGGER, SCROLLABLE CONTENT: editor (compact) + tall table */}
        <div style={S.content}>
          <div style={S.card} ref={editorCardRef}>
            <div style={S.formRow}>
              <div style={{ minWidth: 232 }}>
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

              <div style={{ display:'grid', gridTemplateColumns:'minmax(120px, 160px) minmax(220px, 320px) 1fr', gap: 10, alignItems:'center', flex:1 }}>
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
                </div>

                <div>
                  <div style={S.label}>Category</div>
                  <div style={{ display:'flex', gap:8, minWidth:0 }}>
                    <select
                      value={catSelect || (draft.category && sortedCategories.includes(draft.category) ? draft.category : (draft.category ? CUSTOM_CAT_VALUE : ''))}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCatSelect(v);
                        if (v === CUSTOM_CAT_VALUE) {
                          setCustomCategory(draft.category && !sortedCategories.includes(draft.category) ? draft.category : '');
                        } else {
                          setDraft(d => ({ ...d, category: v }));
                          setCustomCategory('');
                          scrollToCategory(v);
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

              <div style={{ marginTop: 10 }}>
                <div style={S.label}>Assembly (Optional)</div>
                <select
                  value={draft.assemblyId || ''}
                  onChange={e => setDraft(d => ({ ...d, assemblyId: e.target.value || undefined }))}
                  style={{ ...S.input, width: '100%', maxWidth: '500px' }}
                >
                  <option value="">— No Assembly —</option>
                  {assemblies && assemblies.filter((a: any) => a.isActive).map((assembly: any) => (
                    <option key={assembly.id} value={assembly.id}>
                      {assembly.code} - {assembly.name} ({assembly.items.length} items)
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Assemblies automatically calculate materials for count objects (receptacles, switches, etc.)
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'flex-end', gap: 8 }}>
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

          {/* Tall table area */}
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.thNarrow}>Color</th>
                  <th style={S.thCode}>Code</th>
                  <th style={S.thCat}>Category</th>
                  <th>Name</th>
                  <th style={S.thAssembly}>Assembly</th>
                  <th style={S.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map(group => (
                  <React.Fragment key={group.category || 'Uncategorized'}>
                    <tr ref={el => { if (el) groupRefs.current.set(group.category || 'Uncategorized', el); }}>
                      <td colSpan={6} style={{ padding:'8px 6px', background:'#fafafa', borderTop:'1px solid #eee', fontWeight:700, position:'sticky', top:34, zIndex:1 }}>
                        {group.category || 'Uncategorized'}
                      </td>
                    </tr>
                    {group.items.map((t: Tag) => {
                      const assembly = (t as any).assemblyId ? assemblies?.find((a: any) => a.id === (t as any).assemblyId) : null;
                      return (
                      <tr key={t.id} style={{ height:32 }}>
                        <td>
                          <div style={{ width:18, height:18, borderRadius:4, background:t.color, border:'1px solid #999', margin:'0 auto' }} />
                        </td>
                        <td style={{ fontWeight:600 }}>{t.code}</td>
                        <td>{t.category}</td>
                        <td>{t.name}</td>
                        <td style={{ fontSize: 13, color: assembly ? '#333' : '#999' }}>
                          {assembly ? `${assembly.code} - ${assembly.name}` : '—'}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                            <button className="btn" title="Add to current project" aria-label={`Add ${t.code} to current project`} onClick={() => addToProject(t)}>+</button>
                            <button className="btn" onClick={() => startEdit(t)}>Edit</button>
                            <button className="btn" onClick={() => remove(t.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {group.items.length === 0 && (
                      <tr><td colSpan={6} style={{ color:'#777', padding:'8px 6px' }}>No items in this category.</td></tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredGroups.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'#666', padding:'14px 0' }}>No tags match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="application/json" onChange={onPickFile} style={{ display:'none' }} />
      </div>
    </div>
  );
}

/* ---------- Inline styles ---------- */
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999,
    display:'flex', alignItems:'flex-start', justifyContent:'flex-start'
  },
  modal: {
    position:'fixed',
    background:'#fff',
    width: 1200,
    maxWidth:'96vw',
    maxHeight:'96vh',
    overflow:'hidden',
    borderRadius:12,
    boxShadow:'0 16px 40px rgba(0,0,0,0.25)',
    display:'flex', flexDirection:'column'
  },
  titleBar: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 14px', borderBottom:'1px solid #eee', background:'#fafafa',
    cursor:'move'
  },
  dragHandle: { width:14, height:14, borderRadius:3, background:'#ddd', border:'1px solid #c9c9c9', boxShadow:'inset 0 0 0 2px #f4f4f4' },
  title: { fontSize:20, fontWeight:700, marginBottom:2 },
  subtitle: { fontSize:12, color:'#666' },
  toolbar: {
    display:'flex', gap:8, alignItems:'center',
    padding:'8px 14px', borderBottom:'1px solid #f2f2f2', background:'#fff'
  },
  search: { flex:1, padding:'10px 12px', border:'1px solid #ccc', borderRadius:8, fontSize:14, lineHeight:'20px', boxSizing:'border-box' },
  jump:   { width:260, padding:'10px 12px', border:'1px solid #ccc', borderRadius:8, fontSize:14 },

  content: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },

  card:   { padding:'10px 14px', borderBottom:'1px solid #f2f2f2', background:'#fff' },
  formRow: { display:'grid', gridTemplateColumns:'232px 1fr auto', gap:14, alignItems:'start' },
  label:  { fontSize:12, fontWeight:600, color:'#444', marginBottom:6 },
  input:  { width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8, fontSize:14, lineHeight:'20px', boxSizing:'border-box', minWidth:0 },
  colorGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, 28px)', gap:8, maxHeight: 140, overflowY:'auto', paddingRight: 4 },
  swatch: { width:24, height:24, borderRadius:4, cursor:'pointer' },
  error:  { marginTop:8, color:'#b00020', fontSize:13, fontWeight:600 },

  tableWrap: { flex:1, overflow:'auto', padding:'0 14px 14px' },
  table:  { width:'100%', borderCollapse:'separate', borderSpacing:0 },
  thNarrow: { width:64, textAlign:'center', padding:'8px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:2 },
  thCode:   { width:100, textAlign:'left', padding:'8px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:2 },
  thCat:    { width:220, textAlign:'left', padding:'8px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:2 },
  thAssembly: { width:280, textAlign:'left', padding:'8px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:2 },
  thActions:{ width:210, textAlign:'right', padding:'8px 6px', fontSize:12, color:'#555',
    borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:2 },
};
