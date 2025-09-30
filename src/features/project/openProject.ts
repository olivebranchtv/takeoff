// src/features/project/openProject.ts
import { parseSkdProject } from '@/utils/parseProject';
import { useStore } from '@/state/store';

export async function openProjectFromFile(file: File, onWarn: (msg: string) => void, onError: (msg: string) => void) {
  const { fromProject } = useStore.getState();
  try {
    const proj = await parseSkdProject(file);
    // Optional: summarize fixes (basic example).
    const notes: string[] = [];
    if (!proj.pages.length) notes.push('no pages array');
    if (!proj.tags.length) notes.push('no tags array');
    if (notes.length) onWarn(`Opened with minor fixes: ${notes.join(', ')}`);
    fromProject(proj);
  } catch (e: any) {
    console.error(e);
    onError(e?.message || 'Could not open project.');
  }
}
