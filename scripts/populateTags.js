// Script to populate all master tags into Supabase
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MASTER_TAGS } from '../src/constants/masterTags.ts';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const defaultUserId = '00000000-0000-0000-0000-000000000000';

async function populateTags() {
  console.log(`🔄 Populating ${DEFAULT_MASTER_TAGS.length} tags into Supabase...`);

  // Convert master tags to Tag format with IDs
  const tags = DEFAULT_MASTER_TAGS.map(mt => ({
    id: crypto.randomUUID(),
    code: mt.code,
    name: mt.name,
    color: mt.color,
    category: mt.category,
    ...(mt.customMaterialCost !== undefined && { customMaterialCost: mt.customMaterialCost }),
    ...(mt.customLaborHours !== undefined && { customLaborHours: mt.customLaborHours })
  }));

  // Create color overrides from tags
  const colorOverrides = {};
  tags.forEach(tag => {
    if (tag.code && tag.color) {
      colorOverrides[tag.code] = tag.color;
    }
  });

  const updateData = {
    tags: tags,
    color_overrides: colorOverrides,
    deleted_tag_codes: [],
    updated_at: new Date().toISOString()
  };

  // Check if exists
  const { data: existing } = await supabase
    .from('tag_library')
    .select('id')
    .eq('user_id', defaultUserId)
    .maybeSingle();

  if (existing) {
    console.log('📝 Updating existing tag library...');
    const { error } = await supabase
      .from('tag_library')
      .update(updateData)
      .eq('id', existing.id);

    if (error) {
      console.error('❌ Error updating tags:', error);
      process.exit(1);
    }
  } else {
    console.log('📝 Creating new tag library...');
    const { error } = await supabase
      .from('tag_library')
      .insert({
        user_id: defaultUserId,
        ...updateData
      });

    if (error) {
      console.error('❌ Error inserting tags:', error);
      process.exit(1);
    }
  }

  console.log(`✅ Successfully populated ${tags.length} tags into Supabase!`);
  console.log(`📊 Categories: ${[...new Set(tags.map(t => t.category))].length}`);
}

populateTags().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
