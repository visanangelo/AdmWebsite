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

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

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
const useDataFetching = (setRealtimeStatus: (status: 'connected' | 'disconnected' | 'connecting') => void, filters: { userId: string | null; equipmentId: string | null; status: string | null }) => {
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
  const realtimeSubscriptionsRef = useRef<any[]>([])
  const initializedRef = useRef(false)
  
  // Cache for better performance
  const cacheRef = useRef<{
    requests: { data: RentalRequest[]; timestamp: number; filters: any }
    fleet: { data: any[]; timestamp: number }
    stats: { data: any; timestamp: number }
  }>({
    requests: { data: [], timestamp: 0, filters: null },
    fleet: { data: [], timestamp: 0 },
    stats: { data: null, timestamp: 0 }
  })

  const CACHE_DURATION = 30000 // 30 seconds cache

  // Check if cache is valid
  const isCacheValid = (cacheKey: keyof typeof cacheRef.current) => {
    const cache = cacheRef.current[cacheKey]
    return Date.now() - cache.timestamp < CACHE_DURATION
  }

  // Check if filters match cache
  const doFiltersMatch = (currentFilters: any) => {
    const cachedFilters = cacheRef.current.requests.filters
    if (!cachedFilters || !currentFilters) return false
    return JSON.stringify(cachedFilters) === JSON.stringify(currentFilters)
  }

  // Cache invalidation function
  const invalidateCache = useCallback((cacheKey?: keyof typeof cacheRef.current) => {
    if (cacheKey) {
      cacheRef.current[cacheKey].timestamp = 0
    } else {
      // Invalidate all cache
      Object.keys(cacheRef.current).forEach(key => {
        cacheRef.current[key as keyof typeof cacheRef.current].timestamp = 0
      })
    }
  }, [])

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (loadingRef.current && !isManualRefresh) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      // Check cache first (unless manual refresh)
      if (!isManualRefresh) {
        // Check requests cache
        if (isCacheValid('requests') && doFiltersMatch(filters)) {
          setData(prev => ({ ...prev, requests: cacheRef.current.requests.data }))
        }
        
        // Check fleet cache
        if (isCacheValid('fleet')) {
          setData(prev => ({ ...prev, fleet: cacheRef.current.fleet.data }))
        }
        
        // Check stats cache
        if (isCacheValid('stats')) {
          setData(prev => ({ ...prev, stats: cacheRef.current.stats.data }))
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
                filters: { ...filters }
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
                timestamp: Date.now()
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
                timestamp: Date.now()
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
      // Cleanup realtime subscriptions
      realtimeSubscriptionsRef.current.forEach(sub => sub.unsubscribe())
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
          requests: requestsResult.data || [],
          fleet: fleetResult.data || [],
          stats: statsResult.data
        }
        
        // Update cache
        cacheRef.current.requests = {
          data: newData.requests,
          timestamp: Date.now(),
          filters: { ...filters }
        }
        cacheRef.current.fleet = {
          data: newData.fleet,
          timestamp: Date.now()
        }
        cacheRef.current.stats = {
          data: newData.stats,
          timestamp: Date.now()
        }
        
        setData(newData)
        setLastFetch(new Date())
        
        // Setup realtime subscriptions after initial data load
        // setupRealtimeSubscriptions()
      } catch (err) {
        console.error('Error in initial data fetch:', err)
        setError('Failed to load data')
        notify.error('Failed to load data. Please refresh the page.')
      }
    }
    
    initializeData()
  }, []) // Empty dependency array to prevent Fast Refresh reloads

  return {
    data,
    loading,
    error,
    lastFetch,
    fetchData,
    debouncedFetch,
    setData,
    notify,
    invalidateCache
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
  realtimeStatus: 'connected' | 'disconnected' | 'connecting'
  filters: {
    userId: string | null
    equipmentId: string | null
    status: string | null
  }
  fetchData: (isManualRefresh?: boolean) => Promise<void>
  debouncedFetch: (isManualRefresh?: boolean) => void
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
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [filters, setFiltersState] = useState({
    userId: null as string | null,
    equipmentId: null as string | null,
    status: null as string | null
  })

  // Use the data fetching hook
  const { data, loading, error, lastFetch, fetchData, debouncedFetch, setData, notify, invalidateCache } = useDataFetching(setRealtimeStatus, filters)

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

  // Action handlers - moved inside provider
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

  const createActionHandler = useCallback((actionType: string, serviceMethod: (id: string) => Promise<void>, successMessage: string, optimisticUpdate?: (id: string) => void, cacheKey?: 'requests' | 'fleet' | 'stats') => {
    return async (id: string) => {
      setActionLoadingId(id)
      try {
        const req = findRequest(id)
        
        // Apply optimistic update if provided
        if (optimisticUpdate) {
          optimisticUpdate(id)
        }
        
        // Validate service method exists
        if (!serviceMethod || typeof serviceMethod !== 'function') {
          throw new Error(`Service method for ${actionType} is not available`)
        }
        
        await serviceMethod(id)
        notify.success(successMessage)
        
        // Invalidate cache after successful action
        if (cacheKey) {
          invalidateCache(cacheKey)
        }
        
        await logAudit(`${actionType} rental request`, {
          request_id: id,
          equipment_id: req?.equipment_id,
          equipment_name: req?.equipment?.name,
          request_user_id: req?.user_id
        })
        
      } catch (error) {
        console.error(`Error in ${actionType} action:`, error)
        notify.error(error instanceof Error ? error.message : `Failed to ${actionType.toLowerCase()} request`)
        
        // Revert optimistic update on error
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      } finally {
        setActionLoadingId(null)
      }
    }
  }, [findRequest, logAudit, debouncedFetch, invalidateCache])

  const handleApprove = useCallback(
    createActionHandler('Approved', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.approveRequest !== 'function') {
          throw new Error('RentalRequestService.approveRequest is not available')
        }
        return RentalRequestService.approveRequest(id)
      }, 
      'Request approved and equipment reserved!',
      (id: string) => {
        setData(prev => {
          const req = prev.requests.find(r => r.id === id)
          return {
            ...prev,
            requests: prev.requests.map(r => 
              r.id === id ? { ...r, status: 'Approved' } : r
            ),
            fleet: req ? prev.fleet.map(f => 
              f.id === req.equipment_id ? { ...f, status: 'Reserved' } : f
            ) : prev.fleet
          }
        })
      },
      'requests'
    ),
    [createActionHandler]
  )

  const handleDecline = useCallback(
    createActionHandler('Declined', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.declineRequest !== 'function') {
          throw new Error('RentalRequestService.declineRequest is not available')
        }
        return RentalRequestService.declineRequest(id)
      }, 
      'Request declined.',
      (id: string) => {
        setData(prev => {
          const req = prev.requests.find(r => r.id === id)
          return {
            ...prev,
            requests: prev.requests.map(r => 
              r.id === id ? { ...r, status: 'Declined' } : r
            ),
            fleet: req ? prev.fleet.map(f => 
              f.id === req.equipment_id ? { ...f, status: 'Available' } : f
            ) : prev.fleet
          }
        })
      },
      'requests'
    ),
    [createActionHandler]
  )

  const handleComplete = useCallback(
    createActionHandler('Completed', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.completeRequest !== 'function') {
          throw new Error('RentalRequestService.completeRequest is not available')
        }
        return RentalRequestService.completeRequest(id)
      }, 
      'Request marked as completed.',
      (id: string) => {
        setData(prev => {
          const req = prev.requests.find(r => r.id === id)
          return {
            ...prev,
            requests: prev.requests.map(r => 
              r.id === id ? { ...r, status: 'Completed' } : r
            ),
            fleet: req ? prev.fleet.map(f => 
              f.id === req.equipment_id ? { ...f, status: 'Available' } : f
            ) : prev.fleet
          }
        })
      },
      'requests'
    ),
    [createActionHandler]
  )

  const handleReopen = useCallback(
    createActionHandler('Reopened', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.reopenRequest !== 'function') {
          throw new Error('RentalRequestService.reopenRequest is not available')
        }
        return RentalRequestService.reopenRequest(id)
      }, 
      'Request reopened.',
      (id: string) => {
        setData(prev => {
          const req = prev.requests.find(r => r.id === id)
          return {
            ...prev,
            requests: prev.requests.map(r => 
              r.id === id ? { ...r, status: 'Reopened' } : r
            ),
            fleet: req ? prev.fleet.map(f => 
              f.id === req.equipment_id ? { ...f, status: 'In Use' } : f
            ) : prev.fleet
          }
        })
      },
      'requests'
    ),
    [createActionHandler]
  )

  const handleCancel = useCallback(
    createActionHandler('Cancelled', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.cancelRequest !== 'function') {
          throw new Error('RentalRequestService.cancelRequest is not available')
        }
        return RentalRequestService.cancelRequest(id)
      }, 
      'Request cancelled.',
      (id: string) => {
        setData(prev => {
          const req = prev.requests.find(r => r.id === id)
          return {
            ...prev,
            requests: prev.requests.map(r => 
              r.id === id ? { ...r, status: 'Cancelled' } : r
            ),
            fleet: req ? prev.fleet.map(f => 
              f.id === req.equipment_id ? { ...f, status: 'Available' } : f
            ) : prev.fleet
          }
        })
      },
      'requests'
    ),
    [createActionHandler]
  )

  const createBulkActionHandler = useCallback((actionType: string, serviceMethod: (id: string) => Promise<void>) => {
    return async (ids: string[]) => {
      if (!serviceMethod || typeof serviceMethod !== 'function') {
        notify.error(`Service method for ${actionType} is not available`)
        return
      }

      notify.info(`${actionType} ${ids.length} requests...`)
      try {
        await Promise.all(ids.map(id => serviceMethod(id)))
        notify.success(`${ids.length} requests ${actionType.toLowerCase()} successfully.`)
        
        // Use a small delay for smoother UX
        setTimeout(() => {
          debouncedFetch()
        }, 100)
      } catch (error) {
        console.error(`Error in bulk ${actionType} action:`, error)
        notify.error(`Failed to ${actionType.toLowerCase()} all requests. ${error instanceof Error ? error.message : ''}`)
      }
    }
  }, [debouncedFetch])

  const handleBulkApprove = useCallback(
    createBulkActionHandler('Approving', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.approveRequest !== 'function') {
          throw new Error('RentalRequestService.approveRequest is not available')
        }
        return RentalRequestService.approveRequest(id)
      }
    ),
    [createBulkActionHandler]
  )

  const handleBulkDecline = useCallback(
    createBulkActionHandler('Declining', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.declineRequest !== 'function') {
          throw new Error('RentalRequestService.declineRequest is not available')
        }
        return RentalRequestService.declineRequest(id)
      }
    ),
    [createBulkActionHandler]
  )

  const handleBulkDelete = useCallback(
    createBulkActionHandler('Deleting', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.deleteRequest !== 'function') {
          throw new Error('RentalRequestService.deleteRequest is not available')
        }
        return RentalRequestService.deleteRequest(id)
      }
    ),
    [createBulkActionHandler]
  )

  const handleFleetDelete = useCallback(async (id: string) => {
    setActionLoadingId(id)
    try {
      const { error } = await getSupabaseClient().from('fleet').delete().eq('id', id)
      if (error) throw error
      
      notify.success('Fleet item deleted successfully.')
      await logAudit('Deleted fleet item', { fleet_id: id })
      
      // Invalidate fleet cache
      invalidateCache('fleet')
      
      debouncedFetch()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to delete fleet item')
    } finally {
      setActionLoadingId(null)
    }
  }, [logAudit, debouncedFetch, invalidateCache])

  const handleEdit = useCallback(async (id: string, updatedFields: any) => {
    setActionLoadingId(id)
    try {
      const { error } = await getSupabaseClient().from('rental_requests').update(updatedFields).eq('id', id)
      if (error) throw error
      
      notify.success('Request updated successfully.')
      await logAudit('Updated rental request', { request_id: id, updated_fields: updatedFields })
      
      // Invalidate requests cache
      invalidateCache('requests')
      
      debouncedFetch()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to update request')
    } finally {
      setActionLoadingId(null)
    }
  }, [logAudit, debouncedFetch, invalidateCache])

  const handleFleetStatusUpdate = async (fleetId: string, newStatus: string) => {
    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        fleet: prev.fleet.map(item => 
          item.id === fleetId ? { ...item, status: newStatus } : item
        )
      }))

      await RentalRequestService.updateFleetStatus(fleetId, newStatus)
      notify.success('Fleet status updated successfully')
      
      // Invalidate fleet cache
      invalidateCache('fleet')
      
      // Log audit if available
      try {
        const { data: { user } } = await getSupabaseClient().auth.getUser()
        if (user?.id) {
          await getSupabaseClient().from('audit_log').insert([
            {
              action: 'Updated fleet status',
              user_id: user.id,
              details: {
                user_email: user.email,
                user_name: user.user_metadata?.name,
                fleet_id: fleetId,
                new_status: newStatus
              }
            }
          ])
        }
      } catch (auditError) {
        console.error('Failed to log audit:', auditError)
      }
      
    } catch (error) {
      console.error('Error updating fleet status:', error)
      notify.error('Error updating fleet status')
      
      // Revert optimistic update on error
      setTimeout(() => {
        debouncedFetch(true)
      }, 100)
    }
  }

  const contextValue = {
    data,
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
    realtimeStatus,
    filters,
    fetchData,
    debouncedFetch,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    setFilters,
    clearFilters,
    // Action handlers
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
    handleEdit
  }

  return (
    <DashboardContext.Provider value={contextValue}>
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
    realtimeStatus,
    filters,
    fetchData,
    debouncedFetch,
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
    handleEdit,
    handleFleetStatusUpdate
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
      debouncedFetch()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, refreshInterval, debouncedFetch])

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
        debouncedFetch()
      }, 100)
    } catch (error) {
      console.error('Error in delete action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to delete request')
    } finally {
      setActionLoadingId(null)
    }
  }, [deleteDialog, debouncedFetch])

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
            onRefresh={() => debouncedFetch(true)}
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
              await debouncedFetch(true)
            }}
            onFilterByEquipment={async (equipmentId: string) => {
              setFilters({ equipmentId })
              await debouncedFetch(true)
            }}
            onClearIndexedFilters={async () => {
              clearFilters()
              await debouncedFetch(true)
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
            realtimeStatus={realtimeStatus}
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
    realtimeStatus,
    debouncedFetch,
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
    setRefreshInterval
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

export default function Page() {
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
  const { user, loading: authLoading, isAdmin, isAuthenticated } = useAuth()

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

  // Example: How to use the new indexed methods for better performance
  // 
  // 1. Fetch requests by user (uses rental_requests_user_id_idx):
  // const userRequests = await RentalRequestService.fetchRequestsByUser(userId, 1, 10, 'Pending')
  //
  // 2. Fetch requests by equipment (uses rental_requests_equipment_id_idx):
  // const equipmentRequests = await RentalRequestService.fetchRequestsByEquipment(equipmentId, 1, 10, 'Approved')
  //
  // 3. Fetch audit log by user (uses audit_log_user_id_idx):
  // const userAuditLog = await RentalRequestService.fetchAuditLogByUser(userId, 1, 20)
  //
  // These methods are much faster than fetching all data and filtering in JavaScript!

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
    <SupabaseProvider>
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
    </SupabaseProvider>
  )
}