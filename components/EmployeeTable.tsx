"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Filter, ChevronLeft, ChevronRight, ChevronDown, Search, X, Users, Circle, Briefcase, MoreVertical, UserX, LogOut, FileX, RotateCcw, AlertTriangle, Check, Loader2 } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  status: string;
  createdAt: Date;
  employeeId: string | null;
  employmentType?: string | null;
}

function FilterDropdown({
  activeStatusFilters,
  activeDepartmentFilters,
  departments,
  onToggleStatus,
  onToggleDepartment,
  onClearAll,
}: {
  activeStatusFilters: string[];
  activeDepartmentFilters: string[];
  departments: string[];
  onToggleStatus: (s: string) => void;
  onToggleDepartment: (d: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [depSearch, setDepSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const depInputRef = useRef<HTMLInputElement>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      zIndex: 9999,
      width: 260,
    });
  }, []);

  function handleOpen() {
    calculatePosition();
    setOpen(o => !o);
    setDepSearch("");
  }

  const filteredDepartments = useMemo(() => {
    if (!depSearch) return departments;
    const lower = depSearch.toLowerCase();
    return departments.filter(d => d.toLowerCase().includes(lower));
  }, [departments, depSearch]);

  React.useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function reposition() { calculatePosition(); }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, calculatePosition]);

  const openChangedRef = useRef(open);
  React.useEffect(() => {
    if (open && !openChangedRef.current && depInputRef.current) {
      depInputRef.current.focus();
    }
    openChangedRef.current = open;
  }, [open]);

  function toggleStatus(s: string) { onToggleStatus(s); }
  function toggleDepartment(d: string) { onToggleDepartment(d); }
  function clearAll() { onClearAll(); }

  const activeCount = activeStatusFilters.length + activeDepartmentFilters.length;

  const ALL_STATUSES = ['Active', 'On Leave', 'Inactive'];
  const STATUS_STYLES: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800',
    'On Leave': 'bg-orange-100 text-orange-800',
    'Inactive': 'bg-red-100 text-red-800',
  };

  const menu = open ? (
    <div ref={menuRef} style={menuStyle} className="bg-white border border-gray-200 rounded-xl shadow-xl p-2">
      <div className="px-2 py-1.5 mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">Clear all</button>
        )}
      </div>
      {ALL_STATUSES.map(s => {
        const ticked = activeStatusFilters.includes(s);
        return (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${ticked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
          >
            <Circle className={`w-3 h-3 ${ticked ? 'text-gray-900' : 'text-gray-400'}`} />
            <span className="flex-1 text-left text-gray-700">{s}</span>
            {ticked && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[s] || ''}`}>✓</span>}
          </button>
        );
      })}
      <div className="border-t border-gray-100 my-2" />
      <div className="px-2 py-1.5 mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</span>
      </div>
      <div className="relative mb-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={depInputRef}
          type="text"
          value={depSearch}
          onChange={e => setDepSearch(e.target.value)}
          placeholder="Search departments..."
          className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
        {depSearch && (
          <button onClick={() => setDepSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="max-h-44 overflow-y-auto">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map(d => {
            const ticked = activeDepartmentFilters.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDepartment(d)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${ticked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <Briefcase className={`w-3 h-3 flex-shrink-0 ${ticked ? 'text-gray-900' : 'text-gray-400'}`} />
                <span className="flex-1 text-left text-gray-700 truncate">{d}</span>
                {ticked && <span className="text-xs font-semibold text-blue-700 flex-shrink-0">✓</span>}
              </button>
            );
          })
        ) : (
          <p className="px-2.5 py-2 text-sm text-gray-400">No departments match</p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors select-none flex-shrink-0 ${
          activeCount > 0
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </>
  );
}

function ConfirmArchiveModal({
  employee,
  reason,
  onClose,
  onConfirm,
  isArchiving,
}: {
  employee: Employee;
  reason: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isArchiving: boolean;
}) {
  const [note, setNote] = useState("");
  const displayId = employee.employeeId ?? '—';

  const descriptions: Record<string, string> = {
    Fired: "This employee will be removed from active records and all benefit enrollments will be suspended. Their ID is permanently reserved and will not be reused.",
    Resigned: "This employee will be marked as resigned. Their records are preserved in the archive.",
    'Contract Ended': "This employee's contract will be ended. Their records are preserved in the archive.",
    Other: "This employee will be archived. Their records are preserved.",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <UserX className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{reason} Employee?</h3>
          <p className="text-sm text-gray-500 mt-1">{descriptions[reason]}</p>
          {displayId !== '—' && (
            <p className="text-xs text-gray-400 mt-1 font-mono">ID: {displayId} (permanent)</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason Notes</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add any notes about this departure..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all resize-none"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-700">This action can be undone from the Archive. The employee record is never permanently deleted.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isArchiving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isArchiving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isArchiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Confirm {reason}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [localEmployees, setLocalEmployees] = useState(employees);
  const [menuAnchor, setMenuAnchor] = useState<{ employee: Employee; rect: DOMRect } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<{ employee: Employee; reason: string } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    if (!menuAnchor) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const el = document.getElementById('emp-action-menu');
      if (el?.contains(target)) return;
      setMenuAnchor(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuAnchor]);

  const departments = useMemo(() => {
    const deps = new Set(localEmployees.map(e => e.department));
    return Array.from(deps).sort();
  }, [localEmployees]);

  const filteredEmployees = useMemo(() => {
    const hasSearch = searchTerm.trim().length > 0;
    const hasStatusFilter = statusFilters.length > 0;
    const hasDeptFilter = departmentFilters.length > 0;

    if (!hasSearch && !hasStatusFilter && !hasDeptFilter) return localEmployees;

    const search = searchTerm.toLowerCase();
    return localEmployees.filter((emp) => {
      if (hasStatusFilter && !statusFilters.includes(emp.status)) return false;
      if (hasDeptFilter && !departmentFilters.includes(emp.department)) return false;
      if (hasSearch) {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        if (
          !fullName.includes(search) &&
          !emp.role.toLowerCase().includes(search) &&
          !emp.department.toLowerCase().includes(search) &&
          !emp.email.toLowerCase().includes(search)
        ) return false;
      }
      return true;
    });
  }, [localEmployees, searchTerm, statusFilters, departmentFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":     return "bg-green-100 text-green-800";
      case "On Leave":   return "bg-orange-100 text-orange-800";
      case "Inactive":   return "bg-red-100 text-red-800";
      default:           return "bg-gray-100 text-gray-800";
    }
  };

  async function handleArchive(employee: Employee, reason: string, note: string) {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note: note || undefined }),
      });
      if (res.ok) {
        setLocalEmployees(prev => prev.filter(e => e.id !== employee.id));
        setToast({ message: `Employee has been archived (${reason})`, type: 'success' });
        setConfirmArchive(null);
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Failed to archive employee', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to archive employee. Please try again.', type: 'error' });
    } finally {
      setIsArchiving(false);
    }
    setMenuAnchor(null);
  }

  const canFire = (status: string) => status === 'Active' || status === 'On Leave';
  const canResign = (status: string) => status === 'Active';
  const canEndContract = (status: string, empType?: string | null) => status === 'Active' && empType === 'Contractual';

  return (
    <div className="flex flex-col">
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

      {confirmArchive && (
        <ConfirmArchiveModal
          employee={confirmArchive.employee}
          reason={confirmArchive.reason}
          onClose={() => { setConfirmArchive(null); setMenuAnchor(null); }}
          onConfirm={(note) => handleArchive(confirmArchive.employee, confirmArchive.reason, note)}
          isArchiving={isArchiving}
        />
      )}

      {menuAnchor && typeof document !== 'undefined' && createPortal(
        <div
          id="emp-action-menu"
          style={{
            position: 'fixed',
            top: menuAnchor.rect.bottom + 4,
            left: menuAnchor.rect.right - 176,
            zIndex: 9999,
          }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 w-44 py-1 overflow-hidden"
        >
          {(() => {
            const emp = menuAnchor.employee;
            const showFire = canFire(emp.status);
            const showResign = canResign(emp.status);
            const showEndContract = canEndContract(emp.status, emp.employmentType);
            return (
              <>
                {showFire && (
                  <button
                    onClick={() => { setConfirmArchive({ employee: emp, reason: 'Fired' }); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    Fire Employee
                  </button>
                )}
                {showResign && (
                  <button
                    onClick={() => { setConfirmArchive({ employee: emp, reason: 'Resigned' }); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Mark as Resigned
                  </button>
                )}
                {showEndContract && (
                  <button
                    onClick={() => { setConfirmArchive({ employee: emp, reason: 'Contract Ended' }); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FileX className="w-4 h-4" />
                    End Contract
                  </button>
                )}
              </>
            );
          })()}
        </div>,
        document.body,
      )}

      <div className="flex gap-3 items-center p-4 sm:p-5 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, position, or department..."
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white text-sm transition-all"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <FilterDropdown
          activeStatusFilters={statusFilters}
          activeDepartmentFilters={departmentFilters}
          departments={departments}
          onToggleStatus={(s) => { setStatusFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); setCurrentPage(1); }}
          onToggleDepartment={(d) => { setDepartmentFilters(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]); setCurrentPage(1); }}
          onClearAll={() => { setStatusFilters([]); setDepartmentFilters([]); setCurrentPage(1); }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">ID</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((emp) => {
                const displayId = emp.employeeId ?? '—';
                return (
                  <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500 font-mono">{displayId}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{emp.role}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 hidden md:table-cell">{emp.department}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(emp.status)}`}>
                        {emp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuAnchor(menuAnchor?.employee.id === emp.id ? null : { employee: emp, rect });
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium text-sm">No employees found</p>
                      {searchTerm ? (
                        <p className="text-gray-400 text-xs mt-1">
                          No results for &ldquo;{searchTerm}&rdquo;
                        </p>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1">
                          No employees match the current filters
                        </p>
                      )}
                    </div>
                    {(searchTerm || statusFilters.length > 0 || departmentFilters.length > 0) && (
                      <button
                        onClick={() => { clearSearch(); setStatusFilters([]); setDepartmentFilters([]); }}
                        className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length > 0 && (
        <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 order-2 sm:order-1">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
