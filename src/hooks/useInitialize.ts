import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { loadTagsFromSupabase } from '@/utils/supabasePricing';
import { syncStandardAssembliesToDatabase, loadAssembliesFromSupabase, compareAssemblies, getAssembliesByCodes } from '@/utils/supabaseAssemblies';
import { STANDARD_ASSEMBLIES } from '@/constants/assemblies';

export function useInitialize() {
  const importTags = useStore(s => s.importTags);
  const setTagColorOverride = useStore(s => s.setTagColorOverride);
  const setAssemblies = useStore(s => s.setAssemblies);
  const setHasLoadedFromSupabase = useStore(s => s.setHasLoadedFromSupabase);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialize() {
      console.log('🔄 Initializing application (Supabase-only mode)...');

      // Load tags from Supabase
      console.log('🔄 Loading tags from Supabase...');
      try {
        const result = await loadTagsFromSupabase();

        // Check if we have ANY data from Supabase (even if tags array is empty)
        // This prevents re-importing master tags when user has deleted all tags
        if (result) {
          console.log(`✅ Loaded tag library from Supabase (${result.tags?.length || 0} tags, ${result.deletedTagCodes?.length || 0} deleted codes)`);

          // Apply deletedTagCodes BEFORE importing tags (CRITICAL: this prevents re-import of deleted tags)
          if (result.deletedTagCodes && result.deletedTagCodes.length > 0) {
            console.log(`🗑️ Loading ${result.deletedTagCodes.length} deleted tag codes:`, result.deletedTagCodes);
            useStore.setState({ deletedTagCodes: result.deletedTagCodes });
          }

          // Only import tags if we have any
          if (result.tags && result.tags.length > 0) {
            // Count how many tags have assemblies assigned
            const tagsWithAssemblies = result.tags.filter((t: any) => t.assemblyId).length;
            console.log(`   📋 ${tagsWithAssemblies} tags have assemblies assigned`);

            // Check specifically for lights with assemblies
            const lightTags = result.tags.filter((t: any) => t.category?.toLowerCase().includes('light'));
            const lightsWithAssemblies = lightTags.filter((t: any) => t.assemblyId).length;
            console.log(`   💡 ${lightsWithAssemblies} of ${lightTags.length} light tags have assemblies assigned`);

            // Check if TCLK has custom pricing
            const tclk = result.tags.find(t => t.code === 'TCLK');
            if (tclk) {
              console.log('🔍 TCLK tag loaded from Supabase DB:');
              console.log('   Code:', tclk.code);
              console.log('   Name:', tclk.name);
              console.log('   customMaterialCost:', tclk.customMaterialCost, typeof tclk.customMaterialCost);
              console.log('   customLaborHours:', tclk.customLaborHours, typeof tclk.customLaborHours);
            } else {
              console.warn('⚠️ TCLK tag NOT found in Supabase tags!');
            }

            console.log('📥 About to importTags() - this will merge with store and save to Supabase');

            // Import tags into store (this will trigger Supabase save)
            importTags(result.tags);

            // Verify TCLK was imported correctly
            console.log('🔍 Verifying TCLK after importTags():');
            const storeTags = useStore.getState().tags;
            const tclkInStore = storeTags.find(t => t.code === 'TCLK');
            if (tclkInStore) {
              console.log('   ✅ TCLK in store:', {
                code: tclkInStore.code,
                customMaterialCost: tclkInStore.customMaterialCost,
                customLaborHours: tclkInStore.customLaborHours
              });
            } else {
              console.error('   ❌ TCLK NOT FOUND in store after import!');
            }
          } else {
            console.log('ℹ️ Tag library loaded from Supabase but contains 0 tags (all deleted)');
          }

          // Apply color overrides
          if (result.colorOverrides) {
            Object.entries(result.colorOverrides).forEach(([code, color]) => {
              setTagColorOverride(code, color as string);
            });
          }

          console.log('✅ Tags loaded successfully from Supabase');
        } else {
          console.log('ℹ️ No tags found in Supabase, loading master tags...');
          // Load master tags from constants
          const { DEFAULT_MASTER_TAGS } = await import('@/constants/masterTags');
          if (DEFAULT_MASTER_TAGS && DEFAULT_MASTER_TAGS.length > 0) {
            console.log(`📥 Importing ${DEFAULT_MASTER_TAGS.length} master tags into database...`);
            importTags(DEFAULT_MASTER_TAGS);
            console.log('✅ Master tags loaded');
          }
        }

        // Mark that we've completed Supabase load
        setHasLoadedFromSupabase(true);
      } catch (error) {
        console.error('❌ Failed to load tags from Supabase:', error);
        console.log('ℹ️ Falling back to default tags in store');
        // Still mark as loaded even if failed, to prevent blocking
        setHasLoadedFromSupabase(true);
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
  }, [importTags, setTagColorOverride, setAssemblies, setHasLoadedFromSupabase]);
}