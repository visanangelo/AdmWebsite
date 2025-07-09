// Rental request validation utilities
import { CreateRequestData } from '@/features/shared/types/rental'

/**
 * Validates that all required fields are present in the rental request data.
 * @param data Partial rental request data
 * @returns Error message if missing fields, otherwise null
 */
export function validateRequiredFields(data: Partial<CreateRequestData>): string | null {
  if (!data.first_name || !data.last_name || !data.equipment_id || !data.start_date || !data.end_date || !data.project_location) {
    return 'Missing required fields: first name, last name, equipment, start date, end date, and project location are required';
  }
  return null;
}

/**
 * Validates that the end date is after the start date.
 * @param start Start date (YYYY-MM-DD)
 * @param end End date (YYYY-MM-DD)
 * @returns Error message if invalid, otherwise null
 */
export function validateDateRange(start: string, end: string): string | null {
  if (new Date(end) < new Date(start)) {
    return 'End date must be after start date';
  }
  return null;
} 