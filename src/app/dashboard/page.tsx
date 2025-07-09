"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient, useAuth } from "@/features/shared"
import { RentalRequestService } from "@/features/rental-requests"
import { DashboardProvider, DashboardContent } from "@/features/dashboard"
import { DeleteDialogState } from "@/features/dashboard/types"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function Page() {
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    id: null,
    row: null,
  });
  const [auditLogLoaded, setAuditLogLoaded] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);

  const router = useRouter()
  const searchParams = useSearchParams()
  const { loading: authLoading, isAdmin, isAuthenticated } = useAuth()

  // Handle URL parameters for highlighting requests
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedRequestId(highlightId);
      // Clear the highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedRequestId(null);
        // Remove highlight from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHighlightedRequestId(null);
    }
  }, [searchParams]);

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
          <p className="text-muted-foreground">Rental request service is not available. Please refresh the page.</p>
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
          <p className="text-muted-foreground">Some rental request service methods are missing. Please contact support.</p>
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
        highlightedRequestId={highlightedRequestId}
      />
    </DashboardProvider>
  )
}