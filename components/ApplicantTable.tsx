'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  MoreVertical, Eye, Calendar, ClipboardList,
  UserPlus, XCircle, ExternalLink, CheckCircle,
  Clock, AlertCircle, Circle, Search, X,
  Filter, ChevronDown, ChevronLeft, ChevronRight,
  Shield, Heart, Home, FileText, Download,
  Mail, Phone, User, Briefcase
} from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { DEPARTMENTS, POSITIONS } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────────────────────────
type Applicant = {
  id:                string;
  firstName:         string;
  lastName:          string;
  email?:            string;
  phone?:            string;
  address?:          string;
  position:          string;
  expectedSalary?:   string;
  yearsOfExperience?: string;
  sssNumber?:        string;
  pagibigNumber?:    string;
  philhealthNumber?: string;
  tinNumber?:        string;
  resumeUrl?:        string;
  coverLetterUrl?:   string;
  otherDocsUrl?:     string;
  status:            string;
  appliedAt:         Date;
  convertedEmployeeId?: string;
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

const STATUS_STYLES: Record<string, string> = {
  'Applied':             'bg-gray-100   text-gray-800',
  'Pending Review':      'bg-pink-100   text-pink-800',
  'Under Review':        'bg-yellow-100 text-yellow-800',
  'Interview Scheduled': 'bg-blue-100   text-blue-800',
  'Hired':               'bg-green-100  text-green-800',
  'Rejected':            'bg-red-100    text-red-800',
};

const STATUS_ICONS: Record<string, typeof Circle> = {
  'Applied':             Circle,
  'Pending Review':      AlertCircle,
  'Under Review':        Clock,
  'Interview Scheduled': Calendar,
  'Hired':               CheckCircle,
  'Rejected':            XCircle,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] || Circle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-800'}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function isPdf(url: string) {
  return url.split('?')[0].toLowerCase().endsWith('.pdf');
}

// ── Success Toast ──────────────────────────────────────────────────────────────
function SuccessToast({
  message,
  employeeId,
  onClose,
}: {
  message: string;
  employeeId: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] bg-green-50 border border-green-200 rounded-xl shadow-xl p-4 pr-12 max-w-md animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">{message}</p>
          <a
            href={`/employees/${employeeId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 underline mt-1"
          >
            View Profile <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-green-500 hover:text-green-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Resume viewer dialog ───────────────────────────────────────────────────────
function ResumeDialog({
  applicant,
  url,
  docLabel,
  onClose,
}: {
  applicant: Applicant;
  url:       string;
  docLabel:  string;
  onClose:   () => void;
}) {
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{name}</p>
              <p className="text-xs text-gray-400">{docLabel}</p>
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
        <div className="flex-1 overflow-hidden bg-gray-100 min-h-0">
          {showIframe ? (
            <iframe
              src={url}
              className="w-full h-full"
              style={{ minHeight: '65vh' }}
              title={`${docLabel} – ${name}`}
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
                Download {docLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Document picker (portaled) ─────────────────────────────────────────────────
function DocumentPicker({
  docs,
  buttonRect,
  onSelect,
  onClose,
}: {
  docs:       { url: string; label: string }[];
  buttonRect: DOMRect;
  onSelect:   (url: string, label: string) => void;
  onClose:    () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top:   buttonRect.bottom + 4,
        left:  buttonRect.left,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 min-w-[180px]"
    >
      {docs.map(doc => (
        <button
          key={doc.url}
          onClick={() => onSelect(doc.url, doc.label)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4 text-gray-400" />
          {doc.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

// ── Status filter dropdown ─────────────────────────────────────────────────────
function StatusFilterDropdown({
  active,
  onChange,
}: {
  active:   string[];
  onChange: (statuses: string[]) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef                 = useRef<HTMLButtonElement>(null);
  const menuRef                   = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top:      rect.bottom + 8,
      right:    window.innerWidth - rect.right,
      zIndex:   9999,
      width:    224,
    });
  }, []);

  function handleOpen() {
    calculatePosition();
    setOpen(o => !o);
  }

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
        const Icon   = STATUS_ICONS[s] || Circle;
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
            <Icon className={`w-3 h-3 ${ticked ? '' : 'text-gray-400'}`} />
            <span className="flex-1 text-left text-gray-700">{s}</span>
            {ticked && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style || ''}`}>✓</span>
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
      {typeof document !== 'undefined' && menu
        ? createPortal(menu, document.body)
        : null}
    </>
  );
}

// ── View Application Modal ─────────────────────────────────────────────────────
function ViewApplicationModal({
  applicant,
  onClose,
  onScheduleInterview,
  onConvertToEmployee,
}: {
  applicant: Applicant;
  onClose: () => void;
  onScheduleInterview?: () => void;
  onConvertToEmployee?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasGovIds = applicant.sssNumber || applicant.philhealthNumber || applicant.pagibigNumber || applicant.tinNumber;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {applicant.firstName} {applicant.lastName}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge status={applicant.status} />
              <span className="text-sm text-gray-400">
                Applied {new Date(applicant.appliedAt).toLocaleDateString('en-PH', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">Personal Information</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-24">Full Name</span>
                <span className="text-sm text-gray-900 font-medium">{applicant.firstName} {applicant.lastName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-24">Email</span>
                <span className="text-sm text-gray-900">{applicant.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-24">Phone</span>
                <span className="text-sm text-gray-900">{applicant.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-24">Address</span>
                <span className="text-sm text-gray-900">{applicant.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Position Details */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">Position Details</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-32">Position Applied For</span>
                <span className="text-sm text-gray-900 font-medium">{applicant.position}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-32">Expected Salary</span>
                <span className="text-sm text-gray-900">
                  {applicant.expectedSalary
                    ? `₱${Number(applicant.expectedSalary).toLocaleString()}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 w-32">Years of Experience</span>
                <span className="text-sm text-gray-900">{applicant.yearsOfExperience || '—'}</span>
              </div>
            </div>
          </div>

          {/* Government IDs */}
          {hasGovIds && (
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#1E3A8A]" />
                <h3 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">Government IDs</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">SSS Number</p>
                  <p className="text-sm font-medium text-gray-900">{applicant.sssNumber || <span className="text-gray-400">Not provided</span>}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">PhilHealth Number</p>
                  <p className="text-sm font-medium text-gray-900">{applicant.philhealthNumber || <span className="text-gray-400">Not provided</span>}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">PAG-IBIG Number</p>
                  <p className="text-sm font-medium text-gray-900">{applicant.pagibigNumber || <span className="text-gray-400">Not provided</span>}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">TIN Number</p>
                  <p className="text-sm font-medium text-gray-900">{applicant.tinNumber || <span className="text-gray-400">Not provided</span>}</p>
                </div>
              </div>
            </div>
          )}

          {/* Document Attachments */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">Document Attachments</h3>
            </div>
            <div className="space-y-2.5">
              <DocRow label="Resume" url={applicant.resumeUrl} />
              <DocRow label="Cover Letter" url={applicant.coverLetterUrl} />
              <DocRow label="Other Documents" url={applicant.otherDocsUrl} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {applicant.status === 'Interview Scheduled' && onConvertToEmployee && (
            <button
              onClick={() => { onClose(); onConvertToEmployee(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Convert to Employee
            </button>
          )}
          {(applicant.status === 'Applied' || applicant.status === 'Under Review') && onScheduleInterview && (
            <button
              onClick={() => { onClose(); onScheduleInterview(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              Schedule Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url?: string }) {
  if (url) {
    return (
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm text-gray-500 w-28">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
        >
          View {label} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
      <span className="text-sm text-gray-500 w-28">{label}</span>
      <span className="text-sm text-gray-400">Not uploaded</span>
    </div>
  );
}

// ── Convert to Employee Modal ──────────────────────────────────────────────────
function ConvertToEmployeeModal({
  applicant,
  onClose,
  onConfirm,
  isConverting,
}: {
  applicant: Applicant;
  onClose: () => void;
  onConfirm: (data: Record<string, string>) => void;
  isConverting: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    firstName:     applicant.firstName || '',
    lastName:      applicant.lastName || '',
    email:         applicant.email || '',
    phone:         applicant.phone || '',
    position:      applicant.position || '',
    department:    '',
    employmentType: 'Regular',
    startDate:     new Date().toISOString().split('T')[0],
    salary:        applicant.expectedSalary || '',
    sssNumber:     applicant.sssNumber || '',
    philhealthNumber: applicant.philhealthNumber || '',
    pagibigNumber: applicant.pagibigNumber || '',
    tinNumber:     applicant.tinNumber || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const { [field]: _removed, ...rest } = prev; return rest; });
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim())  newErrors.firstName = 'Required';
    if (!form.lastName.trim())   newErrors.lastName = 'Required';
    if (!form.email.trim())      newErrors.email = 'Required';
    if (!form.position.trim())   newErrors.position = 'Required';
    if (!form.department.trim()) newErrors.department = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onConfirm(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Convert to Employee</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5 flex items-start gap-3">
            <UserPlus className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              This will create a new Employee record and mark this applicant as Hired.
            </p>
          </div>

          <div className="space-y-5">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-bold text-[#1E3A8A] mb-3 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First Name" value={form.firstName} onChange={v => update('firstName', v)} required error={errors.firstName} />
                <FormField label="Last Name" value={form.lastName} onChange={v => update('lastName', v)} required error={errors.lastName} />
                <FormField label="Email" value={form.email} onChange={v => update('email', v)} required error={errors.email} className="col-span-2" />
                <FormField label="Phone" value={form.phone} onChange={v => update('phone', v)} className="col-span-2" />
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-[#1E3A8A] mb-3 uppercase tracking-wider">Employment Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <SearchableSelect label="Position/Role" options={POSITIONS} value={form.position} onChange={v => update('position', v)} required error={errors.position} placeholder="Select or type position..." />
                </div>
                <SearchableSelect label="Department" options={DEPARTMENTS} value={form.department} onChange={v => update('department', v)} required error={errors.department} placeholder="Select or type department..." />
                <SelectField label="Employment Type" value={form.employmentType} onChange={v => update('employmentType', v)} options={['Regular', 'Contractual', 'Part-time', 'Probationary']} />
                <FormField label="Start Date" type="date" value={form.startDate} onChange={v => update('startDate', v)} />
                <FormField label="Annual Salary (₱)" value={form.salary} onChange={v => update('salary', v)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input
                    value="Active"
                    disabled
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-[#1E3A8A] mb-3 uppercase tracking-wider">Government IDs</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="SSS Number" value={form.sssNumber} onChange={v => update('sssNumber', v)} />
                <FormField label="PhilHealth Number" value={form.philhealthNumber} onChange={v => update('philhealthNumber', v)} />
                <FormField label="PAG-IBIG Number" value={form.pagibigNumber} onChange={v => update('pagibigNumber', v)} />
                <FormField label="TIN Number" value={form.tinNumber} onChange={v => update('tinNumber', v)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isConverting}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isConverting}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Converting...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Confirm &amp; Create Employee
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-blue-600">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-600 text-xs font-medium mt-1">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-blue-600">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Reject Confirmation Dialog ─────────────────────────────────────────────────
function RejectConfirmDialog({
  applicant,
  onClose,
  onConfirm,
  isRejecting,
}: {
  applicant: Applicant;
  onClose: () => void;
  onConfirm: () => void;
  isRejecting: boolean;
}) {
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 text-lg mb-2">Reject Applicant?</h3>
        <p className="text-sm text-gray-500 mb-6">
          This will mark {applicant.firstName} {applicant.lastName} as rejected. This action can be undone by changing their status manually.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isRejecting}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRejecting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isRejecting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Yes, Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────
export default function ApplicantTable({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [statusFilters,    setStatusFilters]    = useState<string[]>([]);
  const [localApplicants,  setLocalApplicants]  = useState(applicants);

  const [viewingApplicant, setViewingApplicant] = useState<Applicant | null>(null);
  const [convertingApplicant, setConvertingApplicant] = useState<Applicant | null>(null);
  const [rejectingApplicant, setRejectingApplicant]   = useState<Applicant | null>(null);
  const [isConverting,     setIsConverting]     = useState(false);
  const [isRejecting,      setIsRejecting]      = useState(false);
  const [successToast,     setSuccessToast]     = useState<{
    show: boolean;
    message: string;
    employeeId: string;
  } | null>(null);
  const [docDialog, setDocDialog] = useState<{
    applicant: Applicant;
    url:       string;
    docLabel:  string;
  } | null>(null);

  const [pickerState, setPickerState] = useState<{
    applicant: Applicant;
    docs:      { url: string; label: string }[];
    buttonRect: DOMRect;
  } | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<{
    applicant: Applicant;
    rect: DOMRect;
  } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuAnchor) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const el = document.getElementById('action-menu');
      if (el?.contains(target)) return;
      setMenuAnchor(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuAnchor]);

  // Stable ID map — reverse so A001 = oldest
  const idMap = new Map<string, string>(
    [...localApplicants]
      .reverse()
      .map((a, i) => [a.id, `A${String(i + 1).padStart(3, '0')}`])
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = localApplicants.filter(app => {
    const matchSearch =
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilters.length === 0 || statusFilters.includes(app.status);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  function updateApplicantStatus(id: string, newStatus: string) {
    setLocalApplicants(prev => prev.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to update status');
      }
      updateApplicantStatus(id, status);
    } catch (err) {
      console.error('Status update error:', err);
    }
    setMenuAnchor(null);
  }

  async function handleConvert(applicant: Applicant, employeeData: Record<string, string>) {
    setIsConverting(true);
    try {
      const res = await fetch('/api/applicants/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: applicant.id, employeeData }),
      });
      const data = await res.json();
      if (data.success) {
        updateApplicantStatus(applicant.id, 'Hired');
        setConvertingApplicant(null);
        setSuccessToast({
          show: true,
          message: `${data.employeeName} has been successfully added as an employee!`,
          employeeId: data.employeeId,
        });
      }
    } catch {
      // silent
    } finally {
      setIsConverting(false);
    }
  }

  async function handleReject(applicant: Applicant) {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to reject applicant');
      }
      updateApplicantStatus(applicant.id, 'Rejected');
    } catch (err) {
      console.error('Reject error:', err);
    }
    setRejectingApplicant(null);
    setIsRejecting(false);
    setMenuAnchor(null);
  }

  return (
    <>
      {successToast && (
        <SuccessToast
          message={successToast.message}
          employeeId={successToast.employeeId}
          onClose={() => setSuccessToast(null)}
        />
      )}

      {viewingApplicant && (
        <ViewApplicationModal
          applicant={viewingApplicant}
          onClose={() => setViewingApplicant(null)}
          onScheduleInterview={() => {
            if (viewingApplicant) {
              handleUpdateStatus(viewingApplicant.id, 'Interview Scheduled');
              setViewingApplicant(null);
            }
          }}
          onConvertToEmployee={() => {
            if (viewingApplicant) {
              setViewingApplicant(null);
              setConvertingApplicant(viewingApplicant);
            }
          }}
        />
      )}

      {convertingApplicant && (
        <ConvertToEmployeeModal
          applicant={convertingApplicant}
          onClose={() => setConvertingApplicant(null)}
          onConfirm={(data) => handleConvert(convertingApplicant, data)}
          isConverting={isConverting}
        />
      )}

      {rejectingApplicant && (
        <RejectConfirmDialog
          applicant={rejectingApplicant}
          onClose={() => setRejectingApplicant(null)}
          onConfirm={() => handleReject(rejectingApplicant)}
          isRejecting={isRejecting}
        />
      )}

      {docDialog && (
        <ResumeDialog
          applicant={docDialog.applicant}
          url={docDialog.url}
          docLabel={docDialog.docLabel}
          onClose={() => setDocDialog(null)}
        />
      )}

      {menuAnchor && typeof document !== 'undefined' && createPortal(
        <div
          id="action-menu"
          style={{
            position: 'fixed',
            top:  menuAnchor.rect.bottom + 4,
            left: menuAnchor.rect.right - 208,
            zIndex: 9999,
          }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 w-52 py-1 overflow-hidden"
        >
          {(() => {
            const app = menuAnchor.applicant;
            const showSchedule = app.status === 'Applied' || app.status === 'Under Review';
            const showUnderReview = app.status === 'Applied';
            const showConvert = app.status === 'Interview Scheduled' && !app.convertedEmployeeId;
            const showReject = app.status !== 'Hired' && app.status !== 'Rejected';
            const showViewProfile = app.status === 'Hired' && app.convertedEmployeeId;
            return (
              <>
                <button
                  onClick={() => { setViewingApplicant(app); setMenuAnchor(null); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                  View Application
                </button>

                {showSchedule && (
                  <button
                    onClick={() => { handleUpdateStatus(app.id, 'Interview Scheduled'); setMenuAnchor(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Schedule Interview
                  </button>
                )}

                {showUnderReview && (
                  <button
                    onClick={() => { handleUpdateStatus(app.id, 'Under Review'); setMenuAnchor(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4 text-yellow-600" />
                    Mark as Under Review
                  </button>
                )}

                {showConvert && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setConvertingApplicant(app); setMenuAnchor(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-700 font-medium hover:bg-green-50 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-green-600" />
                      Convert to Employee
                    </button>
                  </>
                )}

                {showViewProfile && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { router.push(`/employees/${app.convertedEmployeeId}`); setMenuAnchor(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      View Employee Profile
                    </button>
                  </>
                )}

                {(showConvert || showSchedule || showUnderReview) && showReject && (
                  <div className="border-t border-gray-100 my-1" />
                )}
                {showReject && (
                  <button
                    onClick={() => { setRejectingApplicant(app); setMenuAnchor(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    Reject Applicant
                  </button>
                )}
              </>
            );
          })()}
        </div>,
        document.body,
      )}

      {pickerState && typeof document !== 'undefined' && createPortal(
        <DocumentPicker
          docs={pickerState.docs}
          buttonRect={pickerState.buttonRect}
          onSelect={(url, label) => {
            const applicant = pickerState.applicant;
            setPickerState(null);
            setDocDialog({ applicant, url, docLabel: label });
          }}
          onClose={() => setPickerState(null)}
        />,
        document.body,
      )}

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
              onChange={e => { setSearchTerm(e.target.value); setMenuAnchor(null); setPage(1); }}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setMenuAnchor(null); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <StatusFilterDropdown active={statusFilters} onChange={(s) => { setStatusFilters(s); setPage(1); }} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto" ref={scrollRef}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-20">ID</th>
                <th className="px-4 py-3 min-w-[160px]">Name</th>
                <th className="px-4 py-3 min-w-[140px]">Position</th>
                <th className="px-4 py-3 w-32">Applied</th>
                <th className="px-4 py-3 w-44">Status</th>
                <th className="px-4 py-3 w-24">Docs</th>
                <th className="px-4 py-3 w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length > 0 ? (
                paged.map(app => {
                  const stableId      = idMap.get(app.id) ?? '—';
                  const isUpdating    = isConverting || isRejecting;
                  const availableDocs = [
                    app.resumeUrl      && { url: app.resumeUrl,      label: 'Resume / CV' },
                    app.coverLetterUrl && { url: app.coverLetterUrl, label: 'Cover Letter' },
                    app.otherDocsUrl   && { url: app.otherDocsUrl,   label: 'Other Documents' },
                  ].filter(Boolean) as { url: string; label: string }[];

                  const showSchedule = app.status === 'Applied' || app.status === 'Under Review';
                  const showUnderReview = app.status === 'Applied';
                  const showConvert = app.status === 'Interview Scheduled' && !app.convertedEmployeeId;
                  const showReject = app.status !== 'Hired' && app.status !== 'Rejected';
                  const showViewProfile = app.status === 'Hired' && app.convertedEmployeeId;

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
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3">
                        {availableDocs.length === 0 ? (
                          <span className="text-xs text-gray-300 italic">None</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              if (availableDocs.length === 1) {
                                setDocDialog({ applicant: app, url: availableDocs[0].url, docLabel: availableDocs[0].label });
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerState({ applicant: app, docs: availableDocs, buttonRect: rect });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuAnchor(menuAnchor?.applicant.id === app.id ? null : { applicant: app, rect });
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                    {searchTerm || statusFilters.length > 0 ? (
                      <div>
                        No applicants match your search or filters.
                        {(searchTerm || statusFilters.length > 0) && (
                          <button
                            onClick={() => { setSearchTerm(''); setStatusFilters([]); }}
                            className="ml-2 text-blue-600 hover:underline text-sm"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    ) : (
                      'No applicants found.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Showing {filtered.length > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)}` : '0'} of {filtered.length} applicant{filtered.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
