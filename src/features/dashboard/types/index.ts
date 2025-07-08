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

export interface DashboardState {
  data: {
    requests: import('@/types/rental').RentalRequest[];
    fleet: import('@/types/rental').FleetItem[];
    stats: DashboardStats | null;
  };
  loading: boolean;
  error: string | null;
  lastFetch: Date;
  actionLoadingId: string | null;
  tab: string;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
  realtimeStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface DeleteDialogState {
  open: boolean;
  id: string | null;
  row: any | null;
} 