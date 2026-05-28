"use client"

import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import NavbarUserMenu from '@/components/NavbarUserMenu'
import { Bell, Shield, Database, Info } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
          <div className="w-8 lg:hidden" />
          <div className="hidden lg:block text-white font-semibold text-base tracking-wide opacity-80 select-none">
            Management Portal
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <NavbarUserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">System configuration and preferences</p>
          </div>

          <div className="max-w-lg space-y-4">

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-1">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                Notifications are computed in real-time from your HR data and refresh every 30 seconds automatically.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-1">
                <Database className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Database</h3>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                SQLite local database. Located at prisma/dev.db. All data persists locally on this machine.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Security</h3>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                Password hashed with SHA-256. Session stored in sessionStorage and clears on tab close.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                This is a school project demonstration. currently not a production use so i didnt add any settings functionality.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
