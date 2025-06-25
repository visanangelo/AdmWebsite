"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/features/shared/lib/utils'

interface ProgressiveSkeletonProps {
  className?: string
  children: React.ReactNode
  loading?: boolean
  delay?: number
  showShimmer?: boolean
  variant?: 'default' | 'card' | 'table' | 'list'
}

export function ProgressiveSkeleton({
  className,
  children,
  loading = false,
  delay = 0,
  showShimmer = true,
  variant = 'default'
}: ProgressiveSkeletonProps) {
  const [shouldShow, setShouldShow] = useState(!loading)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShouldShow(false), delay)
      return () => clearTimeout(timer)
    } else {
      setShouldShow(true)
    }
  }, [loading, delay])

  if (!shouldShow) {
    return (
      <div className={cn(
        "relative overflow-hidden",
        variant === 'card' && "bg-card rounded-lg border p-4",
        variant === 'table' && "bg-card rounded-lg border",
        variant === 'list' && "space-y-2",
        className
      )}>
        {showShimmer && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        )}
        <div className="relative z-10">
          {variant === 'card' && <CardSkeleton />}
          {variant === 'table' && <TableSkeleton />}
          {variant === 'list' && <ListSkeleton />}
          {variant === 'default' && <DefaultSkeleton />}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 bg-muted rounded w-20 animate-pulse" />
          <div className="h-8 bg-muted rounded w-24 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/20">
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
            <div className="flex space-x-2 ml-auto">
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function DefaultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
    </div>
  )
}

// Enhanced skeleton for dashboard cards
export function DashboardCardSkeletonEnhanced() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 border border-gray-200/60 rounded-lg p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted/60 rounded w-24 animate-pulse" />
          <div className="h-8 w-8 bg-muted/60 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-muted/60 rounded w-16 animate-pulse" />
          <div className="h-3 bg-muted/60 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Enhanced skeleton for data tables
export function DataTableSkeletonEnhanced() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-8 bg-muted/60 rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted/60 rounded w-64 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-muted/60 rounded-full animate-pulse" />
            <div className="h-4 bg-muted/60 rounded w-16 animate-pulse" />
          </div>
          <div className="h-10 bg-muted/60 rounded w-24 animate-pulse" />
        </div>
      </div>
      
      <div className="rounded-xl border border-gray-200/60 bg-card overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50">
                <div className="h-4 w-4 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-24 animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-32 animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-20 animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-16 animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-24 animate-pulse" />
                <div className="flex space-x-2 ml-auto">
                  <div className="h-7 w-16 bg-muted/60 rounded-md animate-pulse" />
                  <div className="h-7 w-16 bg-muted/60 rounded-md animate-pulse" />
                  <div className="h-7 w-7 bg-muted/60 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 