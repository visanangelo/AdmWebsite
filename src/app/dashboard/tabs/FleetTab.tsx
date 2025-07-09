import React from 'react'
import type { FleetItem } from '@/features/shared'
import type { FleetStatus } from '@/features/shared/types/rental'
import { FleetCardSkeleton } from '@/features/dashboard'
import { FleetCard } from '@/features/dashboard/components/FleetCard'
import { Card, CardContent } from '@/features/shared/components/ui/card'
import { Button } from '@/features/shared/components/ui/button'
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Wrench
} from 'lucide-react'
import { Input } from '@/features/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select'

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
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const emptyFleet = fleet.length === 0

  // Calculate fleet statistics
  const stats = React.useMemo(() => {
    const total = fleet.length
    const available = fleet.filter(item => item.status === 'Available').length
    const inUse = fleet.filter(item => item.status === 'In Use').length
    const maintenance = fleet.filter(item => item.status === 'Maintenance').length

    return { total, available, inUse, maintenance }
  }, [fleet])

  // Filter fleet based on search and status
  const filteredFleet = React.useMemo(() => {
    return fleet
      .filter(item => item && item.id)
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => statusFilter === 'all' || item.status === statusFilter)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [fleet, searchTerm, statusFilter])



  const handleStatusChange = async (fleetId: string, newStatus: FleetStatus) => {
    setLoadingId(fleetId)
    try {
      await onFleetStatusUpdate(fleetId, newStatus)
    } catch (error) {
      console.error('Error updating fleet status:', error)
    }
    setLoadingId(null)
  }

  const handleDelete = async (fleetId: string) => {
    setLoadingId(fleetId)
    try {
      await onFleetDelete(fleetId)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fleet Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your equipment and vehicles</p>
        </div>
        <Button className="w-full lg:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Fleet</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Available</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.available}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">In Use</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.inUse}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Maintenance</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.maintenance}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="In Use">In Use</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          <FleetCardSkeleton />
          <FleetCardSkeleton />
          <FleetCardSkeleton />
        </div>
      ) : emptyFleet ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No fleet vehicles found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first piece of equipment</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredFleet.map(eq => (
            <FleetCard
              key={eq.id}
              eq={eq}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              loadingId={loadingId}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && !emptyFleet && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredFleet.length} of {fleet.length} equipment
        </div>
      )}
    </div>
  )
}

export default FleetTab 