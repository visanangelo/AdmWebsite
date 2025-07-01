-- Restore the working role configuration
-- This adds back the user_metadata role that was working before
-- while keeping the app_metadata role for compatibility

-- First, let's see the current state
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as app_metadata_role,
  raw_user_meta_data->>'role' as user_metadata_role,
  raw_user_meta_data as full_user_metadata
FROM auth.users 
WHERE email = 'angelo.visan@gmail.com';

-- Add back the user_metadata role that was working
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
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

-- Alternative: If you want to use 'super-admin' in user_metadata instead
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"super-admin"'
-- )
-- WHERE email = 'angelo.visan@gmail.com'; 