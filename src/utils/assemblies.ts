import { supabase } from './supabasePricing';
import type { Assembly } from '@/types';

export async function fetchAssembliesFromDB(): Promise<Assembly[]> {
  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching assemblies:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    type: row.type || 'custom',
    items: row.items || [],
    isActive: row.is_active ?? true,
  }));
}

export async function saveAssemblyToDB(assembly: Assembly): Promise<void> {
  const { error } = await supabase
    .from('assemblies')
    .upsert({
      id: assembly.id,
      code: assembly.code,
      name: assembly.name,
      description: assembly.description,
      type: assembly.type,
      items: assembly.items,
      is_active: assembly.isActive,
    });

  if (error) {
    console.error('Error saving assembly:', error);
    throw error;
  }
}

export async function deleteAssemblyFromDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('assemblies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting assembly:', error);
    throw error;
  }
}
