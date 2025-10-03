/*
  # Create Assemblies Table

  1. New Tables
    - `assemblies`
      - `id` (text, primary key) - unique assembly identifier
      - `code` (text) - assembly code (e.g., "RECEP-20A")
      - `name` (text) - assembly name
      - `description` (text) - detailed description
      - `type` (text) - assembly type (device, fixture, etc.)
      - `is_active` (boolean) - whether assembly is active
      - `is_custom` (boolean) - whether this is a user-created assembly (vs prebuilt)
      - `items` (jsonb) - array of assembly items with materials
      - `created_at` (timestamptz) - when assembly was created
      - `updated_at` (timestamptz) - when assembly was last modified
      - `user_id` (uuid) - optional user who created/modified (for multi-user support)

  2. Security
    - Enable RLS on `assemblies` table
    - Allow public read access (all users can see assemblies)
    - Allow public write access (all users can create/edit assemblies)

  3. Indexes
    - Index on code for fast lookups
    - Index on is_active for filtering
    - Index on is_custom for separating user vs prebuilt assemblies

  Note: Assembly editing and customization functionality. Users can:
  - Edit prebuilt assemblies (creates a modified copy)
  - Create new custom assemblies
  - Deactivate assemblies they don't use
  - All changes are saved to Supabase for persistence
*/

-- Create assemblies table
CREATE TABLE IF NOT EXISTS assemblies (
  id text PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  type text DEFAULT 'device',
  is_active boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Enable RLS
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can see assemblies)
CREATE POLICY "Allow public read access to assemblies"
  ON assemblies
  FOR SELECT
  USING (true);

-- Allow public insert (anyone can create assemblies)
CREATE POLICY "Allow public insert to assemblies"
  ON assemblies
  FOR INSERT
  WITH CHECK (true);

-- Allow public update (anyone can edit assemblies)
CREATE POLICY "Allow public update to assemblies"
  ON assemblies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public delete (anyone can delete custom assemblies)
CREATE POLICY "Allow public delete from assemblies"
  ON assemblies
  FOR DELETE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assemblies_code ON assemblies(code);
CREATE INDEX IF NOT EXISTS idx_assemblies_is_active ON assemblies(is_active);
CREATE INDEX IF NOT EXISTS idx_assemblies_is_custom ON assemblies(is_custom);
CREATE INDEX IF NOT EXISTS idx_assemblies_type ON assemblies(type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assemblies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assemblies_updated_at
  BEFORE UPDATE ON assemblies
  FOR EACH ROW
  EXECUTE FUNCTION update_assemblies_updated_at();