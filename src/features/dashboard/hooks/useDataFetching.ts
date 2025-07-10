import { useState, useCallback, useRef, useEffect } from 'react'
import { getSupabaseClient } from "@/features/shared/lib/supabaseClient"
import { useNotify } from '@/features/shared/hooks/useNotify'
import { RentalRequestService } from "@/features/rental-requests"
import { RentalRequest, FleetItem, RentalRequestStatus, FleetStatus } from '@/features/shared/types/rental'
import { DashboardStats } from '../types'

// Equipment cache to avoid repeated fetches
const equipmentCache = new Map<string, { data: { name: string; status: FleetStatus; image?: string }; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to transform raw database row to RentalRequest format
const transformRentalRequest = (rawData: Record<string, unknown>): RentalRequest => {
  return {
    id: rawData.id as string,
    user_id: rawData.user_id as string,
    first_name: rawData.first_name as string,
    last_name: rawData.last_name as string,
    equipment_id: rawData.equipment_id as string,
    start_date: rawData.start_date as string,
    end_date: rawData.end_date as string,
    project_location: rawData.project_location as string,
    notes: rawData.notes as string,
    status: rawData.status as RentalRequestStatus,
    created_at: rawData.created_at as string,
    // For new requests, we'll need to fetch equipment data separately
    equipment: { name: 'Loading...', status: 'Available' as FleetStatus, image: undefined },
    requester: `${rawData.first_name} ${rawData.last_name}`,
    date: rawData.created_at as string,
  }
}

// Helper function to fetch equipment data for a request with caching
const fetchEquipmentData = async (equipmentId: string): Promise<{ name: string; status: FleetStatus; image?: string }> => {
  try {
    // Check cache first
    const cached = equipmentCache.get(equipmentId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    
    const { data, error } = await getSupabaseClient()
      .from('fleet')
      .select('name, status, image')
      .eq('id', equipmentId)
      .single()
    
    if (error || !data) {
      const fallbackData = { name: 'Unknown Equipment', status: 'Available' as FleetStatus, image: undefined }
      equipmentCache.set(equipmentId, { data: fallbackData, timestamp: Date.now() })
      return fallbackData
    }
    
    const equipmentData = {
      name: data.name,
      status: data.status as FleetStatus,
      image: data.image
    }
    
    // Cache the result
    equipmentCache.set(equipmentId, { data: equipmentData, timestamp: Date.now() })
    return equipmentData
  } catch (error) {
    console.warn(`Failed to fetch equipment data for ${equipmentId}:`, error)
    const fallbackData = { name: 'Unknown Equipment', status: 'Available' as FleetStatus, image: undefined }
    equipmentCache.set(equipmentId, { data: fallbackData, timestamp: Date.now() })
    return fallbackData
  }
}

// Batch equipment updates to reduce re-renders
const batchEquipmentUpdates = new Map<string, Promise<{ name: string; status: FleetStatus; image?: string }>>()

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
  const pendingEquipmentUpdatesRef = useRef<Set<string>>(new Set())

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
        async (payload) => {
          // For INSERT events, transform the data and add it smoothly
          if (payload.eventType === 'INSERT') {
            const newRequest = transformRentalRequest(payload.new)
            
            // Add the request immediately with placeholder equipment data
            setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
              const { requests } = prev
              return { ...prev, requests: [newRequest, ...requests] }
            })
            
            // Batch equipment data fetch to avoid multiple simultaneous requests
            const equipmentId = payload.new.equipment_id
            if (!batchEquipmentUpdates.has(equipmentId)) {
              const equipmentPromise = fetchEquipmentData(equipmentId)
              batchEquipmentUpdates.set(equipmentId, equipmentPromise)
              
              // Add to pending updates set
              pendingEquipmentUpdatesRef.current.add(equipmentId)
              
              // Fetch equipment data in the background and update the request
              equipmentPromise.then((equipmentData) => {
                // Remove from pending updates
                pendingEquipmentUpdatesRef.current.delete(equipmentId)
                batchEquipmentUpdates.delete(equipmentId)
                
                // Update the request with equipment data
                setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
                  const { requests } = prev
                  const updatedRequests = requests.map(req => 
                    req.id === payload.new.id 
                      ? { ...req, equipment: equipmentData }
                      : req
                  )
                  return { ...prev, requests: updatedRequests }
                })
              }).catch((error) => {
                console.error(`Failed to fetch equipment data for ${equipmentId}:`, error)
                pendingEquipmentUpdatesRef.current.delete(equipmentId)
                batchEquipmentUpdates.delete(equipmentId)
              })
            }
            return
          }
          
          // For UPDATE and DELETE, use optimistic updates
          setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
            const { requests } = prev
            let newRequests = [...requests]
            
            switch (payload.eventType) {
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
                if (payload.new && payload.new.id && payload.new.name && payload.new.status && payload.new.category) {
                  newFleet.unshift({
                    id: payload.new.id,
                    name: payload.new.name,
                    status: payload.new.status,
                    category: payload.new.category,
                    image: payload.new.image ?? undefined,
                    year: payload.new.year ?? undefined,
                    location: payload.new.location ?? undefined,
                    specs: payload.new.specs ?? undefined,
                    created_at: payload.new.created_at ?? undefined,
                  });
                }
                break;
              case 'UPDATE':
                newFleet = newFleet.map(item =>
                  item.id === payload.new.id && payload.new.name && payload.new.status && payload.new.category
                    ? {
                        id: payload.new.id,
                        name: payload.new.name,
                        status: payload.new.status,
                        category: payload.new.category,
                        image: payload.new.image ?? undefined,
                        year: payload.new.year ?? undefined,
                        location: payload.new.location ?? undefined,
                        specs: payload.new.specs ?? undefined,
                        created_at: payload.new.created_at ?? undefined,
                      }
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
    const pendingUpdates = pendingEquipmentUpdatesRef.current;
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      // Cleanup realtime subscriptions
      realtimeSubscriptionsRef.current.forEach(sub => (sub as { unsubscribe: () => void }).unsubscribe())
      // Clear equipment cache
      equipmentCache.clear()
      batchEquipmentUpdates.clear()
      // Use the captured value
      pendingUpdates.clear()
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