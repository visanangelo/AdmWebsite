/**
 * Valid statuses for a rental request.
 */
export type RentalRequestStatus = 'Pending' | 'Approved' | 'Declined' | 'Completed' | 'Cancelled';

/**
 * Valid statuses for fleet items.
 */
export type FleetStatus = 'Available' | 'In Use' | 'Maintenance' | 'Reserved';

/**
 * Represents a rental request for a piece of equipment.
 */
export interface RentalRequest {
  /** Unique identifier for the request */
  id: string;
  /** User ID of the requester */
  user_id: string;
  /** First name of the requester */
  first_name: string;
  /** Last name of the requester */
  last_name: string;
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
  equipment?: { name: string; status: FleetStatus; image?: string };
  /** Date string for display (optional) */
  date?: string;
  /** Requester name or ID for display (optional) */
  requester?: string;
}

/**
 * Filters for querying rental requests.
 */
export interface RentalRequestFilters {
  status?: string;
  equipment?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Data required to create a new rental request.
 */
export interface CreateRequestData {
  /** First name of the requester */
  first_name: string;
  /** Last name of the requester */
  last_name: string;
  /** Equipment ID being requested */
  equipment_id: string;
  /** Start date of the rental period (YYYY-MM-DD) */
  start_date: string;
  /** End date of the rental period (YYYY-MM-DD) */
  end_date: string;
  /** Project location for the rental */
  project_location: string;
  /** Optional notes for the request */
  notes?: string;
}

/**
 * Represents a fleet item (equipment).
 */
export interface FleetItem {
  id: string;
  name: string;
  category: string;
  specs?: string;
  status: FleetStatus;
  year?: number;
  image?: string;
  location?: string;
  created_at?: string;
} 