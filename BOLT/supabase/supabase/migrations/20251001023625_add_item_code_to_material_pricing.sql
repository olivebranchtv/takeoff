/*
  # Add Item Code to Material Pricing

  1. Changes
    - Add `item_code` column to `material_pricing` table
    - Add unique constraint on `item_code` where not null
    - Generate item codes for all existing materials starting from 1
    - Create index on `item_code` for fast lookups

  2. Purpose
    - Enable exact matching between assemblies and pricing database
    - Eliminate fuzzy matching issues with descriptions
    - Provide stable references that won't break with description changes
*/

-- Add item_code column
ALTER TABLE material_pricing ADD COLUMN IF NOT EXISTS item_code text;

-- Generate sequential item codes for existing materials (format: ITEM-0001, ITEM-0002, etc.)
DO $$
DECLARE
  row_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR row_record IN 
    SELECT id FROM material_pricing ORDER BY category, description
  LOOP
    UPDATE material_pricing 
    SET item_code = 'ITEM-' || LPAD(counter::text, 4, '0')
    WHERE id = row_record.id AND item_code IS NULL;
    counter := counter + 1;
  END LOOP;
END $$;

-- Create unique index on item_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_pricing_item_code 
  ON material_pricing(item_code) 
  WHERE item_code IS NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_material_pricing_item_code_lookup 
  ON material_pricing(item_code);
