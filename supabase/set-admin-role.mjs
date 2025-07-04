// set-admin-role.mjs
// Usage:
//   Set environment variables in PowerShell:
//     $env:SUPABASE_URL="https://your-project-id.supabase.co"
//     $env:SERVICE_ROLE_KEY="your_service_role_key"
//     $env:USER_ID="8df34345-4eef-48c8-88c6-38ed83fbefd3"
//   Then run:
//     node supabase/set-admin-role.mjs
//
// This script sets app_metadata.role = 'admin' for the specified user.

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
    const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
        app_metadata: { role: 'admin' }
    })
    if (error) {
        console.error('Error updating user:', error)
        process.exit(1)
    } else {
        console.log('User updated:', data)
    }
}

setAdminRole()