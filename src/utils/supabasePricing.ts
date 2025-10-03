import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);
export async function fetchMaterialPricing() { return []; }
export async function fetchCompanySettings() { return null; }
export async function updateCompanySettings(settings: any) {}
export async function saveProjectToSupabase(projectData: any, projectName: string) { return true; }
export async function loadAllProjectsFromSupabase() { return []; }
export async function loadProjectByIdFromSupabase(id: string) { return null; }
