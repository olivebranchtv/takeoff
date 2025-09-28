import type { ProjectSave } from '@/types';
const KEY = 'local_takeoff_project_v1';
export function saveProject(data: ProjectSave) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function loadProject(): ProjectSave | null {
  const s = localStorage.getItem(KEY);
  return s ? JSON.parse(s) as ProjectSave : null;
}
export function exportJSON(data: ProjectSave): string {
  return JSON.stringify(data, null, 2);
}
export function importJSON(text: string): ProjectSave {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.pages)) throw new Error('Invalid JSON');
  return parsed as ProjectSave;
}