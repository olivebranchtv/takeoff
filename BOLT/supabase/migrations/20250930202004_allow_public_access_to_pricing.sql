/*
  # Allow Public Access to Pricing Tables

  1. Changes
    - Drop existing RLS policies that require authentication
    - Create new policies that allow public access with default user_id
    - This supports the app's no-auth design while maintaining data isolation

  2. Security
    - All data uses a default user_id (00000000-0000-0000-0000-000000000000)
    - RLS remains enabled to prevent accidental data access
    - Public users can only access data with the default user_id
*/

-- Drop old policies for material_pricing
DROP POLICY IF EXISTS "Users can view own material pricing" ON material_pricing;
DROP POLICY IF EXISTS "Users can insert own material pricing" ON material_pricing;
DROP POLICY IF EXISTS "Users can update own material pricing" ON material_pricing;
DROP POLICY IF EXISTS "Users can delete own material pricing" ON material_pricing;

-- Create new public policies for material_pricing
CREATE POLICY "Public can view default material pricing"
  ON material_pricing FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can insert default material pricing"
  ON material_pricing FOR INSERT
  TO public
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can update default material pricing"
  ON material_pricing FOR UPDATE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can delete default material pricing"
  ON material_pricing FOR DELETE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Drop old policies for company_settings
DROP POLICY IF EXISTS "Users can view own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON company_settings;

-- Create new public policies for company_settings
CREATE POLICY "Public can view default settings"
  ON company_settings FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can insert default settings"
  ON company_settings FOR INSERT
  TO public
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can update default settings"
  ON company_settings FOR UPDATE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- Drop old policies for project_estimates
DROP POLICY IF EXISTS "Users can view own estimates" ON project_estimates;
DROP POLICY IF EXISTS "Users can insert own estimates" ON project_estimates;
DROP POLICY IF EXISTS "Users can update own estimates" ON project_estimates;
DROP POLICY IF EXISTS "Users can delete own estimates" ON project_estimates;

-- Create new public policies for project_estimates
CREATE POLICY "Public can view default estimates"
  ON project_estimates FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can insert default estimates"
  ON project_estimates FOR INSERT
  TO public
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can update default estimates"
  ON project_estimates FOR UPDATE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Public can delete default estimates"
  ON project_estimates FOR DELETE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Update estimate_line_items policies
DROP POLICY IF EXISTS "Users can view estimate line items" ON estimate_line_items;
DROP POLICY IF EXISTS "Users can insert estimate line items" ON estimate_line_items;
DROP POLICY IF EXISTS "Users can update estimate line items" ON estimate_line_items;
DROP POLICY IF EXISTS "Users can delete estimate line items" ON estimate_line_items;

CREATE POLICY "Public can view estimate line items"
  ON estimate_line_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = '00000000-0000-0000-0000-000000000000'
    )
  );

CREATE POLICY "Public can insert estimate line items"
  ON estimate_line_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = '00000000-0000-0000-0000-000000000000'
    )
  );

CREATE POLICY "Public can update estimate line items"
  ON estimate_line_items FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = '00000000-0000-0000-0000-000000000000'
    )
  );

CREATE POLICY "Public can delete estimate line items"
  ON estimate_line_items FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = '00000000-0000-0000-0000-000000000000'
    )
  );
