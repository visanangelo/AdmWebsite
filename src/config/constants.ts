/**
 * Status options for rental requests.
 */
export const RENTAL_REQUEST_STATUSES = [
  'Pending',
  'Approved',
  'Declined',
  'Completed',
  'Cancelled',
] as const;

/**
 * Status options for fleet items.
 */
export const FLEET_STATUSES = [
  'Available',
  'In Use',
  'Reserved',
  'Maintenance',
] as const;

/**
 * Common error messages used throughout the app.
 */
export const ERROR_MESSAGES = {
  requestNotFound: 'Request not found',
  equipmentConflict: 'This equipment is already reserved for the selected dates.',
  notAuthenticated: 'User not authenticated',
  missingFields: 'Missing required fields',
  invalidDate: 'End date must be after start date',
}; 