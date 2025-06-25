import React from 'react'
import { motion } from "framer-motion"
import { Button } from "@/features/shared/components/ui/button"
import { Badge } from "@/features/shared/components/ui/badge"
import { Trash2Icon } from "lucide-react"
import { FleetItem } from '@/features/shared'

// Enhanced Fleet Card with better visual design (from original)
const FleetCard = React.memo(function FleetCard({ eq, onStatus, onDelete, loadingId }: {
  eq: FleetItem
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  loadingId?: string | null | undefined
}) {
  const isLoading = loadingId === eq.id
  const statusColors = {
    "Available": "bg-green-100 text-green-800 border-green-200 shadow-green-100/50",
    "In Use": "bg-blue-100 text-blue-800 border-blue-200 shadow-blue-100/50",
    "Reserved": "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-100/50",
    "Maintenance": "bg-red-100 text-red-800 border-red-200 shadow-red-100/50"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 p-6 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300/80"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors mb-3">
            {eq.name}
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-300 ${
              statusColors[eq.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200 shadow-gray-100/50"
            }`}>
              {eq.status}
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-primary"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={eq.status}
            onChange={(e) => onStatus(eq.id, e.target.value)}
            disabled={isLoading}
            className="text-sm border border-gray-200/60 rounded-lg px-3 py-2 bg-white/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <button
            onClick={() => onDelete(eq.id)}
            disabled={isLoading}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
            title="Delete equipment"
          >
            <Trash2Icon className="h-4 w-4 group-hover/delete:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})

// Enhanced Fleet Card Skeleton (from original)
const FleetCardSkeleton = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 p-6 rounded-xl border border-gray-200/60 shadow-sm">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-20 mb-4 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-8" />
      </div>
    </div>
  </div>
)

interface FleetTabProps {
  loading: boolean
  fleet: any[]
  onFleetDelete: (id: string) => Promise<void>
  onFleetStatusUpdate: (fleetId: string, newStatus: string) => Promise<void>
}

const FleetTab: React.FC<FleetTabProps> = ({ 
  loading, 
  fleet, 
  onFleetDelete, 
  onFleetStatusUpdate 
}) => {
  const emptyFleet = fleet.length === 0

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
      <div className="space-y-4">
        {loading ? (
          <>
            <FleetCardSkeleton />
            <FleetCardSkeleton />
            <FleetCardSkeleton />
          </>
        ) : emptyFleet ? (
          <div className="text-center py-8 text-muted-foreground">No fleet vehicles found.</div>
        ) : (
          fleet
            .filter(item => item && item.id)
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(eq => (
              <FleetCard
                key={eq.id}
                eq={eq}
                onStatus={async (id: string, status: string) => {
                  try {
                    await onFleetStatusUpdate(id, status)
                  } catch (error) {
                    console.error('Error updating fleet status:', error)
                  }
                }}
                onDelete={onFleetDelete}
                loadingId={null}
              />
            ))
        )}
      </div>
    </div>
  )
}

export default FleetTab 