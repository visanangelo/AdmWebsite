import React from 'react'
import type { FleetItem } from '@/features/shared'
import type { FleetStatus } from '@/features/shared/types/rental'
import { FleetCard, FleetCardSkeleton } from '@/features/dashboard'

interface FleetTabProps {
  loading: boolean
  fleet: FleetItem[]
  onFleetDelete: (id: string) => Promise<void>
  onFleetStatusUpdate: (fleetId: string, newStatus: FleetStatus) => Promise<void>
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
                onStatus={async (id: string, status: FleetStatus) => {
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