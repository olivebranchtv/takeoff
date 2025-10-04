// Quick script to generate JSON array from masterTags
import { DEFAULT_MASTER_TAGS } from './src/constants/masterTags.ts';
import { writeFileSync } from 'fs';

const tagsWithIds = DEFAULT_MASTER_TAGS.map((tag, index) => ({
  id: `tag-${index}-${Date.now()}`,
  code: tag.code,
  name: tag.name,
  color: tag.color,
  category: tag.category,
  ...(tag.customMaterialCost !== undefined && { customMaterialCost: tag.customMaterialCost }),
  ...(tag.customLaborHours !== undefined && { customLaborHours: tag.customLaborHours })
}));

writeFileSync('tags-data.json', JSON.stringify(tagsWithIds, null, 2));
console.log(`✅ Generated tags-data.json with ${tagsWithIds.length} tags`);
