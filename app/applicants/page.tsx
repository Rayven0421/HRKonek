export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/Sidebar';
import ApplicantTable from '@/components/ApplicantTable';
import NotificationBell from '@/components/NotificationBell';
import NavbarUserMenu from '@/components/NavbarUserMenu';
import Link from 'next/link';
import { FileText, AlertCircle, Archive } from 'lucide-react';

export default async function ApplicantsPage() {
  let rawApplicants: Array<{
    id: string; applicantId: string | null;
    firstName: string; lastName: string;
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
  }> = []

  let pageError: string | null = null

  try {
    rawApplicants = await prisma.$queryRaw`
      SELECT id, applicantId, firstName, lastName, email, phone,
             address, position, expectedSalary,
             yearsOfExperience, sssNumber, pagibigNumber,
             philhealthNumber, tinNumber, resumeUrl,
             coverLetterUrl, otherDocsUrl, status,
             appliedAt, createdAt, convertedEmployeeId
      FROM Applicant
      WHERE isArchived = 0
      ORDER BY appliedAt ASC
    `
  } catch (error) {
    console.error('Applicants page query error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('invalid characters') || msg.includes('Conversion failed')) {
      pageError = 'Some applicant records contain invalid data. Please contact your administrator.'
    } else {
      pageError = 'Unable to load applicants at this time. Please refresh the page.'
    }
  }

  const applicants = rawApplicants.map((a) => ({
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
    applicantId:       a.applicantId ?? undefined,
  }));

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
          <div className="flex items-center gap-3">
            <NotificationBell />
            <NavbarUserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review and manage job applicants</p>
          </div>

          {pageError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium text-sm">Unable to load data</p>
                <p className="text-red-600 text-xs mt-1">{pageError}</p>
              </div>
            </div>
          )}

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

          <div className="flex justify-end mb-3">
            <Link
              href="/applicants/archive"
              className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Archive className="w-4 h-4" />
              Archived Applicants
            </Link>
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
