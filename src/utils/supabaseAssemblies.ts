import { supabase } from './supabasePricing';
import type { Assembly } from '@/types';

export async function loadAssembliesFromSupabase(): Promise<Assembly[]> {
  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading assemblies:', error);
    return [];
  }

  return data || [];
}

export async function saveAssemblyToDatabase(assembly: Assembly) {
  const { error } = await supabase
    .from('assemblies')
    .upsert({
      id: assembly.id,
      code: assembly.code,
      name: assembly.name,
      description: assembly.description,
      type: assembly.type,
      is_active: assembly.isActive,
      items: assembly.items,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving assembly:', error);
    throw error;
  }
}

export async function saveAssemblyToSupabase(assembly: Assembly): Promise<boolean> {
  try {
    await saveAssemblyToDatabase(assembly);
    return true;
  } catch {
    return false;
  }
}

export async function syncStandardAssembliesToDatabase(assemblies: Assembly[]) {
  try {
    for (const assembly of assemblies) {
      await saveAssemblyToDatabase(assembly);
    }
  } catch (error) {
    console.error('Error syncing assemblies:', error);
  }
}

export async function compareAssemblies(standardAssemblies: Assembly[]): Promise<{
  matched: number;
  missing: Assembly[];
  extra: Assembly[];
}> {
  const dbAssemblies = await loadAssembliesFromSupabase();

  const matched = standardAssemblies.filter(std =>
    dbAssemblies.some(db => db.code === std.code)
  ).length;

  const missing = standardAssemblies.filter(std =>
    !dbAssemblies.some(db => db.code === std.code)
  );

  const extra = dbAssemblies.filter(db =>
    !standardAssemblies.some(std => std.code === db.code)
  );

  return { matched, missing, extra };
}

export async function getAssembliesByCodes(codes: string[]): Promise<Assembly[]> {
  if (codes.length === 0) return [];

  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .in('code', codes);

  if (error) {
    console.error('Error fetching assemblies by codes:', error);
    return [];
  }

  return data || [];
}
