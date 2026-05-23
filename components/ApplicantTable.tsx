'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

type Applicant = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  appliedAt: Date;
  status: string;
  resumeUrl?: string;
};

const statusStyles: Record<string, string> = {
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Interview Scheduled': 'bg-blue-100 text-blue-800',
  'Pending Review': 'bg-pink-100 text-pink-800',
  'Applied': 'bg-gray-100 text-gray-800',
  'Hired': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
};

export default function ApplicantTable({ applicants }: { applicants: Applicant[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredApplicants = applicants.filter(
    (app) =>
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch(`/api/applicants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search applicants..."
          className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
            <th className="pb-3 text-left">ID</th>
            <th className="pb-3 text-left">NAME</th>
            <th className="pb-3 text-left">POSITION</th>
            <th className="pb-3 text-left">APPLIED DATE</th>
            <th className="pb-3 text-center">STATUS</th>
            <th className="pb-3 text-left">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map((app, index) => (
              <tr key={app.id}>
                <td className="py-4 font-medium text-sm text-gray-900">A{(index + 1).toString().padStart(3, '0')}</td>
                <td className="py-4 text-sm text-gray-900 font-medium">{app.firstName} {app.lastName}</td>
                <td className="py-4 text-sm text-gray-600">{app.position}</td>
                <td className="py-4 text-sm text-gray-600">{new Date(app.appliedAt).toISOString().split('T')[0]}</td>
                <td className="py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[app.status] || 'bg-gray-100 text-gray-800'}`}>
                    {app.status}
                  </span>
                </td>
                 <td className="py-4 flex gap-3">
                   <button onClick={() => handleUpdateStatus(app.id, 'Interview Scheduled')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium">Approve</button>
                   <button onClick={() => handleUpdateStatus(app.id, 'Rejected')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium">Reject</button>
                   {app.resumeUrl && (
                     <a href={app.resumeUrl} target="_blank" className="text-blue-600 text-xs font-medium hover:underline flex items-center">View Resume</a>
                   )}
                 </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={6} className="py-8 text-center text-gray-500">No applicants found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
