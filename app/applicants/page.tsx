export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client'
import Sidebar from '@/components/Sidebar';
import ApplicantTable from '@/components/ApplicantTable';
import { Bell, UserCircle, FileText } from 'lucide-react';

export default async function ApplicantsPage() {
  // ── Fetch oldest-first so index 0 = A001 (stable, chronological IDs) ──────
  /* SQL: Get all applicants ordered by application date
     ascending for stable ID assignment (A001 = oldest) */
  const rawApplicants = await prisma.$queryRaw<Array<{
    id: string; firstName: string; lastName: string;
    email: string | null; phone: string | null;
    address: string | null; position: string;
    expectedSalary: string | null;
    yearsOfExperience: string | null;
    sssNumber: string | null; pagibigNumber: string | null;
    philhealthNumber: string | null; tinNumber: string | null;
    resumeUrl: string | null; coverLetterUrl: string | null;
    otherDocsUrl: string | null; status: string;
    appliedAt: Date; createdAt: Date;
    convertedEmployeeId: string | null;
  }>>`
    SELECT id, firstName, lastName, email, phone,
           address, position, expectedSalary,
           yearsOfExperience, sssNumber, pagibigNumber,
           philhealthNumber, tinNumber, resumeUrl,
           coverLetterUrl, otherDocsUrl, status,
           appliedAt, createdAt, convertedEmployeeId
    FROM Applicant
    ORDER BY appliedAt ASC
  `

  // Assign stable IDs based on insertion/application order, not display order
  const applicants = rawApplicants.map((a, index) => ({
    ...a,
    email:             a.email             ?? '',
    phone:             a.phone             ?? undefined,
    address:           a.address           ?? undefined,
    expectedSalary:    a.expectedSalary    ?? undefined,
    yearsOfExperience: a.yearsOfExperience ?? undefined,
    sssNumber:         a.sssNumber         ?? undefined,
    pagibigNumber:     a.pagibigNumber     ?? undefined,
    philhealthNumber:  a.philhealthNumber  ?? undefined,
    tinNumber:         a.tinNumber         ?? undefined,
    resumeUrl:         a.resumeUrl         ?? undefined,
    coverLetterUrl:    a.coverLetterUrl    ?? undefined,
    otherDocsUrl:      a.otherDocsUrl      ?? undefined,
    convertedEmployeeId: a.convertedEmployeeId ?? undefined,
    applicantId: `A${String(index + 1).padStart(3, '0')}`,  // A001 = oldest
  }));

  // Pass newest-first as the default — the client table handles re-sorting
  const defaultSorted = [...applicants].reverse();

  const pendingCount   = applicants.filter(a => a.status === 'Applied' || a.status === 'Under Review').length;
  const hiredCount     = applicants.filter(a => a.status === 'Hired').length;
  const interviewCount = applicants.filter(a => a.status === 'Interview Scheduled').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
          <div className="w-8 lg:hidden" />
          <div className="hidden lg:block text-white font-semibold text-base tracking-wide opacity-80 select-none">
            Management Portal
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <button className="relative text-white/80 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium">Admin User</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review and manage job applicants</p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-900">{applicants.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-sm text-gray-500">Pending</span>
              <span className="text-sm font-bold text-gray-900">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-500">Interviewing</span>
              <span className="text-sm font-bold text-gray-900">{interviewCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-gray-500">Hired</span>
              <span className="text-sm font-bold text-gray-900">{hiredCount}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ApplicantTable applicants={defaultSorted} />
          </div>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}