// set-admin-role.js
// Usage:
//   SUPABASE_URL=... SERVICE_ROLE_KEY=... USER_ID=... node set-admin-role.js
//
// This script sets app_metadata.role = 'super-admin' for the specified user.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY
const USER_ID = process.env.USER_ID

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !USER_ID) {
    console.error('Please set SUPABASE_URL, SERVICE_ROLE_KEY, and USER_ID environment variables.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function setAdminRole() {
    try {
        // First, get the current user to see what needs to be updated
        const { data: currentUser, error: getUserError } = await supabase.auth.admin.getUserById(USER_ID)

        if (getUserError) {
            console.error('Error getting user:', getUserError)
            process.exit(1)
        }

        console.log('Current user data:', {
            app_metadata: currentUser.user.app_metadata,
            user_metadata: currentUser.user.user_metadata,
            raw_app_meta_data: currentUser.user.raw_app_meta_data,
            raw_user_meta_data: currentUser.user.raw_user_meta_data
        })

        // Update both app_metadata and user_metadata to ensure consistency
        const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
            app_metadata: {
                ...currentUser.user.app_metadata,
                role: 'super-admin'
            },
            user_metadata: {
                ...currentUser.user.user_metadata,
                role: 'super-admin'
            }
        })

        if (error) {
            console.error('Error updating user:', error)
            process.exit(1)
        } else {
            console.log('User updated successfully:', data)
            console.log('Role set to "super-admin" in both app_metadata and user_metadata')
        }
    } catch (error) {
        console.error('Unexpected error:', error)
        process.exit(1)
    }
}

setAdminRole()