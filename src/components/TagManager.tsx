import React, { useRef, useState } from 'react';
import { useStore } from '@/state/store';
import type { Tag } from '@/types';
import { downloadTagsFile } from '@/utils/persist';

type Props = { open: boolean; onClose: () => void };

export default function TagManager({ open, onClose }: Props) {
  const { tags, palette, addTag, updateTag, deleteTag, importTags } = useStore();
  const [draft, setDraft] = useState<Omit<Tag,'id'>>({ code: '', name: '', category: '', color: '#FF9900' });
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  function startEdit(t: Tag) {
    setEditId(t.id);
    setDraft({ code: t.code, name: t.name, category: t.category, color: t.color });
  }
  function cancelEdit() { setEditId(null); setDraft({ code:'', name:'', category:'', color:'#FF9900' }); }
  function saveEdit() { if (!editId) return; updateTag(editId, draft); cancelEdit(); }
  function add() { if (!draft.code.trim()) return; addTag({ ...draft, code: draft.code.toUpperCase() }); setDraft(d=>({ ...d, code:'' })); }
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

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'#fff', width:900, maxHeight:'85vh', overflow:'auto', borderRadius:10, padding:16, boxShadow:'0 10px 30px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <h3 style={{margin:0}}>Tag Database</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'90px 220px 180px 1fr', gap:10, alignItems:'center', marginBottom:10}}>
          <div>
            <div style={{marginBottom:6}}>Color</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(10, 22px)', gap:6}}>
              {palette.map(c => (
                <button key={c} title={c} onClick={()=>setDraft(d=>({...d, color:c}))}
                        style={{width:20, height:20, borderRadius:4, border:`2px solid ${draft.color===c?'#333':'#ccc'}`, background:c}} />
              ))}
            </div>
          </div>
          <div>
            <div style={{marginBottom:6}}>Code</div>
            <input value={draft.code} onChange={e=>setDraft(d=>({...d, code:e.target.value.toUpperCase()}))} placeholder="A1" style={{width:'100%'}} />
          </div>
          <div>
            <div style={{marginBottom:6}}>Category</div>
            <input value={draft.category} onChange={e=>setDraft(d=>({...d, category:e.target.value}))} placeholder="Lights / Switches / Receptacles ..." style={{width:'100%'}} />
          </div>
          <div>
            <div style={{marginBottom:6}}>Name</div>
            <input value={draft.name} onChange={e=>setDraft(d=>({...d, name:e.target.value}))} placeholder="Fixture A1 - 2x4 LED" style={{width:'100%'}} />
          </div>
        </div>

        <div style={{display:'flex', gap:8, marginBottom:16}}>
          {editId ? (<><button className="btn" onClick={saveEdit}>Save</button><button className="btn" onClick={cancelEdit}>Cancel</button></>) : (<button className="btn" onClick={add}>Add Tag</button>)}
          <div style={{flex:1}} />
          <input ref={fileRef} type="file" accept="application/json" onChange={onPickFile} style={{display:'none'}}/>
          <button className="btn" onClick={()=>fileRef.current?.click()}>Import JSON</button>
          <button className="btn" onClick={()=>downloadTagsFile('tags.json', useStore.getState().exportTags())}>Export JSON</button>
        </div>

        <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
          <thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}>
            <th style={{padding:'6px 4px'}}>Color</th><th style={{padding:'6px 4px'}}>Code</th>
            <th style={{padding:'6px 4px'}}>Category</th><th style={{padding:'6px 4px'}}>Name</th><th style={{padding:'6px 4px'}}>Actions</th>
          </tr></thead>
          <tbody>
            {tags.map(t => (
              <tr key={t.id} style={{borderBottom:'1px solid #f2f2f2'}}>
                <td style={{padding:'8px 4px'}}><div style={{width:20, height:20, borderRadius:4, background:t.color, border:'1px solid #999'}}/></td>
                <td style={{padding:'8px 4px'}}>{t.code}</td>
                <td style={{padding:'8px 4px'}}>{t.category}</td>
                <td style={{padding:'8px 4px'}}>{t.name}</td>
                <td style={{padding:'8px 4px'}}>
                  <button className="btn" onClick={()=>startEdit(t)}>Edit</button>
                  <button className="btn" onClick={()=>deleteTag(t.id)} style={{marginLeft:6}}>Delete</button>
                </td>
              </tr>
            ))}
            {tags.length === 0 && (<tr><td colSpan={5} style={{padding:12, color:'#666'}}>No tags yet. Add or import a JSON database.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
