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

export async function saveProjectToSupabase(projectData: any, projectName?: string) {
  const name = projectName || projectData.projectName || 'Untitled Project';
  const { data, error } = await supabase
    .from('project_data')
    .upsert({
      project_name: name,
      project_data: projectData,
      updated_at: new Date().toISOString(),
      user_id: '00000000-0000-0000-0000-000000000000'
    }, { onConflict: 'project_name' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving project:', error);
    return false;
  }

  return true;
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

export async function loadMaterialPricingFromSupabase() {
  return fetchMaterialPricing();
}

export async function saveMaterialPricingToSupabase(materials: any[]) {
  const { error } = await supabase
    .from('material_pricing')
    .upsert(materials);

  if (error) {
    console.error('Error saving material pricing:', error);
    return false;
  }
  return true;
}

export async function loadCompanySettings() {
  return fetchCompanySettings();
}

export async function saveCompanySettings(settings: any) {
  try {
    await updateCompanySettings(settings);
    return true;
  } catch {
    return false;
  }
}

export async function saveProjectEstimate(projectName: string, estimate: any, projectData: any) {
  const { data, error } = await supabase
    .from('project_estimates')
    .insert({
      project_name: projectName,
      estimate_data: estimate,
      project_data: projectData,
      user_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving project estimate:', error);
    return null;
  }

  return data?.id;
}

export async function loadTagsFromSupabase() {
  const { data, error } = await supabase
    .from('tag_library')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error loading tags:', error);
    return null;
  }

  return data;
}

export async function saveTagsToSupabase(tags: any[], colorOverrides: any = {}, deletedTagCodes: string[] = []) {
  const { error } = await supabase
    .from('tag_library')
    .upsert({
      user_id: '00000000-0000-0000-0000-000000000000',
      tags,
      color_overrides: colorOverrides,
      deleted_tag_codes: deletedTagCodes,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving tags:', error);
    throw error;
  }
}

export type MaterialPricing = {
  id: string;
  category: string;
  description: string;
  unit: string;
  material_cost: number;
  labor_hours: number;
  vendor?: string;
  vendor_part_number?: string;
  item_code?: string;
  user_id?: string;
  created_at?: string;
};
