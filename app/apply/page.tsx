'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Upload, X } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { POSITIONS } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────────────────────────
type FormDataRecord = {
  firstName:         string;
  lastName:          string;
  email:             string;
  phone:             string;
  address:           string;
  position:          string;
  expectedSalary:    string; // stored as raw numeric string, e.g. "25000"
  yearsOfExperience: string;
  sssNumber:         string; // formatted display value, e.g. "34-1234567-8"
  pagibigNumber:     string; // formatted display value, e.g. "1234-5678-9012"
  philhealthNumber:  string; // formatted display value, e.g. "1234-5678-9012"
  tinNumber:         string; // formatted display value, e.g. "123-456-789"
  resume:            File | null;
  coverLetter:       File | null;
  other:             File | null;
};

type FormErrors = Partial<Record<keyof FormDataRecord, string>>;

// ── Constants ──────────────────────────────────────────────────────────────────
const PH_PHONE_REGEX    = /^(\+?63|0)9\d{9}$/;
const EMAIL_REGEX       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_MB  = 5;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DOC_LABELS: Record<string, { label: string; required: boolean }> = {
  resume:      { label: 'Upload Resume / CV',  required: true  },
  coverLetter: { label: 'Cover Letter',         required: false },
  other:       { label: 'Other Documents',      required: false },
};

// ── Auto-formatters (strip non-digits, apply mask as user types) ───────────────

/** SSS: ##-#######-# (10 digits, 2-7-1) */
function fmtSSS(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 9)}-${d.slice(9)}`;
}

/** PhilHealth PIN: XX-XXXXXXXXX-X (12 digits, 2-9-1) */
function fmtPhilHealth(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 2) return d;
  if (d.length <= 11) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 11)}-${d.slice(11)}`;
}

/** Pag-IBIG MID: ####-####-#### (12 digits, 4-4-4) */
function fmtPagIbig(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

/** TIN: ###-###-###[-###] (9 digits for individuals, optional 3-digit branch code) */
function fmtTIN(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Salary: digits only, displayed with thousands separator.
 * Returns the raw digits string so we store "25000" not "25,000".
 */
function fmtSalaryDisplay(rawDigits: string): string {
  if (!rawDigits) return '';
  return Number(rawDigits).toLocaleString('en-PH');
}

// ── Validators ─────────────────────────────────────────────────────────────────
function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!cleaned) return 'Phone number is required.';
  if (!PH_PHONE_REGEX.test(cleaned))
    return 'Enter a valid PH number (e.g. 09171234567 or +639171234567).';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return 'Email address is required.';
  if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address.';
  return null;
}

function validateFile(file: File | null, required = false): string | null {
  if (!file) return required ? 'Resume / CV is required.' : null;
  if (!ALLOWED_FILE_TYPES.includes(file.type))
    return 'Only PDF, DOC, or DOCX files are allowed.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    return `File must be under ${MAX_FILE_SIZE_MB} MB.`;
  return null;
}

/** SSS: exactly 10 digits */
function validateSSS(val: string): string | null {
  const d = val.replace(/\D/g, '');
  if (!d) return null; // optional
  if (d.length !== 10) return 'SSS number must be 10 digits (##-#######-#).';
  return null;
}

/** PhilHealth: exactly 12 digits */
function validatePhilHealth(val: string): string | null {
  const d = val.replace(/\D/g, '');
  if (!d) return null;
  if (d.length !== 12) return 'PhilHealth PIN must be 12 digits (XX-XXXXXXXXX-X).';
  return null;
}

/** Pag-IBIG MID: exactly 12 digits */
function validatePagIbig(val: string): string | null {
  const d = val.replace(/\D/g, '');
  if (!d) return null;
  if (d.length !== 12) return 'Pag-IBIG MID must be 12 digits (####-####-####).';
  return null;
}

/** TIN: 9 digits (individual) or 12 digits (with branch code) */
function validateTIN(val: string): string | null {
  const d = val.replace(/\D/g, '');
  if (!d) return null;
  if (d.length !== 9 && d.length !== 12)
    return 'TIN must be 9 digits (###-###-###) or 12 with branch code.';
  return null;
}

const MAX_SALARY = 10_000_000;

/** Salary: required, must be a positive integer */
function validateSalary(rawDigits: string): string | null {
  if (!rawDigits) return 'Expected salary is required.';
  const n = Number(rawDigits);
  if (!Number.isInteger(n) || n <= 0) return 'Enter a valid salary amount (numbers only).';
  if (n > MAX_SALARY) return `Maximum salary is ₱${MAX_SALARY.toLocaleString('en-PH')}.`;
  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const [formData, setFormData] = useState<FormDataRecord>({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    position: '', expectedSalary: '', yearsOfExperience: '',
    sssNumber: '', pagibigNumber: '', philhealthNumber: '', tinNumber: '',
    resume: null, coverLetter: null, other: null,
  });

  const [errors, setErrors]       = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  // ── Safe input filter ────────────────────────────────────────────────────
  function handleSafeInput(e: React.FormEvent) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const cleaned = target.value
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    if (cleaned !== target.value) {
      target.value = cleaned
    }
  }

  // ── Generic field setter ───────────────────────────────────────────────────
  function setField<K extends keyof FormDataRecord>(key: K, value: FormDataRecord[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ── Government-ID input handler (strips to digits, applies mask) ───────────
  function handleGovId(
    field: 'sssNumber' | 'pagibigNumber' | 'philhealthNumber' | 'tinNumber',
    raw: string,
  ) {
    const formatters = {
      sssNumber:        fmtSSS,
      philhealthNumber: fmtPhilHealth,
      pagibigNumber:    fmtPagIbig,
      tinNumber:        fmtTIN,
    };
    setField(field, formatters[field](raw));
  }

  // ── Salary handler (digits only, stores raw digits) ────────────────────────
  function handleSalary(input: string) {
    const digits = input.replace(/[^\d]/g, '');
    const capped = digits.length > 7 ? digits.slice(0, 7) : digits;
    setField('expectedSalary', capped);
  }

  // ── File handler ───────────────────────────────────────────────────────────
  function handleFile(
    doc: 'resume' | 'coverLetter' | 'other',
    files: FileList | null,
  ) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validateFile(file, doc === 'resume');
    if (err) {
      setErrors(prev => ({ ...prev, [doc]: err }));
      return;
    }
    setField(doc, file);
  }

  function removeFile(doc: 'resume' | 'coverLetter' | 'other') {
    setField(doc, null);
    const input = document.getElementById(doc) as HTMLInputElement | null;
    if (input) input.value = '';
  }

  // ── Full validation ────────────────────────────────────────────────────────
  function validate(): FormErrors {
    const e: FormErrors = {};

    if (!formData.firstName.trim())        e.firstName         = 'First name is required.';
    if (!formData.lastName.trim())         e.lastName          = 'Last name is required.';

    const emailErr = validateEmail(formData.email);
    if (emailErr) e.email = emailErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) e.phone = phoneErr;

    if (!formData.address.trim())          e.address           = 'Address is required.';
    if (!formData.position.trim())         e.position          = 'Position is required.';
    if (!formData.yearsOfExperience.trim()) e.yearsOfExperience = 'Years of experience is required.';

    const salaryErr = validateSalary(formData.expectedSalary);
    if (salaryErr) e.expectedSalary = salaryErr;

    // Government IDs (optional but format-validated when present)
    const sssErr = validateSSS(formData.sssNumber);
    if (sssErr) e.sssNumber = sssErr;

    const philErr = validatePhilHealth(formData.philhealthNumber);
    if (philErr) e.philhealthNumber = philErr;

    const pagibigErr = validatePagIbig(formData.pagibigNumber);
    if (pagibigErr) e.pagibigNumber = pagibigErr;

    const tinErr = validateTIN(formData.tinNumber);
    if (tinErr) e.tinNumber = tinErr;

    const resumeErr = validateFile(formData.resume, true);
    if (resumeErr) e.resume = resumeErr;

    // Validate optional file formats if provided
    const clErr = validateFile(formData.coverLetter, false);
    if (clErr) e.coverLetter = clErr;

    const otherErr = validateFile(formData.other, false);
    if (otherErr) e.other = otherErr;

    return e;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrKey = Object.keys(validationErrors)[0];
      document.getElementById(firstErrKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    const data = new FormData();

    // Append every field — Files get explicit filename so the server sees all three docs.
    // Non-null check ensures optional (null) files are simply omitted.
    Object.entries(formData).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (value instanceof File) {
        // Always pass the filename; FormData.append(name, blob) would use "blob" as the name
        data.append(key, value, value.name);
      } else {
        data.append(key, String(value));
      }
    });

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: data });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrors(prev => ({ ...prev, resume: errData.error || errData.message || 'Submission failed. Please try again.' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, resume: 'Connection error. Please check your network and try again.' }));
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-gray-500 mb-8">We'll review your application and contact you soon.</p>
        <Link
          href="/"
          className="bg-[#1E3A8A] hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const FieldError = ({ field }: { field: keyof FormErrors }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null;

  const inputClass = (field: keyof FormErrors) =>
    `w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-[#1E3A8A] text-white p-6 w-full shadow-md">
        <Link href="/" className="text-sm hover:underline text-white/70">← Back to Login</Link>
        <h1 className="text-2xl font-bold mt-2">Job Application Form</h1>
        <p className="text-sm text-white/60">HRKonek — Join Our Team</p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8"
      >

        {/* ── Left Column ───────────────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">

          {/* Personal Information */}
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">
            Personal Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name <span className="text-blue-600">*</span>
              </label>
              <input
                id="firstName"
                className={inputClass('firstName')}
                placeholder="Juan"
                value={formData.firstName}
                onInput={handleSafeInput}
                onChange={e => setField('firstName', e.target.value)}
              />
              <FieldError field="firstName" />
            </div>

            <div>
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name <span className="text-blue-600">*</span>
              </label>
              <input
                id="lastName"
                className={inputClass('lastName')}
                placeholder="dela Cruz"
                value={formData.lastName}
                onInput={handleSafeInput}
                onChange={e => setField('lastName', e.target.value)}
              />
              <FieldError field="lastName" />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address <span className="text-blue-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={inputClass('email')}
                placeholder="juan@email.com"
                value={formData.email}
                onInput={handleSafeInput}
                onChange={e => setField('email', e.target.value)}
              />
              <FieldError field="email" />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number <span className="text-blue-600">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                className={inputClass('phone')}
                placeholder="09171234567"
                value={formData.phone}
                onInput={handleSafeInput}
                onChange={e => setField('phone', e.target.value)}
              />
              <FieldError field="phone" />
              {!errors.phone && (
                <p className="text-xs text-gray-400 mt-1">Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Complete Address <span className="text-blue-600">*</span>
            </label>
            <textarea
              id="address"
              className={inputClass('address')}
              rows={4}
              placeholder="House No., Street, Barangay, City, Province"
              value={formData.address}
              onInput={handleSafeInput}
              onChange={e => setField('address', e.target.value)}
            />
            <FieldError field="address" />
          </div>

          {/* Position Details */}
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">
            Position Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SearchableSelect
                label="Position Applied For"
                options={POSITIONS}
                value={formData.position}
                onChange={(val) => setField('position', val)}
                error={errors.position}
                placeholder="Select or type position..."
                required
              />
            </div>

            {/* ── Salary: numeric-only with peso prefix ── */}
            <div>
              <label htmlFor="expectedSalary" className="text-sm font-medium text-gray-700">
                Expected Salary <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">
                  ₱
                </span>
                <input
                  id="expectedSalary"
                  type="text"
                  inputMode="numeric"
                  className={`${inputClass('expectedSalary')} pl-7`}
                  placeholder="25,000"
                  // Display with thousands separator; stored as raw digits
                  value={fmtSalaryDisplay(formData.expectedSalary)}
                  onChange={e => handleSalary(e.target.value)}
                />
              </div>
              <FieldError field="expectedSalary" />
              {!errors.expectedSalary && (
                <p className="text-xs text-gray-400 mt-1">Numbers only — e.g. 25,000 (max ₱10,000,000)</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="yearsOfExperience" className="text-sm font-medium text-gray-700">
              Years of Experience <span className="text-blue-600">*</span>
            </label>
            <textarea
              id="yearsOfExperience"
              className={inputClass('yearsOfExperience')}
              rows={3}
              placeholder="Briefly describe your work history and total years of relevant experience…"
              value={formData.yearsOfExperience}
              onInput={handleSafeInput}
              onChange={e => setField('yearsOfExperience', e.target.value)}
            />
            <FieldError field="yearsOfExperience" />
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">

          {/* Government IDs */}
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">
            Government IDs
          </h2>

          <p className="text-xs text-gray-400 -mt-2">
            All fields are optional but highly recommended. Numbers auto-format as you type.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* SSS */}
            <div>
              <label htmlFor="sssNumber" className="text-sm font-medium text-gray-700">
                SSS Number
              </label>
              <input
                id="sssNumber"
                type="text"
                inputMode="numeric"
                className={inputClass('sssNumber')}
                placeholder="34-1234567-8"
                maxLength={12}
                value={formData.sssNumber}
                onChange={e => handleGovId('sssNumber', e.target.value)}
              />
              <FieldError field="sssNumber" />
              {!errors.sssNumber && (
                <p className="text-xs text-gray-400 mt-1">Format: ##-#######-# (10 digits)</p>
              )}
            </div>

            {/* Pag-IBIG */}
            <div>
              <label htmlFor="pagibigNumber" className="text-sm font-medium text-gray-700">
                Pag-IBIG MID
              </label>
              <input
                id="pagibigNumber"
                type="text"
                inputMode="numeric"
                className={inputClass('pagibigNumber')}
                placeholder="1234-5678-9012"
                maxLength={14}
                value={formData.pagibigNumber}
                onChange={e => handleGovId('pagibigNumber', e.target.value)}
              />
              <FieldError field="pagibigNumber" />
              {!errors.pagibigNumber && (
                <p className="text-xs text-gray-400 mt-1">Format: ####-####-#### (12 digits)</p>
              )}
            </div>

            {/* PhilHealth */}
            <div>
              <label htmlFor="philhealthNumber" className="text-sm font-medium text-gray-700">
                PhilHealth PIN
              </label>
              <input
                id="philhealthNumber"
                type="text"
                inputMode="numeric"
                className={inputClass('philhealthNumber')}
                placeholder="1234-5678-9012"
                maxLength={14}
                value={formData.philhealthNumber}
                onChange={e => handleGovId('philhealthNumber', e.target.value)}
              />
              <FieldError field="philhealthNumber" />
              {!errors.philhealthNumber && (
                <p className="text-xs text-gray-400 mt-1">Format: ####-####-#### (12 digits)</p>
              )}
            </div>

            {/* TIN */}
            <div>
              <label htmlFor="tinNumber" className="text-sm font-medium text-gray-700">
                TIN
              </label>
              <input
                id="tinNumber"
                type="text"
                inputMode="numeric"
                className={inputClass('tinNumber')}
                placeholder="123-456-789"
                maxLength={15}
                value={formData.tinNumber}
                onChange={e => handleGovId('tinNumber', e.target.value)}
              />
              <FieldError field="tinNumber" />
              {!errors.tinNumber && (
                <p className="text-xs text-gray-400 mt-1">Format: ###-###-###[-###] (9 or 12 digits)</p>
              )}
            </div>
          </div>

          {/* Document Attachments */}
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">
            Document Attachments
          </h2>

          {(['resume', 'coverLetter', 'other'] as const).map(doc => {
            const { label, required } = DOC_LABELS[doc];
            const file     = formData[doc] as File | null;
            const hasError = !!errors[doc];

            return (
              <div key={doc}>
                {/* Hidden native file input */}
                <input
                  type="file"
                  id={doc}
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={e => handleFile(doc, e.target.files)}
                />

                {file ? (
                  /* Uploaded state */
                  <div
                    className={`flex items-center justify-between border rounded-lg px-4 py-3 ${
                      hasError
                        ? 'border-red-400 bg-red-50'
                        : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 font-medium truncate">{file.name}</span>
                      <span className="text-xs text-green-500 flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(doc)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Upload prompt */
                  <label
                    htmlFor={doc}
                    className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      hasError
                        ? 'border-red-400 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mb-2 mx-auto ${hasError ? 'text-red-400' : 'text-blue-400'}`} />
                    <p className="font-semibold text-gray-800 text-sm">
                      {label}
                      {required && <span className="text-blue-600 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, or DOCX — max 5 MB</p>
                  </label>
                )}

                <FieldError field={doc} />
              </div>
            );
          })}
        </div>
      </form>

      {/* ── Action Row ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto flex justify-end gap-4 px-6 mt-4">
        <Link
          href="/"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}