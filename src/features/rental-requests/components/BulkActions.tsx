import React, { useState } from "react";
import { Button } from '@/features/shared';
import { CheckCircleIcon, XCircleIcon, Trash2Icon, X } from "lucide-react";
import { toast } from "sonner";

export interface BulkActionsProps {
  selectedRows: string[];
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkApprove?: (ids: string[]) => Promise<void>;
  onBulkDecline?: (ids: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedRows,
  onBulkDelete,
  onBulkApprove,
  onBulkDecline,
  onClearSelection,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkAction = async (action?: (ids: string[]) => Promise<void>) => {
    if (!action) return;
    setIsLoading(true);
    try {
      await action(selectedRows);
      toast.success(`Bulk action completed for ${selectedRows.length} items`);
      onClearSelection();
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedRows.length === 0) return null;

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
  );
}; 