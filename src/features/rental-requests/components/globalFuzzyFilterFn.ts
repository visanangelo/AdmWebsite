import type { Row } from '@tanstack/react-table';
import type { RentalRow } from './data-table';

export function globalFuzzyFilterFn(row: Row<RentalRow>, columnId: string, filterValue: string): boolean {
  // Search across all visible string columns
  const values = Object.values(row.original)
    .filter(v => typeof v === 'string')
    .map(v => (v as string).toLowerCase());
  return values.some(v => v.includes(filterValue.toLowerCase()));
} 