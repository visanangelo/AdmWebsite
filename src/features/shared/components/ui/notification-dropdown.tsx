"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, Trash2, X, Loader2, Settings, ExternalLink, Eye } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'
import { useNotifications, type Notification } from '@/features/shared/hooks/useNotifications'
import { cn } from '@/features/shared/lib/utils'
import { useIsMobile } from '@/features/shared'

interface NotificationDropdownProps {
  onTabChange?: (tab: string) => void
}

export function NotificationDropdown({ onTabChange }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { 
    notifications, 
    unreadCount, 
    loading, 
    isConnected, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()

  useEffect(() => { setMounted(true) }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setClickedNotificationId(null)
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleClose])

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleClose])

  const handleToggle = () => {
    if (isAnimating) return
    if (isOpen) {
      handleClose()
    } else {
      setIsAnimating(true)
      setIsOpen(true)
      setTimeout(() => setIsAnimating(false), 50)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (clickedNotificationId === notification.id) return // Prevent double clicks
    
    setClickedNotificationId(notification.id)
    
    try {
      // Mark as read if unread
      if (!notification.read) {
        await markAsRead(notification.id)
      }

      // Navigate to rental requests tab with request ID in URL for highlighting
      handleClose()
      if (notification.data?.requestId) {
        // Update URL with highlight parameter
        const url = new URL(window.location.href)
        url.searchParams.set('highlight', notification.data.requestId)
        url.searchParams.set('tab', 'requests')
        window.history.pushState({}, '', url.toString())
        // Change tabs
        onTabChange?.('requests')
      } else {
        onTabChange?.('requests')
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    } finally {
      // Reset clicked state after a short delay
      setTimeout(() => setClickedNotificationId(null), 1000)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteNotification(id)
  }

  const handleViewRequest = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation()
    
    handleClose()
    if (notification.data?.requestId) {
      // Update URL with highlight parameter
      const url = new URL(window.location.href)
      url.searchParams.set('highlight', notification.data.requestId)
      url.searchParams.set('tab', 'requests')
      window.history.pushState({}, '', url.toString())
      // Change tabs
      onTabChange?.('requests')
    } else {
      onTabChange?.('requests')
    }
  }

  // Modal content
  const modalContent = (
    <div className={cn(
      "fixed inset-0 z-[1000] flex items-center justify-center",
      isOpen ? "pointer-events-auto" : "pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      {/* Centered Modal */}
      <div
        ref={modalRef}
        className={cn(
          // Make modal larger and more prominent on desktop
          "relative z-10 w-full",
          isMobile
            ? "max-w-md mx-auto"
            : "max-w-2xl mx-auto",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2",
          "transition-all duration-200 ease-out"
        )}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <Card className={cn(
          // Larger, more readable card on desktop
          "shadow-2xl border-2 border-primary/20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg",
          "transition-all duration-200",
          isMobile ? "h-[90vh]" : "max-h-[90vh] p-6",
          !isMobile && "rounded-2xl"
        )}>
          {/* Header */}
          <CardHeader className={cn(
            "pb-4 border-b border-border/30 bg-gradient-to-r from-card/80 to-card/60",
            !isMobile && "px-0"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold tracking-tight">Notifications</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Connection Status */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-xs">
                  {isConnected === 'connected' && (
                    <>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-600">Live</span>
                    </>
                  )}
                  {isConnected === 'connecting' && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-blue-600">Connecting</span>
                    </>
                  )}
                  {isConnected === 'disconnected' && (
                    <>
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span className="text-red-600">Offline</span>
                    </>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title="Mark all as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          {/* Content */}
          <CardContent className={cn(
            "p-0",
            !isMobile && "px-0"
          )}>
            <ScrollArea className={cn(
              "transition-all duration-300",
              isMobile ? "h-[calc(90vh-120px)]" : "h-[60vh]"
            )}>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-base text-muted-foreground font-medium">Loading notifications...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Bell className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">No notifications</h3>
                  <p className="text-base text-muted-foreground">
                    You&apos;re all caught up! No new notifications.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <div
                        className={cn(
                          "group relative p-5 rounded-2xl cursor-pointer transition-all duration-300",
                          "hover:bg-muted/60 hover:shadow-lg hover:scale-[1.01]",
                          "active:scale-[0.98]",
                          !notification.read && "bg-primary/5 border border-primary/20 shadow-sm",
                          clickedNotificationId === notification.id && "bg-primary/10 border-primary/30 shadow-md"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-4 top-5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <div className="flex items-start gap-4 pl-4">
                          {/* Icon */}
                          <div className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
                            "border border-blue-500/30"
                          )}>
                            <Bell className="h-6 w-6 text-blue-600" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className={cn(
                                "text-base font-semibold line-clamp-1 text-foreground",
                                !notification.read && "font-bold"
                              )}>
                                {notification.title}
                              </h4>
                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                {notification.data?.requestId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleViewRequest(e, notification)}
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                    title="View request details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            {/* Notification details */}
                            {notification.data && (
                              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Equipment:</span>
                                    <span className="font-medium text-foreground truncate ml-2">
                                      {notification.data.equipmentName}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Requester:</span>
                                    <span className="font-medium text-foreground truncate ml-2">
                                      {notification.data.requesterName}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Rental Period:</span>
                                  <span className="font-medium text-foreground">
                                    {new Date(notification.data.startDate).toLocaleDateString()} - {new Date(notification.data.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {/* Click hint */}
                                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                                  <ExternalLink className="h-3 w-3 text-primary" />
                                  <span className="text-xs text-primary font-medium">
                                    Click to view request details
                                  </span>
                                </div>
                              </div>
                            )}
                            {/* Timestamp */}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && (
                        <Separator className="mx-4 my-2" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-sm hover:text-primary"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger Button (sidebar/header) */}
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-10 w-10 rounded-xl transition-colors hover:bg-primary/10 active:bg-primary/20",
          isOpen && "bg-primary/20 text-primary shadow-lg"
        )}
        onClick={handleToggle}
      >
        <Bell className={cn(
          "h-5 w-5 transition-none",
          isOpen && ""
        )} />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center shadow-lg shadow-red-500/30"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {isConnected === 'connected' && (
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          )}
          {isConnected === 'connecting' && (
            <Loader2 className="h-2 w-2 animate-spin text-blue-500" />
          )}
          {isConnected === 'disconnected' && (
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          )}
        </div>
      </Button>
      {/* Global Modal Portal */}
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  )
} 