"use client"

import '../../../styles/dashboard-theme.css'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data }) => {
      const isAdmin = !!data.user && data.user.user_metadata?.role === "admin"
      setIsAdmin(isAdmin)
      setAuthChecked(true)
      if (!isAdmin) {
        router.replace("/login")
      }
    })
  }, [])

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><span className="animate-spin text-2xl">⏳</span></div>
  }

  if (!isAdmin) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" activeTab="dashboard" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="max-w-7xl w-full mx-auto px-4 pb-12">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <p className="text-muted-foreground">Dashboard content will be loaded here.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
