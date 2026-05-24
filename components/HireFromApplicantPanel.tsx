"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, User, X, Check } from 'lucide-react';

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  email: string;
  phone: string | null;
  address: string | null;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  expectedSalary: string | null;
}

export default function HireFromApplicantPanel({ applicants, onSelect }: { applicants: Applicant[], onSelect: (applicant: Applicant) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = applicants.filter(a => 
    a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-[#1E3A8A]" />
          <span className="font-semibold text-gray-900">Hire an Existing Applicant</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500">Pre-fill this form from a Hired/Interview-Scheduled applicant. Their status will be set to &quot;Hired&quot;.</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search applicants..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map(a => (
              <div 
                key={a.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedId === a.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                onClick={() => {
                  setSelectedId(a.id);
                  onSelect(a);
                }}
              >
                <div>
                  <p className="text-sm font-medium">{a.firstName} {a.lastName} · {a.position} · {a.status}</p>
                </div>
                {selectedId === a.id && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">Selected <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); setSelectedId(null); }} /></span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
