import { readFileSync } from 'fs';

const tagsData = JSON.parse(readFileSync('tags-data.json', 'utf-8'));
const tagsJson = JSON.stringify(tagsData).replace(/'/g, "''");

const sql = `
UPDATE tag_library
SET tags = '${tagsJson}'::jsonb,
    updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000000';
`;

console.log(sql);
