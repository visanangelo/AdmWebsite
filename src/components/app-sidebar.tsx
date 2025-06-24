"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  DatabaseIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard?tab=dashboard",
    icon: LayoutDashboardIcon,
    tab: "dashboard",
    shortcut: "1"
  },
  {
    title: "Rental Requests",
    url: "/dashboard?tab=requests",
    icon: ClipboardListIcon,
    tab: "requests",
    shortcut: "2"
  },
  {
    title: "Fleet",
    url: "/dashboard?tab=fleet",
    icon: DatabaseIcon,
    tab: "fleet",
    shortcut: "3"
  },
  {
    title: "Settings",
    url: "/dashboard?tab=settings",
    icon: SettingsIcon,
    tab: "settings",
    shortcut: "4"
  },
]

export function AppSidebar({ activeTab, role, onTabChange, ...props }: { activeTab?: string, role?: string, onTabChange?: (tab: string) => void } & React.ComponentProps<typeof Sidebar>) {
  // Always show all navMain items
  const filteredNav = navMain;
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('dashboard')}
                className="flex items-center w-full transition-all duration-200 ease-in-out hover:bg-muted/50 active:scale-95"
              >
                <LayoutDashboardIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Admin Panel</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className={activeTab === item.tab ? "bg-primary text-primary-foreground" : undefined}>
                <button
                  type="button"
                  onClick={() => onTabChange && onTabChange(item.tab)}
                  aria-current={activeTab === item.tab ? "page" : undefined}
                  className="flex items-center w-full transition-all duration-200 ease-in-out hover:bg-muted/50 active:scale-95"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-60">{item.shortcut}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none">
                <Avatar>
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <span className="font-medium">Admin User</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <button type="button" onClick={() => onTabChange && onTabChange('profile')} className="w-full text-left transition-colors duration-150 hover:bg-muted/50">Profile</button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button type="button" onClick={() => onTabChange && onTabChange('settings')} className="w-full text-left transition-colors duration-150 hover:bg-muted/50">Settings</button>
              </DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
