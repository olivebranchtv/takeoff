import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Pricing data will not persist.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface MaterialPricing {
  id?: string;
  category: string;
  description: string;
  unit: string;
  material_cost: number;
  labor_hours?: number;
  vendor?: string;
  vendor_part_number?: string;
  last_updated?: string;
  lead_time_days?: number;
  notes?: string;
  user_id?: string;
}

export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_name?: string;
  default_overhead_percentage: number;
  default_profit_percentage: number;
  default_labor_rate: number;
  material_tax_rate: number;
}

export async function loadMaterialPricingFromSupabase(): Promise<MaterialPricing[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('material_pricing')
      .select('*')
      .order('category', { ascending: true })
      .order('description', { ascending: true });

    if (error) {
      console.error('Error loading material pricing:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading material pricing:', error);
    return [];
  }
}

export async function saveMaterialPricingToSupabase(materials: Omit<MaterialPricing, 'id' | 'user_id' | 'created_at'>[]): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured. Cannot save pricing data.');
    return false;
  }

  try {
    // Use a default user_id since this app doesn't have authentication
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const materialsWithUserId = materials.map(m => ({
      ...m,
      user_id: defaultUserId,
      last_updated: new Date().toISOString()
    }));

    // Delete old pricing for this user
    const { error: deleteError } = await supabase
      .from('material_pricing')
      .delete()
      .eq('user_id', defaultUserId);

    if (deleteError) {
      console.error('Error deleting old pricing:', deleteError);
    }

    // Insert new pricing in batches to avoid size limits
    const batchSize = 100;
    for (let i = 0; i < materialsWithUserId.length; i += batchSize) {
      const batch = materialsWithUserId.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('material_pricing')
        .insert(batch);

      if (insertError) {
        console.error(`Error saving material pricing batch ${i / batchSize + 1}:`, insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving material pricing:', error);
    return false;
  }
}

export async function loadCompanySettings(): Promise<CompanySettings | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', defaultUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading company settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading company settings:', error);
    return null;
  }
}

export async function saveCompanySettings(settings: Omit<CompanySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured. Cannot save settings.');
    return false;
  }

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';
    const existing = await loadCompanySettings();

    if (existing) {
      const { error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', defaultUserId);

      if (error) {
        console.error('Error updating company settings:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('company_settings')
        .insert({
          ...settings,
          user_id: defaultUserId
        });

      if (error) {
        console.error('Error creating company settings:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving company settings:', error);
    return false;
  }
}

export async function saveProjectEstimate(
  projectName: string,
  costs: {
    materialCostTotal: number;
    materialTaxRate: number;
    materialTax: number;
    materialShipping: number;
    laborHoursTotal: number;
    laborCostTotal: number;
    equipmentCostTotal: number;
    subtotal: number;
    overheadPercentage: number;
    overheadAmount: number;
    profitPercentage: number;
    profitAmount: number;
    totalBidPrice: number;
  },
  takeoffData: any
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('project_estimates')
      .insert({
        project_name: projectName,
        material_cost_total: costs.materialCostTotal,
        material_tax_rate: costs.materialTaxRate,
        material_tax: costs.materialTax,
        material_shipping: costs.materialShipping,
        labor_hours_total: costs.laborHoursTotal,
        labor_cost_total: costs.laborCostTotal,
        equipment_cost_total: costs.equipmentCostTotal,
        subtotal: costs.subtotal,
        overhead_percentage: costs.overheadPercentage,
        overhead_amount: costs.overheadAmount,
        profit_percentage: costs.profitPercentage,
        profit_amount: costs.profitAmount,
        total_bid_price: costs.totalBidPrice,
        user_id: defaultUserId,
        takeoff_data: takeoffData,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving project estimate:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Error saving project estimate:', error);
    return null;
  }
}

export async function saveProjectToSupabase(projectData: any): Promise<boolean> {
  if (!supabase) return false;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    // First, deactivate all projects for this user
    await supabase
      .from('project_data')
      .update({ is_active: false })
      .eq('user_id', defaultUserId);

    // Check if project already exists
    const { data: existing } = await supabase
      .from('project_data')
      .select('id')
      .eq('user_id', defaultUserId)
      .eq('project_name', projectData.name || projectData.projectName || 'Untitled Project')
      .maybeSingle();

    if (existing) {
      // Update existing project
      const { error } = await supabase
        .from('project_data')
        .update({
          file_name: projectData.fileName,
          project_data: projectData,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating project:', error);
        return false;
      }
    } else {
      // Insert new project
      const { error } = await supabase
        .from('project_data')
        .insert({
          user_id: defaultUserId,
          project_name: projectData.name || projectData.projectName || 'Untitled Project',
          file_name: projectData.fileName,
          project_data: projectData,
          is_active: true
        });

      if (error) {
        console.error('Error inserting project:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
}

export async function loadProjectFromSupabase(): Promise<any | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('project_data')
      .select('project_data')
      .eq('user_id', defaultUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading project:', error);
      return null;
    }

    return data?.project_data || null;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

export async function saveTagsToSupabase(tags: any[], colorOverrides: any): Promise<boolean> {
  if (!supabase) return false;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    // Check if tag library exists
    const { data: existing } = await supabase
      .from('tag_library')
      .select('id')
      .eq('user_id', defaultUserId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('tag_library')
        .update({
          tags,
          color_overrides: colorOverrides,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating tags:', error);
        return false;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('tag_library')
        .insert({
          user_id: defaultUserId,
          tags,
          color_overrides: colorOverrides
        });

      if (error) {
        console.error('Error inserting tags:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving tags:', error);
    return false;
  }
}

export async function loadTagsFromSupabase(): Promise<{ tags: any[]; colorOverrides: any } | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('tag_library')
      .select('tags, color_overrides')
      .eq('user_id', defaultUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading tags:', error);
      return null;
    }

    if (!data) return null;

    return {
      tags: data.tags || [],
      colorOverrides: data.color_overrides || {}
    };
  } catch (error) {
    console.error('Error loading tags:', error);
    return null;
  }
}
