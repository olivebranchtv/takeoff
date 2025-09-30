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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('User not authenticated. Cannot save pricing data.');
      return false;
    }

    const materialsWithUserId = materials.map(m => ({
      ...m,
      user_id: user.id,
      last_updated: new Date().toISOString()
    }));

    const { error: deleteError } = await supabase
      .from('material_pricing')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old pricing:', deleteError);
    }

    const { error: insertError } = await supabase
      .from('material_pricing')
      .insert(materialsWithUserId);

    if (insertError) {
      console.error('Error saving material pricing:', insertError);
      return false;
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('User not authenticated. Cannot save settings.');
      return false;
    }

    const existing = await loadCompanySettings();

    if (existing) {
      const { error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating company settings:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('company_settings')
        .insert({
          ...settings,
          user_id: user.id
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

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
        user_id: user.id,
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
