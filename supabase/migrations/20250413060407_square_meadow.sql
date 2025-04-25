/*
  # Update Address Schema

  1. New Tables
    - `countries`
      - Basic country information
    - `addresses`
      - Detailed address information
      - Prepared for future location data

  2. Changes
    - Remove address column from:
      - operators
      - field_operators
      - service_providers
      - stores
    - Add address_id reference to these tables

  3. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code char(2) NOT NULL,
  phone_code text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(code)
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES countries(id),
  state text,
  city text,
  street_address text,
  postal_code text,
  building_number text,
  apartment_number text,
  additional_info text,
  -- Reserved for future location data
  latitude numeric(10,8),
  longitude numeric(11,8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read countries"
  ON countries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Everyone can read addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own addresses"
  ON addresses
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Modify existing tables to use new address structure
ALTER TABLE operators
  DROP COLUMN IF EXISTS address,
  ADD COLUMN address_id uuid REFERENCES addresses(id);

ALTER TABLE field_operators
  DROP COLUMN IF EXISTS address,
  ADD COLUMN address_id uuid REFERENCES addresses(id);

ALTER TABLE service_providers
  DROP COLUMN IF EXISTS address,
  ADD COLUMN address_id uuid REFERENCES addresses(id);

ALTER TABLE stores
  DROP COLUMN IF EXISTS address,
  ADD COLUMN address_id uuid REFERENCES addresses(id);

-- Seed some initial countries
INSERT INTO countries (name, code, phone_code) VALUES
  ('United States', 'US', '+1'),
  ('Canada', 'CA', '+1'),
  ('United Kingdom', 'GB', '+44'),
  ('Australia', 'AU', '+61'),
  ('New Zealand', 'NZ', '+64'),
  ('Germany', 'DE', '+49'),
  ('France', 'FR', '+33'),
  ('Italy', 'IT', '+39'),
  ('Spain', 'ES', '+34'),
  ('Portugal', 'PT', '+351'),
  ('Netherlands', 'NL', '+31'),
  ('Belgium', 'BE', '+32'),
  ('Switzerland', 'CH', '+41'),
  ('Austria', 'AT', '+43'),
  ('Sweden', 'SE', '+46'),
  ('Norway', 'NO', '+47'),
  ('Denmark', 'DK', '+45'),
  ('Finland', 'FI', '+358'),
  ('Ireland', 'IE', '+353'),
  ('Iceland', 'IS', '+354')
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_country_id ON addresses(country_id);
CREATE INDEX IF NOT EXISTS idx_addresses_created_by ON addresses(created_by);
CREATE INDEX IF NOT EXISTS idx_operators_address_id ON operators(address_id);
CREATE INDEX IF NOT EXISTS idx_field_operators_address_id ON field_operators(address_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_address_id ON service_providers(address_id);
CREATE INDEX IF NOT EXISTS idx_stores_address_id ON stores(address_id);

-- Create basic indexes for location queries
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;