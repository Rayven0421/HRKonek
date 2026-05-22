import Sidebar from "@/components/Sidebar";
import EmployeeTable from "@/components/EmployeeTable";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[220px]">
        {/* Top Navbar */}
        <header className="h-16 bg-[#1E3A8A] text-white flex items-center justify-end px-8">
            <div className="flex items-center gap-6">
                <span>🔔</span>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    <span className="text-sm">Admin User</span>
                </div>
            </div>
        </header>

        <main className="p-8">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
              <p className="text-gray-500">Manage and track all employees</p>
            </div>
            <Link 
              href="/employees/new" 
              className="bg-[#1E3A8A] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#152e6f] transition-colors"
            >
              Add Employee
            </Link>
          </div>

          <EmployeeTable employees={employees} />
        </main>
      </div>
    </div>
  );
}
