import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { saveProjectToSupabase, saveTagsToSupabase } from '@/utils/supabasePricing';

export function useAutoSave() {
  const pages = useStore(s => s.pages);
  const tags = useStore(s => s.tags);
  const colorOverrides = useStore(s => s.colorOverrides);
  const deletedTagCodes = useStore(s => s.deletedTagCodes);
  const projectName = useStore(s => s.projectName);
  const fileName = useStore(s => s.fileName);
  const pdfBytesBase64 = useStore(s => s.pdfBytesBase64);
  const pdfName = useStore(s => s.pdfName);
  const setLastSaveTime = useStore(s => s.setLastSaveTime);

  const periodicSaveRef = useRef<NodeJS.Timeout>();

  const saveProject = async () => {
    // Save project data
    if (pages.length > 0) {
      const projectData = {
        fileName,
        projectName,
        name: projectName,
        pages,
        tags,
        pdf: pdfBytesBase64 ? {
          bytesBase64: pdfBytesBase64,
          name: pdfName || fileName
        } : undefined
      };
      const success = await saveProjectToSupabase(projectData);
      if (success) {
        setLastSaveTime(new Date());
        console.log('✅ Project autosaved to database');
      }
    }

    // Save tags separately for faster tag library access (ALWAYS save, even with 0 tags, to persist deletedTagCodes)
    await saveTagsToSupabase(tags, colorOverrides, deletedTagCodes);
  };

  // AUTOSAVE DISABLED - Manual save only
  // Periodic save every 5 minutes
  useEffect(() => {
    console.log('⏸️ Autosave is currently DISABLED');
    // periodicSaveRef.current = setInterval(() => {
    //   if (pages.length > 0) {
    //     console.log('⏰ Running periodic autosave (5 minutes)...');
    //     saveProject();
    //   }
    // }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
      }
    };
  }, [pages, tags, colorOverrides, deletedTagCodes, projectName, fileName, pdfBytesBase64, pdfName]);

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