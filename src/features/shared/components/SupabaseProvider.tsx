'use client'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient'

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={getSupabaseClient()}>
      {children}
    </SessionContextProvider>
  )
} 