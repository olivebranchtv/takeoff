// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import { Pencil, Cloud, CloudOff } from 'lucide-react';

export const Header: React.FC = () => {
  const name = useStore(s => s.projectName);
  const rename = useStore(s => s.setProjectName);
  const lastSaveTime = useStore(s => s.lastSaveTime);
  const pages = useStore(s => s.pages);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>('');

  useEffect(() => {
    const updateTimeSince = () => {
      if (!lastSaveTime) {
        setTimeSinceLastSave('Not saved');
        return;
      }
      const saveDate = lastSaveTime instanceof Date ? lastSaveTime : new Date(lastSaveTime);
      const seconds = Math.floor((Date.now() - saveDate.getTime()) / 1000);
      if (seconds < 10) setTimeSinceLastSave('Just now');
      else if (seconds < 60) setTimeSinceLastSave(`${seconds}s ago`);
      else if (seconds < 3600) setTimeSinceLastSave(`${Math.floor(seconds / 60)}m ago`);
      else setTimeSinceLastSave(`${Math.floor(seconds / 3600)}h ago`);
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 5000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

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
        src="/SKD Logo.png"
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

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {pages.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: lastSaveTime ? '#0f172a' : '#1f2937',
              border: '1px solid #2b364a',
              borderRadius: 8,
              fontSize: '13px',
              color: lastSaveTime ? '#10b981' : '#94a3b8'
            }}
            title={lastSaveTime ? `Last saved: ${(lastSaveTime instanceof Date ? lastSaveTime : new Date(lastSaveTime)).toLocaleString()}` : 'Not saved to database yet'}
          >
            {lastSaveTime ? <Cloud size={14} /> : <CloudOff size={14} />}
            <span>{timeSinceLastSave}</span>
          </div>
        )}
      </div>
    </div>
  );
};
