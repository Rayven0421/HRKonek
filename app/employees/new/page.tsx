"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { DEPARTMENTS, POSITIONS } from "@/lib/constants";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  department: string;
  hireDate: string;
  salary: string;
  status: string;
}

const MAX_SALARY = 10_000_000;

const REGEX = {
  name: /^[a-zA-Z\s'-]{2,50}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+63\s?|0)9\d{9}$/,
};

const handleSafeInput = (e: React.FormEvent) => {
  const target = e.target as HTMLInputElement
  const cleaned = target.value
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
  if (cleaned !== target.value) {
    target.value = cleaned
  }
}

const InputField = ({ 
  label, 
  name, 
  type = "text", 
  placeholder = "", 
  value, 
  onChange,
  error
}: { 
  label: string; 
  name: string; 
  type?: string; 
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
        }`}
      placeholder={placeholder}
      value={value}
      onInput={handleSafeInput}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <span className="text-xs font-medium text-red-600">{error}</span>}
  </div>
);

export default function NewEmployeePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    department: "",
    hireDate: "",
    salary: "",
    status: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!REGEX.name.test(formData.firstName)) errors.firstName = "Invalid first name (2-50 letters)";
    if (!REGEX.name.test(formData.lastName)) errors.lastName = "Invalid last name (2-50 letters)";
    if (!REGEX.email.test(formData.email)) errors.email = "Invalid email address";
    if (formData.phone && !REGEX.phone.test(formData.phone)) errors.phone = "Invalid PH number (+639... or 09...)";
    if (formData.salary) {
      const n = Number(formData.salary);
      if (!Number.isInteger(n) || n <= 0) errors.salary = "Invalid salary amount";
      else if (n > MAX_SALARY) errors.salary = `Maximum salary is ₱${MAX_SALARY.toLocaleString('en-PH')}.`;
    }
    if (!formData.role) errors.role = "Position is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.hireDate) errors.hireDate = "Hire date is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validate()) {
      setError("Please fix the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({
        message: 'Unexpected server response'
      }));

      if (!response.ok) {
        setError(data.message || data.error || "Failed to create employee");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      window.location.href = "/employees";
    } catch (err) {
      setError("Connection error. Please check your network and try again.");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  function handleSalary(input: string) {
    const digits = input.replace(/[^\d]/g, '');
    const capped = digits.length > 7 ? digits.slice(0, 7) : digits;
    handleInputChange('salary', capped);
  }

  function fmtSalaryDisplay(rawDigits: string): string {
    if (!rawDigits) return '';
    return Number(rawDigits).toLocaleString('en-PH');
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header */}
      <header className="w-full bg-[#1E3A8A] text-white px-8 py-6 flex flex-col gap-1 relative z-10">
        <Link href="/employees" className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition-opacity">
          <ChevronLeft className="w-5 h-5" /> Add New Employee
        </Link>
        <span className="text-sm text-blue-100">Enter employee information</span>
      </header>

      {/* Background Blobs */}
      <div className="absolute -left-20 top-1/4 w-96 h-96 bg-[#1E3A8A] rounded-full blur-3xl opacity-20 -z-0 pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20 -z-0 pointer-events-none" />
      
      {/* Custom SVG Blobs for more accurate "wave/blob" look */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-10 pointer-events-none -z-0">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path fill="#1E3A8A" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,86.1,-0.5C85.3,14.7,80.4,29.3,72.4,42.1C64.4,54.9,53.3,65.8,40.3,73.5C27.3,81.2,13.7,85.7,-0.8,87.5C-15.3,89.3,-30.6,88.4,-44.2,82.8C-57.8,77.2,-70,66.9,-77.3,54.3C-84.6,41.7,-87,26.7,-85.6,12.4C-84.2,-1.9,-79,-15.4,-71.6,-27.5C-64.2,-39.6,-54.6,-50.2,-43.2,-58.4C-31.8,-66.6,-18.6,-72.4,-3.6,-73.7C11.4,-75,23.9,-73.5,36.4,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-10 pointer-events-none -z-0">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path fill="#60A5FA" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,86.1,-0.5C85.3,14.7,80.4,29.3,72.4,42.1C64.4,54.9,53.3,65.8,40.3,73.5C27.3,81.2,13.7,85.7,-0.8,87.5C-15.3,89.3,-30.6,88.4,-44.2,82.8C-57.8,77.2,-70,66.9,-77.3,54.3C-84.6,41.7,-87,26.7,-85.6,12.4C-84.2,-1.9,-79,-15.4,-71.6,-27.5C-64.2,-39.6,-54.6,-50.2,-43.2,-58.4C-31.8,-66.6,-18.6,-72.4,-3.6,-73.7C11.4,-75,23.9,-73.5,36.4,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10 flex justify-center py-16 px-4">
        <div className="w-full max-w-[700px] bg-white rounded-xl shadow-lg p-10 border border-gray-100">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md border border-red-100 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Personal Information Section */}
            <section className="space-y-6">
              <div>
                <h2 className="text-[#1E3A8A] font-bold text-lg">Personal Information</h2>
                <div className="w-full h-px bg-gray-200 mt-1" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  label="First Name" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={(val) => handleInputChange("firstName", val)} 
                  error={fieldErrors.firstName}
                />
                <InputField 
                  label="Last Name" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={(val) => handleInputChange("lastName", val)} 
                  error={fieldErrors.lastName}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  label="Email Address" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={(val) => handleInputChange("email", val)} 
                  error={fieldErrors.email}
                />
                <InputField 
                  label="Phone Number" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={(val) => handleInputChange("phone", val)} 
                  error={fieldErrors.phone}
                />
              </div>
              <InputField 
                label="Address" 
                name="address" 
                value={formData.address} 
                onChange={(val) => handleInputChange("address", val)} 
              />
              
              <div className="w-full h-px bg-gray-200" />
            </section>

            {/* Employment Information Section */}
            <section className="space-y-6">
              <div>
                <h2 className="text-[#1E3A8A] font-bold text-lg">Employment Information</h2>
                <div className="w-full h-px bg-gray-200 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#1E3A8A]">Employee ID</label>
                  <input 
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Auto-generated"
                  />
                </div>
                <SearchableSelect
                  label="Position"
                  options={POSITIONS}
                  value={formData.role}
                  onChange={(val) => handleInputChange("role", val)}
                  error={fieldErrors.role}
                  placeholder="Select or type position..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <SearchableSelect
                  label="Department"
                  options={DEPARTMENTS}
                  value={formData.department}
                  onChange={(val) => handleInputChange("department", val)}
                  error={fieldErrors.department}
                  placeholder="Select or type department..."
                />
                <InputField 
                  label="Start Date" 
                  name="hireDate" 
                  type="date" 
                  value={formData.hireDate} 
                  onChange={(val) => handleInputChange("hireDate", val)} 
                  error={fieldErrors.hireDate}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Annual Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">₱</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white pl-7
                        focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${
                          fieldErrors.salary ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                      placeholder="25,000"
                      value={fmtSalaryDisplay(formData.salary)}
                      onChange={e => handleSalary(e.target.value)}
                    />
                  </div>
                  {fieldErrors.salary && <span className="text-xs font-medium text-red-600">{fieldErrors.salary}</span>}
                  {!fieldErrors.salary && <span className="text-xs text-gray-400">Numbers only — max ₱10,000,000</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#1E3A8A]">Employment Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Bottom Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/employees")}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-[#3B82F6] text-white rounded-md font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
