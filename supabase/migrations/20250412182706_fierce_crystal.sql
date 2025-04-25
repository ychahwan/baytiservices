/*
  # Service Categories Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references users)

    - `subcategories`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references categories)
      - `name` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references users)

    - `service_types`
      - `id` (uuid, primary key)
      - `subcategory_id` (uuid, references subcategories)
      - `name` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references users)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(category_id, name)
);

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(subcategory_id, name)
);

-- Create indexes for better performance
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_service_types_subcategory_id ON service_types(subcategory_id);

-- Enable RLS (if not already)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;


-- ✅ New policies with proper admin role usage

CREATE POLICY "Allow admin full access to categories"
  ON categories
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin full access to subcategories"
  ON subcategories
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin full access to service_types"
  ON service_types
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);
