"use client"

import { Suspense, lazy } from 'react'
import '../dashboard-theme.css'
import { AppSidebar } from "@/features/shared"
import { ChartAreaInteractive } from "@/features/shared/components/chart-area-interactive"
import { DataTable } from "@/features/rental-requests"
import { SectionCards } from "@/features/shared/components/section-cards"
import { SiteHeader } from "@/features/shared"
import { SidebarInset, SidebarProvider } from "@/features/shared/components/ui/sidebar"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { getSupabaseClient } from "@/features/shared"
import { useNotify } from '@/features/shared'
import { useRouter } from "next/navigation"
import { Button } from "@/features/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/features/shared/components/ui/dialog"
import { Skeleton } from "@/features/shared/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import { RentalRequestService } from "@/features/rental-requests"
import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/features/shared/components/ui/card"
import { Truck, CheckCircle, Clock, AlertCircle, RefreshCwIcon, Trash2Icon, EyeIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/features/shared/components/ui/tabs"
import { Badge } from "@/features/shared/components/ui/badge"
import { RentalRequest, FleetItem } from '@/features/shared'
import { useAuth } from '@/features/shared'
import SupabaseProvider from '@/features/shared/components/SupabaseProvider'
import { DashboardCard, DashboardCardSkeleton, FleetCard, FleetCardSkeleton } from "@/features/dashboard"
import { useDashboardData } from "@/features/dashboard"
import { useLiveDashboardData } from "@/features/dashboard/hooks/use-live-dashboard-data"
import { useDashboardActions } from "@/features/dashboard/hooks/useDashboardActions"

// Lazy load tab components for better performance
const DashboardTab = lazy(() => import('./tabs/DashboardTab'))
const RequestsTab = lazy(() => import('./tabs/RequestsTab'))
const FleetTab = lazy(() => import('./tabs/FleetTab'))
const SettingsTab = lazy(() => import('./tabs/SettingsTab'))

// Inline skeleton for requests tab
const RequestsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
    
    <div className="rounded-xl border border-gray-200/60 bg-card overflow-hidden">
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <div className="flex space-x-2 ml-auto">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Enhanced Action Loading Overlay with better UX
const ActionLoadingOverlay = ({ isVisible }: { isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex items-center gap-4 bg-card p-6 rounded-xl shadow-2xl border border-gray-200/60"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40 animate-ping" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Processing...</span>
            <p className="text-xs text-gray-500">Please wait while we complete your request</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Custom hook for data fetching with React Query patterns and caching
const useDataFetching = (
  filters: { userId: string | null; equipmentId: string | null; status: string | null },
  autoRefreshEnabled: boolean,
  setAutoRefreshEnabled: (enabled: boolean) => void,
  session: any // Add session parameter
) => {
  const notify = useNotify();
  const [data, setData] = useState<{
    requests: RentalRequest[]
    fleet: any[]
    stats: any
  }>({ requests: [], fleet: [], stats: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())
  const loadingRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Enhanced cache with background refresh
  const cacheRef = useRef<{
    requests: { data: RentalRequest[]; timestamp: number; filters: any; stale: boolean }
    fleet: { data: any[]; timestamp: number; stale: boolean }
    stats: { data: any; timestamp: number; stale: boolean }
  }>({
    requests: { data: [], timestamp: 0, filters: null, stale: true },
    fleet: { data: [], timestamp: 0, stale: true },
    stats: { data: null, timestamp: 0, stale: true }
  })

  // Cache configuration
  const CACHE_DURATION = 300000 // 5 minutes cache (increased from 60s for better hit rate)
  const STALE_DURATION = 60000 // 1 minute stale duration
  const BACKGROUND_REFRESH_DURATION = 30000 // 30 seconds background refresh

  // Check if cache is valid
  const isCacheValid = (cacheKey: keyof typeof cacheRef.current) => {
    const cache = cacheRef.current[cacheKey]
    if (!cache || cache.timestamp === 0) {
      return false
    }
    
    const isValid = Date.now() - cache.timestamp < CACHE_DURATION && !cache.stale
    
    return isValid
  }

  // Check if cache is stale (for background refresh)
  const isCacheStale = (cacheKey: keyof typeof cacheRef.current) => {
    const cache = cacheRef.current[cacheKey]
    if (!cache || cache.timestamp === 0) return true
    return Date.now() - cache.timestamp > STALE_DURATION
  }

  // Check if filters match cache - improved logic
  const doFiltersMatch = (currentFilters: any) => {
    const cachedFilters = cacheRef.current.requests.filters
    if (!cachedFilters && !currentFilters) return true // Both null/undefined
    if (!cachedFilters || !currentFilters) return false // One is null/undefined
    
    // Deep comparison for better accuracy
    const currentKeys = Object.keys(currentFilters).sort()
    const cachedKeys = Object.keys(cachedFilters).sort()
    
    if (currentKeys.length !== cachedKeys.length) return false
    
    return currentKeys.every(key => {
      const currentValue = currentFilters[key]
      const cachedValue = cachedFilters[key]
      return currentValue === cachedValue || 
             (currentValue === null && cachedValue === null) ||
             (currentValue === undefined && cachedValue === undefined)
    })
  }

  // Mark cache as stale
  const markCacheStale = useCallback((cacheKey?: keyof typeof cacheRef.current) => {
    if (cacheKey) {
      cacheRef.current[cacheKey].stale = true
    } else {
      // Mark all cache as stale
      Object.keys(cacheRef.current).forEach(key => {
        cacheRef.current[key as keyof typeof cacheRef.current].stale = true
      })
    }
  }, [])

  // Cache invalidation function - more selective
  const invalidateCache = useCallback((cacheKey?: keyof typeof cacheRef.current) => {
    if (cacheKey) {
      cacheRef.current[cacheKey].timestamp = 0
      cacheRef.current[cacheKey].stale = true
    } else {
      // Only invalidate requests cache by default (most frequently changing)
      cacheRef.current.requests.timestamp = 0
      cacheRef.current.requests.stale = true
    }
  }, [])

  // Smart cache invalidation based on action type
  const invalidateCacheByAction = useCallback((actionType: string) => {
    switch (actionType) {
      case 'approve':
      case 'decline':
      case 'complete':
      case 'reopen':
      case 'cancel':
        // Only invalidate requests cache for request actions
        cacheRef.current.requests.timestamp = 0
        cacheRef.current.requests.stale = true
        break
      case 'fleet_status':
      case 'fleet_delete':
        // Only invalidate fleet cache for fleet actions
        cacheRef.current.fleet.timestamp = 0
        cacheRef.current.fleet.stale = true
        break
      default:
        // For unknown actions, invalidate requests only
        cacheRef.current.requests.timestamp = 0
        cacheRef.current.requests.stale = true
    }
  }, [])

  // Background prefetch function
  const backgroundPrefetch = useCallback(async () => {
    if (loadingRef.current) return

    try {
      const fetchPromises = []
      
      // Only prefetch stale data
      if (isCacheStale('requests')) {
        fetchPromises.push(
          RentalRequestService.fetchRequests(1, 100).then(result => {
            if (!result.error) {
              cacheRef.current.requests = {
                data: result.data || [],
                timestamp: Date.now(),
                filters: { ...filters },
                stale: false
              }
              // Update data silently (no loading state)
              setData(prev => ({ ...prev, requests: result.data || [] }))
            }
            return { type: 'requests', data: result.data || [] }
          }).catch(() => ({ type: 'requests', error: 'Background fetch failed' }))
        )
      }
      
      if (isCacheStale('fleet')) {
        fetchPromises.push(
          RentalRequestService.fetchFleet().then(result => {
            if (!result.error) {
              cacheRef.current.fleet = {
                data: result.data || [],
                timestamp: Date.now(),
                stale: false
              }
              setData(prev => ({ ...prev, fleet: result.data || [] }))
            }
            return { type: 'fleet', data: result.data || [] }
          }).catch(() => ({ type: 'fleet', error: 'Background fetch failed' }))
        )
      }
      
      if (isCacheStale('stats')) {
        fetchPromises.push(
          RentalRequestService.fetchDashboardStats().then(result => {
            if (!result.error) {
              cacheRef.current.stats = {
                data: result.data,
                timestamp: Date.now(),
                stale: false
              }
              setData(prev => ({ ...prev, stats: result.data }))
            }
            return { type: 'stats', data: result.data }
          }).catch(() => ({ type: 'stats', error: 'Background fetch failed' }))
        )
      }
      
      if (fetchPromises.length > 0) {
        await Promise.allSettled(fetchPromises)
      }
    } catch (err) {
      console.warn('Background prefetch failed:', err)
    }
  }, [filters])

  // Setup background prefetch interval
  useEffect(() => {
    const interval = setInterval(() => {
      backgroundPrefetch()
    }, BACKGROUND_REFRESH_DURATION)

    return () => clearInterval(interval)
  }, [backgroundPrefetch])

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (loadingRef.current && !isManualRefresh) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      // Check cache first (unless manual refresh)
      if (!isManualRefresh) {
        let hasValidCache = false
        
        // Check requests cache
        if (isCacheValid('requests') && doFiltersMatch(filters)) {
          setData(prev => ({ ...prev, requests: cacheRef.current.requests.data }))
          hasValidCache = true
        }
        
        // Check fleet cache
        if (isCacheValid('fleet')) {
          setData(prev => ({ ...prev, fleet: cacheRef.current.fleet.data }))
          hasValidCache = true
        }
        
        // Check stats cache
        if (isCacheValid('stats')) {
          setData(prev => ({ ...prev, stats: cacheRef.current.stats.data }))
          hasValidCache = true
        }

        // If we have valid cache for all data, skip loading state
        if (hasValidCache && isCacheValid('requests') && isCacheValid('fleet') && isCacheValid('stats')) {
          setLoading(false)
          loadingRef.current = false
          return
        }
      }
      
      // Clear cache on manual refresh
      if (isManualRefresh) {
        invalidateCache()
        if (RentalRequestService && typeof RentalRequestService.clearCache === 'function') {
          RentalRequestService.clearCache()
        }
      }
      
      // Fetch data with caching
      const fetchPromises = []
      
      // Fetch requests (with cache check)
      if (isManualRefresh || !isCacheValid('requests') || !doFiltersMatch(filters)) {
        fetchPromises.push(
          RentalRequestService.fetchRequests(1, 100).then(result => {
            if (!result.error) {
              cacheRef.current.requests = {
                data: result.data || [],
                timestamp: Date.now(),
                filters: { ...filters },
                stale: false
              }
              return { type: 'requests', data: result.data || [] }
            }
            return { type: 'requests', error: result.error }
          })
        )
      }
      
      // Fetch fleet (with cache check)
      if (isManualRefresh || !isCacheValid('fleet')) {
        fetchPromises.push(
          RentalRequestService.fetchFleet().then(result => {
            if (!result.error) {
              cacheRef.current.fleet = {
                data: result.data || [],
                timestamp: Date.now(),
                stale: false
              }
              return { type: 'fleet', data: result.data || [] }
            }
            return { type: 'fleet', error: result.error }
          })
        )
      }
      
      // Fetch stats (with cache check)
      if (isManualRefresh || !isCacheValid('stats')) {
        fetchPromises.push(
          RentalRequestService.fetchDashboardStats().then(result => {
            if (!result.error) {
              cacheRef.current.stats = {
                data: result.data,
                timestamp: Date.now(),
                stale: false
              }
              return { type: 'stats', data: result.data }
            }
            return { type: 'stats', error: result.error }
          })
        )
      }
      
      // Wait for all fetches to complete
      if (fetchPromises.length > 0) {
        const results = await Promise.all(fetchPromises)
        
        results.forEach(result => {
          if (result.error) {
            setError(result.error)
          } else {
            setData(prev => ({
              ...prev,
              [result.type]: result.data
            }))
          }
        })
      }
      
      setLastFetch(new Date())
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('Failed to load data')
      notify.error('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [filters, notify, invalidateCache])

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
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [])

  // Initialize data function
  const initializeData = useCallback(async () => {
    // console.log('Initializing dashboard data...')
    await fetchData(true) // Force initial fetch
  }, [fetchData])

  // Initialize data and setup real-time subscriptions
  useEffect(() => {
    // console.log('Setting up real-time subscriptions (inlined)...');
    // console.log('Session state:', { session: !!session, sessionAccessToken: !!session?.access_token });
    
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeData();
    }

    // Only setup real-time if session is available
    if (session && session.access_token) {
      // console.log('Session available, setting up real-time...');
      
      (async () => {
        try {
          // Cleanup existing subscriptions
          // realtimeSubscriptionsRef.current.forEach(sub => sub.unsubscribe());
          // realtimeSubscriptionsRef.current = [];

          // Create authenticated client for real-time subscriptions
          const supabase = getSupabaseClient();

          // Add connection timeout
          // const connectionTimeout = setTimeout(() => {
          //   console.log('Real-time connection timeout, falling back to polling');
          //   setRealtimeStatus('disconnected');
          //   notify.info('Real-time connection timeout. Using polling mode.');
          // }, 10000); // 10 second timeout

          // Rental Requests real-time subscription
          // const requestsSubscription = supabase
          //   .channel('rental_requests_realtime')
          //   .on('postgres_changes',
          //     {
          //       event: '*',
          //       schema: 'public',
          //       table: 'rental_requests'
          //     },
          //     (payload: any) => {
          //       console.log('Rental request change:', payload);
          //       markCacheStale('requests');
          //       markCacheStale('stats');
          //       setData(prev => ({
          //         ...prev,
          //         requests: [...prev.requests]
          //       }));
          //     }
          //   )
          //   .subscribe((status) => {
          //     console.log('Rental requests subscription status:', status);
          //     if (status === 'CHANNEL_ERROR') {
          //       console.error('Rental requests subscription failed:', status);
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('disconnected');
          //       notify.error('Real-time connection failed. Using polling mode.');
          //     } else if (status === 'SUBSCRIBED') {
          //       console.log('Rental requests subscription successful');
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('connected');
          //       notify.success('Real-time connection established');
          //     } else if (status === 'CLOSED') {
          //       console.log('Rental requests subscription closed');
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('disconnected');
          //     }
          //   });

          // Fleet real-time subscription
          // const fleetSubscription = supabase
          //   .channel('fleet_realtime')
          //   .on('postgres_changes',
          //     {
          //       event: '*',
          //       schema: 'public',
          //       table: 'fleet'
          //     },
          //     (payload: any) => {
          //       console.log('Fleet change:', payload);
          //       markCacheStale('fleet');
          //       markCacheStale('stats');
          //       setData(prev => ({
          //         ...prev,
          //         fleet: [...prev.fleet]
          //       }));
          //     }
          //   )
          //   .subscribe((status) => {
          //     console.log('Fleet subscription status:', status);
          //     if (status === 'CHANNEL_ERROR') {
          //       console.error('Fleet subscription failed:', status);
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('disconnected');
          //       notify.error('Real-time connection failed. Using polling mode.');
          //     } else if (status === 'SUBSCRIBED') {
          //       console.log('Fleet subscription successful');
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('connected');
          //       notify.success('Real-time connection established');
          //     } else if (status === 'CLOSED') {
          //       console.log('Fleet subscription closed');
          //       clearTimeout(connectionTimeout);
          //       setRealtimeStatus('disconnected');
          //     }
          //   });

          // realtimeSubscriptionsRef.current = [requestsSubscription, fleetSubscription];

        } catch (error) {
          console.error('Error setting up real-time subscriptions:', error);
          // setRealtimeStatus('disconnected');
          // notify.error('Failed to establish real-time connection. Using polling mode.');
        }
      })();
    } else if (session === null) {
      // Session is explicitly null (user not authenticated)
      // console.log('No session available for real-time subscriptions');
      // setRealtimeStatus('disconnected');
    }
    // If session is undefined, we're still loading, so don't do anything

  }, [session, initializeData, setData])

  // Cache warming function for better hit rates
  const warmCache = useCallback(async () => {
    try {
      // Pre-fetch data to warm the cache
      const [requestsResult, fleetResult, statsResult] = await Promise.allSettled([
        RentalRequestService.fetchRequests(1, 100),
        RentalRequestService.fetchFleet(),
        RentalRequestService.fetchDashboardStats()
      ])

      // Update cache with successful results
      if (requestsResult.status === 'fulfilled' && !requestsResult.value.error) {
        cacheRef.current.requests = {
          data: requestsResult.value.data || [],
          timestamp: Date.now(),
          filters: { ...filters },
          stale: false
        }
      }

      if (fleetResult.status === 'fulfilled' && !fleetResult.value.error) {
        cacheRef.current.fleet = {
          data: fleetResult.value.data || [],
          timestamp: Date.now(),
          stale: false
        }
      }

      if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
        cacheRef.current.stats = {
          data: statsResult.value.data,
          timestamp: Date.now(),
          stale: false
        }
      }

      // console.log('Cache warmed successfully')
    } catch (err) {
      console.warn('Cache warming failed:', err)
    }
  }, [filters])

  // Warm cache on mount
  useEffect(() => {
    const warmTimer = setTimeout(() => {
      warmCache()
    }, 2000) // Warm cache 2 seconds after mount

    return () => {
      clearTimeout(warmTimer)
    }
  }, [warmCache])

  return {
    data,
    loading,
    error,
    lastFetch,
    fetchData,
    setData,
  }
}

// Dashboard Context for global state management
interface DashboardContextType {
  data: {
    requests: RentalRequest[]
    fleet: any[]
    stats: any
  }
  loading: boolean
  error: string | null
  lastFetch: Date
  actionLoadingId: string | null
  tab: string
  autoRefreshEnabled: boolean
  refreshInterval: number
  filters: {
    userId: string | null
    equipmentId: string | null
    status: string | null
  }
  fetchData: (isManualRefresh?: boolean) => Promise<void>
  setData: (data: { requests: RentalRequest[]; fleet: any[]; stats: any }) => void
  setActionLoadingId: (id: string | null) => void
  setTab: (tab: string) => void
  setAutoRefreshEnabled: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  setFilters: (newFilters: { userId?: string | null; equipmentId?: string | null; status?: string | null }) => void
  clearFilters: () => void
  handleApprove: (id: string) => Promise<void>
  handleDecline: (id: string) => Promise<void>
  handleComplete: (id: string) => Promise<void>
  handleReopen: (id: string) => Promise<void>
  handleCancel: (id: string) => Promise<void>
  handleBulkApprove: (ids: string[]) => Promise<void>
  handleBulkDecline: (ids: string[]) => Promise<void>
  handleBulkDelete: (ids: string[]) => Promise<void>
  handleFleetDelete: (id: string) => Promise<void>
  handleFleetStatusUpdate: (fleetId: string, newStatus: string) => Promise<void>
  handleEdit: (id: string, updatedFields: any) => Promise<void>
  handleDirectDeleteConfirm?: () => Promise<void>
  handleDirectDeleteCancel?: () => void
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(undefined)

const useDashboard = () => {
  const context = React.useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

// Dashboard Provider component
const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [tab, setTab] = useState('dashboard')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(60000)
  const [filters, setFiltersState] = useState({
    userId: null as string | null,
    equipmentId: null as string | null,
    status: null as string | null
  })

  // Get session from auth hook for real-time subscriptions
  const { session } = useAuth()

  // Use the new live data hook
  const { data, loading, error, lastFetch, liveStatus, fetchData, setData } = useLiveDashboardData(filters)

  // Optimized filter setters
  const setFilters = useCallback((newFilters: { userId?: string | null; equipmentId?: string | null; status?: string | null }) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({ userId: null, equipmentId: null, status: null })
  }, [])

  // Service validation function
  const validateService = useCallback((serviceName: string, methodName: string) => {
    if (!RentalRequestService) {
      console.error(`${serviceName} is not available`)
      return false
    }
    if (typeof RentalRequestService[methodName as keyof typeof RentalRequestService] !== 'function') {
      console.error(`${methodName} method is not available on ${serviceName}`)
      return false
    }
    return true
  }, [])

  // Action helpers
  const findRequest = useCallback((id: string) => {
    return data.requests.find(r => r.id === id)
  }, [data.requests])

  const logAudit = useCallback(async (action: string, details: any = {}) => {
    const { data: { user } } = await getSupabaseClient().auth.getUser()
    if (!user?.id) return
    await getSupabaseClient().from('audit_log').insert([
      {
        action,
        user_id: user.id,
        details: {
          user_email: user.email,
          user_name: user.user_metadata?.name,
          ...details
        }
      }
    ])
  }, [])

  // Use split action handlers
  const actions = useDashboardActions({ setData, fetchData, findRequest, logAudit })

  const contextValue = {
    data,
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
    filters,
    fetchData,
    setData,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    setFilters,
    clearFilters,
    ...actions,
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex items-center gap-2 px-4 py-1">
        {liveStatus === 'live' && <Badge variant="green">LIVE</Badge>}
        {liveStatus === 'polling' && <Badge variant="yellow">POLLING</Badge>}
      </div>
      {children}
    </DashboardContext.Provider>
  )
}

// Dashboard Content component that uses the context
const DashboardContent = ({ 
  user, 
  auditOpen, 
  setAuditOpen, 
  auditLog, 
  expandedLog, 
  setExpandedLog, 
  detailsId, 
  setDetailsId, 
  deleteDialog, 
  setDeleteDialog, 
  auditLogLoaded, 
  fetchAuditLog 
}: {
  user: any
  auditOpen: boolean
  setAuditOpen: (open: boolean) => void
  auditLog: any[]
  expandedLog: string | null
  setExpandedLog: (id: string | null) => void
  detailsId: string | null
  setDetailsId: (id: string | null) => void
  deleteDialog: { open: boolean; id: string | null; row: any | null }
  setDeleteDialog: (dialog: { open: boolean; id: string | null; row: any | null }) => void
  auditLogLoaded: boolean
  fetchAuditLog: () => void
}) => {
  const notify = useNotify();
  const {
    data: { requests, fleet, stats },
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
    fetchData,
    setData,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    setFilters,
    clearFilters,
    handleApprove,
    handleDecline,
    handleComplete,
    handleReopen,
    handleCancel,
    handleBulkApprove,
    handleBulkDecline,
    handleBulkDelete,
    handleFleetDelete,
    handleFleetStatusUpdate,
    handleEdit,
  } = useDashboard()

  // Memoize expensive calculations
  const dashboardStats = useMemo(() => {
    const activeRentals = requests.filter(r => r.status === 'Approved').length
    const fleetAvailable = fleet.filter(f => f.status === 'Available').length
    const fleetInUse = fleet.filter(f => f.status === 'In Use').length
    const pendingRequests = requests.filter(r => r.status === 'Pending').length
    
    return { activeRentals, fleetAvailable, fleetInUse, pendingRequests }
  }, [requests, fleet])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      fetchData(true)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, refreshInterval, fetchData])

  // Load audit log when tab changes
  useEffect(() => {
    if (tab === 'audit' && !auditLogLoaded) {
      fetchAuditLog()
    }
  }, [tab, auditLogLoaded, fetchAuditLog])

  const emptyFleet = fleet.length === 0

  const handleDeleteWrapper = async (id: string) => {
    const row = requests.find(r => r.id === id)
    setDeleteDialog({ open: true, id, row })
  }

  const handleViewDetails = useCallback(async (id: string) => {
    setDetailsId(id)
  }, [setDetailsId])

  const handleDirectDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.id) return
    
    setActionLoadingId(deleteDialog.id)
    try {
      if (!RentalRequestService || typeof RentalRequestService.deleteRequest !== 'function') {
        throw new Error('RentalRequestService.deleteRequest is not available')
      }
      
      await RentalRequestService.deleteRequest(deleteDialog.id)
      notify.success('Request deleted successfully.')
      
      // Log audit if available
      try {
        const { data: { user } } = await getSupabaseClient().auth.getUser()
        if (user?.id) {
          await getSupabaseClient().from('audit_log').insert([
            {
              action: 'Deleted rental request',
              user_id: user.id,
              details: {
                user_email: user.email,
                user_name: user.user_metadata?.name,
                request_id: deleteDialog.id,
                equipment_id: deleteDialog.row?.equipment_id,
                equipment_name: deleteDialog.row?.equipment?.name,
                request_user_id: deleteDialog.row?.user_id
              }
            }
          ])
        }
      } catch (auditError) {
        console.error('Failed to log audit:', auditError)
      }
      
      setDeleteDialog({ open: false, id: null, row: null })
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        fetchData(true)
      }, 100)
    } catch (error) {
      console.error('Error in delete action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to delete request')
    } finally {
      setActionLoadingId(null)
    }
  }, [deleteDialog, fetchData])

  const handleDirectDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, id: null, row: null })
  }, [setDeleteDialog])

  // Helper function to convert actionLoadingId type
  const getActionLoadingId = (): string | null | undefined => actionLoadingId || undefined

  const tabOptions = [
    { key: "home", label: "Home" },
    { key: "dashboard", label: "Dashboard" },
    { key: "requests", label: "Requests" },
    { key: "fleet", label: "Fleet" },
    { key: "settings", label: "Settings" },
  ]

  // Optimized tab switching - instant and performant
  const handleTabChange = useCallback((value: string) => {
    if (tab === value) return; // Prevent unnecessary updates
    
    if (value === 'home') {
      // Navigate to home page
      window.location.href = '/'
      return
    }
    
    setTab(value);
  }, [tab]);

  // Keyboard navigation for tabs - optimized for mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard navigation when not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tabOrder = ['home', 'dashboard', 'requests', 'fleet', 'settings'];
      const currentIndex = tabOrder.indexOf(tab);
      
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % tabOrder.length;
          if (tabOrder[nextIndex] === 'home') {
            window.location.href = '/'
          } else {
            handleTabChange(tabOrder[nextIndex]);
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
          if (tabOrder[prevIndex] === 'home') {
            window.location.href = '/'
          } else {
            handleTabChange(tabOrder[prevIndex]);
          }
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          window.location.href = '/'
          break;
        case '1':
          event.preventDefault();
          handleTabChange('dashboard');
          break;
        case '2':
          event.preventDefault();
          handleTabChange('requests');
          break;
        case '3':
          event.preventDefault();
          handleTabChange('fleet');
          break;
        case '4':
          event.preventDefault();
          handleTabChange('settings');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, handleTabChange]);

  // Optimized tab content with lazy loading and smooth transitions
  const tabContent = useMemo(() => {
    const tabComponents = {
      dashboard: (
        <Suspense fallback={
          <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          </div>
        }>
          <DashboardTab 
            loading={loading} 
            dashboardStats={dashboardStats} 
          />
        </Suspense>
      ),
      requests: (
        <Suspense fallback={<RequestsSkeleton />}>
          <RequestsTab
            loading={loading}
            requests={requests}
            error={error}
            lastFetch={lastFetch}
            actionLoadingId={actionLoadingId}
            deleteDialog={deleteDialog}
            detailsId={detailsId}
            onRefresh={() => fetchData(true)}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onDelete={handleDeleteWrapper}
            onEdit={handleEdit}
            onComplete={handleComplete}
            onReopen={handleReopen}
            onCancel={handleCancel}
            onViewDetails={handleViewDetails}
            onBulkApprove={handleBulkApprove}
            onBulkDecline={handleBulkDecline}
            onBulkDelete={handleBulkDelete}
            onDirectDeleteConfirm={handleDirectDeleteConfirm}
            onDirectDeleteCancel={handleDirectDeleteCancel}
            onSetDetailsId={setDetailsId}
            onFilterByUser={async (userId: string) => {
              setFilters({ userId })
              await fetchData(true)
            }}
            onFilterByEquipment={async (equipmentId: string) => {
              setFilters({ equipmentId })
              await fetchData(true)
            }}
            onClearIndexedFilters={async () => {
              clearFilters()
              await fetchData(true)
            }}
          />
        </Suspense>
      ),
      fleet: (
        <Suspense fallback={
          <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <FleetCardSkeleton />
              <FleetCardSkeleton />
              <FleetCardSkeleton />
              <FleetCardSkeleton />
            </div>
          </div>
        }>
          <FleetTab
            loading={loading}
            fleet={fleet}
            onFleetDelete={handleFleetDelete}
            onFleetStatusUpdate={handleFleetStatusUpdate}
          />
        </Suspense>
      ),
      settings: (
        <Suspense fallback={
          <div className="max-w-4xl w-full mx-auto px-4 md:px-6 pb-12">
            <div className="space-y-6">
              <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          </div>
        }>
          <SettingsTab
            autoRefreshEnabled={autoRefreshEnabled}
            refreshInterval={refreshInterval}
            onSetAutoRefreshEnabled={setAutoRefreshEnabled}
            onSetRefreshInterval={setRefreshInterval}
          />
        </Suspense>
      )
    }

    return tabComponents[tab as keyof typeof tabComponents] || tabComponents.dashboard
  }, [
    tab,
    loading,
    dashboardStats,
    requests,
    error,
    lastFetch,
    actionLoadingId,
    deleteDialog,
    detailsId,
    fleet,
    autoRefreshEnabled,
    refreshInterval,
    fetchData,
    handleApprove,
    handleDecline,
    handleDeleteWrapper,
    handleEdit,
    handleComplete,
    handleReopen,
    handleCancel,
    handleViewDetails,
    handleBulkApprove,
    handleBulkDecline,
    handleBulkDelete,
    handleDirectDeleteConfirm,
    handleDirectDeleteCancel,
    setDetailsId,
    setFilters,
    clearFilters,
    handleFleetDelete,
    handleFleetStatusUpdate,
    setAutoRefreshEnabled,
    setRefreshInterval,
  ])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" activeTab={tab} onTabChange={handleTabChange} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.15, 
                    ease: "easeOut"
                  }}
                  className="flex-1"
                >
                  {tabContent}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </SidebarInset>
      <ActionLoadingOverlay isVisible={!!actionLoadingId} />
    </SidebarProvider>
  )
}

// TabContent component
const TabContent = React.memo(({ children, tabKey }: { children: React.ReactNode; tabKey: string }) => (
  <div className="flex-1 overflow-hidden transition-opacity duration-200 ease-in-out">
    <div className="h-full overflow-y-auto">
      {children}
    </div>
  </div>
))

// Debug component to show JWT payload
function DebugJWT() {
  const { session } = useAuth();
  if (!session) return <div style={{color: 'red'}}>No session</div>;
  let payload = null;
  try {
    payload = JSON.parse(atob(session.access_token.split('.')[1]));
  } catch (e) {
    return <div style={{color: 'red'}}>Invalid JWT</div>;
  }
  return (
    <pre style={{background: '#f5f5f5', color: '#333', padding: 12, borderRadius: 6, marginBottom: 16}}>
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// Client component for the dashboard
function DashboardClient() {
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; row: any | null }>({
    open: false,
    id: null,
    row: null,
  });
  const [auditLogLoaded, setAuditLogLoaded] = useState(false);

  const router = useRouter()
  const { user, session, loading: authLoading, isAdmin, isAuthenticated } = useAuth()

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login")
      } else if (!isAdmin) {
        router.replace("/")
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router])

  // Memoized audit log fetch function
  const fetchAuditLog = useCallback(async () => {
    if (auditLogLoaded) return; // Skip if already loaded
    
    try {
      // OPTIMIZED: Use the new indexed method for better performance
      // This will use the audit_log_user_id_idx index
      const { data, error } = await RentalRequestService.fetchAuditLogByUser(
        user?.id || '', // Replace with actual user ID when needed
        1, // page
        50 // pageSize
      )
      
      if (!error) {
        setAuditLog(data || [])
        setAuditLogLoaded(true)
      }
    } catch (error) {
      console.error('Failed to load audit log:', error)
    }
  }, [auditLogLoaded, user?.id])

  // Validate service availability
  if (!RentalRequestService) {
    console.error('RentalRequestService is not available')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Service Error</h2>
          <p className="text-gray-600">Rental request service is not available. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  // Validate service methods
  const requiredMethods = [
    'fetchRequests', 'approveRequest', 'declineRequest', 'deleteRequest',
    'completeRequest', 'reopenRequest', 'cancelRequest', 'clearRequestsCache',
    'fetchFleet', 'fetchDashboardStats'
  ]
  
  const missingMethods = requiredMethods.filter(method => 
    typeof RentalRequestService[method as keyof typeof RentalRequestService] !== 'function'
  )
  
  if (missingMethods.length > 0) {
    console.error('Missing RentalRequestService methods:', missingMethods)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Service Configuration Error</h2>
          <p className="text-gray-600">Some rental request service methods are missing. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      <DashboardProvider>
        <DashboardContent 
          user={user}
          auditOpen={auditOpen}
          setAuditOpen={setAuditOpen}
          auditLog={auditLog}
          expandedLog={expandedLog}
          setExpandedLog={setExpandedLog}
          detailsId={detailsId}
          setDetailsId={setDetailsId}
          deleteDialog={deleteDialog}
          setDeleteDialog={setDeleteDialog}
          auditLogLoaded={auditLogLoaded}
          fetchAuditLog={fetchAuditLog}
        />
      </DashboardProvider>
    </div>
  )
}

// Main page component
export default function Page() {
  return (
    <>
      <DebugJWT />
      <DashboardClient />
    </>
  );
}