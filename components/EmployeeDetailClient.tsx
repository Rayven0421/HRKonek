"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Mail, Phone, MapPin, Calendar, Briefcase, CreditCard,
  Shield, Heart, Home, ChevronLeft, UserCircle,
  Bell, Printer, X, Save, Camera, AlertCircle, CheckCircle
} from "lucide-react";

interface Employee {
  id: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  tinNumber: string | null;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  department: string;
  role: string;
  employmentType: string | null;
  status: string;
  salary: number | null;
  hireDate: string;
  profileImage: string | null;
}

const VALIDATIONS: Record<string, { regex: RegExp; message: string; placeholder: string }> = {
  sssNumber: {
    regex: /^\d{2}-\d{7}-\d{1}$/,
    message: 'SSS format: XX-XXXXXXX-X (e.g. 34-1234567-8)',
    placeholder: '34-1234567-8',
  },
  philhealthNumber: {
    regex: /^\d{2}-\d{9}-\d{1}$|^\d{12}$/,
    message: 'PhilHealth format: XX-XXXXXXXXX-X (12 digits)',
    placeholder: '12-123456789-0',
  },
  pagibigNumber: {
    regex: /^\d{4}-\d{4}-\d{4}$|^\d{12}$/,
    message: 'PAG-IBIG format: XXXX-XXXX-XXXX (12 digits)',
    placeholder: '1234-5678-9012',
  },
  tinNumber: {
    regex: /^\d{3}-\d{3}-\d{3}(-\d{3})?$/,
    message: 'TIN format: XXX-XXX-XXX or XXX-XXX-XXX-XXX',
    placeholder: '123-456-789-000',
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Enter a valid email address',
    placeholder: 'juan.dela.cruz@company.com',
  },
  phone: {
    regex: /^(\+63|0)9\d{9}$/,
    message: 'Phone format: 09XXXXXXXXX or +639XXXXXXXXX',
    placeholder: '09123456789',
  },
  salary: {
    regex: /^\d+(\.\d{1,2})?$/,
    message: 'Enter a valid salary amount (e.g. 25000.00)',
    placeholder: '25000.00',
  },
  firstName: {
    regex: /^[a-zA-Z\s\-'\.]{2,50}$/,
    message: 'First name must be 2-50 letters only',
    placeholder: 'Juan',
  },
  lastName: {
    regex: /^[a-zA-Z\s\-'\.]{2,50}$/,
    message: 'Last name must be 2-50 letters only',
    placeholder: 'Dela Cruz',
  },
};

const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'role', 'department'];

function validateField(name: string, value: string): string {
  if (!value || value.trim() === '') {
    if (REQUIRED_FIELDS.includes(name)) return 'This field is required';
    return '';
  }
  const rule = VALIDATIONS[name];
  if (!rule) return '';
  if (!rule.regex.test(value.trim())) return rule.message;
  return '';
}

function formatSSS(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 9)}-${digits.slice(9)}`;
}

function formatTIN(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join('-');
}

function formatPagibig(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}

const FORMAT_MAP: Record<string, (v: string) => string> = {
  sssNumber: formatSSS,
  tinNumber: formatTIN,
  pagibigNumber: formatPagibig,
};

export default function EmployeeDetailClient({
  employee: initialEmployee,
}: {
  employee: Employee;
}) {
  const [employeeData, setEmployeeData] = useState<Employee>(initialEmployee);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employee = employeeData;
  const salary = employee.salary ?? 0;

  const sssMonthly = salary > 0
    ? Math.min(Math.max(Math.round(salary * 0.045 / 100) * 100, 135), 900)
    : 0;
  const philMonthly = salary > 0
    ? Math.min(Math.max(Math.round(salary * 0.025 / 50) * 50, 250), 2500)
    : 0;
  const pagibigMonthly = salary > 0
    ? Math.min(Math.round(salary * 0.02 / 50) * 50, 200)
    : 0;

  const lastPayment = new Date().toLocaleDateString('en-PH', {
    month: 'long', year: 'numeric',
  });

  const hasGovIds =
    !!employee.sssNumber ||
    !!employee.philhealthNumber ||
    !!employee.pagibigNumber;

  const printHistory = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
      sss: employee.sssNumber ? sssMonthly : null,
      phil: employee.philhealthNumber ? philMonthly : null,
      pagi: employee.pagibigNumber ? pagibigMonthly : null,
      status: i === 0 ? 'Pending' : 'Paid',
    };
  });

  const contributionHistory = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
      sss: employee.sssNumber ? sssMonthly : null,
      phil: employee.philhealthNumber ? philMonthly : null,
      pagi: employee.pagibigNumber ? pagibigMonthly : null,
      status: i === 0 ? 'Pending' : 'Paid',
    };
  });

  const fmt = (n: number) =>
    '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  function getFieldBorderClass(field: string) {
    if (errors[field]) return 'border-red-400 focus:ring-red-400/30';
    const val = formData[field];
    if (val && val.trim() !== '' && !errors[field] && hasAttemptedSave) return 'border-green-400 focus:ring-green-400/30';
    return 'border-gray-300 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]';
  }

  function openEditModal() {
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      dateOfBirth: employee.dateOfBirth
        ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
        : '',
      tinNumber: employee.tinNumber || '',
      sssNumber: employee.sssNumber || '',
      philhealthNumber: employee.philhealthNumber || '',
      pagibigNumber: employee.pagibigNumber || '',
      role: employee.role,
      department: employee.department,
      salary: employee.salary ? employee.salary.toString() : '',
      hireDate: new Date(employee.hireDate).toISOString().split('T')[0],
      employmentType: employee.employmentType || 'Regular',
      status: employee.status,
    });
    setErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    setImageError('');
    setHasAttemptedSave(false);
    setIsEditOpen(true);
  }

  function closeEditModal() {
    setIsEditOpen(false);
    setErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    setImageError('');
    setHasAttemptedSave(false);
  }

  function handleFormChange(field: string, value: string) {
    const fmtFn = FORMAT_MAP[field];
    const formatted = fmtFn ? fmtFn(value) : value;
    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleFieldBlur(field: string, value: string) {
    const err = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: err }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setImageError('Only JPG, PNG, or WEBP files allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError('Image must be under 2MB');
      return;
    }

    setImageError('');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(true);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const val = formData[key];
      if (typeof val === 'string') {
        const err = validateField(key, val);
        if (err) newErrors[key] = err;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    setHasAttemptedSave(true);
    if (!validate()) return;

    setIsSaving(true);
    try {
      let profileImage = employee.profileImage;
      if (removeImage) {
        profileImage = null;
      } else if (selectedImage) {
        const formDataImg = new FormData();
        formDataImg.append('file', selectedImage);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataImg });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Upload failed');
        }
        const { filename } = await uploadRes.json();
        profileImage = filename;
      }

      const body: Record<string, unknown> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        tinNumber: formData.tinNumber?.trim() || null,
        sssNumber: formData.sssNumber?.trim() || null,
        philhealthNumber: formData.philhealthNumber?.trim() || null,
        pagibigNumber: formData.pagibigNumber?.trim() || null,
        role: formData.role.trim(),
        department: formData.department.trim(),
        salary: formData.salary ? parseFloat(formData.salary) : null,
        hireDate: formData.hireDate,
        employmentType: formData.employmentType || 'Regular',
        status: formData.status || 'Active',
        profileImage,
      };

      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }

      const updated = await res.json();
      setEmployeeData(updated);
      closeEditModal();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const initials = (employee.firstName[0] + employee.lastName[0]).toUpperCase();

  const printTotalSSS = printHistory.reduce((s, r) => s + (r.sss || 0), 0);
  const printTotalPhil = printHistory.reduce((s, r) => s + (r.phil || 0), 0);
  const printTotalPagi = printHistory.reduce((s, r) => s + (r.pagi || 0), 0);
  const printGrandTotal = printTotalSSS + printTotalPhil + printTotalPagi;

  const errorCount = Object.keys(errors).filter(k => errors[k]).length;

  function renderInputIcon(field: string) {
    if (!hasAttemptedSave) return null;
    const val = formData[field];
    if (!val || val.trim() === '') return null;
    if (errors[field]) {
      return <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:hidden">

        {/* Navbar */}
        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
          <div className="w-8 lg:hidden" />
          <div className="hidden lg:block text-white font-semibold text-base tracking-wide opacity-80 select-none">
            Management Portal
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <button className="relative text-white/80 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium">Admin User</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:hidden">

          {/* Success toast */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
              Employee profile updated successfully
            </div>
          )}

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/employees"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>
              {employee.profileImage ? (
                <img
                  src={`/uploads/${employee.profileImage}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  alt="Profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-gray-500 text-sm">
                  {employee.role} — {employee.department}
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={openEditModal}
                className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Details
              </button>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 mb-5">

            {/* LEFT — Personal Information card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">
                Personal Information
              </h2>

              <div className="space-y-4">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={employee.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={employee.phone || '—'} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={employee.address || '—'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Hire Date" value={formatDate(employee.hireDate)} />
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="TIN" value={employee.tinNumber || '—'} />
              </div>

              <hr className="border-gray-100 my-5" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Employment Type</span>
                  <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {employee.employmentType || 'Regular'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : employee.status === 'On Leave'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </div>
                {salary > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Annual Salary</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {fmt(salary)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Government Benefits card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">
                Government Benefits
              </h2>

              <div className="flex flex-col gap-4">
                <BenefitRow
                  color="blue"
                  icon={<Shield className="w-5 h-5 text-blue-600" />}
                  name="SSS (Social Security System)"
                  idLabel={`ID: ${employee.sssNumber || 'Not on file'}`}
                  hasId={!!employee.sssNumber}
                  monthly={sssMonthly}
                  lastPayment={lastPayment}
                  fmt={fmt}
                />
                <BenefitRow
                  color="red"
                  icon={<Heart className="w-5 h-5 text-red-500" />}
                  name="PhilHealth"
                  idLabel={`ID: ${employee.philhealthNumber || 'Not on file'}`}
                  hasId={!!employee.philhealthNumber}
                  monthly={philMonthly}
                  lastPayment={lastPayment}
                  fmt={fmt}
                />
                <BenefitRow
                  color="green"
                  icon={<Home className="w-5 h-5 text-green-600" />}
                  name="PAG-IBIG"
                  idLabel={`ID: ${employee.pagibigNumber || 'Not on file'}`}
                  hasId={!!employee.pagibigNumber}
                  monthly={pagibigMonthly}
                  lastPayment={lastPayment}
                  fmt={fmt}
                />
              </div>
            </div>
          </div>

          {/* Contribution History */}
          {hasGovIds ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">
                  Recent Contribution History
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Last 6 months of government benefit contributions
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Month', 'SSS', 'PhilHealth', 'PAG-IBIG', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contributionHistory.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {row.month}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {row.sss !== null ? fmt(row.sss) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {row.phil !== null ? fmt(row.phil) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {row.pagi !== null ? fmt(row.pagi) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            row.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-700 font-medium text-sm">
                No contribution history available
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Add SSS, PhilHealth, or PAG-IBIG IDs to this employee&apos;s profile to track contributions.
              </p>
            </div>
          )}

          <div className="h-6" />
        </main>
      </div>

      {/* ── Print Section ── */}
      <div id="print-section" className="hidden print:block" style={{ width: '210mm', margin: '0 auto', background: '#fff' }}>
        {/* HEADER */}
        <div style={{ background: '#1E3A8A', color: '#fff', padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {employee.profileImage ? (
                <img src={`/uploads/${employee.profileImage}`} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} alt="" />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 700, flexShrink: 0 }}>
                  {initials}
                </div>
              )}
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{employee.firstName} {employee.lastName}</div>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{employee.role} — {employee.department}</div>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '999px', fontSize: '14px' }}>{employee.status}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>HRKonek</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Human Resource Information System</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              {employee.employeeId && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>ID: {employee.employeeId}</div>}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '32px 40px' }}>
          {/* ROW 1 — Two columns */}
          <div style={{ display: 'flex', gap: '40px' }}>
            {/* LEFT — Personal Information */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1E3A8A', paddingBottom: '4px', marginBottom: '12px' }}>Personal Information</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {printField('Email', employee.email)}
                  {printField('Phone', employee.phone || '—')}
                  {printField('Address', employee.address || '—')}
                  {printField('Date of Birth', formatDate(employee.dateOfBirth))}
                  {printField('TIN Number', employee.tinNumber || '—')}
                </tbody>
              </table>
            </div>

            {/* RIGHT — Employment Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1E3A8A', paddingBottom: '4px', marginBottom: '12px' }}>Employment Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {printField('Employee ID', employee.employeeId || '—')}
                  {printField('Position', employee.role)}
                  {printField('Department', employee.department)}
                  {printField('Employment Type', employee.employmentType || 'Regular')}
                  {printField('Hire Date', formatDate(employee.hireDate))}
                  {printField('Annual Salary', salary > 0 ? fmt(salary) : '—')}
                  {printField('Status', employee.status)}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 2 — Government Benefits */}
          {hasGovIds && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1E3A8A', paddingBottom: '4px', marginBottom: '16px', marginTop: '28px' }}>Government Benefits &amp; IDs</div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <PrintBenefitCard color="#3B82F6" name="SSS (Social Security System)" id={employee.sssNumber || null} monthly={sssMonthly} fmt={fmt} />
                <PrintBenefitCard color="#F87171" name="PhilHealth" id={employee.philhealthNumber || null} monthly={philMonthly} fmt={fmt} />
                <PrintBenefitCard color="#22C55E" name="PAG-IBIG" id={employee.pagibigNumber || null} monthly={pagibigMonthly} fmt={fmt} />
              </div>
            </>
          )}

          {/* ROW 3 — Contribution History */}
          {hasGovIds && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1E3A8A', paddingBottom: '4px', marginBottom: '12px', marginTop: '28px' }}>Contribution History</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#1E3A8A', color: '#fff' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #E5E7EB' }}>Month</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #E5E7EB' }}>SSS</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #E5E7EB' }}>PhilHealth</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #E5E7EB' }}>PAG-IBIG</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #E5E7EB' }}>Total</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {printHistory.map((row, idx) => (
                    <tr key={row.month} style={{ background: idx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', fontWeight: 500, color: '#111827' }}>{row.month}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#4B5563' }}>{row.sss !== null ? fmt(row.sss) : '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#4B5563' }}>{row.phil !== null ? fmt(row.phil) : '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#4B5563' }}>{row.pagi !== null ? fmt(row.pagi) : '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmt((row.sss || 0) + (row.phil || 0) + (row.pagi || 0))}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: row.status === 'Pending' ? '#FEF3C7' : '#DCFCE7', color: row.status === 'Pending' ? '#B45309' : '#16A34A' }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#F3F4F6', fontWeight: 700 }}>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', color: '#111827' }}>Total (12 months)</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111827' }}>{fmt(printTotalSSS)}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111827' }}>{fmt(printTotalPhil)}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111827' }}>{fmt(printTotalPagi)}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111827' }}>{fmt(printGrandTotal)}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>—</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF' }}>
          <span>HRKonek — Human Resource Information System</span>
          <span>CONFIDENTIAL — For authorized personnel only</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg">Edit Employee Profile</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">

              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.form}
                </div>
              )}

              {/* Profile Picture Section */}
              <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl mb-6">
                {/* Avatar preview */}
                {imagePreview ? (
                  <img src={imagePreview} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" alt="Preview" />
                ) : employee.profileImage && !removeImage ? (
                  <img src={`/uploads/${employee.profileImage}`} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" alt="Profile" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#1E3A8A] text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-md">
                    {initials}
                  </div>
                )}

                {/* Upload controls */}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Profile Photo</p>
                  <p className="text-xs text-gray-500 mt-0.5">JPG, PNG or WEBP. Max 2MB</p>
                  <div className="flex gap-2 mt-2">
                    <label
                      htmlFor="profileImageInput"
                      className="bg-[#1E3A8A] text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-[#152e6f] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Upload Photo
                    </label>
                    <input
                      id="profileImageInput"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {(employee.profileImage || imagePreview) && (
                      <button
                        onClick={handleRemoveImage}
                        className="border border-gray-300 text-gray-600 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  {imageError && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {imageError}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 1: Personal Information */}
              <h3 className="text-[#1E3A8A] font-semibold mb-3">Personal Information</h3>
              <hr className="border-gray-200 mb-4" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" required error={errors.firstName}>
                  <div className="relative">
                    <input
                      name="firstName"
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                      onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('firstName')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="Juan"
                    />
                    {renderInputIcon('firstName')}
                  </div>
                </FormField>

                <FormField label="Last Name" required error={errors.lastName}>
                  <div className="relative">
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                      onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('lastName')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="Dela Cruz"
                    />
                    {renderInputIcon('lastName')}
                  </div>
                </FormField>

                <FormField label="Email" required error={errors.email}>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('email')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="juan.dela.cruz@company.com"
                    />
                    {renderInputIcon('email')}
                  </div>
                </FormField>

                <FormField label="Phone" error={errors.phone}>
                  <div className="relative">
                    <input
                      name="phone"
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('phone')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="09123456789"
                    />
                    {renderInputIcon('phone')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
                  </div>
                </FormField>

                <div className="col-span-2">
                  <FormField label="Address">
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                      placeholder="Enter address"
                    />
                  </FormField>
                </div>

                <FormField label="Date of Birth">
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                  />
                </FormField>

                <FormField label="TIN Number" error={errors.tinNumber}>
                  <div className="relative">
                    <input
                      name="tinNumber"
                      type="text"
                      value={formData.tinNumber || ''}
                      onChange={(e) => handleFormChange('tinNumber', e.target.value)}
                      onBlur={(e) => handleFieldBlur('tinNumber', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('tinNumber')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="123-456-789-000"
                    />
                    {renderInputIcon('tinNumber')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: XXX-XXX-XXX or XXX-XXX-XXX-XXX</p>
                  </div>
                </FormField>
              </div>

              {/* Section 2: Employment Information */}
              <h3 className="text-[#1E3A8A] font-semibold mb-3 mt-6">Employment Information</h3>
              <hr className="border-gray-200 mb-4" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Position/Role" required error={errors.role}>
                  <div className="relative">
                    <input
                      name="role"
                      type="text"
                      value={formData.role || ''}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      onBlur={(e) => handleFieldBlur('role', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('role')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="Enter position/role"
                    />
                    {renderInputIcon('role')}
                  </div>
                </FormField>

                <FormField label="Department" required error={errors.department}>
                  <div className="relative">
                    <input
                      name="department"
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => handleFormChange('department', e.target.value)}
                      onBlur={(e) => handleFieldBlur('department', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('department')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="Enter department"
                    />
                    {renderInputIcon('department')}
                  </div>
                </FormField>

                <FormField label="Annual Salary" error={errors.salary}>
                  <div className="relative">
                    <input
                      name="salary"
                      type="text"
                      value={formData.salary || ''}
                      onChange={(e) => handleFormChange('salary', e.target.value)}
                      onBlur={(e) => handleFieldBlur('salary', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('salary')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="25000.00"
                    />
                    {renderInputIcon('salary')}
                  </div>
                </FormField>

                <FormField label="Hire Date">
                  <input
                    type="date"
                    value={formData.hireDate || ''}
                    onChange={(e) => handleFormChange('hireDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                  />
                </FormField>

                <FormField label="Employment Type">
                  <select
                    value={formData.employmentType || 'Regular'}
                    onChange={(e) => handleFormChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Probationary">Probationary</option>
                  </select>
                </FormField>

                <FormField label="Status">
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </FormField>
              </div>

              {/* Section 3: Government IDs */}
              <h3 className="text-[#1E3A8A] font-semibold mb-3 mt-6">Government IDs</h3>
              <hr className="border-gray-200 mb-4" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="SSS Number" error={errors.sssNumber}>
                  <div className="relative">
                    <input
                      name="sssNumber"
                      type="text"
                      value={formData.sssNumber || ''}
                      onChange={(e) => handleFormChange('sssNumber', e.target.value)}
                      onBlur={(e) => handleFieldBlur('sssNumber', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('sssNumber')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="34-1234567-8"
                    />
                    {renderInputIcon('sssNumber')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: XX-XXXXXXX-X (e.g. 34-1234567-8)</p>
                  </div>
                </FormField>

                <FormField label="PhilHealth Number" error={errors.philhealthNumber}>
                  <div className="relative">
                    <input
                      name="philhealthNumber"
                      type="text"
                      value={formData.philhealthNumber || ''}
                      onChange={(e) => handleFormChange('philhealthNumber', e.target.value)}
                      onBlur={(e) => handleFieldBlur('philhealthNumber', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('philhealthNumber')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="12-123456789-0"
                    />
                    {renderInputIcon('philhealthNumber')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: XX-XXXXXXXXX-X (12 digits)</p>
                  </div>
                </FormField>

                <FormField label="PAG-IBIG Number" error={errors.pagibigNumber}>
                  <div className="relative">
                    <input
                      name="pagibigNumber"
                      type="text"
                      value={formData.pagibigNumber || ''}
                      onChange={(e) => handleFormChange('pagibigNumber', e.target.value)}
                      onBlur={(e) => handleFieldBlur('pagibigNumber', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('pagibigNumber')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="1234-5678-9012"
                    />
                    {renderInputIcon('pagibigNumber')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: XXXX-XXXX-XXXX (12 digits)</p>
                  </div>
                </FormField>

                <FormField label="TIN Number" error={errors.tinNumber}>
                  <div className="relative">
                    <input
                      name="tinNumber"
                      type="text"
                      value={formData.tinNumber || ''}
                      onChange={(e) => handleFormChange('tinNumber', e.target.value)}
                      onBlur={(e) => handleFieldBlur('tinNumber', e.target.value)}
                      className={`w-full px-3 py-2 border ${getFieldBorderClass('tinNumber')} rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8`}
                      placeholder="123-456-789-000"
                    />
                    {renderInputIcon('tinNumber')}
                    <p className="text-xs text-gray-400 mt-0.5">Format: XXX-XXX-XXX or XXX-XXX-XXX-XXX</p>
                  </div>
                </FormField>
              </div>

              {/* Validation Summary */}
              {hasAttemptedSave && (
                <div className={`mt-6 flex items-center gap-2 border rounded-lg px-4 py-2 text-sm ${errorCount === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {errorCount === 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">All fields are valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-700 font-medium">{errorCount} field(s) need attention</span>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeEditModal}
                className="border border-gray-300 text-gray-700 bg-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-[#1E3A8A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#152e6f] transition-colors flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </div>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function BenefitRow({
  color, icon, name, idLabel, hasId, monthly, lastPayment, fmt,
}: {
  color: 'blue' | 'red' | 'green';
  icon: React.ReactNode;
  name: string;
  idLabel: string;
  hasId: boolean;
  monthly: number;
  lastPayment: string;
  fmt: (n: number) => string;
}) {
  const bgMap = { blue: 'bg-blue-50 border-blue-100', red: 'bg-red-50 border-red-100', green: 'bg-green-50 border-green-100' };
  const iconBg = { blue: 'bg-blue-100', red: 'bg-red-100', green: 'bg-green-100' };

  return (
    <div className={`rounded-xl border p-4 ${bgMap[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[color]}`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{name}</p>
            <p className="text-xs text-gray-500">{idLabel}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          hasId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {hasId ? 'Active' : 'Not Enrolled'}
        </span>
      </div>
      {hasId && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/5">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Monthly Contribution</p>
            <p className="text-sm font-bold text-gray-900">{fmt(monthly)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Last Payment</p>
            <p className="text-sm font-medium text-gray-900">{lastPayment}</p>
          </div>
        </div>
      )}
      {!hasId && (
        <p className="text-xs text-gray-400 pt-2 border-t border-black/5">
          No government ID on file — enroll this employee to activate benefits.
        </p>
      )}
    </div>
  );
}

function FormField({
  label, required, error, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-blue-600">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function printField(label: string, value: string) {
  return (
    <tr>
      <td style={{ padding: '4px 8px 4px 0', color: '#6B7280', fontSize: '12px', width: '130px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: 500 }}>{value}</td>
    </tr>
  );
}

function PrintBenefitCard({ color, name, id, monthly, fmt }: { color: string; name: string; id: string | null; monthly: number; fmt: (n: number) => string }) {
  const hasId = !!id;
  return (
    <div style={{ flex: 1, borderTop: `4px solid ${color}`, padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
      <div style={{ fontWeight: 600, color: '#111827', fontSize: '13px', marginBottom: '8px' }}>{name}</div>
      <div style={{ fontSize: '12px', color: hasId ? '#4B5563' : '#9CA3AF', marginBottom: '6px' }}>
        ID: {id || 'Not Enrolled'}
      </div>
      <div style={{ marginBottom: '6px' }}>
        {hasId
          ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: '#DCFCE7', color: '#16A34A' }}>Active</span>
          : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: '#F3F4F6', color: '#6B7280' }}>Not Enrolled</span>
        }
      </div>
      {hasId && (
        <div style={{ fontSize: '12px', color: '#4B5563' }}>
          Monthly Contribution: <span style={{ fontWeight: 600, color: '#111827' }}>{fmt(monthly)}</span>
        </div>
      )}
    </div>
  );
}
