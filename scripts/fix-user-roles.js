// Fix User Roles Script
// This script helps fix role conflicts between app_metadata and user_metadata
// Run this in your browser console to see the current user roles

console.log('🔍 Checking current user roles...');

// Get the current user from localStorage
const authToken = localStorage.getItem('supabase-auth-token');
if (!authToken) {
    console.log('❌ No auth token found - please log in first');
    console.log('💡 Run this script after logging in');
} else {
    try {
        const tokenData = JSON.parse(authToken);
        const currentSession = tokenData.currentSession;
        const user = currentSession && currentSession.user;

        if (!user) {
            console.log('❌ No user found in session');
            return;
        }

        console.log('👤 Current user:', {
            id: user.id,
            email: user.email,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
        });

        const appRole = user.app_metadata && user.app_metadata.role;
        const userRole = user.user_metadata && user.user_metadata.role;

        if (appRole && userRole && appRole !== userRole) {
            console.warn('⚠️ Role conflict detected!');
            console.log('App metadata role:', appRole);
            console.log('User metadata role:', userRole);
            console.log('');
            console.log('💡 To fix this:');
            console.log('1. Go to Supabase Dashboard > Authentication > Users');
            console.log('2. Find your user (ID: ' + user.id + ')');
            console.log('3. Update user_metadata.role to match app_metadata.role (' + appRole + ')');
            console.log('');
            console.log('Or run the set-admin-role script:');
            console.log('USER_ID="' + user.id + '" node supabase/set-admin-role.mjs');
        } else {
            console.log('✅ No role conflict detected');
            console.log('App metadata role:', appRole);
            console.log('User metadata role:', userRole);
        }
    } catch (error) {
        console.error('❌ Error parsing auth token:', error);
        console.log('💡 Try logging out and logging back in, then run this script again');
    }
}