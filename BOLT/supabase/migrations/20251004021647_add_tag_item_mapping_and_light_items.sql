/*
  # Add Tag-to-Item Mapping and Missing Light Items

  ## Changes
  
  1. **New Table: tag_item_mapping**
     - Maps custom tag codes (like "LT-STEP") to actual database item codes
     - Allows flexible tag naming while maintaining pricing accuracy
     - Columns: tag_code (unique), item_code, notes, timestamps
  
  2. **New Light Items**
     - LT-STEP: Step/Path Light
     - LT-WALL: Wall Light  
     - LT-BOLLARD: Bollard Light
     - LT-POLE: Pole Light
     - LT-SPOT: Spot Light
  
  3. **Security**
     - Public read access to mapping table
     - Maintains existing RLS on material_pricing
  
  ## Purpose
  Resolves critical issue where custom tag codes cannot find pricing data
  by providing a translation layer between user tags and database items.
*/

-- Create tag-to-item mapping table
CREATE TABLE IF NOT EXISTS tag_item_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text NOT NULL UNIQUE,
  item_code text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tag_item_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tag mappings"
  ON tag_item_mapping
  FOR SELECT
  USING (true);

-- Add missing lighting items to material_pricing
INSERT INTO material_pricing (item_code, description, category, unit, material_cost, labor_hours) VALUES
  ('LT-STEP', 'Step/Path Light', 'Lighting Fixtures', 'EA', 0, 1.5),
  ('LT-WALL', 'Wall Light', 'Lighting Fixtures', 'EA', 0, 1.5),
  ('LT-BOLLARD', 'Bollard Light', 'Lighting Fixtures', 'EA', 0, 2.0),
  ('LT-POLE', 'Pole Light', 'Lighting Fixtures', 'EA', 0, 3.0),
  ('LT-SPOT', 'Spot Light', 'Lighting Fixtures', 'EA', 0, 1.0);

-- Add some example mappings for transformer pads
INSERT INTO tag_item_mapping (tag_code, item_code, notes) VALUES
  ('XFMR-PAD-L', 'ITEM-0429', 'Large Transformer Pad'),
  ('XFMR-PAD-M', 'ITEM-0429', 'Medium Transformer Pad'),
  ('XFMR-PAD-S', 'ITEM-0429', 'Small Transformer Pad');