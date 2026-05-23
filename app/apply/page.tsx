'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Upload } from 'lucide-react';

type FormDataRecord = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  expectedSalary: string;
  yearsOfExperience: string;
  sssNumber: string;
  pagibigNumber: string;
  philhealthNumber: string;
  tinNumber: string;
  resume: File | null;
  coverLetter: File | null;
  other: File | null;
};

export default function ApplyPage() {
  const [formData, setFormData] = useState<FormDataRecord>({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    position: '', expectedSalary: '', yearsOfExperience: '',
    sssNumber: '', pagibigNumber: '', philhealthNumber: '', tinNumber: '',
    resume: null, coverLetter: null, other: null
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        data.append(key, value);
      }
    });
    
    const res = await fetch('/api/apply', {
      method: 'POST',
      body: data,
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8 text-center">
        <Check className="w-8 h-8 text-green-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h1>
        <p className="text-gray-600 mb-8">We will review your application and contact you soon.</p>
        <Link href="/" className="bg-[#1E3A8A] hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-[#1E3A8A] text-white p-6 w-full shadow-md">
        <Link href="/" className="text-sm hover:underline text-white/80">← Back to Login</Link>
        <h1 className="text-2xl font-bold mt-2">Job Application Form</h1>
        <p className="text-sm text-white/60">HRKonek - Join Our Team</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">First Name<span className="text-blue-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name<span className="text-blue-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, lastName: e.target.value})} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address<span className="text-blue-600">*</span></label>
              <input type="email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number<span className="text-blue-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Complete Address<span className="text-blue-600">*</span></label>
            <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows={4} onChange={e => setFormData({...formData, address: e.target.value})} required />
          </div>
          
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">Position Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Position Applied For<span className="text-blue-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, position: e.target.value})} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Expected Salary<span className="text-blue-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, expectedSalary: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Years of Experience<span className="text-blue-600">*</span></label>
            <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows={3} onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})} required />
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">Government IDs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">SSS Number</label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, sssNumber: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pag-IBIG Number</label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, pagibigNumber: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PhilHealth Number</label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, philhealthNumber: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">TIN Number</label>
              <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, tinNumber: e.target.value})} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#1E3A8A] border-b border-gray-200 pb-2">Document Attachments</h2>
          {['resume', 'coverLetter', 'other'].map((doc) => (
            <div key={doc}>
              <input type="file" id={doc} className="hidden" onChange={e => e.target.files && setFormData({...formData, [doc]: e.target.files[0]})} />
              <label htmlFor={doc} className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
                <p className="font-bold text-gray-900">{doc === 'resume' ? 'Upload Resume / CV *' : doc === 'coverLetter' ? 'Cover Letter (Optional)' : 'Other Documents'}</p>
                <p className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 5MB)</p>
                {formData[doc] && <p className="text-green-600 text-xs mt-1 font-medium">{formData[doc].name}</p>}
              </label>
            </div>
          ))}
        </div>
      </form>
      <div className="max-w-6xl mx-auto flex justify-end gap-4 px-6 mt-4">
        <Link href="/" className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Cancel</Link>
        <button onClick={handleSubmit} className="px-6 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-medium">Submit Application</button>
      </div>
    </div>
  );
}
