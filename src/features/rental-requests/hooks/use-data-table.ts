import { useState, useEffect, useCallback, useRef } from 'react'
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

interface CacheEntry<T> {
  data: T[]
  total: number
  timestamp: number
  filters: any
  stale: boolean
}

export function useDataTable<T extends { id: string }>(config: DataTableConfig<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState<any>({})
  
  const loadingRef = useRef(false)
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const CACHE_DURATION = 30000 // 30 seconds
  const STALE_DURATION = 15000 // 15 seconds
  const BACKGROUND_REFRESH_DURATION = 45000 // 45 seconds

  // Generate cache key
  const getCacheKey = useCallback((page: number, pageSize: number, filters: any) => {
    return `${page}-${pageSize}-${JSON.stringify(filters)}`
  }, [])

  // Check if cache is valid
  const isCacheValid = useCallback((cacheKey: string) => {
    const cache = cacheRef.current.get(cacheKey)
    if (!cache) return false
    return Date.now() - cache.timestamp < CACHE_DURATION && !cache.stale
  }, [])

  // Check if cache is stale
  const isCacheStale = useCallback((cacheKey: string) => {
    const cache = cacheRef.current.get(cacheKey)
    if (!cache) return true
    return Date.now() - cache.timestamp > STALE_DURATION
  }, [])

  // Mark cache as stale
  const markCacheStale = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      const cache = cacheRef.current.get(cacheKey)
      if (cache) {
        cache.stale = true
      }
    } else {
      // Mark all cache as stale
      cacheRef.current.forEach(cache => {
        cache.stale = true
      })
    }
  }, [])

  // Background prefetch function
  const backgroundPrefetch = useCallback(async () => {
    if (loadingRef.current) return

    try {
      const cacheKey = getCacheKey(pagination.page, pagination.pageSize, filters)
      
      if (isCacheStale(cacheKey)) {
        const result = await config.fetchData(pagination.page, pagination.pageSize, filters)
        
        if (!result.error) {
          cacheRef.current.set(cacheKey, {
            data: result.data,
            total: result.total,
            timestamp: Date.now(),
            filters: { ...filters },
            stale: false
          })
          
          // Update data silently (no loading state)
          setData(result.data)
          setPagination(prev => ({ ...prev, total: result.total }))
        }
      }
    } catch (err) {
      console.warn('Background prefetch failed:', err)
    }
  }, [config, pagination.page, pagination.pageSize, filters, getCacheKey, isCacheStale])

  // Setup background prefetch interval
  useEffect(() => {
    const interval = setInterval(() => {
      backgroundPrefetch()
    }, BACKGROUND_REFRESH_DURATION)

    return () => clearInterval(interval)
  }, [backgroundPrefetch])

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (loadingRef.current && !isManualRefresh) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      const cacheKey = getCacheKey(pagination.page, pagination.pageSize, filters)
      
      // Check cache first (unless manual refresh)
      if (!isManualRefresh && isCacheValid(cacheKey)) {
        const cache = cacheRef.current.get(cacheKey)
        if (cache) {
          setData(cache.data)
          setPagination(prev => ({ ...prev, total: cache.total }))
          setLoading(false)
          loadingRef.current = false
          return
        }
      }
      
      // Clear cache on manual refresh
      if (isManualRefresh) {
        markCacheStale()
      }
      
      const result = await config.fetchData(pagination.page, pagination.pageSize, filters)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Update cache
      cacheRef.current.set(cacheKey, {
        data: result.data,
        total: result.total,
        timestamp: Date.now(),
        filters: { ...filters },
        stale: false
      })
      
      setData(result.data)
      setPagination(prev => ({ ...prev, total: result.total }))
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [config, pagination.page, pagination.pageSize, filters, getCacheKey, isCacheValid, markCacheStale])

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
      
      // Mark cache as stale for background refresh
      markCacheStale()
      
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
  }, [config, markCacheStale, fetchData])

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

  // Debounced fetch for better performance
  const debouncedFetch = useCallback((isManualRefresh = false) => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
    
    prefetchTimeoutRef.current = setTimeout(() => {
      fetchData(isManualRefresh)
    }, 100)
  }, [fetchData])

  useEffect(() => {
    fetchData()
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
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
    refreshData: fetchData,
    debouncedFetch,
    markCacheStale
  }
} 