"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string | null
  type: 'rental_request'
  title: string
  message: string
  data: {
    requestId: string
    requesterName: string
    equipmentName: string
    startDate: string
    endDate: string
    equipmentImage?: string
  }
  read: boolean
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [loading, setLoading] = useState(true)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const initializedRef = useRef(false)
  const isSubscribingRef = useRef(false)

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await getSupabaseClient()
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state and recalculate unread count
      setNotifications(prev => {
        const newNotifications = prev.map(n => n.id === id ? { ...n, read: true } : n)
        const newUnreadCount = newNotifications.filter(n => !n.read).length
        setUnreadCount(newUnreadCount)
        return newNotifications
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .update({ read: true })
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return
      }

      // Update local state and recalculate unread count
      setNotifications(prev => {
        const newNotifications = prev.map(n => ({ ...n, read: true }))
        setUnreadCount(0)
        return newNotifications
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting notification:', error)
        return
      }

      // Update local state and recalculate unread count
      setNotifications(prev => {
        const newNotifications = prev.filter(n => n.id !== id)
        const newUnreadCount = newNotifications.filter(n => !n.read).length
        setUnreadCount(newUnreadCount)
        return newNotifications
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [])

  // Setup real-time subscription - NO DEPENDENCIES to prevent recreation
  const setupRealtimeSubscription = useCallback(() => {
    // Prevent multiple simultaneous subscriptions
    if (isSubscribingRef.current || subscriptionRef.current) {
      return
    }

    isSubscribingRef.current = true

    try {
      // Cleanup any existing subscription first
      if (subscriptionRef.current) {
        getSupabaseClient().removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      // Create new subscription using exact same pattern as dashboard
      const channel = getSupabaseClient()
        .channel('notifications_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            // Use setNotifications directly to avoid dependency issues (same as dashboard)
            setNotifications((prev: Notification[]) => {
              let newNotifications = [...prev]
              
              if (payload.eventType === 'INSERT') {
                const newNotification = payload.new as Notification
                newNotifications = [newNotification, ...newNotifications]
              } else if (payload.eventType === 'UPDATE') {
                const updatedNotification = payload.new as Notification
                newNotifications = newNotifications.map(n => 
                  n.id === updatedNotification.id ? updatedNotification : n
                )
              } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old?.id
                if (deletedId) {
                  newNotifications = newNotifications.filter(n => n.id !== deletedId)
                }
              }
              
              // Always recalculate unread count from the current notifications array
              // This ensures accuracy and prevents race conditions
              const newUnreadCount = newNotifications.filter(n => !n.read).length
              setUnreadCount(newUnreadCount)
              
              return newNotifications
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected('connected')
            isSubscribingRef.current = false
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected('disconnected')
            isSubscribingRef.current = false
            subscriptionRef.current = null
          }
        })

      subscriptionRef.current = channel
    } catch (error) {
      console.error('Error setting up real-time subscription:', error)
      isSubscribingRef.current = false
    }
  }, []) // NO DEPENDENCIES

  // Initialize data and setup realtime subscription
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeData = async () => {
      await fetchNotifications()
      setupRealtimeSubscription()
    }

    initializeData()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        getSupabaseClient().removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      isSubscribingRef.current = false
      initializedRef.current = false
    }
  }, [fetchNotifications, setupRealtimeSubscription])

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  }
} 