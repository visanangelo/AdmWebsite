import React, { createContext, useContext, useState, useMemo } from 'react'
import { useDataFetching } from '../hooks/useDataFetching'
import { useDashboardActions } from '../hooks/useDashboardActions'
import { RentalRequest, FleetItem, FleetStatus } from '@/features/shared/types/rental'

interface DashboardContextType {
  data: {
    requests: RentalRequest[]
    fleet: FleetItem[]
    stats: import('../types').DashboardStats | null
  }
  loading: boolean
  error: string | null
  lastFetch: Date
  actionLoadingId: string | null
  tab: string
  autoRefreshEnabled: boolean
  refreshInterval: number
  realtimeStatus: 'connected' | 'disconnected' | 'connecting'
  highlightedRequestId: string | null
  fetchData: (isManualRefresh?: boolean) => Promise<void>
  debouncedFetch: (isManualRefresh?: boolean) => void
  setActionLoadingId: (id: string | null) => void
  setTab: (tab: string) => void
  setAutoRefreshEnabled: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  setHighlightedRequestId: (id: string | null) => void
  setData: React.Dispatch<React.SetStateAction<{
    requests: RentalRequest[];
    fleet: FleetItem[];
    stats: import('../types').DashboardStats | null;
  }>>
  handleApprove: (id: string) => Promise<void>
  handleDecline: (id: string) => Promise<void>
  handleComplete: (id: string) => Promise<void>
  handleReopen: (id: string) => Promise<void>
  handleCancel: (id: string) => Promise<void>
  handleBulkApprove: (ids: string[]) => Promise<void>
  handleBulkDecline: (ids: string[]) => Promise<void>
  handleBulkDelete: (ids: string[]) => Promise<void>
  handleFleetDelete: (id: string) => Promise<void>
  handleFleetStatusUpdate: (fleetId: string, newStatus: FleetStatus) => Promise<void>
  handleEdit: (id: string, updatedFields: Partial<RentalRequest>) => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

interface DashboardProviderProps {
  children: React.ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [tab, setTab] = useState('dashboard')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(60000)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null)

  // Use the data fetching hook
  const { data, loading, error, lastFetch, fetchData, debouncedFetch, setData } = useDataFetching(setRealtimeStatus)

  // Use the actions hook
  const actions = useDashboardActions({
    data,
    setData,
    setActionLoadingId,
    debouncedFetch
  })

  const contextValue = useMemo(() => ({
    data,
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
    realtimeStatus,
    highlightedRequestId,
    fetchData,
    debouncedFetch,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    setHighlightedRequestId,
    setData,
    ...actions
  }), [
    data,
    loading,
    error,
    lastFetch,
    actionLoadingId,
    tab,
    autoRefreshEnabled,
    refreshInterval,
    realtimeStatus,
    highlightedRequestId,
    fetchData,
    debouncedFetch,
    setActionLoadingId,
    setTab,
    setAutoRefreshEnabled,
    setRefreshInterval,
    setHighlightedRequestId,
    setData,
    actions
  ])

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
} 