import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MASTER_TAGS } from './src/constants/masterTags';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

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
    category: mt.category
  }));

  // Create color overrides from tags
  const colorOverrides: Record<string, string> = {};
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

  // Verify
  const { data: verify } = await supabase
    .from('tag_library')
    .select('tags')
    .eq('user_id', defaultUserId)
    .maybeSingle();

  if (verify) {
    console.log(`✅ Verified: ${verify.tags.length} tags in database`);
  }
}

populateTags().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
