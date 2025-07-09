import React from "react";
import { Badge, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/features/shared';
import { getStatusVariant } from './getStatusVariant';
import type { RentalRow } from './data-table';
import { CheckCircleIcon, XCircleIcon, BanIcon, RotateCcwIcon, EyeIcon, EditIcon, AlertCircleIcon, Trash2Icon, MoreVerticalIcon } from 'lucide-react';

export interface MobileCardViewProps {
  data: RentalRow[];
  onAction: (action: string, id: string) => Promise<void>;
  actionLoadingId?: string | null;
  onViewDetails?: (id: string) => Promise<void>;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  data,
  onAction,
  actionLoadingId,
  onViewDetails,
}) => {
  return (
    <div className="space-y-4 md:hidden">
      {data.map((row) => {
        const isLoading = actionLoadingId === row.id;
        return (
          <div key={row.id} className="bg-card rounded-xl border border-gray-200 shadow-sm p-5 mb-4 flex flex-col gap-4">
            {/* Equipment Image at Top Center */}
            {(row as any).equipment?.image && (
              <div className="flex justify-center mb-3">
                <img 
                  src={(row as any).equipment.image} 
                  alt={(row as any).equipment?.name || 'Equipment'}
                  className="w-20 h-20 rounded-lg object-cover border border-border/50 shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Header with Status */}
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-foreground">
                {(row as any).equipment?.name || row.equipment}
              </div>
              <Badge variant={getStatusVariant(row.status)} className="text-xs font-semibold px-3 py-1 rounded-full">
                {row.status}
              </Badge>
            </div>
            
            {/* Main Info */}
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Requester:</span> {(row.requester || '').replace(/\([^)]*\)/g, '').trim()}</div>
              {(row.first_name || row.last_name) && (
                <div><span className="font-medium">Name:</span> {`${row.first_name || ''} ${row.last_name || ''}`.trim()}</div>
              )}
              {row.start_date && <div><span className="font-medium">Start:</span> {new Date(row.start_date).toLocaleDateString()}</div>}
              {row.end_date && <div><span className="font-medium">End:</span> {new Date(row.end_date).toLocaleDateString()}</div>}
              {row.project_location && <div><span className="font-medium">Location:</span> <span className="text-muted-foreground">{row.project_location}</span></div>}
              {row.notes && <div><span className="font-medium">Notes:</span> <span className="text-muted-foreground line-clamp-2">{row.notes}</span></div>}
            </div>
            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2">
              {row.status === 'Pending' && (
                <>
                  <Button size="sm" variant="default" onClick={() => onAction('Approve', row.id)} disabled={isLoading} className="w-full h-10 font-semibold bg-green-600 text-white hover:bg-green-700">
                    <CheckCircleIcon className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button size="sm" variant="default" onClick={() => onAction('Decline', row.id)} disabled={isLoading} className="w-full h-10 font-semibold bg-red-500 text-white hover:bg-red-600">
                    <XCircleIcon className="h-4 w-4 mr-2" /> Decline
                  </Button>
                </>
              )}
              {row.status === 'Approved' && (
                <>
                  <Button size="sm" variant="default" onClick={() => onAction('Complete', row.id)} disabled={isLoading} className="w-full h-10 font-semibold bg-blue-600 text-white hover:bg-blue-700">
                    <CheckCircleIcon className="h-4 w-4 mr-2" /> Complete
                  </Button>
                  <Button size="sm" variant="default" onClick={() => onAction('Cancel', row.id)} disabled={isLoading} className="w-full h-10 font-semibold bg-red-500 text-white hover:bg-red-600">
                    <BanIcon className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </>
              )}
              {(row.status === 'Completed' || row.status === 'Cancelled' || row.status === 'Declined') && (
                <Button size="sm" variant="default" onClick={() => onAction('Reopen', row.id)} disabled={isLoading} className="w-full h-10 font-semibold bg-orange-400 text-white hover:bg-orange-500">
                  <RotateCcwIcon className="h-4 w-4 mr-2" /> Reopen
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onViewDetails?.(row.id)} className="w-full h-10 font-semibold border-gray-300">
                <EyeIcon className="h-4 w-4 mr-2" /> View
              </Button>
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full h-10 rounded-lg bg-gray-50 hover:bg-gray-100 border-gray-200">
                    <MoreVerticalIcon className="h-4 w-4 mr-2" /> More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg rounded-xl">
                  <DropdownMenuItem onClick={() => onViewDetails?.(row.id)}>
                    <EyeIcon className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction('Edit', row.id)}>
                    <EditIcon className="mr-2 h-4 w-4" /> Edit Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction('Reminder', row.id)}>
                    <AlertCircleIcon className="mr-2 h-4 w-4" /> Send Reminder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction('Delete', row.id)} className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-800">
                    <Trash2Icon className="mr-2 h-4 w-4" /> Delete Request
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-blue-700">Processing...</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 