"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { User, Session } from '@supabase/supabase-js'

// Enhanced cache with session tracking
interface UserCache {
  user: User | null
  timestamp: number
  sessionId: string | null
}

let userCache: UserCache | null = null
const CACHE_DURATION = 2 * 60 * 1000 // Reduced to 2 minutes for better security

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isAdmin: false
  })
  
  const subscriptionRef = useRef<unknown>(null)
  const mountedRef = useRef(true)
  const currentSessionIdRef = useRef<string | null>(null)

  // Generate session ID for cache validation
  const getSessionId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession()
      return session?.access_token ? session.access_token.slice(-20) : null
    } catch {
      return null
    }
  }, [])

  // Memoized user check to prevent unnecessary recalculations
  const updateUserState = useCallback((user: User | null) => {
    if (!mountedRef.current) return
    
    const isAuthenticated = !!user
    const isAdmin = user?.user_metadata?.role === 'admin'
    
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated,
      isAdmin,
      loading: false,
      error: null
    }))
  }, [])

  // Memoized error handler
  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return
    
    console.error('Auth error:', error)
    setState(prev => ({
      ...prev,
      error: error.message,
      loading: false
    }))
  }, [])

  // Clear cache with session validation
  const clearCache = useCallback(() => {
    userCache = null
  }, [])

  // Memoized sign out function
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      // Clear cache immediately
      clearCache()
      
      const { error } = await getSupabaseClient().auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Update state after successful sign out
      updateUserState(null)
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateUserState, handleError, clearCache])

  // Memoized initial user fetch with enhanced caching
  const getInitialUser = useCallback(async () => {
    try {
      const sessionId = await getSessionId()
      currentSessionIdRef.current = sessionId

      // Check cache with session validation
      if (userCache && 
          Date.now() - userCache.timestamp < CACHE_DURATION &&
          userCache.sessionId === sessionId) {
        updateUserState(userCache.user)
        return
      }

      // Cache miss or invalid - fetch fresh data
      const { data: { user }, error } = await getSupabaseClient().auth.getUser()
      
      if (error) {
        throw error
      }

      // Update cache with session ID
      userCache = { 
        user, 
        timestamp: Date.now(),
        sessionId 
      }
      updateUserState(user)
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateUserState, handleError, getSessionId])

  // Memoized auth state change handler
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    const user = session?.user ?? null
    const sessionId = session?.access_token ? session.access_token.slice(-20) : null
    
    // Clear cache on auth state changes to ensure fresh data
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      clearCache()
    }
    
    // Update cache with new session ID
    userCache = { 
      user, 
      timestamp: Date.now(),
      sessionId 
    }
    currentSessionIdRef.current = sessionId
    updateUserState(user)
  }, [updateUserState, clearCache])

  useEffect(() => {
    mountedRef.current = true
    
    // Get initial user state
    getInitialUser()

    // Set up auth state listener
    const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange(handleAuthStateChange)
    subscriptionRef.current = subscription

    // Cleanup function
    return () => {
      mountedRef.current = false
      if (subscriptionRef.current) {
        (subscriptionRef.current as { unsubscribe: () => void }).unsubscribe()
      }
    }
  }, [getInitialUser, handleAuthStateChange])

  // Memoized return values to prevent unnecessary re-renders
  const memoizedState = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    error: state.error,
    signOut,
    isAdmin: state.isAdmin,
    isAuthenticated: state.isAuthenticated
  }), [state.user, state.loading, state.error, state.isAdmin, state.isAuthenticated, signOut])

  return memoizedState
} 