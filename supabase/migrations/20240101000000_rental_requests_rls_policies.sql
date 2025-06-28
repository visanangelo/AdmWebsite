-- Enable RLS on rental_requests table
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

-- Policy for super-admins to read rental_requests data
CREATE POLICY "Super-admins can read rental_requests" ON rental_requests
    FOR SELECT
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to insert rental_requests data
CREATE POLICY "Super-admins can insert rental_requests" ON rental_requests
    FOR INSERT
    TO public
    WITH CHECK (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to update rental_requests data
CREATE POLICY "Super-admins can update rental_requests" ON rental_requests
    FOR UPDATE
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin')
    WITH CHECK (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to delete rental_requests data
CREATE POLICY "Super-admins can delete rental_requests" ON rental_requests
    FOR DELETE
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin'); 