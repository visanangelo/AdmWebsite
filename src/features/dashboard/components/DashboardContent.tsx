import React, { useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/features/shared/components/layout/app-sidebar"
import { SiteHeader } from "@/features/shared/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/features/shared/components/ui/sidebar"
import { useDashboard } from '../context/DashboardProvider'
import { ActionLoadingOverlay } from './ActionLoadingOverlay'
import RequestsTab from "../../../app/dashboard/tabs/RequestsTab"
import DashboardTab from "../../../app/dashboard/tabs/DashboardTab"
import FleetTab from "../../../app/dashboard/tabs/FleetTab"
import SettingsTab from "../../../app/dashboard/tabs/SettingsTab"
import { DeleteDialogState } from '../types'
import { RentalRequestService } from '@/features/rental-requests'

interface DashboardContentProps {
  detailsId: string | null
  setDetailsId: (id: string | null) => void
  deleteDialog: DeleteDialogState
  setDeleteDialog: (dialog: DeleteDialogState) => void
  auditLogLoaded: boolean
  fetchAuditLog: () => void
  highlightedRequestId?: string | null
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ 
  detailsId, 
  setDetailsId, 
  deleteDialog, 
  setDeleteDialog, 
  auditLogLoaded, 
  fetchAuditLog,
  highlightedRequestId
}) => {
  const {
    data: { requests, fleet },
    loading,
    lastFetch,
    actionLoadingId,
    tab,
    setTab,
    autoRefreshEnabled,
    refreshInterval,
    debouncedFetch,
    setActionLoadingId,
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

  const handleDeleteWrapper = useCallback(async (id: string) => {
    const request = requests.find(r => r.id === id);
    const row = request ? {
      id: request.id,
      date: request.date ?? request.created_at ?? '',
      requester: request.requester ?? request.user_id ?? '',
      first_name: request.first_name,
      last_name: request.last_name,
      equipment: typeof request.equipment === 'string' ? request.equipment : request.equipment?.name ?? '',
      status: request.status,
      notes: request.notes,
      start_date: request.start_date,
      end_date: request.end_date,
      project_location: request.project_location,
    } : null;
    setDeleteDialog({ open: true, id, row });
  }, [requests, setDeleteDialog])

  const handleViewDetails = useCallback(async (id: string) => {
    setDetailsId(id)
  }, [setDetailsId])

  const handleDirectDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.id) return
    
    setActionLoadingId(deleteDialog.id)
    try {
      // Actually delete the request from the database
      await RentalRequestService.deleteRequest(deleteDialog.id)
      setDeleteDialog({ open: false, id: null, row: null })
      
      // Use a small delay for smoother UX
      setTimeout(() => {
        debouncedFetch(true)
      }, 100)
    } catch (error) {
      console.error('Error in delete action:', error)
    } finally {
      setActionLoadingId(null)
    }
  }, [deleteDialog, debouncedFetch, setActionLoadingId, setDeleteDialog])

  const handleDirectDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, id: null, row: null })
  }, [setDeleteDialog])

  // Memoize tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    switch (tab) {
      case 'dashboard':
        return (
          <DashboardTab
            loading={loading}
            dashboardStats={dashboardStats}
          />
        )

      case 'requests':
        return (
          <RequestsTab
            loading={loading}
            requests={requests}
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
            onClearIndexedFilters={async () => {
              // Clear any cached filters and refresh data
              await debouncedFetch(true)
            }}
            highlightedRequestId={highlightedRequestId}
          />
        )

      case 'fleet':
        return (
          <FleetTab
            loading={loading}
            fleet={fleet}
            onFleetDelete={handleFleetDelete}
            onFleetStatusUpdate={handleFleetStatusUpdate}
          />
        )

      case 'settings':
        return (
          <SettingsTab
            autoRefreshEnabled={autoRefreshEnabled}
            refreshInterval={refreshInterval}
            onSetAutoRefreshEnabled={setAutoRefreshEnabled}
            onSetRefreshInterval={setRefreshInterval}
          />
        )

      default:
        return null
    }
  }, [
    tab, loading, requests, fleet, 
    deleteDialog, detailsId,
    dashboardStats,
    handleApprove, handleDecline, handleEdit, handleComplete,
    handleReopen, handleCancel, handleViewDetails, handleBulkApprove, handleBulkDecline,
    handleBulkDelete, handleFleetDelete, debouncedFetch,
    setDetailsId, handleDeleteWrapper, 
    handleDirectDeleteCancel, handleDirectDeleteConfirm, handleFleetStatusUpdate, lastFetch,
    autoRefreshEnabled, refreshInterval, setAutoRefreshEnabled, setRefreshInterval,
    actionLoadingId, highlightedRequestId
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