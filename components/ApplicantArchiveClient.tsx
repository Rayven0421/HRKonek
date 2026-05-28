'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Archive, RotateCcw, Search, X, ChevronRight, Check } from 'lucide-react'

type ArchivedApplicant = {
  id: string
  applicantId: string | null
  firstName: string
  lastName: string
  position: string
  status: string
  archiveReason: string | null
  archiveNote: string | null
  archivedAt: Date | null
  appliedAt: Date
}

const REASON_BADGES: Record<string, string> = {
  'Rejected': 'bg-red-100 text-red-700',
  'Withdrawn': 'bg-gray-100 text-gray-600',
  'Position Filled': 'bg-orange-100 text-orange-700',
}

function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function ApplicantArchiveClient({
  archived,
}: {
  archived: ArchivedApplicant[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [archivedList, setArchivedList] = useState(archived)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = archivedList.filter(a => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(s) ||
      a.position.toLowerCase().includes(s)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  async function handleRestore(id: string, name: string) {
    setRestoring(id)
    try {
      const res = await fetch(`/api/applicants/${id}/archive`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        setArchivedList(prev => prev.filter(a => a.id !== id))
        setToast({ message: `${name} restored to active applicants!`, type: 'success' })
      } else {
        setToast({ message: data.message || 'Restore failed.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Connection error. Try again.', type: 'error' })
    } finally {
      setRestoring(null)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        } border rounded-xl shadow-xl p-4 pr-12 max-w-md animate-in fade-in`}>
          <div className="flex items-start gap-2.5">
            {toast.type === 'success'
              ? <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              : <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
            }
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="absolute top-3 right-3 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex gap-3 items-center p-4 sm:p-5 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search archived applicants..."
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white text-sm transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {archivedList.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Archive className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-medium text-gray-700">No archived applicants</p>
            <p className="text-gray-400 text-sm mt-1">
              Rejected applicants will appear here. They can be restored at any time.
            </p>
            <Link
              href="/applicants"
              className="mt-4 text-blue-600 text-sm hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Applicants
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-20">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Note</th>
                    <th className="px-4 py-3">Archived</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.length > 0 ? paged.map((app) => (
                    <tr key={app.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {app.applicantId || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {app.firstName} {app.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{app.position}</td>
                      <td className="px-4 py-3">
                        {app.archiveReason ? (
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                            REASON_BADGES[app.archiveReason] || 'bg-gray-100 text-gray-700'
                          }`}>
                            {app.archiveReason}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell max-w-[180px] truncate">
                        {app.archiveNote || <span className="text-gray-300 italic">No note</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(app.archivedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRestore(app.id, `${app.firstName} ${app.lastName}`)}
                          disabled={restoring === app.id}
                          className="inline-flex items-center gap-1.5 border border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {restoring === app.id ? 'Restoring...' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <p className="text-gray-400 text-sm">No archived applicants match your search.</p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-2 text-blue-600 text-xs hover:underline"
                        >
                          Clear search
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-gray-600">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
