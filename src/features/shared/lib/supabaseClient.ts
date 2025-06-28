import { createClient } from '@supabase/supabase-js';

// IMPORTANT: For authenticated real-time subscriptions, we use the anon key as the API key
// but set the Authorization header with the JWT token. This is the standard approach.
// See: https://supabase.com/docs/guides/realtime/auth#using-row-level-security-rls

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create the client ONCE
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 10 } }
});

// Always return the same instance
export function getSupabaseClient() {
  return supabase;
}

export const getConnectionStatus = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('rental_requests').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}; 