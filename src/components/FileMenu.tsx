// src/components/FileMenu.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FolderOpen, Save, Download, BookOpen, Clock, FilePlus, Database } from 'lucide-react';
import { useToast } from '@/ui/Toast';
import { openProjectFromFile } from '@/features/project/openProject';
import { useStore } from '@/state/store';
import { loadProjectFromSupabase, loadAllProjectsFromSupabase } from '@/utils/supabasePricing';

type RecentProject = {
  name: string;
  timestamp: number;
  path?: string;
};

const RECENT_PROJECTS_KEY = 'skd_recent_projects';
const MAX_RECENT = 5;

function getRecentProjects(): RecentProject[] {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentProject(name: string) {
  try {
    const recent = getRecentProjects();
    const filtered = recent.filter(p => p.name !== name);
    filtered.unshift({ name, timestamp: Date.now() });
    const limited = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(limited));
  } catch (err) {
    console.warn('Failed to save recent project:', err);
  }
}

interface FileMenuProps {
  onAction?: (action: string) => void;
  onOpenGuide?: () => void;
  onAddSheet?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({ onAction, onOpenGuide, onAddSheet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showDatabaseProjects, setShowDatabaseProjects] = useState(false);
  const [databaseProjects, setDatabaseProjects] = useState<Array<{ id: string; project_name: string; file_name: string; updated_at: string; is_active: boolean }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const toProject = useStore(s => s.toProject);
  const projectName = useStore(s => s.projectName);
  const fromProject = useStore(s => s.fromProject);

  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, [isOpen]);

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
    const fileName = file.name.replace(/\.(skdproj|json)$/i, '');
    addRecentProject(fileName);
    e.target.value = '';
    setIsOpen(false);
  };

  const downloadCurrent = () => {
    if (!projectName) {
      addToast('No open project to download', 'error');
      return;
    }
    const currentProject = toProject();
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fn = `${projectName || 'project'}.skdproj`;
    a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
    addRecentProject(projectName);
    setIsOpen(false);
  };

  const openRecentProject = async (projectName: string) => {
    addToast(`Recent project feature: "${projectName}" - Projects are loaded via File > Open`, 'info');
    setIsOpen(false);
  };

  const openDatabaseProjectsDialog = async () => {
    setIsOpen(false);
    setShowDatabaseProjects(true);
    setLoadingProjects(true);
    const projects = await loadAllProjectsFromSupabase();
    setDatabaseProjects(projects);
    setLoadingProjects(false);
  };

  const loadDatabaseProject = async (projectId: string) => {
    setLoadingProjects(true);
    const { loadProjectByIdFromSupabase } = await import('@/utils/supabasePricing');
    const projectData = await loadProjectByIdFromSupabase(projectId);

    if (projectData) {
      fromProject(projectData);
      addToast(`Project "${projectData.projectName || projectData.name}" loaded from database`, 'info');
    } else {
      addToast('Failed to load project from database', 'error');
    }

    setShowDatabaseProjects(false);
    setLoadingProjects(false);
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
            onClick={openDatabaseProjectsDialog}
            style={itemStyle}
            title="Open project from database"
          >
            <Database size={16} /> Open from Database…
          </button>
          <button
            onClick={() => { onAddSheet?.(); setIsOpen(false); }}
            style={itemStyle}
            title="Add individual PDF sheet to current project"
          >
            <FilePlus size={16} /> Add Sheet…
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

          <div style={{ borderTop: '1px solid #334155', margin: '8px 0' }} />

          <button
            onClick={() => { onOpenGuide?.(); setIsOpen(false); }}
            style={itemStyle}
            title="Complete A to Z User Guide"
          >
            <BookOpen size={16} /> User Guide
          </button>

          {recentProjects.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid #334155', margin: '8px 0' }} />
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                Recent Projects
              </div>
              {recentProjects.map((project, idx) => (
                <button
                  key={idx}
                  onClick={() => openRecentProject(project.name)}
                  style={{
                    ...itemStyle,
                    paddingLeft: '28px',
                    fontSize: '13px'
                  }}
                  title={`Opened ${new Date(project.timestamp).toLocaleString()}`}
                >
                  <Clock size={14} style={{ marginRight: '4px' }} />
                  {project.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".skdproj,application/json"
        style={{ display: 'none' }}
        onChange={onPick}
      />

      {showDatabaseProjects && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowDatabaseProjects(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #142034',
              borderRadius: 12,
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #142034',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Open Project from Database
              </h3>
              <button
                onClick={() => setShowDatabaseProjects(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px 8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {loadingProjects ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
                  Loading projects...
                </div>
              ) : databaseProjects.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
                  No saved projects found in database
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {databaseProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => loadDatabaseProject(project.id)}
                      style={{
                        background: project.is_active ? '#1e293b' : '#0f172a',
                        border: project.is_active ? '1px solid #3b82f6' : '1px solid #334155',
                        borderRadius: 8,
                        padding: '16px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>
                          {project.project_name}
                          {project.is_active && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: '#3b82f6',
                              fontWeight: 500
                            }}>
                              (Active)
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {project.file_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Last updated: {new Date(project.updated_at).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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