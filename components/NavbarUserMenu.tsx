"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, LogOut, Settings, User, Shield
} from 'lucide-react'

type AdminUser = {
  id: string
  name: string
  email: string
  username: string
  role: string
}

export default function NavbarUserMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current &&
          !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = user?.name ?? 'Admin User'
  const displayEmail = user?.email ?? 'admin@hrkonek.com'
  const displayRole = user?.role === 'admin' ? 'Administrator' : (user?.role ?? 'Administrator')
  const initials = getInitials(displayName)

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    setOpen(false)
    router.push('/')
  }

  function handleMyProfile() {
    setOpen(false)
    router.push('/admin/profile')
  }

  function handleSettings() {
    setOpen(false)
    router.push('/admin/settings')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-white text-sm font-semibold leading-tight">{displayName}</span>
          <span className="text-white/60 text-xs leading-tight flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {displayRole}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/60 hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">

          <div className="px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                <p className="text-white/70 text-xs truncate">{displayEmail}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={handleMyProfile}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-gray-400" />
              My Profile
            </button>
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              Settings
            </button>
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
