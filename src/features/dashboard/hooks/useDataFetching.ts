import { useState, useCallback, useRef, useEffect } from 'react'
import { getSupabaseClient } from "@/features/shared/lib/supabaseClient"
import { useNotify } from '@/features/shared/hooks/useNotify'
import { RentalRequestService } from "@/services/rental-requests"
import { RentalRequest, FleetItem } from '@/types/rental'
import { DashboardStats } from '../types'

export const useDataFetching = (setRealtimeStatus: (status: 'connected' | 'disconnected' | 'connecting') => void) => {
  const notify = useNotify();
  const [data, setData] = useState<{
    requests: RentalRequest[]
    fleet: FleetItem[]
    stats: DashboardStats | null
  }>({ requests: [], fleet: [], stats: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())
  const loadingRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeSubscriptionsRef = useRef<unknown[]>([])
  const initializedRef = useRef(false)

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    // Cleanup existing subscriptions
    realtimeSubscriptionsRef.current.forEach(sub => (sub as { unsubscribe: () => void }).unsubscribe())
    realtimeSubscriptionsRef.current = []

    // Requests subscription
    const requestsChannel = getSupabaseClient()
      .channel('rental_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rental_requests' },
        (payload) => {
          // Use setData directly to avoid dependency issues
          setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
            const { requests } = prev
            let newRequests = [...requests]
            
            switch (payload.eventType) {
              case 'INSERT':
                newRequests.unshift(payload.new as RentalRequest)
                break
              case 'UPDATE':
                newRequests = newRequests.map(req => 
                  req.id === payload.new.id ? { ...req, ...payload.new } : req
                )
                break
              case 'DELETE':
                newRequests = newRequests.filter(req => req.id !== payload.old.id)
                break
            }
            
            return { ...prev, requests: newRequests }
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected')
        }
      })

    // Fleet subscription
    const fleetChannel = getSupabaseClient()
      .channel('fleet_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fleet' },
        (payload) => {
          // Use setData directly to avoid dependency issues
          setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
            const { fleet } = prev
            let newFleet = [...fleet]
            
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new && payload.new.id && payload.new.name && payload.new.status) {
                  newFleet.unshift({
                    id: payload.new.id,
                    name: payload.new.name,
                    status: payload.new.status
                  });
                }
                break;
              case 'UPDATE':
                newFleet = newFleet.map(item =>
                  item.id === payload.new.id && payload.new.name && payload.new.status
                    ? { id: payload.new.id, name: payload.new.name, status: payload.new.status }
                    : item
                );
                break;
              case 'DELETE':
                newFleet = newFleet.filter(item => item.id !== payload.old.id)
                break
            }
            
            return { ...prev, fleet: newFleet }
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected')
        }
      })

    realtimeSubscriptionsRef.current.push(requestsChannel, fleetChannel)
  }, [setRealtimeStatus])

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (loadingRef.current && !isManualRefresh) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      if (isManualRefresh && RentalRequestService && typeof RentalRequestService.clearCache === 'function') {
        RentalRequestService.clearCache()
      }
      
      const [requestsResult, fleetResult, statsResult] = await Promise.all([
        RentalRequestService.fetchRequests(1, 100),
        RentalRequestService.fetchFleet(),
        RentalRequestService.fetchDashboardStats()
      ])

      if (requestsResult.error) setError(requestsResult.error)
      if (fleetResult.error) setError(fleetResult.error)
      if (statsResult.error) setError(statsResult.error)

      const newData = {
        requests: (requestsResult.data || []) as RentalRequest[],
        fleet: (fleetResult.data || []) as unknown as FleetItem[],
        stats: (statsResult.data ?? null) as unknown as DashboardStats | null
      }
      
      setData(newData)
      setLastFetch(new Date())
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('Failed to load data')
      notify.error('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [notify])

  const debouncedFetch = useCallback((isManualRefresh = false) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchData(isManualRefresh)
    }, 100)
  }, [fetchData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      // Cleanup realtime subscriptions
      realtimeSubscriptionsRef.current.forEach(sub => (sub as { unsubscribe: () => void }).unsubscribe())
    }
  }, [])

  // Initial data fetch and realtime setup - only run once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Fetch data without showing loading state initially
    const initializeData = async () => {
      try {
        const [requestsResult, fleetResult, statsResult] = await Promise.all([
          RentalRequestService.fetchRequests(1, 100),
          RentalRequestService.fetchFleet(),
          RentalRequestService.fetchDashboardStats()
        ])

        const newData = {
          requests: (requestsResult.data || []) as RentalRequest[],
          fleet: (fleetResult.data || []) as unknown as FleetItem[],
          stats: (statsResult.data ?? null) as unknown as DashboardStats | null
        }
        
        setData(newData)
        setLastFetch(new Date())
        
        // Setup realtime subscriptions after initial data load
        setupRealtimeSubscriptions()
      } catch (err) {
        console.error('Error in initial data fetch:', err)
        setError('Failed to load data')
        notify.error('Failed to load data. Please refresh the page.')
      }
    }
    
    initializeData()
  }, [notify, setupRealtimeSubscriptions])

  return {
    data,
    loading,
    error,
    lastFetch,
    fetchData,
    debouncedFetch,
    setData,
    notify
  }
} 