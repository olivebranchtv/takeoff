/*
  # Fix tag_library duplicate rows issue
  
  1. Problem
    - Multiple rows were being created for the same user_id
    - This caused query timeouts when loading tags
    - The saveTagsToSupabase function was inserting instead of updating
  
  2. Solution
    - Add UNIQUE constraint on user_id column
    - This prevents duplicate rows from being created
    - Future inserts will fail if duplicate user_id exists, forcing updates
  
  3. Changes
    - Add unique constraint to tag_library.user_id
*/

-- Add unique constraint to prevent duplicate user_id rows
ALTER TABLE tag_library 
ADD CONSTRAINT tag_library_user_id_unique UNIQUE (user_id);
