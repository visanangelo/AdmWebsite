"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  DatabaseIcon,
  SettingsIcon,
  UserIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  BellIcon,
  CommandIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

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
    badge: "2" // Example badge count
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

export function AppSidebar({ activeTab, role, onTabChange, ...props }: { activeTab?: string, role?: string, onTabChange?: (tab: string) => void } & React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()
  const filteredNav = navMain;
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [showShortcutFeedback, setShowShortcutFeedback] = React.useState(false)

  const handleTabClick = (item: typeof navMain[0]) => {
    if (item.external) {
      window.location.href = item.url
    } else {
      onTabChange && onTabChange(item.tab)
    }
    
    // Close mobile sidebar after tab click
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const showFeedback = () => {
    setShowShortcutFeedback(true)
    setTimeout(() => setShowShortcutFeedback(false), 1000)
  }

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Escape key to close keyboard shortcuts overlay
      if (event.key === 'Escape') {
        if (showKeyboardShortcuts) {
          event.preventDefault()
          setShowKeyboardShortcuts(false)
          return
        }
      }

      // Cmd/Ctrl + K for search (placeholder)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        showFeedback()
        // Focus the search input
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Cmd/Ctrl + / for keyboard shortcuts overlay
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault()
        setShowKeyboardShortcuts(prev => !prev)
      }

      // Number keys for quick navigation (only when not in input)
      if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            showFeedback()
            if (onTabChange) onTabChange('dashboard')
            break
          case '2':
            event.preventDefault()
            showFeedback()
            if (onTabChange) onTabChange('requests')
            break
          case '3':
            event.preventDefault()
            showFeedback()
            if (onTabChange) onTabChange('fleet')
            break
          case '4':
            event.preventDefault()
            showFeedback()
            if (onTabChange) onTabChange('settings')
            break
        }
      }

      // H key for home navigation
      if (event.key.toLowerCase() === 'h' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        showFeedback()
        window.location.href = '/'
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onTabChange, showKeyboardShortcuts])

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30 backdrop-blur-md shadow-2xl border-r border-gray-200/60 md:border-gray-200/40 md:shadow-xl md:bg-gradient-to-b md:from-white md:via-gray-50/80 md:to-gray-100/50 flex flex-col h-full overflow-hidden"
        {...props}
      >
        {/* Enhanced Header with Search and Notifications */}
        <SidebarHeader className="border-b border-gray-200/60 flex-shrink-0 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-sm">Admin Panel</h1>
                <p className="text-xs text-gray-500">Equipment Rental</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 relative"
                    onClick={() => setShowKeyboardShortcuts(prev => !prev)}
                  >
                    <CommandIcon className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">⌘</Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts (⌘/)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
            />
            <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
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
                    `group relative flex items-center w-full rounded-xl transition-all duration-300 px-4 py-3 my-1.5 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1
                    ${activeTab === item.tab
                      ? "bg-gradient-to-r from-primary/10 via-primary/8 to-primary/5 text-primary font-semibold border-l-4 border-primary shadow-lg shadow-primary/10 transform scale-[1.02]"
                      : "hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/60 hover:shadow-md hover:scale-[1.01] hover:border-l-4 hover:border-gray-300/50"}
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
                        ? 'text-primary' 
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                    
                    <span className={`text-base text-left truncate transition-colors duration-300 ${
                      activeTab === item.tab 
                        ? 'text-primary font-semibold' 
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {item.title}
                    </span>
                    
                    {/* Unified Badge Style for Both Notification and Shortcut */}
                    {(item.badge || (!isMobile && item.shortcut)) && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-mono flex-shrink-0 group-hover:opacity-80 transition-opacity">
                        {item.badge || item.shortcut}
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-200/60 flex-shrink-0 bg-gradient-to-t from-gray-50/50 to-transparent overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Notifications */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <BellIcon className="h-4 w-4 text-gray-600" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-gray-700">Notifications</span>
              </div>
              <Badge className="bg-red-100 text-red-700 text-xs">3</Badge>
            </div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 focus:outline-none w-full p-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/60 transition-all duration-300 touch-manipulation group">
                  <Avatar className="h-9 w-9 md:h-8 md:w-8 ring-2 ring-gray-200/60 group-hover:ring-primary/20 transition-all duration-300 flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">AU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm md:text-base truncate text-gray-700 group-hover:text-gray-900 transition-colors duration-300 block">
                      Admin User
                    </span>
                    <span className="text-xs text-gray-500 truncate block">admin@company.com</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 shadow-xl border-gray-200/60 bg-white/95 backdrop-blur-md">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-500">admin@company.com</p>
                </div>
                <DropdownMenuItem asChild>
                  <button type="button" onClick={() => onTabChange && onTabChange('profile')} className="w-full text-left transition-colors duration-150 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 p-3 rounded-lg">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button type="button" onClick={() => onTabChange && onTabChange('settings')} className="w-full text-left transition-colors duration-150 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 p-3 rounded-lg">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 p-3 rounded-lg text-red-600 hover:text-red-700">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Logout
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Keyboard Shortcuts Overlay */}
      {showKeyboardShortcuts && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowKeyboardShortcuts(false)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Search</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Dashboard</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">1</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Requests</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Fleet</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">3</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Settings</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Home</span>
                <kbd className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">H</kbd>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">⌘/</kbd> or <kbd className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Keyboard Shortcut Feedback */}
      <AnimatePresence>
        {showShortcutFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Shortcut activated</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
