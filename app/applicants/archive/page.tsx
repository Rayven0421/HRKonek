"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import NavbarUserMenu from "@/components/NavbarUserMenu";
import Link from "next/link";
import { ChevronLeft, Archive, RotateCcw, Search, X, ChevronLeft as ChevronLeftIcon, ChevronRight, Check } from "lucide-react";

type ArchivedApplicant = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  applicantId?: string | null;
  archivedAt: string | null;
};

export default function ArchivedApplicantsPage() {
  const [applicants, setApplicants] = useState<ArchivedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchArchived();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchArchived() {
    setLoading(true);
    try {
      const res = await fetch("/api/applicants?archived=1");
      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []);
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string, name: string) {
    if (!confirm(`Restore ${name} to active applicants?`)) return;
    setRestoring(id);
    try {
      const res = await fetch(`/api/applicants/${id}/archive`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setApplicants(prev => prev.filter(a => a.id !== id));
        setToast({ message: `${name} restored successfully!`, type: 'success' });
      } else {
        setToast({ message: data.message || 'Restore failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Restore failed. Try again.', type: 'error' });
    } finally {
      setRestoring(null);
    }
  }

  const filtered = applicants.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return `${a.firstName} ${a.lastName}`.toLowerCase().includes(s) ||
      a.position.toLowerCase().includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-xl shadow-xl p-4 pr-12 max-w-md animate-in fade-in`}>
          <div className="flex items-start gap-2.5">
            {toast.type === 'success' ? <Check className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <X className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="absolute top-3 right-3 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Archive</h1>
                {!loading && (
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                    {applicants.length} archived
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">Rejected, withdrawn, and archived applicants</p>
            </div>
          </div>

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
                  <button onClick={() => { setSearchTerm(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-20">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Archived</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : paged.length > 0 ? (
                    paged.map((app) => (
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
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {app.archivedAt ? new Date(app.archivedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRestore(app.id, `${app.firstName} ${app.lastName}`)}
                            disabled={restoring === app.id}
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {restoring === app.id ? 'Restoring...' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-14 gap-3">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                            <Archive className="w-7 h-7 text-gray-300" />
                          </div>
                          <div className="text-center">
                            <p className="text-gray-700 font-medium text-sm">No archived applicants</p>
                            <p className="text-gray-400 text-xs mt-1">Rejected applicants and archived records will appear here.</p>
                          </div>
                        </div>
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
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-gray-600">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
