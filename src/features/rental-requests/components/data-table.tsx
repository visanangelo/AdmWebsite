"use client"

import * as React from "react"
import {
  ColumnDef,
  Row as TanstackRow,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/features/shared';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, BanIcon, RotateCcwIcon, MoreVerticalIcon, EyeIcon, EditIcon, AlertCircleIcon, Trash2Icon } from 'lucide-react';
import { DropdownMenuSeparator } from '@/features/shared';
import { ActionButtons } from './ActionButtons'
import { BulkActions } from './BulkActions';
import { MobileCardView } from './MobileCardView';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { SortableHeader } from './SortableHeader';
import { globalFuzzyFilterFn } from './globalFuzzyFilterFn';
import Image from 'next/image'

// Rename local Row interface to RentalRow
export interface RentalRow {
  id: string
  date: string
  requester: string
  first_name?: string
  last_name?: string
  equipment: string
  status: string
  notes?: string
  start_date?: string
  end_date?: string
  project_location?: string
  [key: string]: unknown
}

// interface DataTableProps
interface DataTableProps {
  data: RentalRow[]
  onApprove?: (id: string) => Promise<void>
  onDecline?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string, updatedFields: Record<string, unknown>) => Promise<void>
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
  actionLoadingId?: string | null | undefined
  pageSize?: number
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  enableBulkActions?: boolean
  onClearIndexedFilters?: () => Promise<void>
  highlightedRequestId?: string | null
}

// Elimină complet funcțiile DataTableToolbar, DataTablePagination, SortableHeader, globalFuzzyFilterFn din acest fișier (păstrează doar importurile)

// Quick Action Buttons Component - Memoized for better performance
const QuickActions = React.memo(({ row, onAction, actionLoadingId }: { 
  row: RentalRow; 
  onAction: (action: string, id: string) => Promise<void>;
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

// Elimină implementările vechi ale acestor subcomponente din acest fișier

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
  actionLoadingId,
  // pageSize = 10,
  enablePagination = true,
  enableColumnVisibility = true,
  enableBulkActions = true,
  onClearIndexedFilters,
  highlightedRequestId,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [pagination, setPagination] = useState(() => ({ pageIndex: 0, pageSize: 10 }))
  const [columnFilters, setColumnFilters] = useState<Array<{ id: string; value: unknown }>>([]);

  // Update columnFilters when dateFrom/dateTo change
  useEffect(() => {
    setColumnFilters([
      {
        id: 'start_date',
        value: { from: dateFrom, to: dateTo }
      }
    ]);
  }, [dateFrom, dateTo]);

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
          await onApprove(id)
        }
        break
      case 'Decline':
        if (onDecline) {
          await onDecline(id)
        }
        break
      case 'Complete':
        if (onComplete) {
          await onComplete(id)
        }
        break
      case 'Reopen':
        if (onReopen) {
          await onReopen(id)
        }
        break
      case 'Cancel':
        if (onCancel) {
          await onCancel(id)
        }
        break
      case 'Delete':
        if (onDelete) {
          await onDelete(id)
        }
        break
      case 'Edit':
        if (onEdit) {
          await onEdit(id, {})
        }
        break
      case 'Reminder':
        if (onReminder) {
          await onReminder(id)
        }
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }, [data, onApprove, onDecline, onComplete, onReopen, onCancel, onDelete, onEdit, onReminder, handleViewDetails])

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
      size: 50,
      minSize: 50,
      maxSize: 50,
    },
    // Add First Name column
    {
      accessorKey: "first_name",
      header: ({ column }) => <SortableHeader column={column}>First Name</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <span className="font-medium text-sm truncate max-w-[120px]" title={row.getValue("first_name") as string}>
          {row.getValue("first_name") || '-'}
        </span>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    // Add Last Name column
    {
      accessorKey: "last_name",
      header: ({ column }) => <SortableHeader column={column}>Last Name</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => (
        <span className="font-medium text-sm truncate max-w-[120px]" title={row.getValue("last_name") as string}>
          {row.getValue("last_name") || '-'}
        </span>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
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
        const cellValue = row.getValue(id);
        if (!cellValue || typeof cellValue !== 'string') return false;
        // Normalizează la YYYY-MM-DD
        const rowDate = cellValue.slice(0, 10);

        const from = value.from;
        const to = value.to;

        if (from && to) {
          return rowDate >= from && rowDate <= to;
        } else if (from) {
          return rowDate >= from;
        } else if (to) {
          return rowDate <= to;
        }
        return true;
      },
      size: 120,
      minSize: 110,
      maxSize: 140,
    },
    {
      accessorKey: "equipment",
      header: ({ column }) => <SortableHeader column={column}>Equipment</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const equipmentData = row.getValue("equipment") as { name?: string; image?: string } | undefined;
        const equipmentName = equipmentData?.name || 'Unknown';
        const equipmentImage = equipmentData?.image;
        
        return (
          <div className="flex items-center gap-3">
            {equipmentImage && (
              <Image 
                src={equipmentImage} 
                alt={equipmentName}
                width={32}
                height={32}
                className="w-8 h-8 rounded object-cover border border-border/50 shadow-sm flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="font-medium text-sm truncate max-w-[140px]" title={equipmentName}>
              {equipmentName}
            </span>
          </div>
        );
      },
      size: 180,
      minSize: 160,
      maxSize: 220,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const status = row.getValue("status") as string;
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'reserved' | 'in-use' | 'maintenance' | 'available' | undefined = 'outline';
        let extraClass = '';
        if (status === 'Pending') variant = 'reserved';
        else if (status === 'Approved') variant = 'in-use';
        else if (status === 'Declined') variant = 'maintenance';
        else if (status === 'Completed') variant = 'available';
        else if (status === 'Cancelled') {
          variant = 'outline';
          extraClass = 'text-red-400 border-red-200 bg-red-50';
        }
        return (
          <Badge
            variant={variant}
            className={`whitespace-nowrap font-medium text-sm ${extraClass}`}
          >
            {status}
          </Badge>
        );
      },
      size: 120,
      minSize: 110,
      maxSize: 140,
    },
    {
      accessorKey: "notes",
      header: ({ column }) => <SortableHeader column={column}>Notes</SortableHeader>,
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        const notes = row.getValue("notes") as string;
        return (
          <span className="max-w-[150px] truncate text-sm text-muted-foreground" title={notes}>
            {notes || '-'}
          </span>
        );
      },
      size: 150,
      minSize: 130,
      maxSize: 180,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: TanstackRow<RentalRow> }) => {
        // status is not used, so remove this line to fix the lint error.

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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>
                    <EyeIcon className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  
                  {onEdit && (
                    <DropdownMenuItem onClick={() => handleQuickAction('Edit', row.original.id)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  
                  {onReminder && (
                    <DropdownMenuItem onClick={() => handleQuickAction('Reminder', row.original.id)}>
                      <AlertCircleIcon className="mr-2 h-4 w-4" />
                      Send Reminder
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => handleQuickAction('Delete', row.original.id)}
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
      minSize: 90,
      maxSize: 120,
    },
  ], [handleQuickAction, handleViewDetails, onEdit, onReminder, onDelete, actionLoadingId])

  // Memoized table configuration for better performance
  const tableConfig = useMemo(() => ({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
      columnFilters,
    },
    enableRowSelection: enableBulkActions,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalFuzzyFilterFn,
  }), [
    data, columns, sorting, columnVisibility, rowSelection, 
    globalFilter, pagination, enableBulkActions, columnFilters
  ])

  const table = useReactTable(tableConfig)

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary" />
          <span className="text-sm text-muted-foreground">Loading rental requests...</span>
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
        dateFrom={dateFrom}
        setDateFrom={(value: string) => setDateFrom(value)}
        dateTo={dateTo}
        setDateTo={(value: string) => setDateTo(value)}
        globalFilter={globalFilter}
        setGlobalFilter={(value: string) => setGlobalFilter(value)}
        onClearIndexedFilters={onClearIndexedFilters}
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
      
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        style={{ 
                          width: header.getSize(),
                          minWidth: header.getSize(),
                          maxWidth: header.getSize()
                        }} 
                        className="whitespace-nowrap text-sm font-medium px-3 py-3"
                      >
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
                table.getPaginationRowModel().rows.map((row) => {
                  const isHighlighted = highlightedRequestId === row.original.id;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      data-row-id={row.original.id}
                      className={`hover:bg-muted/50 transition-all duration-500 ${
                        isHighlighted 
                          ? 'animate-pulse bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-blue-500 shadow-lg' 
                          : ''
                      }`}
                      style={{
                        animationDelay: isHighlighted ? '0.5s' : '0s',
                        animationDuration: isHighlighted ? '2s' : '0s',
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          style={{ 
                            width: cell.column.getSize(),
                            minWidth: cell.column.getSize(),
                            maxWidth: cell.column.getSize()
                          }} 
                          className="whitespace-nowrap text-sm px-3 py-3"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground text-sm">
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
                          className="h-8 px-3 text-xs"
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

      {/* Mobile Card View */}
      <div className="md:hidden">
        <MobileCardView 
          data={table.getPaginationRowModel().rows.map(row => row.original)}
          onAction={handleQuickAction}
          actionLoadingId={actionLoadingId}
          onViewDetails={handleViewDetails}
          highlightedRequestId={highlightedRequestId}
        />
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
