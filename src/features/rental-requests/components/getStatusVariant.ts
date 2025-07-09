export function getStatusVariant(status: string):
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'available'
  | 'in-use'
  | 'reserved'
  | 'maintenance'
  | undefined {
  switch (status) {
    case 'approved':
    case 'Approved':
      return 'in-use';
    case 'declined':
    case 'Declined':
      return 'maintenance';
    case 'pending':
    case 'Pending':
      return 'reserved';
    case 'completed':
    case 'Completed':
      return 'available';
    case 'cancelled':
    case 'Cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
} 