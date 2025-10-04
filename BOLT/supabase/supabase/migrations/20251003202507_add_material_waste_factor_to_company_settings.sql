/*
  # Add Material Waste Factor to Company Settings

  1. Changes
    - Add `material_waste_factor` column to `company_settings` table
    - Default value: 0.00 (0% waste)
    - Allows users to set a percentage to add to material costs (e.g., 0.05 = 5% waste)

  2. Notes
    - This waste factor applies to all material costs in competitive bidding mode
    - Different from assembly-level waste factors (which are now set to 0)
    - Value is a decimal percentage (e.g., 0.10 = 10% waste)
*/

-- Add material_waste_factor column to company_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'material_waste_factor'
  ) THEN
    ALTER TABLE company_settings 
    ADD COLUMN material_waste_factor DECIMAL(5,4) DEFAULT 0.0000;
  END IF;
END $$;

-- Add a comment to document the column
COMMENT ON COLUMN company_settings.material_waste_factor IS 
  'Percentage waste factor for materials in bidding (0.05 = 5% waste). Applied to all material costs.';
