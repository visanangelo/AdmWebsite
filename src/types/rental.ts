/**
 * Valid statuses for a rental request.
 */
export type RentalRequestStatus = 'Pending' | 'Approved' | 'Declined' | 'Completed' | 'Cancelled';

/**
 * Valid statuses for a fleet item (equipment).
 */
export type FleetStatus = 'Available' | 'In Use' | 'Reserved' | 'Maintenance';

/**
 * Represents a rental request for a piece of equipment.
 */
export interface RentalRequest {
  /** Unique identifier for the request */
  id: string;
  /** User ID of the requester */
  user_id: string;
  /** Equipment ID being requested */
  equipment_id: string;
  /** Start date of the rental period (YYYY-MM-DD) */
  start_date: string;
  /** End date of the rental period (YYYY-MM-DD) */
  end_date: string;
  /** Project location for the rental */
  project_location: string;
  /** Optional notes for the request */
  notes: string;
  /** Status of the request (Pending, Approved, etc.) */
  status: RentalRequestStatus;
  /** Timestamp when the request was created */
  created_at: string;
  /** Embedded equipment info (optional) */
  equipment?: { name: string; status: FleetStatus };
  /** Date string for display (optional) */
  date?: string;
  /** Requester name or ID for display (optional) */
  requester?: string;
}

/**
 * Filters for querying rental requests.
 */
export interface RentalRequestFilters {
  status?: RentalRequestStatus;
  equipment?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Data required to create a new rental request.
 */
export interface CreateRequestData {
  equipment_id: string;
  start_date: string;
  end_date: string;
  project_location: string;
  notes?: string;
}

/**
 * Represents a fleet item (equipment).
 */
export interface FleetItem {
  id: string;
  name: string;
  status: FleetStatus;
} 