import React from 'react'
import { DataTable } from "@/features/rental-requests"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/features/shared/components/ui/dialog"
import { RefreshCwIcon, Trash2Icon, EyeIcon } from "lucide-react"
import { RentalRequest } from '@/features/shared'
import DataTableSkeleton from '../components/DataTableSkeleton'
import { Button } from "@/features/shared/components/ui/button";
import { Badge } from "@/features/shared/components/ui/badge";
import type { RentalRow } from "@/features/rental-requests/components/data-table";

interface RequestsTabProps {
  loading: boolean
  requests: RentalRequest[]
  error: string | null
  lastFetch: Date
  actionLoadingId: string | null
  deleteDialog: { open: boolean; id: string | null; row: any | null }
  detailsId: string | null
  onRefresh: () => void
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updatedFields: any) => Promise<void>
  onComplete: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onViewDetails: (id: string) => Promise<void>
  onBulkApprove: (ids: string[]) => Promise<void>
  onBulkDecline: (ids: string[]) => Promise<void>
  onBulkDelete: (ids: string[]) => Promise<void>
  onDirectDeleteConfirm: () => Promise<void>
  onDirectDeleteCancel: () => void
  onSetDetailsId: (id: string | null) => void
  onFilterByUser: (userId: string) => Promise<void>
  onFilterByEquipment: (equipmentId: string) => Promise<void>
  onClearIndexedFilters: () => Promise<void>
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  loading,
  requests,
  error,
  lastFetch,
  actionLoadingId,
  deleteDialog,
  detailsId,
  onRefresh,
  onApprove,
  onDecline,
  onDelete,
  onEdit,
  onComplete,
  onReopen,
  onCancel,
  onViewDetails,
  onBulkApprove,
  onBulkDecline,
  onBulkDelete,
  onDirectDeleteConfirm,
  onDirectDeleteCancel,
  onSetDetailsId,
  onFilterByUser,
  onFilterByEquipment,
  onClearIndexedFilters
}) => {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Rental Requests
              </h2>
            </div>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Manage and track all rental requests in the system with real-time updates and comprehensive controls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-200/60">
              <span className="text-gray-600">Last updated:</span>
              <span className="font-medium text-gray-900">
                {lastFetch.toLocaleTimeString()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading && !actionLoadingId}
              className="h-10 md:h-9 gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="space-y-4">
        {loading ? (
          <DataTableSkeleton />
        ) : (
          <DataTable
            data={requests as unknown as RentalRow[]}
            onApprove={onApprove}
            onDecline={onDecline}
            onDelete={onDelete}
            onEdit={onEdit}
            onComplete={onComplete}
            onReopen={onReopen}
            onCancel={onCancel}
            onViewDetails={onViewDetails}
            onBulkApprove={onBulkApprove}
            onBulkDecline={onBulkDecline}
            onBulkDelete={onBulkDelete}
            loading={false}
            error={error || undefined}
            actionLoadingId={actionLoadingId || undefined}
            pageSize={10}
            enablePagination={true}
            enableColumnVisibility={true}
            enableBulkActions={true}
            onFilterByUser={onFilterByUser}
            onFilterByEquipment={onFilterByEquipment}
            onClearIndexedFilters={onClearIndexedFilters}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && onDirectDeleteCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2Icon className="h-5 w-5 text-destructive" />
              Delete Rental Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rental request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.row && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">ID:</span> {deleteDialog.row.id}</div>
                <div><span className="font-medium">Status:</span> 
                  <Badge variant="outline" className="ml-1">
                    {deleteDialog.row.status || 'Unknown'}
                  </Badge>
                </div>
                <div><span className="font-medium">Equipment:</span> {typeof deleteDialog.row.equipment === 'string' ? deleteDialog.row.equipment : deleteDialog.row.equipment?.name || 'Unknown'}</div>
                <div><span className="font-medium">Requester:</span> {deleteDialog.row.requester}</div>
                <div className="md:col-span-2">
                  <span className="font-medium">Date:</span> {deleteDialog.row.date ? new Date(deleteDialog.row.date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onDirectDeleteCancel} className="h-10 md:h-9">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDirectDeleteConfirm}
              className="gap-2 h-10 md:h-9"
            >
              <Trash2Icon className="h-4 w-4" />
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsId} onOpenChange={open => onSetDetailsId(open ? detailsId : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              Rental Request Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this rental request including status, equipment, and requester details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {requests.filter(r => r.id === detailsId).map(r => (
              <div key={r.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">ID:</span> {r.id}</div>
                  <div><span className="font-medium">Status:</span> 
                    <Badge variant="outline" className="ml-1">
                      {r.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div><span className="font-medium">Equipment:</span> {typeof r.equipment === 'string' ? r.equipment : r.equipment?.name || 'Unknown'}</div>
                  <div><span className="font-medium">Requester:</span> {r.requester}</div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Date:</span> {r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Notes:</span> {r.notes || 'No notes provided'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RequestsTab 