/*
  # Store Management Schema

  1. New Tables
    - `store_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `created_by` (uuid)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)

    - `stores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category_id` (uuid, references store_categories)
      - `name` (text)
      - `owner_first_name` (text)
      - `owner_last_name` (text)
      - `address` (text)
      - `phone_number` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
    - Add policies for store owners to manage their stores
*/

-- Create store_categories table
CREATE TABLE store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS for store_categories
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- Create stores table
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  category_id uuid REFERENCES store_categories(id),
  name text NOT NULL,
  owner_first_name text NOT NULL,
  owner_last_name text NOT NULL,
  address text,
  phone_number text,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS for stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policies for store_categories
CREATE POLICY "Admins can manage store categories"
  ON store_categories
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

CREATE POLICY "Users can view store categories"
  ON store_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for stores
CREATE POLICY "Admins can manage all stores"
  ON stores
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

CREATE POLICY "Users can view their own store"
  ON stores
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own store"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());