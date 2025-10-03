import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchMaterialPricing() {
  const { data, error } = await supabase
    .from('material_pricing')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching material pricing:', error);
    return [];
  }

  return data || [];
}

export async function fetchCompanySettings() {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }

  return data;
}

export async function updateCompanySettings(settings: any) {
  const { error } = await supabase
    .from('company_settings')
    .upsert(settings);

  if (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
}

export async function saveProjectToSupabase(projectData: any, projectName: string) {
  const { data, error } = await supabase
    .from('project_data')
    .upsert({
      project_name: projectName,
      project_data: projectData,
      updated_at: new Date().toISOString(),
      user_id: '00000000-0000-0000-0000-000000000000'
    }, { onConflict: 'project_name' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving project:', error);
    throw error;
  }

  return data;
}

export async function loadAllProjectsFromSupabase() {
  const { data, error } = await supabase
    .from('project_data')
    .select('id, project_name, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error loading projects:', error);
    return [];
  }

  return data || [];
}

export async function loadProjectByIdFromSupabase(id: string) {
  const { data, error } = await supabase
    .from('project_data')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error loading project:', error);
    throw error;
  }

  return data;
}
