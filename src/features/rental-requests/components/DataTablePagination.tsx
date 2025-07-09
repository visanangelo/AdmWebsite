import React, { useState } from "react";
import { Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/features/shared';
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

export interface DataTablePaginationProps {
  table: { getPageCount: () => number };
  pagination: { pageIndex: number; pageSize: number };
  setPagination: (p: { pageIndex: number; pageSize: number }) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({ table, pagination, setPagination }) => {
  const [open, setOpen] = useState(false);

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
            onValueChange={(value: string) => {
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
  );
}; 