import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "@/features/shared/components/ui/card"
import { Skeleton } from "@/features/shared/components/ui/skeleton"

interface DashboardCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: { value: number; isPositive: boolean }
  loading?: boolean
}

export const DashboardCard = React.memo<DashboardCardProps>(({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  loading = false 
}) => {
  if (loading) {
    return <DashboardCardSkeleton />
  }

  return (
    <Card className="group relative modern-card hover:scale-[1.02] hover:shadow-custom-lg animate-fadeIn">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-card-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-all duration-300 group-hover:scale-105">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-accent-foreground' : 'text-destructive'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 group-hover:text-card-foreground transition-colors">
          {description}
        </p>
      </CardContent>
    </Card>
  )
})

export const DashboardCardSkeleton = React.memo(() => (
  <Card className="relative overflow-hidden modern-card animate-fadeIn">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-shimmer" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
))

DashboardCard.displayName = 'DashboardCard'
DashboardCardSkeleton.displayName = 'DashboardCardSkeleton' 