// Shared components
export { AppSidebar } from './components/layout/app-sidebar'
export { SiteHeader } from './components/layout/site-header'

// UI Components
export { Button } from './components/ui/button'
export { Card, CardHeader, CardContent, CardTitle } from './components/ui/card'
export { Input } from './components/ui/input'
export { Label } from './components/ui/label'
export { Badge } from './components/ui/badge'
export { Skeleton } from './components/ui/skeleton'
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './components/ui/dialog'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table'
export { Checkbox } from './components/ui/checkbox'
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from './components/ui/dropdown-menu'
export { Switch } from './components/ui/switch'
export { Textarea } from './components/ui/textarea'
export { Separator } from './components/ui/separator'
export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarInset, SidebarProvider, useSidebar } from './components/ui/sidebar'
export { Avatar, AvatarFallback } from './components/ui/avatar'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
export { ThemeProvider } from './components/ui/theme-provider'
export { ClientLayout } from './components/ui/client-layout'
export { AnimatedStat } from './components/ui/animated-stat'
export { Navbar } from './components/ui/navbar'
export { default as BlurText } from './components/ui/blur-text'
export { ModeToggle } from './components/ui/mode-toggle'
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './components/ui/sheet'
export { toggleVariants } from './components/ui/toggle'

// Shared hooks
export { useAuth } from './hooks/use-auth'
export { useNotify } from './hooks/useNotify'
export { useIsMobile } from './hooks/use-mobile'

// Shared utilities
export { getSupabaseClient } from './lib/supabaseClient'
export { cn } from './lib/utils'
export { validateRequiredFields, validateDateRange } from './lib/validation'

// Shared types
export * from './types/rental' 