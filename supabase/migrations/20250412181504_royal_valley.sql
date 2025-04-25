/*
  # Create Field Operators Management System

  1. New Tables
    - `field_operators`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `address` (text)
      - `phone_number` (text)
      - `working_area` (text)
      - `date_of_birth` (date)
      - `description` (text)
      - `referenced_by` (text)
      - `domain` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp with time zone)
      - `updated_by` (uuid, references auth.users)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on field_operators table
    - Add policies for:
      - Admins can perform all operations
      - Field operators can read their own data
*/

-- Create field_operators table
CREATE TABLE IF NOT EXISTS field_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text,
  phone_number text,
  working_area text,
  date_of_birth date,
  description text,
  referenced_by text,
  domain text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE field_operators ENABLE ROW LEVEL SECURITY;

-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Policies for field_operators table
-- ✅ Ensure RLS is enabled
ALTER TABLE public.field_operators ENABLE ROW LEVEL SECURITY;

-- ✅ Full access for admins
DROP POLICY IF EXISTS "Admins have full access" ON public.field_operators;
CREATE POLICY "Admins have full access"
  ON public.field_operators
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- ✅ SELECT: Authenticated users can read their own field_operator profile
DROP POLICY IF EXISTS "Users can view their own field_operator profile" ON public.field_operators;
CREATE POLICY "Users can view their own field_operator profile"
  ON public.field_operators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ✅ INSERT: Authenticated users can create their own field_operator profile
DROP POLICY IF EXISTS "Users can create their field_operator profile" ON public.field_operators;
CREATE POLICY "Users can create their field_operator profile"
  ON public.field_operators
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE: Authenticated users can update their own field_operator profile
DROP POLICY IF EXISTS "Users can update their own field_operator profile" ON public.field_operators;
CREATE POLICY "Users can update their own field_operator profile"
  ON public.field_operators
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
