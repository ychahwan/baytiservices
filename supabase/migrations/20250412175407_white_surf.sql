/*
  # Create Operators Management System

  1. New Tables
    - `operators`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `address` (text)
      - `phone_number` (text)
      - `working_area` (text)
      - `date_of_birth` (date)
      - `description` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp with time zone)
      - `updated_by` (uuid, references auth.users)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on operators table
    - Add policies for:
      - Admins can perform all operations
      - Operators can read their own data
*/

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text,
  phone_number text,
  working_area text,
  date_of_birth date,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Create admin role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Policies for operators table
-- ✅ Make sure RLS is enabled
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- ✅ Full access for admins
DROP POLICY IF EXISTS "Admins have full access" ON public.operators;
CREATE POLICY "Admins have full access"
  ON public.operators
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- ✅ SELECT: Authenticated users can read their own operator profile
DROP POLICY IF EXISTS "Users can view their own operator profile" ON public.operators;
CREATE POLICY "Users can view their own operator profile"
  ON public.operators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ✅ INSERT: Authenticated users can insert their own operator profile
DROP POLICY IF EXISTS "Users can create their operator profile" ON public.operators;
CREATE POLICY "Users can create their operator profile"
  ON public.operators
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE: Authenticated users can update their own operator profile
DROP POLICY IF EXISTS "Users can update their own operator profile" ON public.operators;
CREATE POLICY "Users can update their own operator profile"
  ON public.operators
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
