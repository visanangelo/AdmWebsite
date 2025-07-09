import React from 'react'
import type { FleetItem } from '@/features/shared'
import type { FleetStatus } from '@/features/shared/types/rental'
import { Badge } from '@/features/shared/components/ui/badge'
import { Button } from '@/features/shared/components/ui/button'
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Eye, 
  Edit, 
  MoreHorizontal 
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/features/shared/components/ui/dropdown-menu'
import Image from 'next/image'

interface FleetCardProps {
  eq: FleetItem
  onStatusChange: (id: string, status: FleetStatus) => void
  onDelete: (id: string) => void
  loadingId?: string | null
}

export const FleetCard: React.FC<FleetCardProps> = React.memo(({ eq, onStatusChange, onDelete, loadingId }) => {
  const isLoading = loadingId === eq.id
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'In Use':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'Maintenance':
        return <Wrench className="w-4 h-4 text-orange-500" />
      default:
        return <Truck className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'In Use':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Maintenance':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusActions = (currentStatus: string) => {
    const allStatuses: FleetStatus[] = ['Available', 'In Use', 'Maintenance']
    return allStatuses.filter(status => status !== currentStatus)
  }

  return (
    <div className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 group rounded-xl bg-card/80 p-4 md:p-6 min-h-[420px] flex flex-col justify-between">
      {/* Equipment Image */}
      {eq.image && (
        <div className="relative w-full h-44 md:h-48 mb-4 md:mb-5 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={eq.image}
            alt={eq.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor(eq.status)} border text-xs px-2 py-1 rounded-lg flex items-center gap-1`}> 
              {getStatusIcon(eq.status)}
              <span className="ml-1">{eq.status}</span>
            </Badge>
          </div>
        </div>
      )}

      {/* Equipment Info */}
      <div className="space-y-3 md:space-y-4 flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{eq.name}</h3>
          {eq.category && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{eq.category}</p>
          )}
        </div>

        {/* Status Badge (if no image) */}
        {!eq.image && (
          <Badge className={`${getStatusColor(eq.status)} border w-fit text-xs px-2 py-1 rounded-lg flex items-center gap-1`}>
            {getStatusIcon(eq.status)}
            <span className="ml-1">{eq.status}</span>
          </Badge>
        )}
      </div>

      {/* Status Actions Section */}
      <div className="mt-4 md:mt-5">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Status</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {getStatusActions(eq.status).map(status => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(eq.id, status)}
              className="text-xs rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary/40 focus:outline-none border-dashed"
              disabled={isLoading}
            >
              {getStatusIcon(status)}
              <span className="ml-1 font-medium">{status}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Actions Section */}
      <div className="mt-4 md:mt-5 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <Button
            variant="default"
            size="lg"
            className="flex-1 rounded-lg py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Updating...
              </span>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-lg px-4 py-2.5 min-w-[44px] focus:ring-2 focus:ring-primary/40 focus:outline-none border-gray-300 dark:border-gray-600" 
                disabled={isLoading}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="flex items-center gap-2 py-2" disabled={isLoading}>
                <Edit className="w-4 h-4" />
                Edit Equipment
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 py-2" disabled={isLoading}>
                <Eye className="w-4 h-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 flex items-center gap-2 py-2"
                onClick={() => !isLoading && onDelete(eq.id)}
                disabled={isLoading}
              >
                <Truck className="w-4 h-4" />
                Delete Equipment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
})

FleetCard.displayName = 'FleetCard'

export const FleetCardSkeleton = () => (
  <div className="relative overflow-hidden bg-card/80 backdrop-blur-md p-6 rounded-xl border border-border shadow-custom min-h-[420px]">
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