import Sidebar from "@/components/Sidebar";
import EmployeeTable from "@/components/EmployeeTable";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, UserCircle, Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Sticky navbar */}
        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
          {/* Left spacer on mobile to avoid overlapping hamburger */}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {/* Page header */}
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

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <EmployeeTable employees={employees} />
          </div>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}