import { useState, useEffect, useCallback, useRef } from 'react';
import { RentalRequestService } from '@/features/rental-requests/services/rental-requests';
import { useNotify } from '@/features/shared';
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient';
import { useAuth } from '@/features/shared/hooks/use-auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface DashboardFilters {
  userId: string | null;
  equipmentId: string | null;
  status: string | null;
}

interface DashboardData {
  requests: any[];
  fleet: any[];
  stats: any;
}

type LiveStatus = 'live' | 'polling' | 'error' | 'connecting';

export const useLiveDashboardData = (filters: DashboardFilters) => {
  const [data, setData] = useState<DashboardData>({ requests: [], fleet: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(new Date());
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('connecting');
  const notify = useNotify();
  const { user, session, isAdmin, isAuthenticated } = useAuth();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<any[]>([]);
  const realtimeClientRef = useRef<SupabaseClient | null>(null);

  // Fetch data (use singleton for queries)
  const fetchData = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      let requestsResult;
      if (filters.userId) {
        requestsResult = await RentalRequestService.fetchRequestsByUser(
          filters.userId,
          1,
          100,
          filters.status || undefined
        );
      } else if (filters.equipmentId) {
        requestsResult = await RentalRequestService.fetchRequestsByEquipment(
          filters.equipmentId,
          1,
          100,
          filters.status || undefined
        );
      } else {
        requestsResult = await RentalRequestService.fetchRequests(1, 100, {
          status: filters.status || undefined,
          equipment: filters.equipmentId || undefined,
        });
      }
      const [fleetResult, statsResult] = await Promise.all([
        RentalRequestService.fetchFleet(),
        RentalRequestService.fetchDashboardStats(),
      ]);
      if (requestsResult.error) throw new Error(requestsResult.error);
      if (fleetResult.error) throw new Error(fleetResult.error);
      if (statsResult.error) throw new Error(statsResult.error);
      setData({
        requests: requestsResult.data || [],
        fleet: fleetResult.data || [],
        stats: statsResult.data || {},
      });
      setLastFetch(new Date());
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
      notify.error(err.message || 'Failed to fetch data');
    }
  }, [filters, notify]);

  // Real-time setup
  useEffect(() => {
    // Only enable real-time for authenticated super-admins
    if (!isAuthenticated || !isAdmin || !session) {
      setLiveStatus('polling');
      fetchData();
      return;
    }
    // Cleanup previous subscriptions and client
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe && sub.unsubscribe());
    subscriptionsRef.current = [];
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (realtimeClientRef.current) {
      // @ts-ignore
      if (typeof realtimeClientRef.current.removeAllChannels === 'function') {
        // supabase-js v2+ API
        // @ts-ignore
        realtimeClientRef.current.removeAllChannels();
      }
      realtimeClientRef.current = null;
    }
    setLiveStatus('connecting');
    // Create a new Supabase client with the user's JWT as the key, and NO session persistence or storage
    const supabaseRealtime = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      session.access_token,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          fetch: typeof window !== 'undefined' ? window.fetch.bind(window) : undefined
        },
        realtime: { params: { eventsPerSecond: 10 } }
      }
    );
    realtimeClientRef.current = supabaseRealtime;
    let gotFirstEvent = false;
    // Helper to handle any change
    const handleChange = (payload: any) => {
      console.log('Realtime event:', payload);
      fetchData();
      if (!gotFirstEvent) {
        setLiveStatus('live');
        gotFirstEvent = true;
      }
    };
    // Subscribe to rental_requests (v2+ channel API only)
    const reqChannel = supabaseRealtime
      .channel('rental_requests_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_requests' }, handleChange)
      .subscribe((status) => {
        console.log('rental_requests_live channel status:', status);
        if (status === 'SUBSCRIBED') {
          setLiveStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setLiveStatus('polling');
          notify.info('Real-time connection lost. Falling back to polling.');
          // Start polling fallback
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => fetchData(), 30000);
          }
        }
      });
    // Subscribe to fleet (v2+ channel API only)
    const fleetChannel = supabaseRealtime
      .channel('fleet_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet' }, handleChange)
      .subscribe((status) => {
        console.log('fleet_live channel status:', status);
        if (status === 'SUBSCRIBED') {
          setLiveStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setLiveStatus('polling');
          notify.info('Real-time connection lost. Falling back to polling.');
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => fetchData(), 30000);
          }
        }
      });
    subscriptionsRef.current = [reqChannel, fleetChannel];
    // Initial fetch
    fetchData();
    // Cleanup
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe && sub.unsubscribe());
      subscriptionsRef.current = [];
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (realtimeClientRef.current) {
        // @ts-ignore
        if (typeof realtimeClientRef.current.removeAllChannels === 'function') {
          // supabase-js v2+ API
          // @ts-ignore
          realtimeClientRef.current.removeAllChannels();
        }
        realtimeClientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, session, filters]);

  // Manual polling fallback for non-admins or unauthenticated
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => fetchData(), 30000);
      setLiveStatus('polling');
      fetchData();
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [isAuthenticated, isAdmin, fetchData]);

  return {
    data,
    loading,
    error,
    lastFetch,
    liveStatus,
    fetchData,
    setData,
  };
}; 