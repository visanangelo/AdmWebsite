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
  },
  {
    title: "Rental Requests",
    url: "/dashboard?tab=requests",
    icon: ClipboardListIcon,
    tab: "requests",
  },
  {
    title: "Fleet",
    url: "/dashboard?tab=fleet",
    icon: DatabaseIcon,
    tab: "fleet",
  },
  {
    title: "Settings",
    url: "/dashboard?tab=settings",
    icon: SettingsIcon,
    tab: "settings",
  },
]

export function AppSidebar({ activeTab, role, ...props }: { activeTab?: string, role?: string } & React.ComponentProps<typeof Sidebar>) {
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
              <a href="/dashboard?tab=dashboard">
                <LayoutDashboardIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Admin Panel</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className={activeTab === item.tab ? "bg-primary text-primary-foreground" : undefined}>
                <a href={item.url} aria-current={activeTab === item.tab ? "page" : undefined}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
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
                  <AvatarImage src="/avatars/shadcn.jpg" alt="User avatar" />
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <span className="font-medium">Admin User</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <a href="/dashboard?tab=profile">Profile</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard?tab=settings">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
