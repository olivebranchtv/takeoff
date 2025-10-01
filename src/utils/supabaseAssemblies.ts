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
 * Load all custom and edited assemblies from Supabase
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
      console.log('No custom assemblies found in database');
      return [];
    }

    console.log(`✅ Loaded ${data.length} custom assemblies from Supabase`);

    // Convert database format to Assembly type
    return data.map((row: DbAssembly) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || '',
      type: row.type as Assembly['type'],
      isActive: row.is_active,
      items: Array.isArray(row.items) ? row.items : []
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
export async function saveAssembliesBatch(assemblies: Assembly[]): Promise<boolean> {
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
      is_custom: true,
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
