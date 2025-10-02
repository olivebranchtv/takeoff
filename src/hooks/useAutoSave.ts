import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { saveProjectToSupabase, saveTagsToSupabase } from '@/utils/supabasePricing';

export function useAutoSave() {
  const pages = useStore(s => s.pages);
  const tags = useStore(s => s.tags);
  const colorOverrides = useStore(s => s.colorOverrides);
  const projectName = useStore(s => s.projectName);
  const fileName = useStore(s => s.fileName);
  const setLastSaveTime = useStore(s => s.setLastSaveTime);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const periodicSaveRef = useRef<NodeJS.Timeout>();

  const saveProject = async () => {
    // Save project data
    if (pages.length > 0) {
      const projectData = {
        fileName,
        projectName,
        name: projectName,
        pages,
        tags
      };
      const success = await saveProjectToSupabase(projectData);
      if (success) {
        setLastSaveTime(new Date());
        console.log('✅ Project autosaved to database');
      }
    }

    // Save tags separately for faster tag library access
    if (tags.length > 0) {
      await saveTagsToSupabase(tags, colorOverrides);
    }
  };

  // Debounced save (2 seconds after changes)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(saveProject, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [pages, tags, colorOverrides, projectName, fileName]);

  // Periodic save every 5 minutes
  useEffect(() => {
    periodicSaveRef.current = setInterval(() => {
      if (pages.length > 0) {
        console.log('⏰ Running periodic autosave (5 minutes)...');
        saveProject();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
      }
    };
  }, [pages, tags, colorOverrides, projectName, fileName]);

  // Warn before closing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pages.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Make sure your project is saved before closing.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pages]);
}
