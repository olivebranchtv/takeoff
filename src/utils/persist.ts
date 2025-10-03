import type { ProjectSave, Tag } from '@/types';
import { saveProjectToSupabase, loadProjectFromSupabase } from './supabasePricing';

const KEY = 'takeoff_project_v2';

export function exportJSON(project: ProjectSave): string {
  return JSON.stringify(project, null, 2);
}

export function importJSON(s: string): ProjectSave {
  const obj = JSON.parse(s);
  if (!obj || typeof obj !== 'object') throw new Error('Malformed JSON');
  if (!Array.isArray(obj.pages)) throw new Error('Missing pages');
  if (!Array.isArray(obj.tags)) obj.tags = [];
  return obj as ProjectSave;
}

export async function saveProject(project: ProjectSave) {
  // Save to Supabase
  await saveProjectToSupabase(project);
  // Also save to localStorage as backup
  localStorage.setItem(KEY, exportJSON(project));
}

export async function loadProject(): Promise<ProjectSave | null> {
  // Try loading from Supabase first
  const supabaseProject = await loadProjectFromSupabase();
  if (supabaseProject) {
    return supabaseProject;
  }

  // Fallback to localStorage
  const s = localStorage.getItem(KEY);
  if (!s) return null;
  try { return importJSON(s); } catch { return null; }
}

/** Optional helpers just for tags (used by TagManager import/export UI) */
export function downloadTagsFile(name: string, tags: Tag[]) {
  const blob = new Blob([JSON.stringify(tags, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}