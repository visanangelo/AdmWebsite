import { useCallback } from 'react';
import { RentalRequestService } from '@/features/rental-requests/services/rental-requests';
import { RentalRequest } from '@/features/shared/types/rental';
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient';

interface DashboardData {
  requests: RentalRequest[];
  fleet: any[];
  stats: any;
}

type SetData = (updater: (prev: DashboardData) => DashboardData) => void;
type FetchData = (isManualRefresh?: boolean) => Promise<void>;
type FindRequest = (id: string) => RentalRequest | undefined;
type LogAudit = (action: string, details?: any) => Promise<void>;

type Handler = (id: string) => Promise<void>;
type BulkHandler = (ids: string[]) => Promise<void>;
type EditHandler = (id: string, updatedFields: any) => Promise<void>;
type FleetStatusHandler = (fleetId: string, newStatus: string) => Promise<void>;

export function useDashboardActions({ setData, fetchData, findRequest, logAudit }: {
  setData: SetData;
  fetchData: FetchData;
  findRequest: FindRequest;
  logAudit: LogAudit;
}) {
  const handleApprove: Handler = useCallback(
    async (id: string) => {
      setData(prev => {
        const req = prev.requests.find(r => r.id === id);
        return {
          ...prev,
          requests: prev.requests.map(r =>
            r.id === id
              ? { ...r, status: 'Approved', updated_at: new Date().toISOString() }
              : r
          ),
          fleet: prev.fleet.map(f =>
            f.id === req?.equipment_id
              ? { ...f, status: 'In Use' }
              : f
          )
        };
      });
      try {
        await RentalRequestService.approveRequest(id);
        await logAudit('Approved rental request', { request_id: id });
        fetchData(true);
      } finally {}
    },
    [setData, fetchData, logAudit]
  );

  const handleDecline: Handler = useCallback(
    async (id: string) => {
      setData(prev => ({
        ...prev,
        requests: prev.requests.map(r =>
          r.id === id
            ? { ...r, status: 'Declined', updated_at: new Date().toISOString() }
            : r
        )
      }));
      try {
        await RentalRequestService.declineRequest(id);
        await logAudit('Declined rental request', { request_id: id });
        fetchData(true);
      } finally {}
    },
    [setData, fetchData, logAudit]
  );

  const handleComplete: Handler = useCallback(
    async (id: string) => {
      setData(prev => {
        const req = prev.requests.find(r => r.id === id);
        return {
          ...prev,
          requests: prev.requests.map(r =>
            r.id === id
              ? { ...r, status: 'Completed', updated_at: new Date().toISOString() }
              : r
          ),
          fleet: prev.fleet.map(f =>
            f.id === req?.equipment_id
              ? { ...f, status: 'Available' }
              : f
          )
        };
      });
      try {
        await RentalRequestService.completeRequest(id);
        await logAudit('Completed rental request', { request_id: id });
        fetchData(true);
      } finally {}
    },
    [setData, fetchData, logAudit]
  );

  const handleReopen: Handler = useCallback(
    async (id: string) => {
      setData(prev => ({
        ...prev,
        requests: prev.requests.map(r =>
          r.id === id
            ? { ...r, status: 'Pending', updated_at: new Date().toISOString() }
            : r
        )
      }));
      try {
        await RentalRequestService.reopenRequest(id);
        await logAudit('Reopened rental request', { request_id: id });
        fetchData(true);
      } finally {}
    },
    [setData, fetchData, logAudit]
  );

  const handleCancel: Handler = useCallback(
    async (id: string) => {
      setData(prev => {
        const req = prev.requests.find(r => r.id === id);
        return {
          ...prev,
          requests: prev.requests.map(r =>
            r.id === id
              ? { ...r, status: 'Cancelled', updated_at: new Date().toISOString() }
              : r
          ),
          fleet: prev.fleet.map(f =>
            f.id === req?.equipment_id
              ? { ...f, status: 'Available' }
              : f
          )
        };
      });
      try {
        await RentalRequestService.cancelRequest(id);
        await logAudit('Cancelled rental request', { request_id: id });
        fetchData(true);
      } finally {}
    },
    [setData, fetchData, logAudit]
  );

  const handleBulkApprove: BulkHandler = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => handleApprove(id)));
      fetchData(true);
    },
    [handleApprove, fetchData]
  );

  const handleBulkDecline: BulkHandler = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => handleDecline(id)));
      fetchData(true);
    },
    [handleDecline, fetchData]
  );

  const handleBulkDelete: BulkHandler = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => RentalRequestService.deleteRequest(id)));
      fetchData(true);
    },
    [fetchData]
  );

  const handleFleetDelete: Handler = useCallback(
    async (id: string) => {
      const { error } = await getSupabaseClient().from('fleet').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await logAudit('Deleted fleet item', { fleet_id: id });
      fetchData(true);
    },
    [fetchData, logAudit]
  );

  const handleEdit: EditHandler = useCallback(
    async (id: string, updatedFields: any) => {
      const { error } = await getSupabaseClient().from('rental_requests').update(updatedFields).eq('id', id);
      if (error) throw new Error(error.message);
      await logAudit('Edited rental request', { request_id: id, updated_fields: updatedFields });
      fetchData(true);
    },
    [fetchData, logAudit]
  );

  const handleFleetStatusUpdate: FleetStatusHandler = useCallback(
    async (fleetId: string, newStatus: string) => {
      setData(prev => ({
        ...prev,
        fleet: prev.fleet.map(item =>
          item.id === fleetId ? { ...item, status: newStatus } : item
        )
      }));
      await RentalRequestService.updateFleetStatus(fleetId, newStatus);
      await logAudit('Updated fleet status', { fleet_id: fleetId, new_status: newStatus });
      fetchData(true);
    },
    [setData, fetchData, logAudit]
  );

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
    handleEdit,
    handleFleetStatusUpdate,
  };
} 