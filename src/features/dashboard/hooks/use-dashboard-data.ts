import { useState, useEffect, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { RentalRequestService } from '@/features/rental-requests/services/rental-requests'
import { useNotify } from '@/features/shared'
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient'
import { RentalRequest } from '@/features/shared/types/rental'

interface DashboardFilters {
  userId: string | null
  equipmentId: string | null
  status: string | null
}

interface DashboardData {
  requests: RentalRequest[]
  fleet: Record<string, unknown>[]
  stats: Record<string, unknown>
}

export const useDashboardData = (setRealtimeStatus: (status: 'connected' | 'disconnected' | 'connecting') => void) => {
  const [data, setData] = useState<DashboardData>({ requests: [], fleet: [], stats: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState(new Date())
  const [filters, setFilters] = useState<DashboardFilters>({ userId: null, equipmentId: null, status: null })
  const notify = useNotify()
  const abortControllerRef = useRef<AbortController | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError(null)
      
      // Use indexed methods when filters are applied for better performance
      let requestsResult
      if (filters.userId) {
        requestsResult = await RentalRequestService.fetchRequestsByUser(
          filters.userId,
          1,
          100,
          filters.status || undefined
        )
      } else if (filters.equipmentId) {
        requestsResult = await RentalRequestService.fetchRequestsByEquipment(
          filters.equipmentId,
          1,
          100,
          filters.status || undefined
        )
      } else {
        // Use regular method with filters
        requestsResult = await RentalRequestService.fetchRequests(1, 100, {
          status: filters.status || undefined,
          equipment: filters.equipmentId || undefined
        })
      }

      const [fleetResult, statsResult] = await Promise.all([
        RentalRequestService.fetchFleet(),
        RentalRequestService.fetchDashboardStats()
      ])

      if (abortControllerRef.current.signal.aborted) return

      if (requestsResult.error) {
        throw new Error(requestsResult.error)
      }

      if (fleetResult.error) {
        throw new Error(fleetResult.error)
      }

      if (statsResult.error) {
        throw new Error(statsResult.error)
      }

      setData({
        requests: requestsResult.data || [],
        fleet: fleetResult.data || [],
        stats: statsResult.data || {}
      })
      
      setLastFetch(new Date())
      
      if (isManualRefresh) {
        notify.success('Data refreshed successfully')
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) return
      let message = 'Failed to fetch data';
      if (err instanceof Error) {
        message = err.message;
      }
      
      console.error('Error fetching dashboard data:', err)
      setError(message)
      notify.error(message)
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [filters, notify])

  const debouncedFetch = useCallback((isManualRefresh = false) => {
    const timeoutId = setTimeout(() => fetchData(isManualRefresh), 300)
    return () => clearTimeout(timeoutId)
  }, [fetchData])

  const clearFilters = useCallback(() => {
    setFilters({ userId: null, equipmentId: null, status: null })
  }, [])

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  useEffect(() => {
    fetchData()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [filters, fetchData])

  // --- REALTIME SUBSCRIPTION LOGIC ---
  useEffect(() => {
    const supabase = getSupabaseClient()
    setRealtimeStatus('connecting')

    // Create a channel for dashboard real-time updates
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_requests' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet' },
        () => {
          fetchData()
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected')
        else if (status === 'CLOSED') setRealtimeStatus('disconnected')
      })

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        setRealtimeStatus('disconnected')
      }
    }
  }, [fetchData, setRealtimeStatus])
  // --- END REALTIME SUBSCRIPTION LOGIC ---

  return {
    data,
    loading,
    error,
    lastFetch,
    filters,
    fetchData,
    debouncedFetch,
    clearFilters,
    updateFilters,
    setData
  }
} 