/*
  # Electrical Estimating Pricing System

  1. New Tables
    - `material_pricing`
      - Stores material costs from vendor quotes and databases
      - Includes category, description, unit, price, vendor
    - `labor_rates`
      - Labor hours per assembly code
      - Installation time standards
    - `labor_costs`
      - Hourly rates by craft/skill level
      - Burden rates (taxes, insurance, benefits)
    - `project_estimates`
      - Complete project cost calculations
      - Material, labor, overhead, profit
    - `estimate_line_items`
      - Detailed cost breakdown by division
      - Line-by-line pricing
    - `company_settings`
      - Default overhead %, profit %, labor rates
      - Company-wide configuration

  2. Security
    - Enable RLS on all tables
    - Authenticated users can manage their own data
*/

-- Material Pricing Database
CREATE TABLE IF NOT EXISTS material_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  material_cost DECIMAL(10,2),
  vendor TEXT,
  vendor_part_number TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  lead_time_days INTEGER,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE material_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own material pricing"
  ON material_pricing FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own material pricing"
  ON material_pricing FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own material pricing"
  ON material_pricing FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own material pricing"
  ON material_pricing FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Labor Rates (installation time per assembly)
CREATE TABLE IF NOT EXISTS labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_code TEXT NOT NULL,
  assembly_name TEXT,
  installation_hours DECIMAL(6,3) NOT NULL,
  skill_level TEXT,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labor rates"
  ON labor_rates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labor rates"
  ON labor_rates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labor rates"
  ON labor_rates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own labor rates"
  ON labor_rates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Labor Costs (hourly rates)
CREATE TABLE IF NOT EXISTS labor_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craft TEXT NOT NULL,
  skill_level TEXT,
  hourly_rate DECIMAL(8,2) NOT NULL,
  burden_rate DECIMAL(8,2),
  total_hourly_cost DECIMAL(8,2) NOT NULL,
  effective_date DATE,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE labor_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labor costs"
  ON labor_costs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labor costs"
  ON labor_costs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labor costs"
  ON labor_costs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own labor costs"
  ON labor_costs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Project Estimates
CREATE TABLE IF NOT EXISTS project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,

  material_cost_total DECIMAL(12,2),
  material_tax_rate DECIMAL(5,4),
  material_tax DECIMAL(12,2),
  material_shipping DECIMAL(12,2),

  labor_hours_total DECIMAL(10,2),
  labor_cost_total DECIMAL(12,2),

  equipment_cost_total DECIMAL(12,2),

  subtotal DECIMAL(12,2),

  overhead_percentage DECIMAL(5,2),
  overhead_amount DECIMAL(12,2),

  profit_percentage DECIMAL(5,2),
  profit_amount DECIMAL(12,2),

  total_bid_price DECIMAL(12,2),

  created_date TIMESTAMPTZ DEFAULT NOW(),
  bid_valid_until DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  user_id UUID,

  takeoff_data JSONB
);

ALTER TABLE project_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimates"
  ON project_estimates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own estimates"
  ON project_estimates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
  ON project_estimates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates"
  ON project_estimates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Estimate Line Items
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES project_estimates(id) ON DELETE CASCADE,
  division TEXT,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  material_cost_unit DECIMAL(10,2),
  material_cost_total DECIMAL(12,2),
  labor_hours DECIMAL(8,2),
  labor_cost_total DECIMAL(12,2),
  equipment_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  sell_price DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view estimate line items"
  ON estimate_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert estimate line items"
  ON estimate_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update estimate line items"
  ON estimate_line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete estimate line items"
  ON estimate_line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_estimates
      WHERE project_estimates.id = estimate_line_items.estimate_id
      AND project_estimates.user_id = auth.uid()
    )
  );

-- Company Settings (default values)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  company_name TEXT,
  default_overhead_percentage DECIMAL(5,2) DEFAULT 15.00,
  default_profit_percentage DECIMAL(5,2) DEFAULT 12.00,
  default_labor_rate DECIMAL(8,2) DEFAULT 30.00,
  material_tax_rate DECIMAL(5,4) DEFAULT 0.0850,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_pricing_category ON material_pricing(category);
CREATE INDEX IF NOT EXISTS idx_material_pricing_description ON material_pricing(description);
CREATE INDEX IF NOT EXISTS idx_material_pricing_user ON material_pricing(user_id);
CREATE INDEX IF NOT EXISTS idx_labor_rates_assembly ON labor_rates(assembly_code);
CREATE INDEX IF NOT EXISTS idx_labor_rates_user ON labor_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user ON project_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON project_estimates(status);
CREATE INDEX IF NOT EXISTS idx_line_items_estimate ON estimate_line_items(estimate_id);
