// Shared components
export { AppSidebar } from './components/layout/app-sidebar'
export { SiteHeader } from './components/layout/site-header'

// Shared hooks
export { useAuth } from './hooks/use-auth'
export { useNotify } from './hooks/useNotify'
export { useIsMobile } from './hooks/use-mobile'

// Shared utilities
export { getSupabaseClient, getAuthenticatedSupabaseClient } from './lib/supabaseClient'
export { cn } from './lib/utils'
export { validateRequiredFields, validateDateRange } from './lib/validation'

// Shared types
export * from './types/rental' 