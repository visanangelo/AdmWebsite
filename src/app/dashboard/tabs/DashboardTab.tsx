import React from 'react'
import { DashboardCard, DashboardCardSkeleton } from "@/features/dashboard"
import { Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface DashboardTabProps {
  loading: boolean
  dashboardStats: {
    activeRentals: number
    fleetAvailable: number
    fleetInUse: number
    pendingRequests: number
  }
}

const DashboardTab: React.FC<DashboardTabProps> = ({ loading, dashboardStats }) => {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12">
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
          </>
        ) : (
          <>
            <DashboardCard
              title="Active Rentals"
              value={dashboardStats.activeRentals}
              icon={Truck}
              description="Currently rented equipment"
            />
            <DashboardCard
              title="Fleet Available"
              value={dashboardStats.fleetAvailable}
              icon={CheckCircle}
              description="Ready for rental"
            />
            <DashboardCard
              title="Fleet In Use"
              value={dashboardStats.fleetInUse}
              icon={Clock}
              description="Currently in use"
            />
            <DashboardCard
              title="Pending Requests"
              value={dashboardStats.pendingRequests}
              icon={AlertCircle}
              description="Awaiting approval"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardTab 