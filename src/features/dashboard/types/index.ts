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

import type { RentalRow } from '@/features/rental-requests/components/data-table'

export interface DeleteDialogState {
  open: boolean;
  id: string | null;
  row: RentalRow | null;
} 