import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/features/shared/components/ui/card"
import { Skeleton } from "@/features/shared/components/ui/skeleton"

// Enhanced Dashboard Card with modern SaaS design and dark mode support
export const DashboardCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  loading = false 
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: { value: number; isPositive: boolean }
  loading?: boolean
}) => {
  if (loading) {
    return <DashboardCardSkeleton />
  }

  return (
    <Card className="group relative bg-card/80 backdrop-blur-md shadow-[var(--shadow)] border border-border rounded-xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
              trend.isPositive ? 'text-accent' : 'text-destructive'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
})

// Enhanced Loading Skeleton with shimmer effect
export const DashboardCardSkeleton = () => (
  <Card className="relative overflow-hidden bg-card/80 backdrop-blur-md shadow-[var(--shadow)] border border-border rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
)

DashboardCard.displayName = 'DashboardCard'; 