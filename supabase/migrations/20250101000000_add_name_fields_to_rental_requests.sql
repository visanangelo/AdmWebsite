-- Add first_name and last_name fields to rental_requests table
-- These fields are required for all new rental requests

ALTER TABLE rental_requests 
ADD COLUMN first_name TEXT NOT NULL DEFAULT '',
ADD COLUMN last_name TEXT NOT NULL DEFAULT '';

-- Add a comment to document the purpose of these fields
COMMENT ON COLUMN rental_requests.first_name IS 'First name of the person making the rental request';
COMMENT ON COLUMN rental_requests.last_name IS 'Last name of the person making the rental request';

-- Create an index on the name fields for better search performance
CREATE INDEX idx_rental_requests_names ON rental_requests(first_name, last_name);

-- Update RLS policies to include the new fields
-- The existing policies should work with the new fields automatically
-- since they use auth.jwt() checks and don't reference specific columns 