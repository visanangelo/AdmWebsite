"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Check, Trash2, Loader2, Eye, Filter } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Separator } from './separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { useNotifications, type Notification } from '@/features/shared/hooks/useNotifications'
import { cn } from '@/features/shared/lib/utils'
import { useIsMobile } from '@/features/shared'

// CSS for smooth swipe interactions
const swipeStyles = `
  .swipe-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  .swipe-container::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = swipeStyles
  document.head.appendChild(style)
}

interface NotificationDropdownProps {
  onTabChange?: (tab: string) => void
  triggerRef?: React.RefObject<HTMLButtonElement>
  setOpenMobile?: (open: boolean) => void
  setHighlightedRequestId?: (id: string | null) => void
}

interface SwipeableNotificationProps {
  notification: Notification
  onClick: () => void
  onView: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  clickedNotificationId: string | null
  formatTime: (dateString: string) => string
}

function SwipeableNotification({ 
  notification, 
  onClick, 
  onView, 
  onDelete, 
  clickedNotificationId, 
  formatTime 
}: SwipeableNotificationProps) {
  const [isSwiped, setIsSwiped] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Reset swipe state when notification changes
  useEffect(() => {
    setIsSwiped(false)
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0
    }
  }, [notification.id])

  const actionWidth = 140; // Lățimea acțiunilor
  const isTouching = useRef(false);

  // Blocare absolută a scroll-ului la actionWidth
  const limitScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    if (container.scrollLeft > actionWidth) {
      container.scrollLeft = actionWidth;
    }
    if (container.scrollLeft < 0) {
      container.scrollLeft = 0;
    }
    if (isTouching.current) {
      requestAnimationFrame(limitScroll);
    }
  };

  const handleTouchStart = () => {
    isTouching.current = true;
    limitScroll();
  };

  const handleTouchEnd = () => {
    isTouching.current = false;
    if (!containerRef.current) return;
    const container = containerRef.current;
    const currentScrollLeft = container.scrollLeft;
    const minSwipeDistance = 30;
    // Snap logic
    if (!isSwiped) {
      // Swipe stânga (deschidere)
      if (currentScrollLeft > minSwipeDistance) {
        setIsSwiped(true);
        container.scrollTo({ left: actionWidth, behavior: 'smooth' });
      } else {
        setIsSwiped(false);
        container.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else {
      // Swipe dreapta (închidere) - orice swipe dreapta duce la 0
      setIsSwiped(false);
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Adaugă limitare la scroll pe touch move
  const handleTouchMove = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // Limitează scroll-ul între 0 și actionWidth
    container.scrollLeft = Math.max(0, Math.min(container.scrollLeft, actionWidth));
  };

  // Adaugă limitare la scroll și pe onScroll (pentru orice alt gest nativ)
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    if (container.scrollLeft > actionWidth) {
      container.scrollLeft = actionWidth;
    }
    if (container.scrollLeft < 0) {
      container.scrollLeft = 0;
    }
  };


  
  
  
  

  const handleActionClick = (e: React.MouseEvent, action: 'view' | 'delete') => {
    e.stopPropagation()
    if (isMobile) {
      setIsSwiped(false)
      if (containerRef.current) {
        containerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      }
    }
    if (action === 'view') {
      onView(e)
    } else {
      onDelete(e)
    }
  }

  const handleCardClick = () => {
    if (isMobile && isSwiped) {
      setIsSwiped(false)
      if (containerRef.current) {
        containerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      }
      return
    }
    onClick()
  }

  // Desktop version - regular card with always-visible actions
  if (!isMobile) {
    return (
      <div
        className={cn(
          "group relative p-4 rounded-xl cursor-pointer transition-all duration-200",
          "hover:bg-muted/60 hover:shadow-sm",
          "active:scale-[0.98]",
          !notification.read && "bg-primary/5 border border-primary/20",
          clickedNotificationId === notification.id && "bg-primary/10 border-primary/30"
        )}
        onClick={handleCardClick}
      >
        {!notification.read && (
          <div className="absolute left-3 top-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
        <div className="flex items-start gap-3 pl-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn(
                "text-sm font-semibold line-clamp-1",
                !notification.read && "font-bold"
              )}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-1">
                {notification.data?.requestId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleActionClick(e, 'view')}
                    className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    title="View request details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleActionClick(e, 'delete')}
                  className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {notification.message}
            </p>
            {notification.data && (
              <div className="space-y-1 p-2 rounded-lg bg-muted/30 border border-border/30">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment:</span>
                    <span className="font-medium truncate ml-2">
                      {notification.data.equipmentName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requester:</span>
                    <span className="font-medium truncate ml-2">
                      {notification.data.requesterName}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {new Date(notification.data.startDate).toLocaleDateString()} - {new Date(notification.data.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
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
    )
  }

  // Mobile version - CSS scroll-snap swipeable card
  return (
    <div 
      ref={containerRef}
      className="swipe-container overflow-x-auto scrollbar-hide"
      style={{
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        overscrollBehaviorX: 'none', // blochează complet bounce-ul la dreapta
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onScroll={handleScroll}
    >
      <div className="flex">
        {/* Main notification card */}
        <div
          className="swipe-element flex-shrink-0 w-full"
          style={{ scrollSnapAlign: 'start' }}
          onClick={handleCardClick}
        >
          <div
            className={cn(
              "relative bg-background cursor-pointer p-4 rounded-xl",
              "hover:bg-muted/60 hover:shadow-sm",
              "active:scale-[0.98]",
              !notification.read && "bg-primary/5 border border-primary/20",
              clickedNotificationId === notification.id && "bg-primary/10 border-primary/30"
            )}
          >
            {!notification.read && (
              <div className="absolute left-3 top-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            <div className="flex items-start gap-3 pl-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={cn(
                    "text-sm font-semibold line-clamp-1",
                    !notification.read && "font-bold"
                  )}>
                    {notification.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                  {notification.message}
                </p>
                {notification.data && (
                  <div className="space-y-1 p-2 rounded-lg bg-muted/30 border border-border/30">
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipment:</span>
                        <span className="font-medium truncate ml-2">
                          {notification.data.equipmentName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requester:</span>
                        <span className="font-medium truncate ml-2">
                          {notification.data.requesterName}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-medium">
                        {new Date(notification.data.startDate).toLocaleDateString()} - {new Date(notification.data.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(notification.created_at)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Swipe left for actions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - wider and full height */}
        <div 
          className="action flex-shrink-0 flex"
          style={{ 
            minWidth: '140px', // Wider actions
            width: '140px',
            scrollSnapAlign: 'end'
          }}
        >
          {notification.data?.requestId && (
            <button
              onClick={(e) => handleActionClick(e, 'view')}
              className="flex-1 h-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-all duration-200 p-0 m-0"
              style={{ minWidth: '70px' }}
              title="View request details"
            >
              <Eye className="h-7 w-7 text-white" />
            </button>
          )}
          <button
            onClick={(e) => handleActionClick(e, 'delete')}
            className="flex-1 h-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all duration-200 p-0 m-0"
            style={{ minWidth: '70px', background: '#dc2626' }}
            title="Delete notification"
          >
            <Trash2 className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotificationDropdown({ onTabChange, triggerRef: externalTriggerRef, setOpenMobile, setHighlightedRequestId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const internalTriggerRef = useRef<HTMLButtonElement>(null)
  const triggerRef = externalTriggerRef || internalTriggerRef
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

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

  const handleToggle = () => {
    if (isOpen) {
      handleClose()
    } else {
      setIsOpen(true)
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
    if (clickedNotificationId === notification.id) return
    
    setClickedNotificationId(notification.id)
    
    try {
      if (!notification.read) {
        await markAsRead(notification.id)
      }

      handleClose()
      
      // Close mobile sidebar if open
      if (setOpenMobile) {
        setOpenMobile(false)
      }
      
      if (notification.data?.requestId) {
        // Set highlight and navigate to requests tab
        setHighlightedRequestId?.(notification.data.requestId)
        onTabChange?.('requests')
        
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedRequestId?.(null)
        }, 5000)
        
        // Scroll to the highlighted request
        setTimeout(() => {
          const highlightedRow = document.querySelector(`[data-row-id="${notification.data.requestId}"]`)
          if (highlightedRow) {
            highlightedRow.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            })
          }
        }, 1000)
      } else {
        onTabChange?.('requests')
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    } finally {
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
    
    // Close mobile sidebar if open
    if (setOpenMobile) {
      setOpenMobile(false)
    }
    
    if (notification.data?.requestId) {
      // Set highlight and navigate to requests tab
      setHighlightedRequestId?.(notification.data.requestId)
      onTabChange?.('requests')
      
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedRequestId?.(null)
      }, 5000)
      
      // Scroll to the highlighted request
      setTimeout(() => {
        const highlightedRow = document.querySelector(`[data-row-id="${notification.data.requestId}"]`)
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 1000)
    } else {
      onTabChange?.('requests')
    }
  }

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  )

  const getConnectionStatus = () => {
    switch (isConnected) {
      case 'connected':
        return { icon: '🟢', text: 'Live', color: 'text-green-600' }
      case 'connecting':
        return { icon: '🟡', text: 'Connecting', color: 'text-yellow-600' }
      case 'disconnected':
        return { icon: '🔴', text: 'Offline', color: 'text-red-600' }
      default:
        return { icon: '⚪', text: 'Unknown', color: 'text-gray-600' }
    }
  }

  const connectionStatus = getConnectionStatus()

  if (!mounted) return null

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full p-0 hover:bg-muted/50"
            onClick={handleToggle}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold">Notifications</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons row - better spacing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-xs">
                <span>{connectionStatus.icon}</span>
                <span className={connectionStatus.color}>{connectionStatus.text}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 px-3 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Filter */}
          <div className="flex-shrink-0 px-6 py-3 border-b">
            <Select value={filter} onValueChange={(value: 'all' | 'unread') => setFilter(value)}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Content - simplified structure for proper scrolling */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <SwipeableNotification
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onView={(e) => handleViewRequest(e, notification)}
                      onDelete={(e) => handleDeleteNotification(e, notification.id)}
                      clickedNotificationId={clickedNotificationId}
                      formatTime={formatTime}
                    />
                    {index < filteredNotifications.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Use Popover component
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-muted/50"
          onClick={handleToggle}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col h-[500px]">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-xs">
                  <span>{connectionStatus.icon}</span>
                  <span className={connectionStatus.color}>{connectionStatus.text}</span>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Select value={filter} onValueChange={(value: 'all' | 'unread') => setFilter(value)}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <SwipeableNotification
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onView={(e) => handleViewRequest(e, notification)}
                      onDelete={(e) => handleDeleteNotification(e, notification.id)}
                      clickedNotificationId={clickedNotificationId}
                      formatTime={formatTime}
                    />
                    {index < filteredNotifications.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 