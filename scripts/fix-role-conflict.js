// Fix Role Conflict Script
// Run this in your browser console to see and fix role conflicts

console.log('🔍 Checking for role conflicts...');

// Get the auth token from localStorage
const authToken = localStorage.getItem('supabase-auth-token');

if (!authToken) {
    console.log('❌ No auth token found. Please log in first.');
} else {
    try {
        const tokenData = JSON.parse(authToken);
        const currentSession = tokenData.currentSession;
        const user = currentSession && currentSession.user;

        if (!user) {
            console.log('❌ No user found in session.');
            return;
        }

        console.log('👤 User Information:');
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('');

        const appRole = user.app_metadata && user.app_metadata.role;
        const userRole = user.user_metadata && user.user_metadata.role;

        console.log('🔑 Role Information:');
        console.log('App Metadata Role:', appRole || 'undefined');
        console.log('User Metadata Role:', userRole || 'undefined');
        console.log('');

        if (appRole && userRole && appRole !== userRole) {
            console.warn('⚠️ ROLE CONFLICT DETECTED!');
            console.log('The roles in app_metadata and user_metadata are different.');
            console.log('');
            console.log('💡 To fix this, you have two options:');
            console.log('');
            console.log('Option 1: Update via Supabase Dashboard');
            console.log('1. Go to your Supabase Dashboard');
            console.log('2. Navigate to Authentication > Users');
            console.log('3. Find your user (ID: ' + user.id + ')');
            console.log('4. Click "Edit" on your user');
            console.log('5. In the "User Metadata" section, update the role to: ' + appRole);
            console.log('6. Save the changes');
            console.log('');
            console.log('Option 2: Run the set-admin-role script');
            console.log('In your terminal, run:');
            console.log('USER_ID="' + user.id + '" node supabase/set-admin-role.mjs');
            console.log('');
            console.log('After fixing, refresh this page and the warning should be gone.');
        } else {
            console.log('✅ No role conflict detected!');
            console.log('Your roles are consistent.');
        }

    } catch (error) {
        console.error('❌ Error reading user data:', error);
        console.log('💡 Try logging out and logging back in, then run this script again.');
    }
}