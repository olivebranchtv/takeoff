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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreTags() {
  console.log(`🔄 Restoring ${DEFAULT_MASTER_TAGS.length} tags to Supabase...`);

  // Convert master tags to proper format with IDs
  const tagsWithIds = DEFAULT_MASTER_TAGS.map((tag, index) => ({
    id: `tag-${index}-${Date.now()}`,
    code: tag.code,
    name: tag.name,
    color: tag.color,
    category: tag.category,
    ...(tag.customMaterialCost !== undefined && { customMaterialCost: tag.customMaterialCost }),
    ...(tag.customLaborHours !== undefined && { customLaborHours: tag.customLaborHours })
  }));

  const userId = '00000000-0000-0000-0000-000000000000';

  // Upsert to tag_library
  const { data, error } = await supabase
    .from('tag_library')
    .upsert({
      user_id: userId,
      tags: tagsWithIds,
      color_overrides: {},
      deleted_tag_codes: []
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('❌ Error restoring tags:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully restored ${tagsWithIds.length} tags to Supabase!`);

  // Verify
  const { data: verify } = await supabase
    .from('tag_library')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verify) {
    console.log(`✅ Verified: ${(verify.tags as any[]).length} tags in database`);
  }
}

restoreTags().catch(console.error);
