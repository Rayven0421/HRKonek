import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import GrowthChart from "@/components/GrowthChart";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // 1. Fetch real counts
  const totalEmployees = await prisma.employee.count();
  const activeBenefits = 0; // No model yet
  const pendingTasks = await prisma.applicant.count({ 
    where: { status: "Applied" } 
  });

  // 2. Fetch last 5 employees for recent activities
  const recentEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // 3. Fetch data for Growth Chart (last 6 months)
  const allEmployees = await prisma.employee.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const growthData: { month: string; count: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[date.getMonth()];
    const monthYear = `${monthName} ${date.getFullYear()}`;
    
    const count = allEmployees.filter(emp => {
      const empDate = new Date(emp.createdAt);
      return empDate.getMonth() === date.getMonth() && empDate.getFullYear() === date.getFullYear();
    }).length;
    
    growthData.push({ month: monthName, count });
  }

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
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
            <p className="text-gray-500 mb-8">Monitor key metrics and recent activities</p>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Total Employees</div>
                    <div className="text-3xl font-bold my-2">{totalEmployees}</div>
                    <div className="text-sm text-green-500">+12% from last month</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Active Benefits</div>
                    <div className="text-3xl font-bold my-2">{activeBenefits}</div>
                    <div className="text-sm text-green-500">+8% from last month</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Pending Tasks</div>
                    <div className="text-3xl font-bold my-2">{pendingTasks}</div>
                    <div className="text-sm text-yellow-500">Awaiting review</div>
                </div>
            </div>

            {/* Growth Chart */}
            <GrowthChart data={growthData} />

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-lg">Recent Activities</h2>
                    <Link href="/employees" className="text-sm text-blue-600">View all</Link>
                </div>
                <div className="space-y-4">
                    {recentEmployees.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No recent activities found</div>
                    ) : (
                        recentEmployees.map((emp) => (
                            <div key={emp.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">👤</div>
                                    <div>
                                        <div className="font-bold">{emp.firstName} {emp.lastName}</div>
                                        <div className="text-sm text-gray-500">New employee onboarded</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {new Date(emp.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
                <Link href="/employees/new" className="bg-[#1E3A8A] text-white px-6 py-2 rounded-lg">Add Employee</Link>
                <button className="border border-gray-300 px-6 py-2 rounded-lg">Generate Report</button>
                <button className="border border-gray-300 px-6 py-2 rounded-lg">Schedule Review</button>
                <button className="border border-gray-300 px-6 py-2 rounded-lg">Export Data</button>
            </div>
        </main>
      </div>
    </div>
  );
}
