"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import NavbarUserMenu from "@/components/NavbarUserMenu";
import Link from "next/link";
import { ChevronLeft, Archive, RotateCcw, Search, X, Users, ChevronLeft as ChevronLeftIcon, ChevronRight, Check, Loader2 } from "lucide-react";

type ArchivedEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  status: string;
  employeeId: string | null;
  archivedAt: string | null;
  archiveReason: string | null;
  archiveNote: string | null;
};

const REASON_STYLES: Record<string, string> = {
  'Fired': 'bg-red-100 text-red-700',
  'Resigned': 'bg-orange-100 text-orange-700',
  'Contract Ended': 'bg-gray-100 text-gray-600',
  'Other': 'bg-gray-100 text-gray-500',
};

export default function ArchivedEmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<ArchivedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees?archived=1");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string, name: string) {
    if (!confirm(`Restore ${name} to active employees?`)) return;
    setRestoring(id);
    try {
      const res = await fetch(`/api/employees/${id}/archive`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id));
        setToast({ message: `${name} has been restored successfully!`, type: 'success' });
      } else {
        setToast({ message: data.message || 'Restore failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Restore failed. Try again.', type: 'error' });
    } finally {
      setRestoring(null);
    }
  }

  const filtered = employees.filter(e => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
      e.role.toLowerCase().includes(s) ||
      e.department.toLowerCase().includes(s);
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
              href="/employees"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Archive</h1>
                {!loading && (
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                    {employees.length} archived
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">Archived, fired, and resigned employees</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex gap-3 items-center p-4 sm:p-5 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search archived employees..."
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
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Archived Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : paged.length > 0 ? (
                    paged.map((emp) => (
                      <tr key={emp.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-5 py-4 text-sm text-gray-400 font-mono">{emp.employeeId || '—'}</td>
                        <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{emp.department}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 hidden md:table-cell">{emp.role}</td>
                        <td className="px-5 py-4 text-sm">
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${REASON_STYLES[emp.archiveReason ?? ''] || 'bg-gray-100 text-gray-600'}`}>
                              {emp.archiveReason ?? 'Archived'}
                            </span>
                            {emp.archiveNote && (
                              <p className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={emp.archiveNote}>
                                {emp.archiveNote}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {emp.archivedAt ? new Date(emp.archivedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-right">
                          <button
                            onClick={() => handleRestore(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            disabled={restoring === emp.id}
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {restoring === emp.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            {restoring === emp.id ? 'Restoring...' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-14 gap-3">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                            <Archive className="w-7 h-7 text-gray-300" />
                          </div>
                          <div className="text-center">
                            <p className="text-gray-700 font-medium text-sm">No archived employees</p>
                            <p className="text-gray-400 text-xs mt-1">Fired, resigned, or contract-ended employees will appear here.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white">
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-md text-sm font-medium ${page === p ? 'bg-[#1E3A8A] text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
