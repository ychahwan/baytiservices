/*
  # Add RLS policies for service providers and related tables

  1. Changes
    - Enable RLS on service_providers table
    - Add policies for service providers table:
      - Admins can manage all service providers
      - Service providers can view and update their own profile
      - Operators can view all service providers
    - Add policies for user_roles table:
      - Everyone can read user roles (needed for role-based access)

  2. Security
    - Enable RLS on tables
    - Add appropriate policies for different user roles
*/

-- Enable RLS on tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all service providers" ON service_providers;
DROP POLICY IF EXISTS "Service providers can view their own profile" ON service_providers;
DROP POLICY IF EXISTS "Service providers can update their own profile" ON service_providers;
DROP POLICY IF EXISTS "Operators can view all service providers" ON service_providers;
DROP POLICY IF EXISTS "Everyone can read user roles" ON user_roles;

-- Policies for service_providers table
CREATE POLICY "Admins can manage all service providers"
ON service_providers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

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

CREATE POLICY "Operators can view all service providers"
ON service_providers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'operator'
  )
);

-- Policy for user_roles table
CREATE POLICY "Everyone can read user roles"
ON user_roles
FOR SELECT
TO authenticated
USING (true);