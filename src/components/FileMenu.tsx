// src/components/FileMenu.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FolderOpen, Save, Download } from 'lucide-react';
import { useToast } from '@/ui/Toast';
import { openProjectFromFile } from '@/features/project/openProject';
import { useAppStore } from '@/state/store';

interface FileMenuProps {
  onAction?: (action: string) => void; // optional if you already use this
}

export const FileMenu: React.FC<FileMenuProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const currentProject = useAppStore(s => s.currentProject);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openFilePicker = () => fileRef.current?.click();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await openProjectFromFile(
      file,
      (msg) => addToast(msg, 'info'),
      (msg) => addToast(msg, 'error')
    );
    e.target.value = '';
    setIsOpen(false);
  };

  const downloadCurrent = () => {
    if (!currentProject) {
      addToast('No open project to download', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fn = `${currentProject.name || 'project'}.skdproj`;
    a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#0b1220',
          color: 'white',
          border: '1px solid #142034',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        File <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            background: '#0f172a',
            color: 'white',
            border: '1px solid #142034',
            borderRadius: 10,
            minWidth: 220,
            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
            zIndex: 1000
          }}
        >
          <button
            onClick={openFilePicker}
            style={itemStyle}
            title="Open .skdproj"
          >
            <FolderOpen size={16} /> Open Project…
          </button>
          <button
            onClick={downloadCurrent}
            style={itemStyle}
            title="Download current project"
          >
            <Download size={16} /> Download .skdproj
          </button>
          <button
            onClick={() => { onAction?.('save'); setIsOpen(false); }}
            style={itemStyle}
            title="Save (app-specific action)"
          >
            <Save size={16} /> Save
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".skdproj,application/json"
        style={{ display: 'none' }}
        onChange={onPick}
      />
    </div>
  );
};

const itemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: '10px 12px',
  background: 'transparent',
  color: 'white',
  border: 'none',
  cursor: 'pointer'
};
