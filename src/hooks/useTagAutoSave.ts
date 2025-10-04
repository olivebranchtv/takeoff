import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { saveTagsToSupabase } from '@/utils/supabasePricing';

/**
 * Auto-saves ONLY the tag library to Supabase immediately after any change.
 * Projects are saved manually by the user.
 */
export function useTagAutoSave() {
  const tags = useStore(s => s.tags);
  const colorOverrides = useStore(s => s.colorOverrides);
  const deletedTagCodes = useStore(s => s.deletedTagCodes);
  const setIsSaving = useStore(s => s.setIsSaving);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 500ms after last change before saving tags to database
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        console.log('💾 Auto-saving tag library to database...', {
          tagCount: tags.length,
          deletedCount: deletedTagCodes.length,
          colorOverrideCount: Object.keys(colorOverrides).length
        });
        const success = await saveTagsToSupabase(tags, colorOverrides, deletedTagCodes);
        if (success) {
          console.log('✅ Tag library saved to database successfully');
        } else {
          console.error('❌ Failed to save tag library - check Supabase errors above');
        }
      } catch (error) {
        console.error('❌ Error saving tag library:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tags, colorOverrides, deletedTagCodes, setIsSaving]);
}
