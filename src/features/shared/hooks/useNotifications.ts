"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getSupabaseClient } from '@/features/shared/lib/supabaseClient'
import {
  addNotificationsListener,
} from '@/lib/notifications-realtime'

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

/**
 * React hook that exposes notifications state and mutation helpers.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState<'connected' | 'disconnected'>('disconnected')

  /** Always derived from notifications array. */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  /* ---------- Fetch initial list ---------- */
  const fetchNotifications = useCallback(async () => {
    setLoading(true)

    const { data, error } = await getSupabaseClient()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) console.error('fetchNotifications error:', error)
    if (data) setNotifications(data as Notification[])

    setLoading(false)
  }, [])

  /* ---------- Server mutations ---------- */
  const patchNotification = useCallback(
    (id: string, patch: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
      )
    },
    []
  )

  const markAsRead = useCallback(
    async (id: string) => {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (!error) patchNotification(id, { read: true })
      else console.error('markAsRead error:', error)
    },
    [patchNotification]
  )

  const markAllAsRead = useCallback(async () => {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    if (!error) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    else console.error('markAllAsRead error:', error)
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .delete()
      .eq('id', id)

    if (!error)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    else console.error('deleteNotification error:', error)
  }, [])

  /* ---------- Realtime subscription ---------- */
  useEffect(() => {
    // initial fetch
    fetchNotifications().finally(() => setIsConnected('connected'))

    // register singleton listener
    const unsubscribe = addNotificationsListener((payload) => {
      setNotifications((prev) => {
        let next = [...prev]
        if (payload.eventType === 'INSERT') {
          next = [payload.new as Notification, ...next]
        } else if (payload.eventType === 'UPDATE') {
          next = next.map((n) =>
            n.id === (payload.new as Notification).id
              ? (payload.new as Notification)
              : n
          )
        } else if (payload.eventType === 'DELETE') {
          next = next.filter((n) => n.id !== (payload.old as Notification).id)
        }
        return next
      })
    })

    // cleanup for this component only: remove its listener
    return () => {
      unsubscribe()
    }
  }, [fetchNotifications])

  /* ---------- Optional: global cleanup ---------- */
  // e.g. call closeNotificationsChannel() inside an AuthProvider sign‑out flow
  //testing
  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  }
} 