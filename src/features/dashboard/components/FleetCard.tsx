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
}

export const FleetCard: React.FC<FleetCardProps> = React.memo(({ eq, onStatusChange, onDelete }) => {
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
    <div className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 group rounded-xl bg-card/80 p-6">
      {/* Equipment Image */}
      {eq.image && (
        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={eq.image}
            alt={eq.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor(eq.status)} border`}>
              {getStatusIcon(eq.status)}
              <span className="ml-1">{eq.status}</span>
            </Badge>
          </div>
        </div>
      )}

      {/* Equipment Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{eq.name}</h3>
          {eq.category && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{eq.category}</p>
          )}
        </div>

        {/* Status Badge (if no image) */}
        {!eq.image && (
          <Badge className={`${getStatusColor(eq.status)} border w-fit`}>
            {getStatusIcon(eq.status)}
            <span className="ml-1">{eq.status}</span>
          </Badge>
        )}

        {/* Quick Status Actions */}
        <div className="flex flex-wrap gap-2">
          {getStatusActions(eq.status).map(status => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(eq.id, status)}
              className="text-xs"
            >
              {getStatusIcon(status)}
              <span className="ml-1">{status}</span>
            </Button>
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Equipment
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(eq.id)}
              >
                <Truck className="w-4 h-4 mr-2" />
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