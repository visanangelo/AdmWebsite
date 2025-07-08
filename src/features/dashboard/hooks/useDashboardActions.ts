import { useCallback } from 'react'
import { getSupabaseClient } from "@/features/shared/lib/supabaseClient"
import { useNotify } from '@/features/shared/hooks/useNotify'
import { RentalRequestService } from "@/services/rental-requests"
import { RentalRequest, FleetItem } from '@/types/rental'
import type { FleetStatus } from '@/types/rental'
import { DashboardStats } from '../types'

interface UseDashboardActionsProps {
  data: {
    requests: RentalRequest[]
    fleet: FleetItem[]
    stats: DashboardStats | null
  }
  setData: React.Dispatch<React.SetStateAction<{
    requests: RentalRequest[];
    fleet: FleetItem[];
    stats: DashboardStats | null;
  }>>
  setActionLoadingId: (id: string | null) => void
  debouncedFetch: (isManualRefresh?: boolean) => void
}

export const useDashboardActions = ({
  data,
  setData,
  setActionLoadingId,
  debouncedFetch
}: UseDashboardActionsProps) => {
  const notify = useNotify()

  // Helper functions
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

  // Request action handlers
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
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId, setData])

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
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId, setData])

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
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId, setData])

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
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId, setData])

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
  }, [findRequest, logAudit, debouncedFetch, data, notify, setActionLoadingId, setData])

  // Bulk action handlers
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

  // Fleet action handlers
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
  }, [logAudit, debouncedFetch, notify, setActionLoadingId])

  const handleFleetStatusUpdate = useCallback(async (fleetId: string, newStatus: FleetStatus) => {
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
  }, [setData, notify, debouncedFetch])

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
  }, [logAudit, debouncedFetch, notify, setActionLoadingId])

  return {
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
} 