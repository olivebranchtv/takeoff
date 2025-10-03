/*
  # Add deleted_tag_codes column to tag_library

  1. Changes
    - Add `deleted_tag_codes` column to `tag_library` table
    - This column stores an array of uppercase tag codes that have been permanently deleted
    - Used to prevent re-importing deleted tags from masterTags.ts

  2. Notes
    - JSONB array type for flexibility
    - Default empty array
    - Allows tracking which master tags the user has explicitly removed
*/

-- Add deleted_tag_codes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tag_library' AND column_name = 'deleted_tag_codes'
  ) THEN
    ALTER TABLE tag_library ADD COLUMN deleted_tag_codes JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
