import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Performance monitoring utilities
interface PerformanceMetrics {
  cacheHits: number
  cacheMisses: number
  fetchTimes: number[]
  actionTimes: number[]
  tabSwitchTimes: number[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    fetchTimes: [],
    actionTimes: [],
    tabSwitchTimes: []
  }

  private startTimes = new Map<string, number>()

  // Track cache performance
  trackCacheHit() {
    this.metrics.cacheHits++
    this.logMetric()
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++
    this.logMetric()
  }

  // Track data fetching performance
  startFetch(key: string) {
    this.startTimes.set(key, performance.now())
  }

  endFetch(key: string) {
    const startTime = this.startTimes.get(key)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.fetchTimes.push(duration)
      this.startTimes.delete(key)
      this.logMetric()
    }
  }

  // Track action performance
  startAction(key: string) {
    this.startTimes.set(key, performance.now())
  }

  endAction(key: string) {
    const startTime = this.startTimes.get(key)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.actionTimes.push(duration)
      this.startTimes.delete(key)
      this.logMetric()
    }
  }

  // Track tab switching performance
  startTabSwitch() {
    this.startTimes.set('tab_switch', performance.now())
  }

  endTabSwitch() {
    const startTime = this.startTimes.get('tab_switch')
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.tabSwitchTimes.push(duration)
      this.startTimes.delete('tab_switch')
      this.logMetric()
    }
  }

  // Calculate averages
  getAverageFetchTime(): number {
    if (this.metrics.fetchTimes.length === 0) return 0
    return this.metrics.fetchTimes.reduce((a, b) => a + b, 0) / this.metrics.fetchTimes.length
  }

  getAverageActionTime(): number {
    if (this.metrics.actionTimes.length === 0) return 0
    return this.metrics.actionTimes.reduce((a, b) => a + b, 0) / this.metrics.actionTimes.length
  }

  getAverageTabSwitchTime(): number {
    if (this.metrics.tabSwitchTimes.length === 0) return 0
    return this.metrics.tabSwitchTimes.reduce((a, b) => a + b, 0) / this.metrics.tabSwitchTimes.length
  }

  // Get cache hit rate
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      cacheHitRate: this.getCacheHitRate(),
      avgFetchTime: this.getAverageFetchTime(),
      avgActionTime: this.getAverageActionTime(),
      avgTabSwitchTime: this.getAverageTabSwitchTime(),
      totalRequests: this.metrics.fetchTimes.length,
      totalActions: this.metrics.actionTimes.length,
      totalTabSwitches: this.metrics.tabSwitchTimes.length
    }
  }

  // Log metrics (can be extended to send to analytics service)
  private logMetric() {
    // Comment out to silence performance logs
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`[Performance] ${type}:`, data)
    // }
    // In production, you could send this to an analytics service
    // analytics.track('performance_metric', { type, ...data })
  }

  // Reset metrics
  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      fetchTimes: [],
      actionTimes: [],
      tabSwitchTimes: []
    }
    this.startTimes.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions for common performance tracking
export const trackPerformance = {
  cache: {
    hit: () => performanceMonitor.trackCacheHit(),
    miss: () => performanceMonitor.trackCacheMiss()
  },
  fetch: {
    start: (key: string) => performanceMonitor.startFetch(key),
    end: (key: string) => performanceMonitor.endFetch(key)
  },
  action: {
    start: (key: string) => performanceMonitor.startAction(key),
    end: (key: string) => performanceMonitor.endAction(key)
  },
  tabSwitch: {
    start: () => performanceMonitor.startTabSwitch(),
    end: () => performanceMonitor.endTabSwitch()
  },
  getSummary: () => performanceMonitor.getPerformanceSummary(),
  reset: () => performanceMonitor.reset()
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory usage utility
export function getMemoryUsage() {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
    }
  }
  return null
}

// Network status utility
export function getNetworkStatus() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as { connection: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    }
  }
  return null
}
