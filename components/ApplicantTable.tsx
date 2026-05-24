'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Filter, Search, X, FileText, Download,
  ChevronDown, ExternalLink, Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Applicant = {
  id:         string;
  firstName:  string;
  lastName:   string;
  position:   string;
  appliedAt:  Date;
  status:     string;
  resumeUrl?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const ALL_STATUSES = [
  'Applied',
  'Pending Review',
  'Under Review',
  'Interview Scheduled',
  'Hired',
  'Rejected',
] as const;

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  'Applied':             { pill: 'bg-gray-100   text-gray-700',   dot: 'bg-gray-400'   },
  'Pending Review':      { pill: 'bg-pink-100   text-pink-700',   dot: 'bg-pink-400'   },
  'Under Review':        { pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  'Interview Scheduled': { pill: 'bg-blue-100   text-blue-700',   dot: 'bg-blue-400'   },
  'Hired':               { pill: 'bg-green-100  text-green-700',  dot: 'bg-green-400'  },
  'Rejected':            { pill: 'bg-red-100    text-red-700',    dot: 'bg-red-400'    },
};

function isPdf(url: string) {
  return url.split('?')[0].toLowerCase().endsWith('.pdf');
}

// ── Resume viewer dialog ───────────────────────────────────────────────────────
function ResumeDialog({
  applicant,
  onClose,
}: {
  applicant: Applicant;
  onClose:   () => void;
}) {
  const url        = applicant.resumeUrl!;
  const showIframe = isPdf(url);
  const name       = `${applicant.firstName} ${applicant.lastName}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{name}</p>
              <p className="text-xs text-gray-400">{applicant.position}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
            <a
              href={url}
              download
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-gray-100 min-h-0">
          {showIframe ? (
            <iframe
              src={url}
              className="w-full h-full"
              style={{ minHeight: '65vh' }}
              title={`Resume – ${name}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 mb-1">Preview not available</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  This file type can&apos;t be previewed in the browser. Use the buttons above to open or download it.
                </p>
              </div>
              <a
                href={url}
                download
                className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Resume
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status filter dropdown ─────────────────────────────────────────────────────
// Renders the menu via a React portal into document.body so it is never clipped
// by an ancestor's overflow-hidden, no matter how deeply nested this component is.
function StatusFilterDropdown({
  active,
  onChange,
}: {
  active:   string[];
  onChange: (statuses: string[]) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef               = useRef<HTMLButtonElement>(null);
  const menuRef                 = useRef<HTMLDivElement>(null);

  // Calculate fixed position from the button's bounding rect each time we open
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top:      rect.bottom + 8,
      // Align the right edge of the menu to the right edge of the button
      right:    window.innerWidth - rect.right,
      zIndex:   9999,
      width:    224, // w-56
    });
  }, []);

  function handleOpen() {
    calculatePosition();
    setOpen(o => !o);
  }

  // Close on outside click
  useEffect(() => {
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

  // Reposition if the page scrolls or the window resizes while open
  useEffect(() => {
    if (!open) return;
    function reposition() { calculatePosition(); }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, calculatePosition]);

  function toggle(s: string) {
    onChange(active.includes(s) ? active.filter(x => x !== s) : [...active, s]);
  }

  const menu = open ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-xl p-2"
    >
      <div className="px-2 py-1.5 mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
        {active.length > 0 && (
          <button onClick={() => onChange([])} className="text-xs text-blue-600 hover:underline">
            Clear all
          </button>
        )}
      </div>
      {ALL_STATUSES.map(s => {
        const style  = STATUS_STYLES[s];
        const ticked = active.includes(s);
        return (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              ticked ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style?.dot ?? 'bg-gray-400'}`} />
            <span className="flex-1 text-left text-gray-700">{s}</span>
            {ticked && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style?.pill ?? ''}`}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors select-none ${
          active.length > 0
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filter
        {active.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
            {active.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal: renders outside all overflow-hidden ancestors */}
      {typeof document !== 'undefined' && menu
        ? createPortal(menu, document.body)
        : null}
    </>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────
export default function ApplicantTable({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();

  const [searchTerm,    setSearchTerm]    = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [resumeTarget,  setResumeTarget]  = useState<Applicant | null>(null);
  const [updatingId,    setUpdatingId]    = useState<string | null>(null);

  // Stable ID map — reverse so A001 = oldest
  const idMap = new Map<string, string>(
    [...applicants]
      .reverse()
      .map((a, i) => [a.id, `A${String(i + 1).padStart(3, '0')}`])
  );

  const filtered = applicants.filter(app => {
    const matchSearch =
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilters.length === 0 || statusFilters.includes(app.status);
    return matchSearch && matchStatus;
  });

  async function handleUpdateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/applicants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    router.refresh();
    setUpdatingId(null);
  }

  return (
    <>
      {resumeTarget && (
        <ResumeDialog
          applicant={resumeTarget}
          onClose={() => setResumeTarget(null)}
        />
      )}

      {/* Removed overflow-hidden from this wrapper — it was clipping the portal-ed
          dropdown before it could escape. The table's own overflow-x-auto handles
          horizontal scrolling, and the visual border/radius still renders correctly. */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or position…"
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <StatusFilterDropdown active={statusFilters} onChange={setStatusFilters} />
        </div>

        {/* Table — overflow-x-auto is scoped only here, never clips the toolbar dropdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-20">ID</th>
                <th className="px-4 py-3 min-w-[160px]">Name</th>
                <th className="px-4 py-3 min-w-[140px]">Position</th>
                <th className="px-4 py-3 w-32">Applied</th>
                <th className="px-4 py-3 w-44">Status</th>
                <th className="px-4 py-3 w-24">Resume</th>
                <th className="px-4 py-3 w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map(app => {
                  const stableId   = idMap.get(app.id) ?? '—';
                  const style      = STATUS_STYLES[app.status];
                  const isUpdating = updatingId === app.id;

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {stableId}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {app.firstName} {app.lastName}
                      </td>

                      <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">{app.position}</td>

                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(app.appliedAt).toLocaleDateString('en-PH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style?.pill ?? 'bg-gray-100 text-gray-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style?.dot ?? 'bg-gray-400'}`} />
                          {app.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {app.resumeUrl ? (
                          <button
                            onClick={() => setResumeTarget(app)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isUpdating || app.status === 'Interview Scheduled' || app.status === 'Hired'}
                            onClick={() => handleUpdateStatus(app.id, 'Interview Scheduled')}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-md font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            disabled={isUpdating || app.status === 'Rejected'}
                            onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-md font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                    No applicants match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl text-xs text-gray-400">
          Showing {filtered.length} of {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
        </div>
      </div>
    </>
  );
}