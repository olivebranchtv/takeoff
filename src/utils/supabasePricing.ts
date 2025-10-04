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
  material_waste_factor?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LaborRate {
  id?: string;
  assembly_code: string;
  assembly_name?: string;
  installation_hours: number;
  skill_level?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
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

export async function loadLaborRatesFromSupabase(): Promise<LaborRate[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('labor_rates')
      .select('*')
      .order('assembly_code', { ascending: true });

    if (error) {
      console.error('Error loading labor rates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading labor rates:', error);
    return [];
  }
}

export async function saveMaterialPricingToSupabase(materials: Omit<MaterialPricing, 'id' | 'user_id' | 'created_at'>[]): Promise<boolean> {
  if (!supabase) {
    console.warn('❌ Supabase not configured. Cannot save pricing data.');
    alert('Supabase is not configured. Please check your .env file.');
    return false;
  }

  try {
    console.log(`🔄 Starting to save ${materials.length} materials to Supabase...`);

    // Use a default user_id since this app doesn't have authentication
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const materialsWithUserId = materials.map(m => ({
      ...m,
      user_id: defaultUserId,
      last_updated: new Date().toISOString()
    }));

    // Delete old pricing for this user
    console.log('🗑️ Deleting old pricing data...');
    const { error: deleteError } = await supabase
      .from('material_pricing')
      .delete()
      .eq('user_id', defaultUserId);

    if (deleteError) {
      console.error('❌ Error deleting old pricing:', deleteError);
      alert(`Failed to delete old pricing: ${deleteError.message}\n\nPlease check the console for details.`);
      return false;
    }
    console.log('✅ Old pricing deleted successfully');

    // Insert new pricing in batches to avoid size limits
    const batchSize = 100;
    const totalBatches = Math.ceil(materialsWithUserId.length / batchSize);

    for (let i = 0; i < materialsWithUserId.length; i += batchSize) {
      const batch = materialsWithUserId.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`📦 Saving batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);

      const { error: insertError } = await supabase
        .from('material_pricing')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error saving batch ${batchNumber}:`, insertError);
        alert(`Failed to save pricing data at batch ${batchNumber}/${totalBatches}\n\nError: ${insertError.message}\n\nDetails: ${insertError.hint || 'Check console for more info'}`);
        return false;
      }

      console.log(`✅ Batch ${batchNumber}/${totalBatches} saved successfully`);
    }

    console.log(`✅ All ${materials.length} materials saved successfully to Supabase!`);
    return true;
  } catch (error: any) {
    console.error('❌ Unexpected error saving material pricing:', error);
    alert(`Unexpected error: ${error.message || error}\n\nCheck console for details.`);
    return false;
  }
}

/**
 * Save or update a single tag to the master material_pricing database
 * @param tag - The tag with item code, description, material cost, and labor hours
 * @returns true if successful, false otherwise
 */
export async function saveTagToMasterDatabase(tag: {
  code: string;
  name: string;
  category: string;
  customMaterialCost?: number;
  customLaborHours?: number;
}): Promise<boolean> {
  if (!supabase) {
    console.warn('❌ Supabase not configured. Cannot save to master database.');
    return false;
  }

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    // Check if item already exists
    const { data: existing } = await supabase
      .from('material_pricing')
      .select('id')
      .eq('item_code', tag.code)
      .eq('user_id', defaultUserId)
      .maybeSingle();

    const materialData = {
      item_code: tag.code,
      category: tag.category,
      description: tag.name,
      unit: 'EA',
      material_cost: tag.customMaterialCost || 0,
      labor_hours: tag.customLaborHours || 0,
      user_id: defaultUserId,
      last_updated: new Date().toISOString()
    };

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('material_pricing')
        .update(materialData)
        .eq('id', existing.id);

      if (error) {
        console.error('❌ Error updating master database:', error);
        alert(`Failed to update master database: ${error.message}`);
        return false;
      }
      console.log(`✅ Updated "${tag.code}" in master database`);
    } else {
      // Insert new record
      const { error } = await supabase
        .from('material_pricing')
        .insert(materialData);

      if (error) {
        console.error('❌ Error inserting to master database:', error);
        alert(`Failed to save to master database: ${error.message}`);
        return false;
      }
      console.log(`✅ Saved "${tag.code}" to master database`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Unexpected error saving to master database:', error);
    alert(`Unexpected error: ${error.message || error}`);
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

export async function loadAllProjectsFromSupabase(): Promise<Array<{ id: string; project_name: string; file_name: string; updated_at: string; is_active: boolean }>> {
  if (!supabase) return [];

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('project_data')
      .select('id, project_name, file_name, updated_at, is_active')
      .eq('user_id', defaultUserId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading projects list:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading projects list:', error);
    return [];
  }
}

export async function loadProjectByIdFromSupabase(projectId: string): Promise<any | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('project_data')
      .select('project_data')
      .eq('id', projectId)
      .eq('user_id', defaultUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading project by ID:', error);
      return null;
    }

    if (data) {
      // Set this project as active and deactivate others
      await supabase
        .from('project_data')
        .update({ is_active: false })
        .eq('user_id', defaultUserId);

      await supabase
        .from('project_data')
        .update({ is_active: true })
        .eq('id', projectId);
    }

    return data?.project_data || null;
  } catch (error) {
    console.error('Error loading project by ID:', error);
    return null;
  }
}

export async function saveTagsToSupabase(tags: any[], colorOverrides: any, deletedTagCodes?: string[]): Promise<boolean> {
  if (!supabase) return false;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    // Sanitize tags to ensure custom pricing fields are numbers, not strings
    const sanitizedTags = tags.map(tag => {
      const sanitized = { ...tag };
      // Force convert custom pricing to numbers if present
      if (sanitized.customMaterialCost != null) {
        sanitized.customMaterialCost = Number(sanitized.customMaterialCost);
      }
      if (sanitized.customLaborHours != null) {
        sanitized.customLaborHours = Number(sanitized.customLaborHours);
      }
      return sanitized;
    });

    // Check if tag library exists
    const { data: existing } = await supabase
      .from('tag_library')
      .select('id')
      .eq('user_id', defaultUserId)
      .maybeSingle();

    const updateData: any = {
      tags: sanitizedTags,
      color_overrides: colorOverrides,
      updated_at: new Date().toISOString()
    };

    if (deletedTagCodes) {
      updateData.deleted_tag_codes = deletedTagCodes;
    }

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('tag_library')
        .update(updateData)
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
          ...updateData
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

export async function loadTagsFromSupabase(): Promise<{ tags: any[]; colorOverrides: any; deletedTagCodes?: string[] } | null> {
  if (!supabase) return null;

  try {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('tag_library')
      .select('tags, color_overrides, deleted_tag_codes')
      .eq('user_id', defaultUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading tags:', error);
      return null;
    }

    if (!data) return null;

    // Sanitize loaded tags to ensure custom pricing fields are numbers, not strings
    const sanitizedTags = (data.tags || []).map((tag: any) => {
      const sanitized = { ...tag };
      // Force convert custom pricing to numbers if present
      if (sanitized.customMaterialCost != null) {
        sanitized.customMaterialCost = Number(sanitized.customMaterialCost);
      }
      if (sanitized.customLaborHours != null) {
        sanitized.customLaborHours = Number(sanitized.customLaborHours);
      }
      return sanitized;
    });

    console.log('✅ Loaded tags from database with sanitized custom pricing');

    return {
      tags: sanitizedTags,
      colorOverrides: data.color_overrides || {},
      deletedTagCodes: data.deleted_tag_codes || []
    };
  } catch (error) {
    console.error('Error loading tags:', error);
    return null;
  }
}

/**
 * Lookup material pricing by item_code to get cost and labor hours
 */
export async function lookupMaterialPricingByCode(code: string): Promise<{ materialCost: number; laborHours: number } | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('material_pricing')
      .select('material_cost, labor_hours')
      .eq('item_code', code)
      .maybeSingle();

    if (error) {
      console.error(`Error looking up pricing for code "${code}":`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      materialCost: data.material_cost || 0,
      laborHours: data.labor_hours || 0
    };
  } catch (error) {
    console.error(`Error looking up pricing for code "${code}":`, error);
    return null;
  }
}