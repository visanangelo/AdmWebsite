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
  Shield, 
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
      case 'Reserved':
        return <Shield className="w-4 h-4 text-purple-500" />
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
      case 'Reserved':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusActions = (currentStatus: string) => {
    const allStatuses: FleetStatus[] = ['Available', 'In Use', 'Maintenance', 'Reserved']
    return allStatuses.filter(status => status !== currentStatus)
  }

  return (
    <div className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 group rounded-xl bg-card/80 p-4 md:p-6 min-h-[370px] flex flex-col justify-between">
      {/* Equipment Image */}
      {eq.image && (
        <div className="relative w-full h-44 md:h-48 mb-3 md:mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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
      <div className="space-y-2 md:space-y-3 flex-1">
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

        {/* Quick Status Actions */}
        <div className="flex flex-wrap gap-2 mt-2 mb-2 md:mb-3">
          {getStatusActions(eq.status).map(status => (
            <Button
              key={status}
              variant="outline"
              size="lg"
              onClick={() => onStatusChange(eq.id, status)}
              className="text-xs md:text-sm rounded-lg px-4 py-2 min-w-[90px] focus:ring-2 focus:ring-primary/40 focus:outline-none"
              disabled={isLoading}
            >
              {getStatusIcon(status)}
              <span className="ml-1 font-medium">{status}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/60 my-2 md:my-3" />

      {/* Actions Row */}
      <div className="flex gap-2 pt-1 md:pt-2">
        <Button
          variant="default"
          size="lg"
          className="flex-1 rounded-lg py-2 md:py-2.5 text-base md:text-base focus:ring-2 focus:ring-primary/40 focus:outline-none"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-primary" /> Updating...</span>
          ) : (
            <><Eye className="w-5 h-5 mr-2" />View</>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="rounded-lg px-3 py-2 min-w-[44px] focus:ring-2 focus:ring-primary/40 focus:outline-none" disabled={isLoading}>
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center gap-2" disabled={isLoading}>
              <Edit className="w-4 h-4" />
              Edit Equipment
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" disabled={isLoading}>
              <Eye className="w-4 h-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 flex items-center gap-2"
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
  )
})

FleetCard.displayName = 'FleetCard'

export const FleetCardSkeleton = () => (
  <div className="relative overflow-hidden bg-card/80 backdrop-blur-md p-6 rounded-xl border border-border shadow-custom min-h-[370px]">
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