import React from 'react'
import { motion } from "framer-motion"
import { Trash2Icon } from "lucide-react"
import type { FleetItem } from '@/features/shared'
import type { FleetStatus } from '@/features/shared/types/rental'

export const FleetCard = React.memo(function FleetCard({ eq, onStatus, onDelete, loadingId }: {
  eq: FleetItem
  onStatus: (id: string, status: FleetStatus) => void
  onDelete: (id: string) => void
  loadingId?: string | null | undefined
}) {
  const isLoading = loadingId === eq.id
  const statusColors = {
    "Available": "bg-status-available-bg text-status-available border-status-available/20",
    "In Use": "bg-status-in-use-bg text-status-in-use border-status-in-use/20",
    "Reserved": "bg-status-reserved-bg text-status-reserved border-status-reserved/20",
    "Maintenance": "bg-status-maintenance-bg text-status-maintenance border-status-maintenance/20"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card/80 backdrop-blur-md p-6 rounded-xl border border-border shadow-custom hover:shadow-custom transition-all duration-300 hover:scale-[1.01] hover:border-border/80"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-3">
            {eq.image && (
              <div className="flex-shrink-0">
                <img 
                  src={eq.image} 
                  alt={eq.name}
                  className="w-16 h-16 rounded-lg object-cover border border-border/50 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {eq.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-300 ${
              statusColors[eq.status as keyof typeof statusColors] || "bg-muted text-muted-foreground border-border"
            }`}>
              {eq.status}
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border border-border border-t-primary"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={eq.status}
            onChange={(e) => onStatus(eq.id, e.target.value as FleetStatus)}
            disabled={isLoading}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <button
            onClick={() => onDelete(eq.id)}
            disabled={isLoading}
            className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
            title="Delete equipment"
          >
            <Trash2Icon className="h-4 w-4 group-hover/delete:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})

FleetCard.displayName = 'FleetCard'

export const FleetCardSkeleton = () => (
  <div className="relative overflow-hidden bg-card/80 backdrop-blur-md p-6 rounded-xl border border-border shadow-custom">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full animate-shimmer" />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-16 h-16 bg-muted rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="h-5 bg-muted rounded w-20 mb-4 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded animate-pulse w-24" />
        <div className="h-8 bg-muted rounded animate-pulse w-8" />
      </div>
    </div>
  </div>
)

FleetCardSkeleton.displayName = 'FleetCardSkeleton' 