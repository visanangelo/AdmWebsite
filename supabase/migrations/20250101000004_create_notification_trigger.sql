-- Create trigger function to automatically create notifications for new rental requests
CREATE OR REPLACE FUNCTION create_rental_request_notification()
RETURNS TRIGGER AS $$
DECLARE
    requester_name TEXT;
    equipment_name TEXT;
    equipment_image TEXT;
BEGIN
    -- Get requester name
    SELECT CONCAT(first_name, ' ', last_name) INTO requester_name
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Get equipment details
    SELECT name, image INTO equipment_name, equipment_image
    FROM fleet
    WHERE id = NEW.equipment_id;
    
    -- Create notification for super-admin users
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        read
    )
    SELECT 
        u.id,
        'rental_request',
        'New Rental Request',
        CONCAT(requester_name, ' has requested ', equipment_name, ' for rental'),
        jsonb_build_object(
            'requestId', NEW.id,
            'requesterName', requester_name,
            'equipmentName', equipment_name,
            'startDate', NEW.start_date,
            'endDate', NEW.end_date,
            'equipmentImage', equipment_image
        ),
        false
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'role' = 'super-admin';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on rental_requests table
DROP TRIGGER IF EXISTS trigger_create_rental_request_notification ON rental_requests;
CREATE TRIGGER trigger_create_rental_request_notification
    AFTER INSERT ON rental_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_rental_request_notification();

-- Add RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for super-admin users to read all notifications
CREATE POLICY "Super admins can read all notifications" ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'super-admin'
        )
    );

-- Policy for users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for super-admin users to update all notifications
CREATE POLICY "Super admins can update all notifications" ON notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'super-admin'
        )
    );

-- Policy for users to update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy for super-admin users to delete all notifications
CREATE POLICY "Super admins can delete all notifications" ON notifications
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'super-admin'
        )
    );

-- Policy for users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Policy for trigger function to insert notifications (service role)
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (true); 