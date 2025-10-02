import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { loadTagsFromSupabase } from '@/utils/supabasePricing';
import { syncStandardAssembliesToDatabase, loadAssembliesFromSupabase, compareAssemblies, getAssembliesByCodes } from '@/utils/supabaseAssemblies';
import { STANDARD_ASSEMBLIES } from '@/constants/assemblies';

export function useInitialize() {
  const importTags = useStore(s => s.importTags);
  const setTagColorOverride = useStore(s => s.setTagColorOverride);
  const setAssemblies = useStore(s => s.setAssemblies);
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

      // Compare and sync standard assemblies to Supabase
      console.log('🔄 Checking assemblies sync status...');
      try {
        const comparison = await compareAssemblies(STANDARD_ASSEMBLIES);
        console.log(`📊 Assembly comparison: ${comparison.matched} matched, ${comparison.missing.length} missing in DB, ${comparison.extra.length} extra in DB`);

        if (comparison.missing.length > 0) {
          console.log(`⚠️ Missing assemblies:`, comparison.missing.join(', '));
        }
        if (comparison.extra.length > 0) {
          console.log(`ℹ️ Extra assemblies in DB (custom):`, comparison.extra.join(', '));

          // Fetch details of extra assemblies
          const extraAssemblies = await getAssembliesByCodes(comparison.extra);
          if (extraAssemblies.length > 0) {
            console.log('📋 Extra assembly details:');
            extraAssemblies.forEach(asm => {
              console.log(`  - ${asm.code}: ${asm.name}`);
              console.log(`    Type: ${asm.type}, Items: ${asm.items.length}`);
            });
          }
        }

        await syncStandardAssembliesToDatabase(STANDARD_ASSEMBLIES);
      } catch (error) {
        console.error('❌ Failed to sync standard assemblies:', error);
      }

      // Load ALL assemblies from Supabase (standard + custom)
      console.log('🔄 Loading all assemblies from Supabase...');
      try {
        const assemblies = await loadAssembliesFromSupabase();
        if (assemblies && assemblies.length > 0) {
          console.log(`✅ Loaded ${assemblies.length} assemblies from Supabase`);
          setAssemblies(assemblies);
        } else {
          console.log('⚠️ No assemblies in database, using standard assemblies from code');
          setAssemblies(STANDARD_ASSEMBLIES);
        }
      } catch (error) {
        console.error('❌ Failed to load assemblies from Supabase:', error);
        console.log('ℹ️ Using standard assemblies from code');
        setAssemblies(STANDARD_ASSEMBLIES);
      }
    }

    initialize();
  }, [importTags, setTagColorOverride, setAssemblies]);
}
