"use client"

import '../../../styles/dashboard-theme.css'
import { AppSidebar } from "@/features/shared/components/layout/app-sidebar"
import { DataTable } from "@/features/rental-requests"
import { SiteHeader } from "@/features/shared/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/features/shared/components/ui/sidebar"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useNotify } from '@/features/shared/hooks/useNotify'
import { useRouter } from "next/navigation"
import { Button } from "@/features/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/features/shared/components/ui/dialog"
import { Skeleton } from "@/features/shared/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import { RentalRequestService } from "@/services/rental-requests"
import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/features/shared/components/ui/card"
import { Truck, CheckCircle, Clock, AlertCircle, RefreshCwIcon, Trash2Icon, EyeIcon } from "lucide-react"
import { Badge } from "@/features/shared/components/ui/badge"
import { RentalRequest, FleetItem } from '@/types/rental'
import { useAuth } from '@/features/shared/hooks/use-auth'
import type { FleetStatus } from '@/types/rental'

// Add missing types
export interface DashboardStats {
  activeRentals: number;
  fleetAvailable: number;
  fleetInUse: number;
  pendingRequests: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// Enhanced Dashboard Card with better visual design
const DashboardCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  loading = false 
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: { value: number; isPositive: boolean }
  loading?: boolean
}) => {
  if (loading) {
    return <DashboardCardSkeleton />
  }

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors">
          {description}
        </p>
      </CardContent>
    </Card>
  )
})

// Enhanced Loading Skeleton with shimmer effect
const DashboardCardSkeleton = () => (
  <Card className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 border border-gray-200/60">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
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

// Enhanced Data Table Skeleton with better visual design
const DataTableSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
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
    
    {/* Table skeleton */}
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

// Enhanced Fleet Card with better visual design
const FleetCard = React.memo(function FleetCard({ eq, onStatus, onDelete, loadingId }: {
  eq: FleetItem
  onStatus: (id: string, status: FleetStatus) => void
  onDelete: (id: string) => void
  loadingId?: string | null | undefined
}) {
  const isLoading = loadingId === eq.id
  const statusColors = {
    "Available": "bg-green-100 text-green-800 border-green-200 shadow-green-100/50",
    "In Use": "bg-blue-100 text-blue-800 border-blue-200 shadow-blue-100/50",
    "Reserved": "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-100/50",
    "Maintenance": "bg-red-100 text-red-800 border-red-200 shadow-red-100/50"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 p-6 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300/80"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors mb-3">
            {eq.name}
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-300 ${
              statusColors[eq.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200 shadow-gray-100/50"
            }`}>
              {eq.status}
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-primary"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={eq.status}
            onChange={(e) => onStatus(eq.id, e.target.value as import('@/types/rental').FleetStatus)}
            disabled={isLoading}
            className="text-sm border border-gray-200/60 rounded-lg px-3 py-2 bg-white/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <button
            onClick={() => onDelete(eq.id)}
            disabled={isLoading}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
            title="Delete equipment"
          >
            <Trash2Icon className="h-4 w-4 group-hover/delete:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})

// Enhanced Fleet Card Skeleton
const FleetCardSkeleton = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 p-6 rounded-xl border border-gray-200/60 shadow-sm">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-5 w-20 mb-4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  </div>
)

// Custom hook for data fetching with React Query patterns
const useDataFetching = (setRealtimeStatus: (status: 'connected' | 'disconnected' | 'connecting') => void): {
  data: {
    requests: RentalRequest[];
    fleet: FleetItem[];
    stats: DashboardStats | null;
  };
  loading: boolean;
  error: string | null;
  lastFetch: Date;
  fetchData: (isManualRefresh?: boolean) => Promise<void>;
  debouncedFetch: (isManualRefresh?: boolean) => void;
  setData: React.Dispatch<React.SetStateAction<{
    requests: RentalRequest[];
    fleet: FleetItem[];
    stats: DashboardStats | null;
  }>>;
  notify: ReturnType<typeof useNotify>;
} => {
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

// Dashboard Context for global state management
interface DashboardContextType {
  data: {
    requests: RentalRequest[]
    fleet: FleetItem[]
    stats: DashboardStats | null
  }
  loading: boolean
  error: string | null
  lastFetch: Date
  actionLoadingId: string | null
  tab: string
  autoRefreshEnabled: boolean
  refreshInterval: number
  realtimeStatus: 'connected' | 'disconnected' | 'connecting'
  fetchData: (isManualRefresh?: boolean) => Promise<void>
  debouncedFetch: (isManualRefresh?: boolean) => void
  setActionLoadingId: (id: string | null) => void
  setTab: (tab: string) => void
  setAutoRefreshEnabled: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  handleApprove: (id: string) => Promise<void>
  handleDecline: (id: string) => Promise<void>
  handleComplete: (id: string) => Promise<void>
  handleReopen: (id: string) => Promise<void>
  handleCancel: (id: string) => Promise<void>
  handleBulkApprove: (ids: string[]) => Promise<void>
  handleBulkDecline: (ids: string[]) => Promise<void>
  handleBulkDelete: (ids: string[]) => Promise<void>
  handleFleetDelete: (id: string) => Promise<void>
  handleFleetStatusUpdate: (fleetId: string, newStatus: FleetStatus) => Promise<void>
  handleEdit: (id: string, updatedFields: Partial<RentalRequest>) => Promise<void>
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

  // Use the data fetching hook
  const { data, loading, error, lastFetch, fetchData, debouncedFetch, setData, notify } = useDataFetching(setRealtimeStatus)

  // Action handlers - moved inside provider
  const findRequest = useCallback((id: string) => {
    return data.requests.find(r => r.id === id)
  }, [data.requests])

  const logAudit = useCallback(async (action: string, details: Record<string, unknown> = {}) => {
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



  const handleApprove = useCallback(async (id: string) => {
    setActionLoadingId(id)
    let prevState: typeof data | null = null;
    try {
      const req = findRequest(id)
      // Save previous state for rollback
      prevState = data;
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
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
      
      if (!RentalRequestService || typeof RentalRequestService.approveRequest !== 'function') {
        throw new Error('RentalRequestService.approveRequest is not available')
      }
      await RentalRequestService.approveRequest(id)
      notify.success('Request approved and equipment reserved!')
      await logAudit('Approved rental request', {
        request_id: id,
        equipment_id: req?.equipment_id,
        equipment_name: req?.equipment?.name,
        request_user_id: req?.user_id
      })
    } catch (error) {
      console.error('Error in Approve action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to approve request')
      // Rollback optimistic update on error
      if (prevState) {
        setData(prevState)
      } else {
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      }
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId])

  const handleDecline = useCallback(async (id: string) => {
    setActionLoadingId(id)
    let prevState: typeof data | null = null;
    try {
      const req = findRequest(id)
      // Save previous state for rollback
      prevState = data;
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
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
      
      if (!RentalRequestService || typeof RentalRequestService.declineRequest !== 'function') {
        throw new Error('RentalRequestService.declineRequest is not available')
      }
      await RentalRequestService.declineRequest(id)
      notify.success('Request declined.')
      await logAudit('Declined rental request', {
        request_id: id,
        equipment_id: req?.equipment_id,
        equipment_name: req?.equipment?.name,
        request_user_id: req?.user_id
      })
    } catch (error) {
      console.error('Error in Decline action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to decline request')
      // Rollback optimistic update on error
      if (prevState) {
        setData(prevState)
      } else {
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      }
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId])

  const handleComplete = useCallback(async (id: string) => {
    setActionLoadingId(id)
    let prevState: typeof data | null = null;
    try {
      const req = findRequest(id)
      // Save previous state for rollback
      prevState = data;
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
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
      
      if (!RentalRequestService || typeof RentalRequestService.completeRequest !== 'function') {
        throw new Error('RentalRequestService.completeRequest is not available')
      }
      await RentalRequestService.completeRequest(id)
      notify.success('Request marked as completed.')
      await logAudit('Completed rental request', {
        request_id: id,
        equipment_id: req?.equipment_id,
        equipment_name: req?.equipment?.name,
        request_user_id: req?.user_id
      })
    } catch (error) {
      console.error('Error in Complete action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to complete request')
      // Rollback optimistic update on error
      if (prevState) {
        setData(prevState)
      } else {
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      }
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId])

  const handleReopen = useCallback(async (id: string) => {
    setActionLoadingId(id)
    let prevState: typeof data | null = null;
    try {
      const req = findRequest(id)
      // Save previous state for rollback
      prevState = data;
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
        const req = prev.requests.find(r => r.id === id)
        return {
          ...prev,
          requests: prev.requests.map(r => 
            r.id === id ? { ...r, status: 'Pending' } : r
          ),
          fleet: req ? prev.fleet.map(f => 
            f.id === req.equipment_id ? { ...f, status: 'In Use' } : f
          ) : prev.fleet
        }
      })
      
      if (!RentalRequestService || typeof RentalRequestService.reopenRequest !== 'function') {
        throw new Error('RentalRequestService.reopenRequest is not available')
      }
      await RentalRequestService.reopenRequest(id)
      notify.success('Request reopened.')
      await logAudit('Reopened rental request', {
        request_id: id,
        equipment_id: req?.equipment_id,
        equipment_name: req?.equipment?.name,
        request_user_id: req?.user_id
      })
    } catch (error) {
      console.error('Error in Reopen action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to reopen request')
      // Rollback optimistic update on error
      if (prevState) {
        setData(prevState)
      } else {
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      }
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId])

  const handleCancel = useCallback(async (id: string) => {
    setActionLoadingId(id)
    let prevState: typeof data | null = null;
    try {
      const req = findRequest(id)
      // Save previous state for rollback
      prevState = data;
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => {
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
      
      if (!RentalRequestService || typeof RentalRequestService.cancelRequest !== 'function') {
        throw new Error('RentalRequestService.cancelRequest is not available')
      }
      await RentalRequestService.cancelRequest(id)
      notify.success('Request cancelled.')
      await logAudit('Cancelled rental request', {
        request_id: id,
        equipment_id: req?.equipment_id,
        equipment_name: req?.equipment?.name,
        request_user_id: req?.user_id
      })
    } catch (error) {
      console.error('Error in Cancel action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to cancel request')
      // Rollback optimistic update on error
      if (prevState) {
        setData(prevState)
      } else {
        setTimeout(() => {
          debouncedFetch(true)
        }, 100)
      }
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId])



  const handleBulkApprove = useCallback(async (ids: string[]) => {
    if (!RentalRequestService || typeof RentalRequestService.approveRequest !== 'function') {
      notify.error('Service method for Approving is not available')
      return
    }

    notify.info(`Approving ${ids.length} requests...`)
    try {
      await Promise.all(ids.map(id => RentalRequestService.approveRequest(id)))
      notify.success(`${ids.length} requests approved successfully.`)
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        debouncedFetch()
      }, 100)
    } catch (error) {
      console.error('Error in bulk Approve action:', error)
      notify.error(`Failed to approve all requests. ${error instanceof Error ? error.message : ''}`)
    }
  }, [debouncedFetch, notify])

  const handleBulkDecline = useCallback(async (ids: string[]) => {
    if (!RentalRequestService || typeof RentalRequestService.declineRequest !== 'function') {
      notify.error('Service method for Declining is not available')
      return
    }

    notify.info(`Declining ${ids.length} requests...`)
    try {
      await Promise.all(ids.map(id => RentalRequestService.declineRequest(id)))
      notify.success(`${ids.length} requests declined successfully.`)
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        debouncedFetch()
      }, 100)
    } catch (error) {
      console.error('Error in bulk Decline action:', error)
      notify.error(`Failed to decline all requests. ${error instanceof Error ? error.message : ''}`)
    }
  }, [debouncedFetch, notify])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!RentalRequestService || typeof RentalRequestService.deleteRequest !== 'function') {
      notify.error('Service method for Deleting is not available')
      return
    }

    notify.info(`Deleting ${ids.length} requests...`)
    try {
      await Promise.all(ids.map(id => RentalRequestService.deleteRequest(id)))
      notify.success(`${ids.length} requests deleted successfully.`)
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        debouncedFetch()
      }, 100)
    } catch (error) {
      console.error('Error in bulk Delete action:', error)
      notify.error(`Failed to delete all requests. ${error instanceof Error ? error.message : ''}`)
    }
  }, [debouncedFetch, notify])

  const handleFleetDelete = useCallback(async (id: string) => {
    setActionLoadingId(id)
    try {
      const { error } = await getSupabaseClient().from('fleet').delete().eq('id', id)
      if (error) throw error
      
      notify.success('Fleet item deleted successfully.')
      await logAudit('Deleted fleet item', { fleet_id: id })
      debouncedFetch()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to delete fleet item')
    } finally {
      setActionLoadingId(null)
    }
  }, [logAudit, debouncedFetch, notify])

  const handleEdit = useCallback(async (id: string, updatedFields: Partial<RentalRequest>) => {
    setActionLoadingId(id)
    try {
      const { error } = await getSupabaseClient().from('rental_requests').update(updatedFields).eq('id', id)
      if (error) throw error
      
      notify.success('Request updated successfully.')
      await logAudit('Updated rental request', { request_id: id, updated_fields: updatedFields })
      debouncedFetch()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to update request')
    } finally {
      setActionLoadingId(null)
    }
  }, [logAudit, debouncedFetch, notify])

  const handleFleetStatusUpdate = async (fleetId: string, newStatus: FleetStatus) => {
    try {
      // Optimistic update
      setData((prev: { requests: RentalRequest[]; fleet: FleetItem[]; stats: DashboardStats | null }) => ({
        ...prev,
        fleet: prev.fleet.map(item => 
          item.id === fleetId ? { ...item, status: newStatus } : item
        )
      }))

      await RentalRequestService.updateFleetStatus(fleetId, newStatus)
      notify.success('Fleet status updated successfully')
      
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
    fetchData,
    debouncedFetch,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
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

// TabContent component
const TabContent = React.memo(function TabContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-hidden transition-opacity duration-200 ease-in-out">
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
});

// Dashboard Content component that uses the context
const DashboardContent = ({ 
  detailsId, 
  setDetailsId, 
  deleteDialog, 
  setDeleteDialog, 
  auditLogLoaded, 
  fetchAuditLog 
}: {
  detailsId: string | null
  setDetailsId: (id: string | null) => void
  deleteDialog: { open: boolean; id: string | null; row: RentalRequest | null }
  setDeleteDialog: (dialog: { open: boolean; id: string | null; row: RentalRequest | null }) => void
  auditLogLoaded: boolean
  fetchAuditLog: () => void
}) => {
  const notify = useNotify();
  const {
    data: { requests, fleet },
    loading,
    lastFetch,
    actionLoadingId,
    tab,
    setTab,
    autoRefreshEnabled,
    refreshInterval,
    realtimeStatus,
    debouncedFetch,
    setActionLoadingId,
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
    const row = requests.find(r => r.id === id) ?? null;
    setDeleteDialog({ open: true, id, row });
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
  }, [deleteDialog, debouncedFetch, notify, setActionLoadingId, setDeleteDialog])

  const handleDirectDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, id: null, row: null })
  }, [setDeleteDialog])

  // Helper function to convert actionLoadingId type
  const getActionLoadingId = (): string | null | undefined => actionLoadingId || undefined

  // Memoize tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    switch (tab) {
      case 'dashboard':
        return (
          <TabContent>
            <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                  <>
                    <DashboardCardSkeleton />
                    <DashboardCardSkeleton />
                    <DashboardCardSkeleton />
                    <DashboardCardSkeleton />
                  </>
                ) : (
                  <>
                    <DashboardCard
                      title="Active Rentals"
                      value={dashboardStats.activeRentals}
                      icon={Truck}
                      description="Currently rented equipment"
                    />
                    <DashboardCard
                      title="Fleet Available"
                      value={dashboardStats.fleetAvailable}
                      icon={CheckCircle}
                      description="Ready for rental"
                    />
                    <DashboardCard
                      title="Fleet In Use"
                      value={dashboardStats.fleetInUse}
                      icon={Clock}
                      description="Currently in use"
                    />
                    <DashboardCard
                      title="Pending Requests"
                      value={dashboardStats.pendingRequests}
                      icon={AlertCircle}
                      description="Awaiting approval"
                    />
                  </>
                )}
              </div>
            </div>
          </TabContent>
        )

      case 'requests':
        return (
          <TabContent>
            <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                        Rental Requests
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          realtimeStatus === 'connected' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' :
                          realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50' :
                          'bg-red-500 shadow-lg shadow-red-500/50'
                        }`} />
                        <span className={`text-sm font-medium ${
                          realtimeStatus === 'connected' ? 'text-green-600' :
                          realtimeStatus === 'connecting' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {realtimeStatus === 'connected' ? 'Live' :
                           realtimeStatus === 'connecting' ? 'Connecting' :
                           'Disconnected'}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                      Manage and track all rental requests in the system with real-time updates and comprehensive controls
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-200/60">
                      <span className="text-gray-600">Last updated:</span>
                      <span className="font-medium text-gray-900">
                        {lastFetch.toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => debouncedFetch(true)}
                      disabled={loading && !getActionLoadingId()}
                      className="h-10 md:h-9 gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                    >
                      <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="space-y-4">
                {loading ? (
                  <DataTableSkeleton />
                ) : (
                  <DataTable
                    data={requests.map((r) => ({
                      id: r.id,
                      date: r.date ?? r.created_at ?? '',
                      requester: r.requester ?? r.user_id ?? '',
                      equipment: typeof r.equipment === 'string' ? r.equipment : r.equipment?.name ?? '',
                      status: r.status,
                      notes: r.notes,
                      start_date: r.start_date,
                      end_date: r.end_date,
                      project_location: r.project_location,
                    }))}
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
                    loading={false}
                    actionLoadingId={getActionLoadingId()}
                    pageSize={10}
                    enablePagination={true}
                    enableColumnVisibility={true}
                    enableBulkActions={true}
                  />
                )}
              </div>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDirectDeleteCancel()}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trash2Icon className="h-5 w-5 text-destructive" />
                      Delete Rental Request
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this rental request? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteDialog.row && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">ID:</span> {deleteDialog.row.id}</div>
                        <div><span className="font-medium">Status:</span> 
                          <Badge variant="outline" className="ml-1">{deleteDialog.row.status}</Badge>
                        </div>
                        <div><span className="font-medium">Equipment:</span> {typeof deleteDialog.row.equipment === 'string' ? deleteDialog.row.equipment : deleteDialog.row.equipment?.name || '-'}</div>
                        <div><span className="font-medium">Requester:</span> {deleteDialog.row.requester || '-'}</div>
                        <div className="md:col-span-2">
                          <span className="font-medium">Date:</span> {deleteDialog.row.date ? new Date(deleteDialog.row.date).toLocaleDateString() : deleteDialog.row.created_at ? new Date(deleteDialog.row.created_at).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleDirectDeleteCancel} className="h-10 md:h-9">
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDirectDeleteConfirm}
                      className="gap-2 h-10 md:h-9"
                    >
                      <Trash2Icon className="h-4 w-4" />
                      Delete Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Details Dialog */}
              <Dialog open={!!detailsId} onOpenChange={open => setDetailsId(open ? detailsId : null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <EyeIcon className="h-5 w-5" />
                      Rental Request Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {requests.filter(r => r.id === detailsId).map((r: RentalRequest) => (
                      <div key={r.id} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Equipment:</span>
                              <span className="text-sm">{typeof r.equipment === 'string' ? r.equipment : r.equipment?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">User:</span>
                              <span className="text-sm">{r.user_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Status:</span>
                              <Badge variant={
                                r.status === "Completed" ? "secondary" :
                                r.status === "Pending" ? "outline" :
                                r.status === "Cancelled" ? "destructive" : "default"
                              }>
                                {r.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Start Date:</span>
                              <span className="text-sm">{new Date(r.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">End Date:</span>
                              <span className="text-sm">{new Date(r.end_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Created:</span>
                              <span className="text-sm">{new Date(r.date || r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="font-medium text-sm">Location:</span>
                          <p className="text-sm bg-muted/50 p-2 rounded">{r.project_location}</p>
                        </div>
                        {r.notes && (
                          <div className="space-y-2">
                            <span className="font-medium text-sm">Notes:</span>
                            <p className="text-sm bg-muted/50 p-2 rounded">{r.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDetailsId(null)} className="h-10 md:h-9">
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabContent>
        )

      case 'fleet':
        return (
          <TabContent>
            <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
              <div className="space-y-4">
                {loading ? (
                  <>
                    <FleetCardSkeleton />
                    <FleetCardSkeleton />
                    <FleetCardSkeleton />
                  </>
                ) : emptyFleet ? (
                  <div className="text-center py-8 text-muted-foreground">No fleet vehicles found.</div>
                ) : (
                  fleet
                    .slice()
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map(eq => (
                      <FleetCard
                        key={eq.id}
                        eq={eq}
                        onStatus={async (id: string, status: FleetStatus) => {
                          setActionLoadingId(id)
                          try {
                            await handleFleetStatusUpdate(id, status)
                          } catch (error) {
                            console.error('Error updating fleet status:', error)
                            notify.error('Error updating fleet status')
                          } finally {
                            setActionLoadingId(null)
                          }
                        }}
                        onDelete={handleFleetDelete}
                        loadingId={getActionLoadingId()}
                      />
                    ))
                )}
              </div>
            </div>
          </TabContent>
        )

      case 'settings':
        return (
          <TabContent>
            <div className="max-w-xl mx-auto px-4 md:px-6 pb-12">
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-primary">Settings</h2>
                <div className="text-muted-foreground text-sm md:text-base">More settings coming soon...</div>
              </div>
            </div>
          </TabContent>
        )

      default:
        return null
    }
  }, [
    tab, loading, requests, fleet, emptyFleet, 
    refreshInterval, autoRefreshEnabled, deleteDialog, detailsId,
    dashboardStats, realtimeStatus,
    handleApprove, handleDecline, handleEdit, handleComplete,
    handleReopen, handleCancel, handleViewDetails, handleBulkApprove, handleBulkDecline,
    handleBulkDelete, handleFleetDelete, debouncedFetch, fetchAuditLog,
    setDetailsId, notify, setActionLoadingId
  ])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" activeTab={tab} onTabChange={setTab} />
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

// After each React.memo definition:
DashboardCard.displayName = 'DashboardCard';
FleetCard.displayName = 'FleetCard';

export default function Page() {
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; row: RentalRequest | null }>({
    open: false,
    id: null,
    row: null,
  });
  const [auditLogLoaded, setAuditLogLoaded] = useState(false);

  const router = useRouter()
  const { loading: authLoading, isAdmin, isAuthenticated } = useAuth()

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
      const { error } = await getSupabaseClient()
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (!error) {
        setAuditLogLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error)
    }
  }, [auditLogLoaded])

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
    <DashboardProvider>
      <DashboardContent 
        detailsId={detailsId}
        setDetailsId={setDetailsId}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        auditLogLoaded={auditLogLoaded}
        fetchAuditLog={fetchAuditLog}
      />
    </DashboardProvider>
  )
}