-- Fix RLS policies to support both 'admin' and 'super-admin' roles
-- This ensures backward compatibility with the previous working setup

-- Fix RLS policies for rental_requests table
-- Drop existing policies
DROP POLICY IF EXISTS "Super-admins can read rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can insert rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can update rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can delete rental_requests" ON rental_requests;

-- Recreate policies with support for both 'admin' and 'super-admin' roles
CREATE POLICY "Admins can read rental_requests" ON rental_requests
    FOR SELECT
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can insert rental_requests" ON rental_requests
    FOR INSERT
    TO public
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can update rental_requests" ON rental_requests
    FOR UPDATE
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can delete rental_requests" ON rental_requests
    FOR DELETE
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

-- Fix RLS policies for fleet table
-- Drop existing policies
DROP POLICY IF EXISTS "Super-admins can read fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can insert fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can update fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can delete fleet" ON fleet;

-- Recreate policies with support for both 'admin' and 'super-admin' roles
CREATE POLICY "Admins can read fleet" ON fleet
    FOR SELECT
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can insert fleet" ON fleet
    FOR INSERT
    TO public
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can update fleet" ON fleet
    FOR UPDATE
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

CREATE POLICY "Admins can delete fleet" ON fleet
    FOR DELETE
    TO public
    USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin') OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super-admin')
    );

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('rental_requests', 'fleet')
ORDER BY tablename, policyname; 