"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, X, Check, CheckCheck,
  FileText, Calendar, UserPlus, Clock
} from 'lucide-react'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string | null
  createdAt: string
  isSystem?: boolean
}

function getNotifIcon(type: string) {
  switch (type) {
    case 'new_application':
      return <FileText className="w-4 h-4 text-blue-600" />
    case 'new_employee':
      return <UserPlus className="w-4 h-4 text-green-600" />
    case 'status_changed':
      return <Check className="w-4 h-4 text-purple-600" />
    case 'review_scheduled':
      return <Calendar className="w-4 h-4 text-orange-600" />
    case 'pending_review':
      return <Clock className="w-4 h-4 text-yellow-600" />
    default:
      return <Bell className="w-4 h-4 text-gray-500" />
  }
}

function getNotifIconBg(type: string): string {
  switch (type) {
    case 'new_application':  return 'bg-blue-100'
    case 'new_employee':     return 'bg-green-100'
    case 'status_changed':   return 'bg-purple-100'
    case 'review_scheduled': return 'bg-orange-100'
    case 'pending_review':   return 'bg-yellow-100'
    default:                 return 'bg-gray-100'
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const allNotifs = data.notifications ?? []
      setNotifications(allNotifs)
      // Only count stored (non-system) unread notifications for the badge
      const storedUnread = allNotifs.filter(
        (n: Notification) => !n.isSystem && !n.isRead
      ).length
      setUnreadCount(storedUnread)
      setError('')
    } catch {
      setError('Could not load notifications')
    }
  }

  async function handleMarkRead(id: string, link: string | null, isSystem?: boolean) {
    if (isSystem) {
      setOpen(false)
      if (link) router.push(link)
      return
    }

    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      await fetchNotifications()
      if (link) {
        setOpen(false)
        router.push(link)
      }
    } catch {
      // Fail silently — re-fetch ensures state matches server
    }
  }

  async function handleMarkAllRead() {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (!res.ok) throw new Error()
      // Re-fetch authoritative state from server
      await fetchNotifications()
    } catch {
      // Badge stays accurate — no local state change on failure
    } finally {
      setLoading(false)
    }
  }

  const firstStoredIndex = notifications.findIndex(n => !n.isSystem)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white/80 hover:text-white transition-colors p-1"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-blue-600 text-xs hover:underline mt-1"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium">All caught up!</p>
                <p className="text-gray-400 text-xs mt-1">No notifications yet.</p>
              </div>
            ) : (
              <>
                {notifications.some(n => n.isSystem) && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      System Status
                    </p>
                  </div>
                )}
                {notifications.map((notif, index) => (
                  <div key={notif.id}>
                    {firstStoredIndex > 0 && index === firstStoredIndex && (
                      <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Recent Events
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleMarkRead(notif.id, notif.link, notif.isSystem)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotifIconBg(notif.type)}`}>
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight flex items-center gap-1 ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                            {notif.isSystem && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full leading-none">
                                LIVE
                              </span>
                            )}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
