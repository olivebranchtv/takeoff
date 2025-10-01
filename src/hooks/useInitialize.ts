import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { loadTagsFromSupabase } from '@/utils/supabasePricing';

export function useInitialize() {
  const importTags = useStore(s => s.importTags);
  const setTagColorOverride = useStore(s => s.setTagColorOverride);
  const loadAssembliesFromDatabase = useStore(s => s.loadAssembliesFromDatabase);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialize() {
      console.log('🔄 Initializing application...');

      // Load tags from Supabase
      console.log('🔄 Loading tags from Supabase...');
      try {
        const result = await loadTagsFromSupabase();

        if (result && result.tags && result.tags.length > 0) {
          console.log(`✅ Loaded ${result.tags.length} tags from Supabase`);

          // Import tags into store (this will trigger a save back, but that's OK)
          importTags(result.tags);

          // Apply color overrides
          if (result.colorOverrides) {
            Object.entries(result.colorOverrides).forEach(([code, color]) => {
              setTagColorOverride(code, color as string);
            });
          }

          console.log('✅ Tags loaded successfully from Supabase');
        } else {
          console.log('ℹ️ No tags found in Supabase, using defaults from localStorage');
        }
      } catch (error) {
        console.error('❌ Failed to load tags from Supabase:', error);
        console.log('ℹ️ Falling back to localStorage tags');
      }

      // Load custom assemblies from Supabase
      console.log('🔄 Loading assemblies from Supabase...');
      try {
        await loadAssembliesFromDatabase();
        console.log('✅ Assemblies loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load assemblies from Supabase:', error);
        console.log('ℹ️ Using standard assemblies only');
      }
    }

    initialize();
  }, [importTags, setTagColorOverride, loadAssembliesFromDatabase]);
}
