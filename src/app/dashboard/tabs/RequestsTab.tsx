import React from 'react'
import { DataTable } from "@/features/rental-requests"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, RentalRequest, Button, Badge, Card, CardContent } from "@/features/shared"
import { RefreshCwIcon, Trash2Icon, EyeIcon, ClipboardListIcon } from "lucide-react"
import { DataTableSkeleton } from "@/features/dashboard"
import type { RentalRow } from "@/features/rental-requests/components/data-table";

interface RequestsTabProps {
  loading: boolean
  requests: RentalRequest[]
  lastFetch: Date
  actionLoadingId: string | null
  deleteDialog: { open: boolean; id: string | null; row: RentalRow | null }
  detailsId: string | null
  onRefresh: () => void
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updatedFields: Record<string, unknown>) => Promise<void>
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
  onClearIndexedFilters: () => Promise<void>
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  loading,
  requests,
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
  onClearIndexedFilters
}) => {
  // Dynamic configuration
  const config = {
    title: "Rental Requests",
    description: "Manage and track all rental requests in the system with real-time updates and comprehensive controls",
    pageSize: 10,
    maxWidth: "7xl"
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  const getEquipmentName = (equipment: unknown): string => {
    if (typeof equipment === 'string') return equipment
    if (equipment && typeof equipment === 'object' && 'name' in equipment) {
      return (equipment as { name: string }).name
    }
    return 'Unknown Equipment'
  }

  return (
    <div className={`max-w-${config.maxWidth} w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8`}>
      {/* Modern Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {config.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {requests.length} {requests.length === 1 ? 'Request' : 'Requests'}
                  </Badge>
                  {loading && (
                    <Badge variant="outline" className="text-xs">
                      <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
                      Syncing
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
              {config.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-muted-foreground font-medium">Last sync:</span>
                  </div>
                  <span className="font-mono text-foreground">
                    {formatTime(lastFetch)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              disabled={loading && !actionLoadingId}
              className="h-11 px-6 gap-2 bg-background/80 backdrop-blur-sm border-border/60 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <DataTableSkeleton />
            </div>
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
              pageSize={config.pageSize}
              enablePagination={true}
              enableColumnVisibility={true}
              enableBulkActions={true}
              onClearIndexedFilters={onClearIndexedFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && onDirectDeleteCancel()}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-foreground">Delete Rental Request</span>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  This action cannot be undone
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {deleteDialog.row && (
            <Card className="bg-muted/30 border-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">ID:</span>
                    <span className="font-mono text-foreground">{deleteDialog.row.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <Badge variant="outline">
                      {deleteDialog.row.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Equipment:</span>
                    <span className="text-foreground text-right">{getEquipmentName(deleteDialog.row.equipment)}</span>
                  </div>
                  <div className="flex justify-between sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Requester:</span>
                    <span className="text-foreground text-right">{deleteDialog.row.requester}</span>
                  </div>
                  <div className="flex justify-between sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Date:</span>
                    <span className="text-foreground text-right">{deleteDialog.row.date ? formatDate(deleteDialog.row.date) : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={onDirectDeleteCancel}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDirectDeleteConfirm}
              className="flex-1 sm:flex-none gap-2"
            >
              <Trash2Icon className="h-4 w-4" />
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsId} onOpenChange={open => onSetDetailsId(open ? detailsId : null)}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-md border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <EyeIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-foreground">Rental Request Details</span>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  Complete information and history
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {requests.filter(r => r.id === detailsId).map(r => (
              <div key={r.id} className="space-y-4">
                <Card className="bg-muted/30 border-border/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Request ID:</span>
                        <span className="font-mono text-foreground">{r.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Status:</span>
                        <Badge variant="outline">
                          {r.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between md:col-span-2">
                        <span className="font-medium text-muted-foreground">Equipment:</span>
                        <span className="text-foreground text-right font-medium">{getEquipmentName(r.equipment)}</span>
                      </div>
                      <div className="flex justify-between md:col-span-2">
                        <span className="font-medium text-muted-foreground">Requester:</span>
                        <span className="text-foreground text-right">{r.requester}</span>
                      </div>
                      <div className="flex justify-between md:col-span-2">
                        <span className="font-medium text-muted-foreground">Request Date:</span>
                                                 <span className="text-foreground text-right">{r.date ? formatDate(r.date) : 'N/A'}</span>
                      </div>
                    </div>
                    
                    {r.notes && (
                      <div className="pt-4 border-t border-border/30">
                        <div className="space-y-2">
                          <span className="font-medium text-muted-foreground text-sm">Notes:</span>
                          <p className="text-foreground text-sm leading-relaxed bg-background/50 p-3 rounded-lg border border-border/30">
                            {r.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onSetDetailsId(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RequestsTab 