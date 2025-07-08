import { createClient } from '@supabase/supabase-js';

// IMPORTANT: For authenticated real-time subscriptions, we use the anon key as the API key
// but set the Authorization header with the JWT token. This is the standard approach.
// See: https://supabase.com/docs/guides/realtime/auth#using-row-level-security-rls

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create the client ONCE
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { 
    autoRefreshToken: true, 
    persistSession: true, 
    detectSessionInUrl: false,
    storageKey: 'supabase-auth-token' // Explicit storage key for consistency
  },
  realtime: { params: { eventsPerSecond: 10 } }
});

// Always return the same instance
export function getSupabaseClient() {
  return supabase;
}

// Utility function to clear corrupted session data
export const clearAuthSession = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.removeItem('supabase-auth-token');
    // Clear sessionStorage
    sessionStorage.removeItem('supabase-auth-token');
    // Clear any other potential storage keys
    localStorage.removeItem('sb-' + SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
    sessionStorage.removeItem('sb-' + SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
  }
};

// Utility function to handle auth errors
export const handleAuthError = async (error: any) => {
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('Refresh Token Not Found')) {
    console.warn('Refresh token error detected, clearing session...');
    clearAuthSession();
    // Sign out to reset the auth state
    await supabase.auth.signOut();
    return { shouldRedirect: true, error: 'Session expired. Please log in again.' };
  }
  return { shouldRedirect: false, error: error?.message || 'Authentication error' };
};

export const getConnectionStatus = async () => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('rental_requests').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}; 