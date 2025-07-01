import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface DataTableConfig<T> {
  fetchData: (page: number, pageSize: number, filters?: any) => Promise<{
    data: T[]
    total: number
    error?: string
  }>
  onAction?: (action: string, id: string, data?: any) => Promise<void>
  optimisticUpdate?: (action: string, id: string, currentData: T[]) => T[]
}

export function useDataTable<T extends { id: string }>(config: DataTableConfig<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState<any>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await config.fetchData(
        pagination.page, 
        pagination.pageSize, 
        filters
      )
      
      if (result.error) {
        setError(result.error)
      } else {
        setData(result.data)
        setPagination(prev => ({ ...prev, total: result.total }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [config, pagination.page, pagination.pageSize, filters])

  const handleAction = useCallback(async (
    action: string,
    id: string,
    optimisticData?: any
  ) => {
    if (!config.onAction) return

    setActionLoadingId(id)
    
    try {
      // Apply optimistic update if provided
      if (config.optimisticUpdate) {
        setData(current => config.optimisticUpdate!(action, id, current))
      }

      // Perform the actual action
      await config.onAction(action, id, optimisticData)
      
      // Refresh data to ensure consistency
      await fetchData()
      
      toast.success(`${action} successful`)
    } catch (err) {
      // Revert optimistic update on error
      if (config.optimisticUpdate) {
        await fetchData()
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      toast.error(`Failed to ${action.toLowerCase()}: ${errorMessage}`)
    } finally {
      setActionLoadingId(null)
    }
  }, [config, fetchData])

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const updatePagination = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize: pageSize || prev.pageSize
    }))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    actionLoadingId,
    pagination,
    filters,
    handleAction,
    updateFilters,
    updatePagination,
    refreshData: fetchData
  }
} 