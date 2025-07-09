import React, { useState } from "react";
import type { Column } from '@tanstack/react-table';
import type { RentalRow } from './data-table';
import { Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, Label } from '@/features/shared';
import { SearchIcon, FilterIcon, RefreshCwIcon, DownloadIcon, SettingsIcon, X } from 'lucide-react';

export interface DataTableToolbarProps {
  table: any;
  onRefresh?: () => Promise<void>;
  onExport?: (data: RentalRow[]) => void;
  data: RentalRow[];
  enableColumnVisibility: boolean;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  onClearIndexedFilters?: () => Promise<void>;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  table,
  onRefresh,
  onExport,
  data,
  enableColumnVisibility,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  globalFilter,
  setGlobalFilter,
  onClearIndexedFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Main Toolbar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={globalFilter ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(event.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9 px-3"
            >
              <RefreshCwIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Refresh</span>
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(data)}
              className="h-9 px-3"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Export</span>
            </Button>
          )}
        </div>
      </div>
      {/* Responsive Date Filters */}
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center w-full">
        <div className="flex flex-col lg:flex-row gap-2 flex-1">
          <div className="flex flex-col gap-1 w-full lg:w-44">
            <Label className="text-xs font-medium">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDateFrom(event.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 w-full lg:w-44">
            <Label className="text-xs font-medium">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDateTo(event.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClearIndexedFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearIndexedFilters}
              className="h-9 px-3 text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      {/* Columns visibility menu moved below filters */}
      {enableColumnVisibility && (
        <div className="flex w-full justify-end lg:justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-sm">
                <SettingsIcon className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                .filter((column: Column<RentalRow, unknown>) => column.getCanHide())
                .map((column: Column<RentalRow, unknown>) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-sm"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value: boolean | 'indeterminate') => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}; 