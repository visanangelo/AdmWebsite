import React from "react"
import { Button } from "@/features/shared/components/ui/button"
import { Badge } from "@/features/shared/components/ui/badge"
import { Trash2Icon } from "lucide-react"
import { FleetItem } from '@/features/shared'

export const FleetCard = React.memo(function FleetCard({ eq, onStatus, onDelete, loadingId }: {
  eq: FleetItem
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  loadingId?: string | null | undefined
}) {
  const isLoading = loadingId === eq.id

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {eq.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {eq.status}
            </Badge>
            <span className="text-sm text-muted-foreground">ID: {eq.id}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <select
            value={eq.status}
            onChange={(e) => onStatus(eq.id, e.target.value)}
            disabled={isLoading}
            className="px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(eq.id)}
            disabled={isLoading}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

export const FleetCardSkeleton = () => (
  <div className="bg-card p-4 rounded-lg border shadow-sm">
    <div className="flex justify-between items-start">
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-8 bg-muted rounded animate-pulse w-24" />
        <div className="h-8 bg-muted rounded animate-pulse w-8" />
      </div>
    </div>
  </div>
) 