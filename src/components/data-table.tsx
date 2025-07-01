"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row as TanstackRow,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import {
  MoreVerticalIcon,
  SearchIcon,
  X,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpDown,
  CheckCircleIcon,
  XCircleIcon,
  Trash2Icon,
  EditIcon,
  EyeIcon,
  RotateCcwIcon,
  BanIcon,
  AlertCircleIcon,
  DownloadIcon,
  RefreshCwIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useCallback, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { ActionButtons } from './ActionButtons'
import { useIsMobile } from "@/hooks/use-mobile"

// Rename local Row interface to RentalRow
interface RentalRow {
  id: string
  date: string
  requester: string
  equipment: string
  status: string
  notes?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

// interface DataTableProps
interface DataTableProps {
  data: RentalRow[]
  onApprove?: (id: string) => Promise<void>
  onDecline?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string, updatedFields: any) => Promise<void>
  onComplete?: (id: string) => Promise<void>
  onReopen?: (id: string) => Promise<void>
  onReminder?: (id: string) => Promise<void>
  onViewDetails?: (id: string) => Promise<void>
  onCancel?: (id: string) => Promise<void>
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkApprove?: (ids: string[]) => Promise<void>
  onBulkDecline?: (ids: string[]) => Promise<void>
  onRefresh?: () => Promise<void>
  onExport?: (data: RentalRow[]) => void
  loading?: boolean
  error?: string
  actionLoadingId?: string | null | undefined
  pageSize?: number
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  enableBulkActions?: boolean
}

// Loading skeleton for table rows
function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// Bulk Actions Component
function BulkActions({ 
  selectedRows, 
  onBulkDelete, 
  onBulkApprove, 
  onBulkDecline,
  onClearSelection 
}: { 
  selectedRows: string[]
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkApprove?: (ids: string[]) => Promise<void>
  onBulkDecline?: (ids: string[]) => Promise<void>
  onClearSelection: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleBulkAction = async (action: (ids: string[]) => Promise<void>) => {
    if (!action) return
    setIsLoading(true)
    try {
      await action(selectedRows)
      toast.success(`Bulk action completed for ${selectedRows.length} items`)
      onClearSelection()
    } catch (error) {
      toast.error('Bulk action failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedRows.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md border border-gray-200">
      <span className="text-sm font-medium text-gray-800">
        {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-1">
        {onBulkApprove && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction(onBulkApprove)}
            disabled={isLoading}
            className="h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Approve All
          </Button>
        )}
        {onBulkDecline && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction(onBulkDecline)}
            disabled={isLoading}
            className="h-8 bg-red-50 hover:bg-red-100 border-red-200 text-red-800"
          >
            <XCircleIcon className="h-4 w-4 mr-1" />
            Decline All
          </Button>
        )}
        {onBulkDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkAction(onBulkDelete)}
            disabled={isLoading}
            className="h-8"
          >
            <Trash2Icon className="h-4 w-4 mr-1" />
            Delete All
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="h-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// DataTable Toolbar Component - Memoized for better performance
const DataTableToolbar = React.memo(({ 
  table, 
  onRefresh, 
  onExport, 
  data,
  enableColumnVisibility = true,
  columnFilters,
  setColumnFilters,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  globalFilter,
  setGlobalFilter
}: { 
  table: any
  onRefresh?: () => Promise<void>
  onExport?: (data: RentalRow[]) => void
  data: RentalRow[]
  enableColumnVisibility?: boolean
  columnFilters: ColumnFiltersState
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  globalFilter: string
  setGlobalFilter: (v: string) => void
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isMobile = useIsMobile()

  const clearFilters = useCallback(() => {
    setColumnFilters([])
    table.setGlobalFilter("")
    setDateFrom("")
    setDateTo("")
  }, [setColumnFilters, table, setDateFrom, setDateTo])

  useEffect(() => {
    if (dateFrom || dateTo) {
      setColumnFilters((prev) => [
        ...prev.filter((f: any) => f.id !== "start_date"),
        { id: "start_date", value: { from: dateFrom ? new Date(dateFrom) : undefined, to: dateTo ? new Date(dateTo) : undefined } }
      ])
    } else {
      setColumnFilters((prev) => prev.filter((f: any) => f.id !== "start_date"))
    }
  }, [dateFrom, dateTo, setColumnFilters])

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  const handleExport = useCallback(() => {
    if (!onExport) return
    onExport(data)
  }, [onExport, data])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 w-full md:w-[300px] h-10 md:h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-10 md:h-9 w-full md:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
        
        <div className="flex items-center justify-between md:justify-end space-x-2">
          <div className="flex items-center space-x-1">
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="h-10 w-10 md:h-8 md:w-8 p-0 touch-manipulation"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Data</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onExport && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="h-10 w-10 md:h-8 md:w-8 p-0 touch-manipulation"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export Data</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 md:h-8 md:w-8 p-0 touch-manipulation">
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table.getAllColumns()
                    .filter((column: any) => column.getCanHide())
                    .map((column: any) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="text-sm text-muted-foreground hidden md:block">
            {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} requests
          </div>
        </div>
      </div>
      
      {/* Mobile summary */}
      <div className="md:hidden text-sm text-muted-foreground text-center">
        {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} requests
      </div>
      
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:space-x-2">
          <Label htmlFor="dateFrom" className="text-sm font-medium">Date From:</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full md:w-[150px] h-10"
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:space-x-2">
          <Label htmlFor="dateTo" className="text-sm font-medium">Date To:</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full md:w-[150px] h-10"
          />
        </div>
      </div>
    </div>
  )
})

DataTableToolbar.displayName = 'DataTableToolbar'

// Sortable header component
function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-2 font-normal"
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ChevronUpIcon className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}

// Pagination Component
function DataTablePagination({ table, pagination, setPagination }: { table: any, pagination: { pageIndex: number, pageSize: number }, setPagination: (p: { pageIndex: number, pageSize: number }) => void }) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground text-center md:text-left">
        Page {pagination.pageIndex + 1} of {table.getPageCount()}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:space-x-6 lg:space-x-8">
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            open={open}
            onOpenChange={setOpen}
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              setPagination({ ...pagination, pageSize: Number(value), pageIndex: 0 });
              setOpen(false);
            }}
          >
            <SelectTrigger className="h-10 md:h-8 w-[80px] md:w-[70px]">
              <SelectValue>{pagination.pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full md:w-[100px] items-center justify-center text-sm font-medium">
          Page {pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <Button
            variant="outline"
            className="hidden h-10 w-10 md:h-8 md:w-8 p-0 lg:flex touch-manipulation"
            onClick={() => setPagination({ ...pagination, pageIndex: 0 })}
            disabled={pagination.pageIndex === 0}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-10 w-10 md:h-8 md:w-8 p-0 touch-manipulation"
            onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
            disabled={pagination.pageIndex === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-10 w-10 md:h-8 md:w-8 p-0 touch-manipulation"
            onClick={() => setPagination({ ...pagination, pageIndex: Math.min(table.getPageCount() - 1, pagination.pageIndex + 1) })}
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-10 w-10 md:h-8 md:w-8 p-0 lg:flex touch-manipulation"
            onClick={() => setPagination({ ...pagination, pageIndex: table.getPageCount() - 1 })}
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Quick Action Buttons Component - Memoized for better performance
const QuickActions = React.memo(({ row, onAction, actionLoadingId }: { 
  row: RentalRow; 
  onAction: (action: string, id: string) => void;
  actionLoadingId: string | null | undefined;
}) => {
  const { status, id } = row
  const isLoading = actionLoadingId === id

  const actions = [];
  if (status === 'Pending') {
    actions.push(
      {
        label: 'Approve',
        onClick: () => onAction('Approve', id),
        icon: CheckCircleIcon,
        colorClass: 'bg-green-100 text-green-800 hover:bg-green-200',
        disabled: isLoading,
      },
      {
        label: 'Decline',
        onClick: () => onAction('Decline', id),
        icon: XCircleIcon,
        colorClass: 'bg-red-100 text-red-800 hover:bg-red-200',
        disabled: isLoading,
      }
    );
  } else if (status === 'Approved') {
    actions.push({
      label: 'Complete',
      onClick: () => onAction('Complete', id),
      icon: CheckCircleIcon,
      colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      disabled: isLoading
    });
    actions.push({
      label: 'Cancel',
      onClick: () => onAction('Cancel', id),
      icon: BanIcon,
      colorClass: 'bg-red-100 text-red-800 hover:bg-red-200',
      disabled: isLoading
    });
  } else if (status === 'Completed' || status === 'Cancelled' || status === 'Declined') {
    actions.push({
      label: 'Reopen',
      onClick: () => onAction('Reopen', id),
      icon: RotateCcwIcon,
      colorClass: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      disabled: isLoading,
    });
  }

  return <ActionButtons actions={actions} />;
})

QuickActions.displayName = 'QuickActions'

// Remove globalStringFilterFn, only keep globalFuzzyFilterFn with types:
function globalFuzzyFilterFn(row: Row<any>, columnId: string, filterValue: string) {
  // Search across all visible string columns
  const values = Object.values(row.original)
    .filter(v => typeof v === 'string')
    .map(v => (v as string).toLowerCase());
  return values.some(v => v.includes(filterValue.toLowerCase()));
}

export function DataTable({
  data = [],
  onApprove,
  onDecline,
  onDelete,
  onEdit,
  onComplete,
  onReopen,
  onReminder,
  onViewDetails,
  onCancel,
  onBulkDelete,
  onBulkApprove,
  onBulkDecline,
  onRefresh,
  onExport,
  loading,
  error,
  actionLoadingId,
  pageSize: propPageSize = 10,
  enablePagination = true,
  enableColumnVisibility = true,
  enableBulkActions = true,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [pagination, setPagination] = useState(() => ({ pageIndex: 0, pageSize: 10 }))

  // Memoized action handler to prevent unnecessary re-renders
  const handleAction = useCallback(async (
    action: (id: string, ...args: any[]) => Promise<void>,
    id: string,
    actionName: string,
    ...args: any[]
  ) => {
    try {
      await action(id, ...args)
      // Do not show toast here; let parent handler show notifications
    } catch (err) {
      // Do not show toast here; let parent handler show notifications
    }
  }, [])

  const handleViewDetails = useCallback(async (id: string) => {
    if (onViewDetails) {
      await onViewDetails(id)
    }
  }, [onViewDetails])

  // Memoized quick action handler
  const handleQuickAction = useCallback(async (action: string, id: string) => {
    const row = data.find(r => r.id === id)
    if (!row) return

    switch (action) {
      case 'ViewDetails':
        await handleViewDetails(id)
        break
      case 'Approve':
        if (onApprove) {
          await handleAction(onApprove, id, "Approve")
        }
        break
      case 'Decline':
        if (onDecline) {
          await handleAction(onDecline, id, "Decline")
        }
        break
      case 'Complete':
        if (onComplete) {
          await handleAction(onComplete, id, "Complete")
        }
        break
      case 'Reopen':
        if (onReopen) {
          await handleAction(onReopen, id, "Reopen")
        }
        break
      case 'Cancel':
        if (onCancel) {
          await handleAction(onCancel, id, "Cancel")
        }
        break
      case 'Edit':
        if (onEdit) {
          await onEdit(id, {})
        }
        break
      case 'Reminder':
        if (onReminder) {
          await handleAction(onReminder, id, "Reminder")
        }
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }, [data, onApprove, onDecline, onComplete, onReopen, onCancel, onEdit, onReminder, handleAction, handleViewDetails])

  const handleClearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  // Memoized selected row IDs
  const selectedRowIds = useMemo(() => {
    return Object.keys(rowSelection).map((index) => {
      const rowIndex = parseInt(index)
      return data[rowIndex]?.id
    }).filter(Boolean) as string[]
  }, [rowSelection, data])

  // Memoized columns definition for better performance
  const columns: ColumnDef<RentalRow>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "id",
      header: ({ column }) => <SortableHeader column={column}>ID</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <span className="font-mono text-sm font-medium">{row.getValue("id")}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => <SortableHeader column={column}>Start Date</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const startDate = row.getValue("start_date");
        return (
          <span className="whitespace-nowrap text-sm">
            {typeof startDate === 'string' ? new Date(startDate).toLocaleDateString() : ''}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        const date = new Date(row.getValue(id))
        const from = value.from
        const to = value.to
        if (from && to) {
          return date >= from && date <= to
        } else if (from) {
          return date >= from
        } else if (to) {
          return date <= to
        }
        return true
      },
      size: 120,
    },
    {
      accessorKey: "requester",
      header: ({ column }) => <SortableHeader column={column}>Requester</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <span className="font-medium text-sm md:text-base">{row.getValue("requester")}</span>
      ),
      size: 150,
    },
    {
      accessorKey: "equipment",
      header: ({ column }) => <SortableHeader column={column}>Equipment</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <span className="font-medium text-sm md:text-base">{row.getValue("equipment")}</span>
      ),
      size: 180,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const status = row.getValue("status") as string;
        let variant: any = 'outline';
        let extraClass = '';
        if (status === 'Pending') variant = 'yellow';
        else if (status === 'Approved') variant = 'default';
        else if (status === 'Declined') variant = 'destructive';
        else if (status === 'Completed') variant = 'green';
        else if (status === 'Cancelled') {
          variant = 'outline';
          extraClass = 'text-red-400 border-red-200 bg-red-50';
        }
        return (
          <Badge
            variant={variant}
            className={`whitespace-nowrap font-medium text-xs md:text-sm ${extraClass}`}
          >
            {status}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: "notes",
      header: ({ column }) => <SortableHeader column={column}>Notes</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const notes = row.getValue("notes") as string;
        return (
          <span className="max-w-[150px] md:max-w-[200px] truncate text-xs md:text-sm text-muted-foreground" title={notes}>
            {notes || '-'}
          </span>
        );
      },
      size: 200,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const status = row.original.status

        return (
          <div className="flex items-center gap-1">
            <QuickActions 
              row={row.original} 
              onAction={handleQuickAction}
              actionLoadingId={actionLoadingId}
            />
            
            <div className="flex items-center gap-1 md:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 md:h-8 md:w-8 p-0 touch-manipulation">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>
                    <EyeIcon className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  
                  {onEdit && (
                    <DropdownMenuItem onClick={() => handleAction(onEdit, row.original.id, "Edit")}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  
                  {onReminder && (
                    <DropdownMenuItem onClick={() => handleAction(onReminder, row.original.id, "Send Reminder")}>
                      <AlertCircleIcon className="mr-2 h-4 w-4" />
                      Send Reminder
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => handleAction(onDelete, row.original.id, "Delete")}
                      className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-800"
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
  ], [handleQuickAction, handleViewDetails, handleAction, onEdit, onReminder, onDelete, actionLoadingId])

  // Memoized table configuration for better performance
  const tableConfig = useMemo(() => ({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableRowSelection: enableBulkActions,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalFuzzyFilterFn,
  }), [
    data, columns, sorting, columnFilters, columnVisibility, rowSelection, 
    globalFilter, pagination, enableBulkActions
  ])

  const table = useReactTable(tableConfig)

  // Enhanced loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns.length }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} columns={columns.length} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Error Loading Data</div>
          <p className="text-muted-foreground">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        onRefresh={onRefresh}
        onExport={onExport}
        data={data}
        enableColumnVisibility={enableColumnVisibility}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      
      {/* Bulk Actions */}
      {enableBulkActions && selectedRowIds.length > 0 && (
        <BulkActions
          selectedRows={selectedRowIds}
          onBulkDelete={onBulkDelete}
          onBulkApprove={onBulkApprove}
          onBulkDecline={onBulkDecline}
          onClearSelection={handleClearSelection}
        />
      )}
      
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} style={{ width: header.getSize() }} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getPaginationRowModel().rows?.length ? (
                table.getPaginationRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground text-sm md:text-base">
                        {table.getFilteredRowModel().rows.length === 0 && table.getCoreRowModel().rows.length > 0
                          ? "No results found for your search."
                          : "No rental requests found."}
                      </p>
                      {table.getFilteredRowModel().rows.length === 0 && table.getCoreRowModel().rows.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            table.resetColumnFilters()
                            table.setGlobalFilter("")
                          }}
                          className="h-10 md:h-9"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Page summary */}
      {enablePagination && (
        <div className="flex justify-center md:justify-end text-sm text-muted-foreground px-2">
          {(() => {
            const total = table.getFilteredRowModel().rows.length;
            const pageIndex = pagination.pageIndex;
            const pageSize = pagination.pageSize;
            const start = total === 0 ? 0 : pageIndex * pageSize + 1;
            const end = Math.min(total, (pageIndex + 1) * pageSize);
            return `Showing ${start}–${end} of ${total}`;
          })()}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && (
        <DataTablePagination table={table} pagination={pagination} setPagination={setPagination} />
      )}
    </div>
  )
}
