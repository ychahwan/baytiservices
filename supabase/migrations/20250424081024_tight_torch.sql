/*
  # Update Service Provider Policies

  1. Changes
    - Add created_by column to service_providers table
    - Update RLS policies to allow operators to see only their created providers
    - Keep admin access unchanged
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all service providers" ON service_providers;
DROP POLICY IF EXISTS "Service providers can view their own profile" ON service_providers;
DROP POLICY IF EXISTS "Service providers can update their own profile" ON service_providers;
DROP POLICY IF EXISTS "Operators can view all service providers" ON service_providers;

-- Create new policies
CREATE POLICY "Admins can manage service providers"
ON service_providers
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

CREATE POLICY "Service providers can view and update their own profile"
ON service_providers
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Operators can view and manage their created providers"
ON service_providers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'operator'
    AND service_providers.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'operator'
  )
);