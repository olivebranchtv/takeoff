/**
 * COMPLETE RESET: This script loads all 455 tags from masterTags.ts into Supabase
 * and CLEARS the deleted_tag_codes list for a fresh start.
 *
 * Run with: npx tsx populate-tags-fresh.ts
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MASTER_TAGS } from './src/constants/masterTags';
import { readFileSync } from 'fs';

// Load .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('L Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function populateTags() {
  console.log(`\n= COMPLETE TAG RESET`);
  console.log(`   Loading ${DEFAULT_MASTER_TAGS.length} tags from masterTags.ts...`);

  // Convert master tags to proper format with IDs
  const tagsWithIds = DEFAULT_MASTER_TAGS.map((tag) => ({
    id: `tag-${tag.code}-${Date.now()}`,
    code: tag.code,
    name: tag.name,
    color: tag.color,
    category: tag.category,
    ...(tag.customMaterialCost !== undefined && { customMaterialCost: tag.customMaterialCost }),
    ...(tag.customLaborHours !== undefined && { customLaborHours: tag.customLaborHours })
  }));

  const userId = '00000000-0000-0000-0000-000000000000';

  console.log(`\n=� Updating Supabase tag_library...`);

  // Upsert to tag_library - this will REPLACE all existing tags
  const { error } = await supabase
    .from('tag_library')
    .upsert({
      user_id: userId,
      tags: tagsWithIds,
      color_overrides: {},
      deleted_tag_codes: [] // � CLEAR deleted tags - fresh start
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('L Error populating tags:', error);
    process.exit(1);
  }

  console.log(` Successfully populated ${tagsWithIds.length} tags!`);
  console.log(` Cleared deleted_tag_codes list`);

  // Verify
  const { data: verify } = await supabase
    .from('tag_library')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verify) {
    const tagCount = (verify.tags as any[]).length;
    const deletedCount = (verify.deleted_tag_codes as any[] || []).length;
    console.log(`\n=� Database Status:`);
    console.log(`    ${tagCount} tags loaded`);
    console.log(`    ${deletedCount} deleted tag codes (fresh start)`);
    console.log(`\n( All done! Refresh your browser to see all ${tagCount} tags.`);
    console.log(`\n=� HOW TO PERMANENTLY DELETE TAGS:`);
    console.log(`   1. Open your app and click "Tags" button`);
    console.log(`   2. Find the unwanted tag`);
    console.log(`   3. Click the "Delete" button next to it`);
    console.log(`   4. That tag will NEVER come back, even if you click "Load Defaults"`);
    console.log(`\n�  DO NOT edit masterTags.ts file - delete tags through the UI!`);
  }
}

populateTags().catch(console.error);
