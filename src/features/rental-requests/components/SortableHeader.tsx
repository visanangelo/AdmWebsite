import React from "react";
import type { Column } from '@tanstack/react-table';
import type { RentalRow } from './data-table';
import { Button } from '@/features/shared';
import { ChevronUpIcon, ChevronDownIcon, ArrowUpDown } from 'lucide-react';

export interface SortableHeaderProps {
  column: Column<RentalRow, unknown>;
  children: React.ReactNode;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ column, children }) => {
  // getIsSorted can return boolean or 'asc' | 'desc', so handle both
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="h-8 px-2 font-normal"
    >
      {children}
      {sorted === "asc" ? (
        <ChevronUpIcon className="ml-2 h-4 w-4" />
      ) : sorted === "desc" ? (
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}; 