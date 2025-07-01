"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/features/shared/components/ui/sidebar"
import { SidebarMenuButton } from "@/features/shared/components/ui/sidebar"

export function NavSecondary({
  items,
  activeTab,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    tab?: string
  }[]
  activeTab?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className={activeTab === item.tab ? "bg-primary text-primary-foreground" : undefined}>
                <a href={item.url} aria-current={activeTab === item.tab ? "page" : undefined}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
