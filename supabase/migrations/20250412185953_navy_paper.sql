/*
  # Add role management capabilities

  1. Changes
    - Add user_roles table to manage user roles
    - Add policies for role management
    - Add functions to manage roles

  2. Security
    - Enable RLS on user_roles table
    - Only admins can assign roles
    - Users can view their own roles
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id uuid PRIMARY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'operator', 'field_operator', 'service_provider')),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ra
      WHERE ra.user_id = auth.uid()
      AND ra.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ra
      WHERE ra.user_id = auth.uid()
      AND ra.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to assign role
CREATE OR REPLACE FUNCTION assign_role(
  target_user_id uuid,
  role_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;

  -- Insert or update role assignment
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, role_name, auth.uid())
  ON CONFLICT (user_id, role)
  DO NOTHING;
END;
$$;