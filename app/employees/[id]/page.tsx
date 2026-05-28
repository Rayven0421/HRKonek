import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EmployeeDetailClient from '@/components/EmployeeDetailClient';
import Sidebar from '@/components/Sidebar';
import { AlertCircle, Bell, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let pageError: string | null = null
  let employee: Record<string, unknown> | null = null
  let records: Array<{ month: string; year: string; type: string }> = []

  try {
    const employeeRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      address: string | null; department: string;
      role: string; status: string; salary: number | null;
      hireDate: Date; sssNumber: string | null;
      philhealthNumber: string | null; pagibigNumber: string | null;
      tinNumber: string | null; employeeId: string | null;
      employmentType: string | null; profileImage: string | null;
      dateOfBirth: Date | null;
      createdAt: Date; updatedAt: Date;
    }>>`
      SELECT id, firstName, lastName, email, phone,
             address, department, role, status, salary,
             hireDate, sssNumber, philhealthNumber,
             pagibigNumber, tinNumber, employeeId,
             employmentType, profileImage, dateOfBirth,
             createdAt, updatedAt
      FROM Employee WHERE id = ${id} LIMIT 1
    `

    if (!employeeRows || employeeRows.length === 0) notFound()
    const emp = employeeRows[0]

    records = await prisma.$queryRaw<Array<{ month: string; year: string; type: string }>>`
      SELECT month, year, type
      FROM ContributionRecord
      WHERE employeeId = ${id}
      ORDER BY year DESC, month DESC
    `

    const processedMonths = new Set(records.map((r) => `${r.month} ${r.year}`))

    employee = {
      ...emp,
      hireDate: emp.hireDate.toISOString(),
      dateOfBirth: emp.dateOfBirth?.toISOString() ?? null,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    }

    return (
      <EmployeeDetailClient
        employee={employee as any}
        processedMonths={Array.from(processedMonths)}
      />
    )
  } catch (error) {
    console.error('Employee detail query error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('invalid characters') || msg.includes('Conversion failed')) {
      pageError = 'This employee record contains invalid data. Please contact your administrator.'
    } else {
      pageError = 'Unable to load employee details at this time. Please refresh the page.'
    }
  }

  if (pageError) {
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
            <Link
              href="/employees"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Employees
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium text-sm">Unable to load data</p>
                <p className="text-red-600 text-xs mt-1">{pageError}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
}
