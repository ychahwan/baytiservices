/*
  # Service Providers Schema

  1. New Tables
    - `service_providers`
      - Core provider information
      - Status management
      - Company details
    - `service_provider_types`
      - Links providers to their service types
      - Many-to-many relationship

  2. Security
    - Enable RLS
    - Admin has full access
    - Providers can view and edit their own data
*/

-- Create enum for service provider status
CREATE TYPE provider_status AS ENUM ('inactive', 'active', 'paused');

-- Create service providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text,
  phone_number text,
  working_area text,
  date_of_birth date,
  description text,
  referenced_by text,
  is_company boolean DEFAULT false,
  number_of_employees integer DEFAULT 0,
  status provider_status DEFAULT 'inactive',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create service provider types junction table
CREATE TABLE IF NOT EXISTS service_provider_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  service_type_id uuid REFERENCES service_types(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(provider_id, service_type_id)
);

-- Create indexes
CREATE INDEX idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX idx_service_providers_status ON service_providers(status);
CREATE INDEX idx_service_provider_types_provider ON service_provider_types(provider_id);
CREATE INDEX idx_service_provider_types_service ON service_provider_types(service_type_id);

-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_types ENABLE ROW LEVEL SECURITY;

-- Create policies for service_providers
CREATE POLICY "Admins have full access to service providers"
  ON service_providers
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Service providers can view their own profile"
  ON service_providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service providers can update their own profile"
  ON service_providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for service_provider_types
CREATE POLICY "Admins have full access to service provider types"
  ON service_provider_types
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Service providers can view their own service types"
  ON service_provider_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_providers
      WHERE id = service_provider_types.provider_id
      AND user_id = auth.uid()
    )
  );