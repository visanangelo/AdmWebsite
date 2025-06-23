"use client"

import '../../../styles/dashboard-theme.css'
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useNotify } from '@/hooks/useNotify'
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import { RentalRequestService } from "@/services/rental-requests"
import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Truck, CheckCircle, Clock, AlertCircle, RefreshCwIcon, Trash2Icon, EyeIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RentalRequest, FleetItem } from '@/types/rental'

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// Memoized FleetCard component for better performance
const FleetCard = React.memo(function FleetCard({ eq, onStatus, onDelete, loadingId }: {
  eq: FleetItem
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  loadingId?: string | null | undefined
}) {
  const isLoading = loadingId === eq.id
  const statusColors = {
    "Available": "bg-green-100 text-green-800 border-green-200",
    "In Use": "bg-blue-100 text-blue-800 border-blue-200",
    "Reserved": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Maintenance": "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary mb-2">{eq.name}</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[eq.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
              {eq.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={eq.status}
            onChange={(e) => onStatus(eq.id, e.target.value)}
            disabled={isLoading}
            className="text-sm border-input rounded-md px-2 py-1 bg-background focus:ring-2 focus:ring-ring"
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(eq.id)}
            disabled={isLoading}
          >
            {isLoading ? <span className="animate-spin">⏳</span> : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
})

// Custom hook for data fetching with React Query patterns
const useDataFetching = () => {
  const notify = useNotify();
  const [data, setData] = useState<{
    requests: RentalRequest[]
    fleet: any[]
    stats: any
  }>({ requests: [], fleet: [], stats: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())
  const loadingRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async (isManualRefresh = false) => {
    console.log('fetchData called, isManualRefresh:', isManualRefresh)
    if (loadingRef.current && !isManualRefresh) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      if (isManualRefresh && RentalRequestService && typeof RentalRequestService.clearCache === 'function') {
        RentalRequestService.clearCache()
      }
      
      console.log('Fetching data from services...')
      const [requestsResult, fleetResult, statsResult] = await Promise.all([
        RentalRequestService.fetchRequests(1, 100),
        RentalRequestService.fetchFleet(),
        RentalRequestService.fetchDashboardStats()
      ])

      console.log('Requests result:', requestsResult)
      console.log('Fleet result:', fleetResult)
      console.log('Stats result:', statsResult)

      if (requestsResult.error) setError(requestsResult.error)
      if (fleetResult.error) setError(fleetResult.error)
      if (statsResult.error) setError(statsResult.error)

      const newData = {
        requests: requestsResult.data || [],
        fleet: fleetResult.data || [],
        stats: statsResult.data
      }
      
      console.log('Setting new data:', newData)
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
  }, [])

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
    }
  }, [])

  // Initial data fetch on mount
  useEffect(() => {
    console.log('DashboardProvider: Initial data fetch')
    fetchData()
  }, [fetchData])

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
  const [refreshInterval, setRefreshInterval] = useState(30000)

  // Use the data fetching hook
  const { data, loading, error, lastFetch, fetchData, debouncedFetch, setData, notify } = useDataFetching()

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

  const createActionHandler = useCallback((actionType: string, serviceMethod: (id: string) => Promise<void>, successMessage: string) => {
    return async (id: string) => {
      setActionLoadingId(id)
      try {
        const req = findRequest(id)
        
        // Validate service method exists
        if (!serviceMethod || typeof serviceMethod !== 'function') {
          throw new Error(`Service method for ${actionType} is not available`)
        }
        
        await serviceMethod(id)
        notify.success(successMessage)
        
        await logAudit(`${actionType} rental request`, {
          request_id: id,
          equipment_id: req?.equipment_id,
          equipment_name: req?.equipment?.name,
          request_user_id: req?.user_id
        })
        
        // Use a small delay for smoother UX
        setTimeout(() => {
          debouncedFetch()
        }, 100)
      } catch (error) {
        console.error(`Error in ${actionType} action:`, error)
        notify.error(error instanceof Error ? error.message : `Failed to ${actionType.toLowerCase()} request`)
      } finally {
        setActionLoadingId(null)
      }
    }
  }, [findRequest, logAudit, debouncedFetch])

  const handleApprove = useCallback(async (id: string) => {
    setActionLoadingId(id)
    try {
      const req = findRequest(id)
      if (!req) {
        notify.error('Request not found')
        return
      }
      
      const conflicts = data.requests.some(r =>
        r.equipment_id === req.equipment_id &&
        r.status === "Approved" &&
        ((req.start_date <= r.end_date) && (req.end_date >= r.start_date))
      )
      if (conflicts) {
        notify.error("This equipment is already reserved for the selected dates.")
        return
      }

      // Validate service exists
      if (!RentalRequestService || typeof RentalRequestService.approveRequest !== 'function') {
        throw new Error('RentalRequestService is not available')
      }

      await RentalRequestService.approveRequest(id)
      await getSupabaseClient().from("fleet").update({ status: "Reserved" }).eq("id", req.equipment_id)
      await logAudit("Approved rental request", {
        request_id: id,
        equipment_id: req.equipment_id,
        equipment_name: req.equipment?.name,
        request_user_id: req.user_id
      })
      notify.success("Request approved and equipment reserved!")
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        debouncedFetch()
      }, 100)
    } catch (error) {
      // Only show error toast if an error actually occurred
      console.error('Error in approve action:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to approve request')
    } finally {
      setActionLoadingId(null)
    }
  }, [findRequest, data.requests, logAudit, debouncedFetch])

  const handleDecline = useCallback(
    createActionHandler('Declined', 
      (id: string) => {
        if (!RentalRequestService || typeof RentalRequestService.declineRequest !== 'function') {
          throw new Error('RentalRequestService.declineRequest is not available')
        }
        return RentalRequestService.declineRequest(id)
      }, 
      'Request declined.'
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
      'Request marked as completed.'
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
      'Request reopened.'
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
      'Request cancelled.'
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
      debouncedFetch()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to delete fleet item')
    } finally {
      setActionLoadingId(null)
    }
  }, [logAudit, debouncedFetch])

  const handleEdit = useCallback(async (id: string, updatedFields: any) => {
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
  }, [logAudit, debouncedFetch])

  const contextValue = {
    data,
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
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
    fetchData,
    debouncedFetch,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    handleApprove,
    handleDecline,
    handleComplete,
    handleReopen,
    handleCancel,
    handleBulkApprove,
    handleBulkDecline,
    handleBulkDelete,
    handleFleetDelete,
    handleEdit
  } = useDashboard()

  // Performance monitoring
  const logPerformance = useCallback((operation: string, duration: number) => {
    console.log(`Performance: ${operation} took ${duration}ms`)
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      debouncedFetch()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, refreshInterval, debouncedFetch])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Load audit log when tab changes
  useEffect(() => {
    if (tab === 'audit' && !auditLogLoaded) {
      fetchAuditLog()
    }
  }, [tab, auditLogLoaded, fetchAuditLog])

  const emptyFleet = fleet.length === 0
  const activeRentals = requests.filter(r => r.status === 'Approved').length
  const fleetAvailable = fleet.filter(f => f.status === 'Available').length
  const fleetInUse = fleet.filter(f => f.status === 'In Use').length
  const pendingRequests = requests.filter(r => r.status === 'Pending').length

  // Add debugging
  console.log('Dashboard data:', { requests, fleet, activeRentals, fleetAvailable, fleetInUse, pendingRequests })

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
    { key: "dashboard", label: "Dashboard" },
    { key: "requests", label: "Requests" },
    { key: "fleet", label: "Fleet" },
    { key: "settings", label: "Settings" },
  ]

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTab = searchParams.get("tab") || "dashboard";

  // Sync tab state with URL
  useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`/dashboard?tab=${value}`);
  };

  // Fetch data on mount and when tab changes
  useEffect(() => {
    fetchData();
  }, [fetchData, tab]);

  const tabContent = useMemo(() => {
    switch (tab) {
      case 'dashboard':
        return (
          <TabContent tabKey="dashboard">
            <div className="max-w-7xl w-full mx-auto px-4 pb-12">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeRentals}</div>
                    <p className="text-xs text-muted-foreground">Currently rented equipment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fleet Available</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fleetAvailable}</div>
                    <p className="text-xs text-muted-foreground">Ready for rental</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fleet In Use</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fleetInUse}</div>
                    <p className="text-xs text-muted-foreground">Currently in use</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabContent>
        )

      case 'requests':
        return (
          <TabContent tabKey="requests">
            <div className="max-w-7xl w-full mx-auto px-4 pb-12">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Rental Requests</h2>
                    <p className="text-muted-foreground">
                      Manage and track all rental requests in the system
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => debouncedFetch(true)}
                      disabled={loading}
                    >
                      {loading && !getActionLoadingId() ? (
                        <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="space-y-4">
                <DataTable
                  data={requests as any}
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
                  loading={loading}
                  error={error || undefined}
                  actionLoadingId={getActionLoadingId()}
                  pageSize={10}
                  enablePagination={true}
                  enableColumnVisibility={true}
                  enableBulkActions={true}
                />
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
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">ID:</span> {deleteDialog.row.id}</div>
                        <div><span className="font-medium">Status:</span> 
                          <Badge variant="outline" className="ml-1">{deleteDialog.row.status}</Badge>
                        </div>
                        <div><span className="font-medium">Equipment:</span> {deleteDialog.row.equipment}</div>
                        <div><span className="font-medium">Requester:</span> {deleteDialog.row.requester}</div>
                        <div className="col-span-2">
                          <span className="font-medium">Date:</span> {new Date(deleteDialog.row.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleDirectDeleteCancel}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDirectDeleteConfirm}
                      className="gap-2"
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
                    {requests.filter(r => r.id === detailsId).map(r => (
                      <div key={r.id} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Equipment:</span>
                              <span className="text-sm">{typeof r.equipment === 'string' ? r.equipment : r.equipment?.name || "-"}</span>
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
                    <Button variant="outline" onClick={() => setDetailsId(null)}>
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
          <TabContent tabKey="fleet">
            <div className="max-w-7xl w-full mx-auto px-4 pb-12">
              <div className="space-y-4">
                {loading ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
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
                        onStatus={async (id: string, status: string) => {
                          setActionLoadingId(id)
                          try {
                            if (!RentalRequestService || typeof RentalRequestService.updateFleetStatus !== 'function') {
                              throw new Error('RentalRequestService.updateFleetStatus is not available')
                            }
                            
                            await RentalRequestService.updateFleetStatus(id, status)
                            notify.success(`Fleet status updated to ${status}`)
                            
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
                                      fleet_id: id,
                                      new_status: status
                                    }
                                  }
                                ])
                              }
                            } catch (auditError) {
                              console.error('Failed to log audit:', auditError)
                            }
                            
                            // Use a small delay for smoother UX
                            setTimeout(() => {
                              debouncedFetch()
                            }, 100)
                          } catch (error) {
                            console.error('Error in fleet status update:', error)
                            notify.error(error instanceof Error ? error.message : 'Failed to update fleet status')
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
          <TabContent tabKey="settings">
            <div className="max-w-xl mx-auto px-4 pb-12">
              <div className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-xl font-bold mb-4 text-primary">Settings</h2>
                <div className="text-muted-foreground">More settings coming soon...</div>
              </div>
            </div>
          </TabContent>
        )

      default:
        return null
    }
  }, [
    tab, loading, getActionLoadingId(), requests, fleet, emptyFleet, 
    refreshInterval, autoRefreshEnabled, deleteDialog, detailsId,
    activeRentals, fleetAvailable, fleetInUse, pendingRequests,
    handleApprove, handleDecline, handleEdit, handleComplete,
    handleReopen, handleCancel, handleViewDetails, handleBulkApprove, handleBulkDecline,
    handleBulkDelete, handleFleetDelete, debouncedFetch, logPerformance, fetchAuditLog,
    setAuditOpen, setRefreshInterval, setAutoRefreshEnabled, setDetailsId, TabContent
  ])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" activeTab={tab} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {tab === "dashboard" && (
                <TabContent tabKey="dashboard">
                  <div className="max-w-7xl w-full mx-auto px-4 pb-12">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                          <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{activeRentals}</div>
                          <p className="text-xs text-muted-foreground">Currently rented equipment</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Fleet Available</CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{fleetAvailable}</div>
                          <p className="text-xs text-muted-foreground">Ready for rental</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Fleet In Use</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{fleetInUse}</div>
                          <p className="text-xs text-muted-foreground">Currently in use</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{pendingRequests}</div>
                          <p className="text-xs text-muted-foreground">Awaiting approval</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabContent>
              )}
              {tab === "requests" && (
                <TabContent tabKey="requests">
                  <div className="max-w-7xl w-full mx-auto px-4 pb-12">
                    {/* Header Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight">Rental Requests</h2>
                          <p className="text-muted-foreground">
                            Manage and track all rental requests in the system
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => debouncedFetch(true)}
                            disabled={loading}
                          >
                            {loading && !getActionLoadingId() ? (
                              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCwIcon className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Data Table Section */}
                    <div className="space-y-4">
                      <DataTable
                        data={requests as any}
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
                        loading={loading}
                        error={error || undefined}
                        actionLoadingId={getActionLoadingId()}
                        pageSize={10}
                        enablePagination={true}
                        enableColumnVisibility={true}
                        enableBulkActions={true}
                      />
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
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-medium">ID:</span> {deleteDialog.row.id}</div>
                              <div><span className="font-medium">Status:</span> 
                                <Badge variant="outline" className="ml-1">{deleteDialog.row.status}</Badge>
                              </div>
                              <div><span className="font-medium">Equipment:</span> {deleteDialog.row.equipment}</div>
                              <div><span className="font-medium">Requester:</span> {deleteDialog.row.requester}</div>
                              <div className="col-span-2">
                                <span className="font-medium">Date:</span> {new Date(deleteDialog.row.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter className="gap-2">
                          <Button variant="outline" onClick={handleDirectDeleteCancel}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDirectDeleteConfirm}
                            className="gap-2"
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
                          {requests.filter(r => r.id === detailsId).map(r => (
                            <div key={r.id} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">Equipment:</span>
                                    <span className="text-sm">{typeof r.equipment === 'string' ? r.equipment : r.equipment?.name || "-"}</span>
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
                          <Button variant="outline" onClick={() => setDetailsId(null)}>
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabContent>
              )}
              {tab === "fleet" && (
                <TabContent tabKey="fleet">
                  <div className="max-w-7xl w-full mx-auto px-4 pb-12">
                    <div className="space-y-4">
                      {loading ? (
                        <Skeleton className="h-32 w-full rounded-xl" />
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
                              onStatus={async (id: string, status: string) => {
                                setActionLoadingId(id)
                                try {
                                  if (!RentalRequestService || typeof RentalRequestService.updateFleetStatus !== 'function') {
                                    throw new Error('RentalRequestService.updateFleetStatus is not available')
                                  }
                                  
                                  await RentalRequestService.updateFleetStatus(id, status)
                                  notify.success(`Fleet status updated to ${status}`)
                                  
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
                                            fleet_id: id,
                                            new_status: status
                                          }
                                        }
                                      ])
                                    }
                                  } catch (auditError) {
                                    console.error('Failed to log audit:', auditError)
                                  }
                                  
                                  // Use a small delay for smoother UX
                                  setTimeout(() => {
                                    debouncedFetch()
                                  }, 100)
                                } catch (error) {
                                  console.error('Error in fleet status update:', error)
                                  notify.error(error instanceof Error ? error.message : 'Failed to update fleet status')
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
              )}
              {tab === "settings" && (
                <TabContent tabKey="settings">
                  <div className="max-w-xl mx-auto px-4 pb-12">
                    <div className="bg-card p-8 rounded-xl border border-border">
                      <h2 className="text-xl font-bold mb-4 text-primary">Settings</h2>
                      <div className="text-muted-foreground">More settings coming soon...</div>
                    </div>
                  </div>
                </TabContent>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// TabContent component
const TabContent = ({ children, tabKey }: { children: React.ReactNode; tabKey: string }) => (
  <motion.div
    key={tabKey}
    initial={{ opacity: 0, x: 64 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -64 }}
    transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.35 }}
    className="will-change-transform"
  >
    {children}
  </motion.div>
)

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
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

  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data }) => {
      const isAdmin = !!data.user && data.user.user_metadata?.role === "admin"
      setIsAdmin(isAdmin)
      setAuthChecked(true)
      if (!isAdmin) {
        router.replace("/login")
      }
    })
  }, [])

  async function fetchAuditLog() {
    if (auditLogLoaded) return; // Skip if already loaded
    
    try {
      const { data, error } = await getSupabaseClient()
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (!error) {
        setAuditLog(data || [])
        setAuditLogLoaded(true)
      }
    } catch (error) {
      console.error('Failed to load audit log:', error)
    }
  }

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

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><span className="animate-spin text-2xl">⏳</span></div>
  }

  if (!isAdmin) {
    return null
  }

  return (
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
  )
}