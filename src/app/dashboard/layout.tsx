import { ReactNode } from 'react'

// Force dynamic rendering for the entire dashboard
export const dynamic = 'force-dynamic'
export const revalidate = false
export const fetchCache = 'force-no-store'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 