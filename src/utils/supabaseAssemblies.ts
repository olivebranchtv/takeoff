/**
 * Supabase Assembly Management
 * CRUD operations for custom and edited assemblies
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Assembly } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<any> | null = null;

function getSupabaseClient(): SupabaseClient<any> | null {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

interface DbAssembly {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  is_custom: boolean;
  items: any;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

/**
 * Load ALL assemblies from Supabase (standard and custom)
 */
export async function loadAssembliesFromSupabase(): Promise<Assembly[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - cannot load assemblies');
    return [];
  }

  try {
    const { data, error } = await client
      .from('assemblies')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error loading assemblies from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No assemblies found in database');
      return [];
    }

    // Get all material IDs from all assemblies
    const materialIds = new Set<string>();
    data.forEach((row: DbAssembly) => {
      if (Array.isArray(row.items)) {
        row.items.forEach((item: any) => {
          if (item.material_id) {
            materialIds.add(item.material_id);
          }
        });
      }
    });

    // Fetch all materials in one query
    const materialMap = new Map();
    if (materialIds.size > 0) {
      const { data: materials } = await client
        .from('material_pricing')
        .select('id, item_code, description, category, unit')
        .in('id', Array.from(materialIds));

      if (materials) {
        materials.forEach((mat: any) => {
          materialMap.set(mat.id, mat);
        });
      }
    }

    console.log(`✅ Loaded ${data.length} assemblies from Supabase`);

    // Convert database format to Assembly type with enriched items
    return data.map((row: DbAssembly) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || '',
      type: row.type as Assembly['type'],
      isActive: row.is_active,
      items: Array.isArray(row.items) ? row.items.map((item: any) => {
        const material = materialMap.get(item.material_id);
        return {
          id: item.material_id || crypto.randomUUID(),
          description: material?.description || item.description || 'Unknown material',
          unit: material?.unit || item.unit || 'EA',
          quantityPer: item.quantityPer || item.quantity || 1,
          category: material?.category || item.category || '',
          wasteFactor: item.wasteFactor || 1.02,
          itemCode: material?.item_code || item.itemCode || undefined,
          notes: item.notes || undefined
        };
      }) : []
    }));
  } catch (err) {
    console.error('Exception loading assemblies:', err);
    return [];
  }
}

/**
 * Save an assembly to Supabase (create or update)
 */
export async function saveAssemblyToSupabase(assembly: Assembly): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - cannot save assembly');
    return false;
  }

  try {
    // Check if assembly already exists
    const { data: existing } = await client
      .from('assemblies')
      .select('id')
      .eq('id', assembly.id)
      .maybeSingle();

    const dbAssembly = {
      id: assembly.id,
      code: assembly.code,
      name: assembly.name,
      description: assembly.description || null,
      type: assembly.type,
      is_active: assembly.isActive,
      is_custom: true, // Mark as custom since it's being saved by user
      items: assembly.items
    };

    if (existing) {
      // Update existing
      const { error } = await client
        .from('assemblies')
        .update(dbAssembly as any)
        .eq('id', assembly.id);

      if (error) {
        console.error('Error updating assembly:', error);
        return false;
      }

      console.log(`✅ Updated assembly: ${assembly.code} - ${assembly.name}`);
    } else {
      // Insert new
      const { error } = await client
        .from('assemblies')
        .insert(dbAssembly as any);

      if (error) {
        console.error('Error inserting assembly:', error);
        return false;
      }

      console.log(`✅ Created assembly: ${assembly.code} - ${assembly.name}`);
    }

    return true;
  } catch (err) {
    console.error('Exception saving assembly:', err);
    return false;
  }
}

/**
 * Delete an assembly from Supabase
 */
export async function deleteAssemblyFromSupabase(assemblyId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - cannot delete assembly');
    return false;
  }

  try {
    const { error } = await client
      .from('assemblies')
      .delete()
      .eq('id', assemblyId);

    if (error) {
      console.error('Error deleting assembly:', error);
      return false;
    }

    console.log(`✅ Deleted assembly: ${assemblyId}`);
    return true;
  } catch (err) {
    console.error('Exception deleting assembly:', err);
    return false;
  }
}

/**
 * Save multiple assemblies in batch
 */
export async function saveAssembliesBatch(assemblies: Assembly[], isCustom: boolean = true): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - cannot save assemblies');
    return false;
  }

  try {
    const dbAssemblies = assemblies.map(assembly => ({
      id: assembly.id,
      code: assembly.code,
      name: assembly.name,
      description: assembly.description || null,
      type: assembly.type,
      is_active: assembly.isActive,
      is_custom: isCustom,
      items: assembly.items
    }));

    const { error } = await client
      .from('assemblies')
      .upsert(dbAssemblies as any);

    if (error) {
      console.error('Error batch saving assemblies:', error);
      return false;
    }

    console.log(`✅ Saved ${assemblies.length} assemblies to database`);
    return true;
  } catch (err) {
    console.error('Exception batch saving assemblies:', err);
    return false;
  }
}

/**
 * Sync standard assemblies to database (only if they don't exist)
 * This ensures all team members have access to the same standard assemblies
 */
export async function syncStandardAssembliesToDatabase(standardAssemblies: Assembly[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - cannot sync standard assemblies');
    return false;
  }

  try {
    // Check how many assemblies exist in the database
    const { count, error: countError } = await client
      .from('assemblies')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking assembly count:', countError);
      return false;
    }

    // If database is empty or has very few assemblies, sync all standard assemblies
    if (count === null || count < standardAssemblies.length / 2) {
      console.log(`🔄 Syncing ${standardAssemblies.length} standard assemblies to database...`);
      const success = await saveAssembliesBatch(standardAssemblies, false); // false = not custom
      if (success) {
        console.log('✅ Standard assemblies synced to database');
      }
      return success;
    } else {
      console.log('ℹ️ Standard assemblies already in database');
      return true;
    }
  } catch (err) {
    console.error('Exception syncing standard assemblies:', err);
    return false;
  }
}
