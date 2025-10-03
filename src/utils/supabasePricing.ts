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
