-- Enable RLS on fleet table
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;

-- Policy for super-admins to read fleet data
CREATE POLICY "Super-admins can read fleet" ON fleet
    FOR SELECT
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to insert fleet data
CREATE POLICY "Super-admins can insert fleet" ON fleet
    FOR INSERT
    TO public
    WITH CHECK (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to update fleet data
CREATE POLICY "Super-admins can update fleet" ON fleet
    FOR UPDATE
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin')
    WITH CHECK (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin');

-- Policy for super-admins to delete fleet data
CREATE POLICY "Super-admins can delete fleet" ON fleet
    FOR DELETE
    TO public
    USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'super-admin'); 