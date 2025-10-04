/*
  # Add Labor Hours to Material Pricing

  1. Changes
    - Add `labor_hours` column to `material_pricing` table
    - This allows storing installation time per unit directly with material costs
    - Supports SKD Database format which includes labor hours alongside material costs

  2. Notes
    - Column is nullable since not all materials have associated labor
    - Uses DECIMAL(6,3) to support fractional hours (e.g., 0.007 hours)
*/

-- Add labor_hours column to material_pricing table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_pricing' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE material_pricing ADD COLUMN labor_hours DECIMAL(6,3);
  END IF;
END $$;
