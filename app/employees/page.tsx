import Sidebar from "@/components/Sidebar";
import EmployeeTable from "@/components/EmployeeTable";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, UserCircle, Plus, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  let employees: Array<{
    id: string; firstName: string; lastName: string;
    email: string; phone: string | null;
    department: string; role: string; status: string;
    hireDate: Date; salary: number | null;
    address: string | null; employeeId: string | null;
    createdAt: Date;
  }> = []

  let pageError: string | null = null

  try {
    employees = await prisma.$queryRaw`
      SELECT id, firstName, lastName, email, phone,
             department, role, status, hireDate,
             salary, address, employeeId, createdAt
      FROM Employee
      ORDER BY createdAt DESC
    `
  } catch (error) {
    console.error('Employees page query error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('invalid characters') || msg.includes('Conversion failed')) {
      pageError = 'Some employee records contain invalid data. Please contact your administrator.'
    } else {
      pageError = 'Unable to load employees at this time. Please refresh the page.'
    }
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Employee Management
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Manage and track all employees
              </p>
            </div>
            <Link
              href="/employees/new"
              className="flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <EmployeeTable employees={employees} />
          </div>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
