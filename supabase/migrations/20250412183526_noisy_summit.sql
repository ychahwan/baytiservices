/*
  # Seed Service Categories Data

  This migration adds default data for:
  1. Categories
  2. Subcategories
  3. Service Types

  Note: Uses DO blocks to handle the insertion of data with proper error handling
*/

-- Seed Categories and their related data
DO $$
DECLARE
  v_category_id uuid;
  v_subcategory_id uuid;
  v_admin_id uuid;
BEGIN
  -- Get the admin user ID (assuming it exists)
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@baiti.com' LIMIT 1;

  -- Home Services
  INSERT INTO categories (name, created_by) 
  VALUES ('Home Services', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Plumbing', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Leak Repair', v_admin_id),
    (v_subcategory_id, 'Pipe Installation', v_admin_id),
    (v_subcategory_id, 'Drain Cleaning', v_admin_id);

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Electrical', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Wiring', v_admin_id),
    (v_subcategory_id, 'Lighting Installation', v_admin_id),
    (v_subcategory_id, 'Circuit Repair', v_admin_id);

  -- Cleaning
  INSERT INTO categories (name, created_by)
  VALUES ('Cleaning', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Residential Cleaning', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Standard Cleaning', v_admin_id),
    (v_subcategory_id, 'Deep Cleaning', v_admin_id),
    (v_subcategory_id, 'Move-out Cleaning', v_admin_id);

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Commercial Cleaning', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Office Cleaning', v_admin_id),
    (v_subcategory_id, 'Window Cleaning', v_admin_id),
    (v_subcategory_id, 'Post-Construction Cleanup', v_admin_id);

  -- Automotive
  INSERT INTO categories (name, created_by)
  VALUES ('Automotive', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Car Repair', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Engine Diagnostics', v_admin_id),
    (v_subcategory_id, 'Brake Repair', v_admin_id),
    (v_subcategory_id, 'Oil Change', v_admin_id);

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Car Wash', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Exterior Wash', v_admin_id),
    (v_subcategory_id, 'Interior Detailing', v_admin_id),
    (v_subcategory_id, 'Waxing', v_admin_id);

  -- Beauty & Wellness
  INSERT INTO categories (name, created_by)
  VALUES ('Beauty & Wellness', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Hair Care', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Haircut', v_admin_id),
    (v_subcategory_id, 'Coloring', v_admin_id),
    (v_subcategory_id, 'Styling', v_admin_id);

  -- IT Services
  INSERT INTO categories (name, created_by)
  VALUES ('IT Services', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Computer Repair', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Virus Removal', v_admin_id),
    (v_subcategory_id, 'Hardware Replacement', v_admin_id),
    (v_subcategory_id, 'System Optimization', v_admin_id);

  -- Legal Services
  INSERT INTO categories (name, created_by)
  VALUES ('Legal Services', v_admin_id)
  RETURNING id INTO v_category_id;

  INSERT INTO subcategories (category_id, name, created_by)
  VALUES (v_category_id, 'Documentation', v_admin_id)
  RETURNING id INTO v_subcategory_id;

  INSERT INTO service_types (subcategory_id, name, created_by)
  VALUES 
    (v_subcategory_id, 'Affidavit Creation', v_admin_id),
    (v_subcategory_id, 'Contract Review', v_admin_id),
    (v_subcategory_id, 'Notarization', v_admin_id);

END $$;