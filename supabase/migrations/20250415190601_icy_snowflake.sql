/*
  # Add Working Areas Management

  1. New Tables
    - `working_areas`
      - Basic area information
    - `service_provider_working_areas`
      - Junction table for providers and areas

  2. Changes to service_providers
    - Add working_area_diameter
    - Add file_url for document storage
*/

-- Create working_areas table
CREATE TABLE IF NOT EXISTS working_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create service_provider_working_areas junction table
CREATE TABLE IF NOT EXISTS service_provider_working_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  working_area_id uuid REFERENCES working_areas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(provider_id, working_area_id)
);

-- Add working_area_diameter to service_providers
ALTER TABLE service_providers
  ADD COLUMN working_area_diameter integer DEFAULT 0,
  ADD COLUMN file_url text;

-- Drop the old working_area column
ALTER TABLE service_providers
  DROP COLUMN IF EXISTS working_area;

-- Enable RLS
ALTER TABLE working_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_working_areas ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_service_provider_working_areas_provider ON service_provider_working_areas(provider_id);
CREATE INDEX idx_service_provider_working_areas_area ON service_provider_working_areas(working_area_id);

-- Policies for working_areas
CREATE POLICY "Everyone can read working areas"
  ON working_areas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage working areas"
  ON working_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for service_provider_working_areas
CREATE POLICY "Service providers can view their working areas"
  ON service_provider_working_areas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_providers
      WHERE id = service_provider_working_areas.provider_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage service provider working areas"
  ON service_provider_working_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Seed some initial working areas
INSERT INTO working_areas (name, created_by) VALUES
  ('City Center', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('North District', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('South District', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('East District', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('West District', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('Downtown', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('Suburban Area', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('Industrial Zone', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('Commercial District', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1)),
  ('Residential Area', (SELECT id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1))
ON CONFLICT (name) DO NOTHING;