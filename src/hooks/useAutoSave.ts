import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { saveProjectToSupabase, saveTagsToSupabase } from '@/utils/supabasePricing';

export function useAutoSave() {
  const pages = useStore(s => s.pages);
  const tags = useStore(s => s.tags);
  const colorOverrides = useStore(s => s.colorOverrides);
  const projectName = useStore(s => s.projectName);
  const fileName = useStore(s => s.fileName);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Debounce saves to avoid hammering the database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Save project data
      if (pages.length > 0) {
        const projectData = {
          fileName,
          projectName,
          name: projectName,
          pages,
          tags
        };
        await saveProjectToSupabase(projectData);
      }

      // Save tags separately for faster tag library access
      if (tags.length > 0) {
        await saveTagsToSupabase(tags, colorOverrides);
      }
    }, 2000); // Save 2 seconds after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [pages, tags, colorOverrides, projectName, fileName]);
}
