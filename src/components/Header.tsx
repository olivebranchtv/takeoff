// src/components/Header.tsx
import React, { useState } from 'react';
import { useStore } from '@/state/store';
import { Pencil } from 'lucide-react';
import skdLogo from '@/assets/skd-logo.png';

export const Header: React.FC = () => {
  const name = useStore(s => s.projectName);
  const rename = useStore(s => s.setProjectName);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');

  const startEdit = () => {
    setDraft(name ?? '');
    setEditing(true);
  };

  const commit = () => {
    const n = draft.trim();
    if (n) rename(n);
    setEditing(false);
  };

  return (
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#0b1220', // keep your theme
        color: 'white',
        gap: 10,
        borderBottom: '1px solid #142034'
      }}
    >
      <img
        src={skdLogo}
        alt="SKD Services"
        style={{ height: 40, width: 'auto' }}
      />
      <div style={{ opacity: 0.6 }}>·</div>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div title={name ?? ''} style={{ maxWidth: 420, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {name || 'No project'}
          </div>
          {name && (
            <button
              onClick={startEdit}
              title="Rename project"
              style={{ background: 'transparent', border: 'none', color: '#bcd', cursor: 'pointer' }}
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{
              background: '#0f172a',
              color: 'white',
              border: '1px solid #2b364a',
              borderRadius: 8,
              padding: '6px 10px',
              minWidth: 240
            }}
          />
          <button onClick={commit} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2b364a', background: '#1f2937', color: 'white' }}>
            Save
          </button>
          <button onClick={() => setEditing(false)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2b364a', background: 'transparent', color: '#cbd5e1' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
