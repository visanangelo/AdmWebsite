-- Fix RLS policies for rental_requests table
-- Drop existing policies
DROP POLICY IF EXISTS "Super-admins can read rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can insert rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can update rental_requests" ON rental_requests;
DROP POLICY IF EXISTS "Super-admins can delete rental_requests" ON rental_requests;

-- Recreate policies with correct JWT path
CREATE POLICY "Super-admins can read rental_requests" ON rental_requests
    FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can insert rental_requests" ON rental_requests
    FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can update rental_requests" ON rental_requests
    FOR UPDATE
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin')
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can delete rental_requests" ON rental_requests
    FOR DELETE
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

-- Fix RLS policies for fleet table
-- Drop existing policies
DROP POLICY IF EXISTS "Super-admins can read fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can insert fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can update fleet" ON fleet;
DROP POLICY IF EXISTS "Super-admins can delete fleet" ON fleet;

-- Recreate policies with correct JWT path
CREATE POLICY "Super-admins can read fleet" ON fleet
    FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can insert fleet" ON fleet
    FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can update fleet" ON fleet
    FOR UPDATE
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin')
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin');

CREATE POLICY "Super-admins can delete fleet" ON fleet
    FOR DELETE
    TO public
    USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin'); 