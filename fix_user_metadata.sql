-- Fix user metadata role conflict
-- This script removes the conflicting 'role' field from user_metadata
-- while keeping the correct 'super-admin' role in app_metadata

-- First, let's see the current state
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as app_metadata_role,
  raw_user_meta_data->>'role' as user_metadata_role,
  raw_user_meta_data as full_user_metadata
FROM auth.users 
WHERE email = 'angelo.visan@gmail.com';

-- Remove the conflicting 'role' field from user_metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'angelo.visan@gmail.com';

-- Verify the fix
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as app_metadata_role,
  raw_user_meta_data->>'role' as user_metadata_role,
  raw_user_meta_data as full_user_metadata
FROM auth.users 
WHERE email = 'angelo.visan@gmail.com';

-- Alternative: If you want to keep some user_metadata but remove only the role
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   raw_user_meta_data, 
--   '{role}', 
--   'null'::jsonb
-- )
-- WHERE email = 'angelo.visan@gmail.com';

-- For all users with conflicting roles (optional - run this if you want to fix all users)
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data - 'role'
-- WHERE raw_user_meta_data ? 'role' 
--   AND raw_app_meta_data->>'role' = 'super-admin'; 