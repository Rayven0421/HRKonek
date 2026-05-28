export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ApplicantArchiveClient from '@/components/ApplicantArchiveClient'
import NotificationBell from '@/components/NotificationBell'
import NavbarUserMenu from '@/components/NavbarUserMenu'

export type ArchivedApplicant = {
  id: string
  applicantId: string | null
  firstName: string
  lastName: string
  email: string | null
  position: string
  status: string
  archiveReason: string | null
  archiveNote: string | null
  archivedAt: Date | null
  appliedAt: Date
}

export default async function ApplicantArchivePage() {
  let archived: ArchivedApplicant[] = []
  let pageError: string | null = null

  try {
    archived = await prisma.$queryRaw<ArchivedApplicant[]>`
      SELECT id, applicantId, firstName, lastName, email,
             position, status, archiveReason, archiveNote,
             archivedAt, appliedAt
      FROM Applicant
      WHERE isArchived = 1
      ORDER BY archivedAt DESC`
  } catch (error) {
    console.error('Archive page query error:', error)
    pageError = 'Unable to load archive. Please refresh the page.'
  }

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
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/applicants"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Archive</h1>
              <p className="text-gray-500 text-sm">Rejected and archived applicants</p>
            </div>
            <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {archived.length} archived
            </span>
          </div>

          {pageError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm">{pageError}</p>
            </div>
          )}

          <ApplicantArchiveClient archived={archived} />
        </main>
      </div>
    </div>
  )
}
