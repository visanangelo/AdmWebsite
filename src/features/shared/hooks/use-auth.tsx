"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getSupabaseClient } from '@/features/shared'
import { User, Session } from '@supabase/supabase-js'

// Enhanced cache with session tracking
interface UserCache {
  user: User | null
  session: Session | null
  timestamp: number
  sessionId: string | null
}

let userCache: UserCache | null = null
const CACHE_DURATION = 2 * 60 * 1000 // Reduced to 2 minutes for better security

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
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
  const updateUserState = useCallback((user: User | null, session: Session | null) => {
    if (!mountedRef.current) return
    
    const isAuthenticated = !!user
    // Check both app_metadata and user_metadata for role compatibility
    const appMetadataRole = user?.app_metadata?.role
    const userMetadataRole = user?.user_metadata?.role
    
    // Support both 'admin' and 'super-admin' roles for backward compatibility
    const isAdmin = appMetadataRole === 'super-admin' || 
                   appMetadataRole === 'admin' || 
                   userMetadataRole === 'admin' || 
                   userMetadataRole === 'super-admin'
    
    console.log('🔍 User role check:', {
      appMetadataRole,
      userMetadataRole,
      isAdmin,
      appMetadata: user?.app_metadata,
      userMetadata: user?.user_metadata,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token
    })

    // Log warning if there's a role conflict
    if (appMetadataRole && userMetadataRole && appMetadataRole !== userMetadataRole) {
      console.warn('⚠️ Role conflict detected:', {
        appMetadataRole,
        userMetadataRole,
        message: 'Using both roles for compatibility'
      })
    }
    
    setState(prev => ({
      ...prev,
      user,
      session,
      isAuthenticated,
      isAdmin,
      loading: false,
      error: null
    }))
  }, [])

  // Memoized error handler
  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return
    
    // console.error('Auth error:', error)
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
      
      // Force immediate state reset for better UX
      updateUserState(null, null)
      
      const { error } = await getSupabaseClient().auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Ensure state is properly cleared
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null
      }))
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateUserState, handleError, clearCache])

  // Memoized initial user fetch with enhanced caching
  const getInitialUser = useCallback(async () => {
    try {
      // console.log('getInitialUser called - fetching session...');
      const sessionId = await getSessionId()
      currentSessionIdRef.current = sessionId
      // console.log('Session ID:', sessionId);

      // Check cache with session validation
      if (userCache && 
          Date.now() - userCache.timestamp < CACHE_DURATION &&
          userCache.sessionId === sessionId) {
        // console.log('Using cached session data');
        updateUserState(userCache.user, userCache.session)
        return
      }

      // Cache miss or invalid - fetch fresh data
      // console.log('Fetching fresh session data...');
      const { data: { session }, error } = await getSupabaseClient().auth.getSession()
      
      if (error) {
        // console.error('Error fetching session:', error);
        throw error
      }

      const user = session?.user || null
      // console.log('Fresh session data:', { 
      //   hasSession: !!session, 
      //   hasUser: !!user, 
      //   hasAccessToken: !!session?.access_token,
      //   userRole: user?.app_metadata?.role 
      // });

      // Update cache with session ID
      userCache = { 
        user, 
        session: session || null,
        timestamp: Date.now(),
        sessionId 
      }
      updateUserState(user, session)
    } catch (error) {
      // console.error('Error in getInitialUser:', error);
      handleError(error as Error)
    }
  }, [updateUserState, handleError, getSessionId])

  // Memoized auth state change handler
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    // console.log('Auth state change:', { event, hasSession: !!session, hasAccessToken: !!session?.access_token });
    const user = session?.user ?? null
    const sessionId = session?.access_token ? session.access_token.slice(-20) : null
    
    // Clear cache on auth state changes to ensure fresh data
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // console.log('Clearing cache due to auth state change:', event);
      clearCache()
    }
    
    // Update cache with new session ID
    userCache = { 
      user, 
      session,
      timestamp: Date.now(),
      sessionId 
    }
    currentSessionIdRef.current = sessionId
    // console.log('Updated user state with session:', { hasUser: !!user, hasSession: !!session });
    updateUserState(user, session)
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
        (subscriptionRef.current as { unsubscribe: () => void } | null)?.unsubscribe?.()
      }
    }
  }, [getInitialUser, handleAuthStateChange])

  // Memoized return values to prevent unnecessary re-renders
  const memoizedState = useMemo(() => ({
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signOut,
    isAdmin: state.isAdmin,
    isAuthenticated: state.isAuthenticated
  }), [state.user, state.session, state.loading, state.error, state.isAdmin, state.isAuthenticated, signOut])

  return memoizedState
} 