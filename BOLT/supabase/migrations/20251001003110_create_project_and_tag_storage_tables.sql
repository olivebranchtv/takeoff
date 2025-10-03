/*
  # Create Project and Tag Storage Tables
  
  ## 1. New Tables
  
  ### `project_data`
  Stores complete project takeoff data including pages, tags, and all objects
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid) - User who owns the project (default: 00000000-0000-0000-0000-000000000000)
  - `project_name` (text) - Name of the project
  - `file_name` (text) - Original PDF filename
  - `project_data` (jsonb) - Complete project JSON with pages, tags, objects
  - `created_at` (timestamptz) - When project was created
  - `updated_at` (timestamptz) - Last modification time
  - `is_active` (boolean) - Whether this is the current active project
  
  ### `tag_library`
  Stores user's master tag library (previously in localStorage)
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who owns the tags
  - `tags` (jsonb) - Array of tag objects
  - `color_overrides` (jsonb) - Manual color overrides by tag code
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## 2. Security
  - Enable RLS on both tables
  - Public read/write access (app doesn't use auth)
  
  ## 3. Indexes
  - Index on user_id for fast queries
  - Index on is_active for finding current project
*/

-- Create project_data table
CREATE TABLE IF NOT EXISTS project_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  project_name text NOT NULL,
  file_name text,
  project_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT false
);

-- Create tag_library table
CREATE TABLE IF NOT EXISTS tag_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  color_overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_library ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read access to project_data"
  ON project_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to project_data"
  ON project_data FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to project_data"
  ON project_data FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from project_data"
  ON project_data FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to tag_library"
  ON tag_library FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to tag_library"
  ON tag_library FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to tag_library"
  ON tag_library FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from tag_library"
  ON tag_library FOR DELETE
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_data_user_id ON project_data(user_id);
CREATE INDEX IF NOT EXISTS idx_project_data_is_active ON project_data(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tag_library_user_id ON tag_library(user_id);

-- Ensure only one active project per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_project_per_user 
  ON project_data(user_id) 
  WHERE is_active = true;