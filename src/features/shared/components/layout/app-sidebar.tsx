"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  DatabaseIcon,
  SettingsIcon,
  UserIcon,
  HomeIcon,
  BellIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/features/shared/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/features/shared/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/features/shared/components/ui/dropdown-menu"
import { Badge } from "@/features/shared/components/ui/badge"
import { useIsMobile, useAuth } from "@/features/shared"

const navMain = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
    tab: "home",
    shortcut: "H",
    external: true,
    badge: null
  },
  {
    title: "Dashboard",
    url: "/dashboard?tab=dashboard",
    icon: LayoutDashboardIcon,
    tab: "dashboard",
    shortcut: "1",
    badge: null
  },
  {
    title: "Rental Requests",
    url: "/dashboard?tab=requests",
    icon: ClipboardListIcon,
    tab: "requests",
    shortcut: "2",
    badge: null
  },
  {
    title: "Fleet",
    url: "/dashboard?tab=fleet",
    icon: DatabaseIcon,
    tab: "fleet",
    shortcut: "3",
    badge: null
  },
  {
    title: "Settings",
    url: "/dashboard?tab=settings",
    icon: SettingsIcon,
    tab: "settings",
    shortcut: "4",
    badge: null
  },
]

export function AppSidebar({ activeTab, onTabChange, ...props }: { activeTab?: string, onTabChange?: (tab: string) => void } & React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()
  const router = useRouter()
  const { signOut } = useAuth()
  const filteredNav = navMain;

  const handleTabClick = (item: typeof navMain[0]) => {
    if (item.external) {
      window.location.href = item.url;
    } else {
      if (onTabChange) {
        onTabChange(item.tab);
      }
    }

    // Close mobile sidebar after tab click
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const handleLogout = React.useCallback(async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [signOut, router])

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="bg-gradient-to-b from-background/80 to-card/80 backdrop-blur-md shadow-[var(--shadow)] border-r border-border flex flex-col h-full overflow-hidden"
        {...props}
      >
        {/* Enhanced Header with Search and Notifications */}
        <SidebarHeader className="border-b border-border flex-shrink-0 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Equipment Rental</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden pt-6 min-h-0">
          <SidebarMenu>
            {filteredNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={isMobile ? undefined : item.title} 
                  className={
                    `group relative flex items-center w-full rounded-xl transition-all duration-300 px-4 py-3 my-1.5 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 sidebar-tab-modern
                    ${activeTab === item.tab
                      ? "sidebar-tab-active text-sidebar-tab-foreground font-semibold border-l-4 border-primary transform scale-[1.02] backdrop-blur-sm"
                      : "hover:bg-sidebar-tab/80 hover:text-sidebar-tab-foreground hover:shadow-lg hover:scale-[1.01] hover:border-l-4 hover:border-primary/40"}
                    touch-manipulation`
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleTabClick(item)}
                    aria-current={activeTab === item.tab ? "page" : undefined}
                    className="flex items-center w-full relative"
                  >
                    {/* Active indicator */}
                    {activeTab === item.tab && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full animate-pulse" />
                    )}
                    
                    <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-all duration-300 ${
                      activeTab === item.tab 
                        ? 'text-sidebar-tab-foreground' 
                        : 'text-muted-foreground group-hover:text-sidebar-tab-foreground'
                    }`} />
                    
                    <span className={`text-base text-left truncate transition-colors duration-300 ${
                      activeTab === item.tab 
                        ? 'text-sidebar-tab-foreground font-semibold' 
                        : 'text-foreground group-hover:text-sidebar-tab-foreground'
                    }`}>
                      {item.title}
                    </span>
                    
                    {/* Unified Badge Style for Both Notification and Shortcut */}
                    {(item.badge || (!isMobile && item.shortcut)) && (
                      <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-mono flex-shrink-0 group-hover:opacity-80 transition-opacity">
                        {item.badge || item.shortcut}
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-border flex-shrink-0 bg-gradient-to-t from-card/80 to-transparent overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Notifications */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <BellIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-foreground">Notifications</span>
              </div>
              <Badge className="bg-destructive/10 text-destructive text-xs">3</Badge>
            </div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 focus:outline-none w-full p-3 rounded-xl hover:bg-muted/60 transition-all duration-300 touch-manipulation group">
                  <Avatar className="h-9 w-9 md:h-8 md:w-8 ring-2 ring-border group-hover:ring-primary/20 transition-all duration-300 flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">AU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm md:text-base truncate text-foreground group-hover:text-primary transition-colors duration-300 block">
                      Admin User
                    </span>
                    <span className="text-xs text-muted-foreground truncate block">admin@company.com</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 shadow-xl border-border bg-card/95 backdrop-blur-md">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@company.com</p>
                </div>
                <DropdownMenuItem asChild>
                  <button type="button" onClick={() => onTabChange && onTabChange('profile')} className="w-full text-left transition-colors duration-150 hover:bg-primary/5 p-3 rounded-lg">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button type="button" onClick={() => onTabChange && onTabChange('settings')} className="w-full text-left transition-colors duration-150 hover:bg-primary/5 p-3 rounded-lg">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button 
                    type="button" 
                    onClick={handleLogout}
                    className="w-full text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 p-3 rounded-lg text-red-600 hover:text-red-700 transition-colors duration-150"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      Logout
                    </span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
