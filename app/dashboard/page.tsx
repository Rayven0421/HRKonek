import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import GrowthChart from "@/components/GrowthChart";
import { Bell, UserCircle, Users, Award, ClipboardList, Plus, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const totalEmployees = await prisma.employee.count();
  const activeBenefits = 0;
  const pendingTasks = await prisma.applicant.count({
    where: { status: "Applied" }
  });

  const recentEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const allEmployees = await prisma.employee.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const growthData: { month: string; count: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = allEmployees.filter(emp => {
      const d = new Date(emp.createdAt);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    growthData.push({ month: months[date.getMonth()], count });
  }

  function timeAgo(date: Date) {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return (
    // Root: full viewport height, no overflow — children manage their own scroll
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar: fixed height, its own scroll if needed */}
      <aside className="w-[220px] flex-shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main column: fills remaining space, scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Navbar: never scrolls away */}
        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-8 shadow-md z-10">
          <div className="text-white font-semibold text-base tracking-wide opacity-80 select-none">
            Management Portal
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-white/80 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">Admin User</span>
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor key metrics and recent activities</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Benefits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeBenefits}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+8% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ClipboardList className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-medium">Awaiting review</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Chart + Recent Activities side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

            {/* Growth Chart - wider */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Employee Growth</h2>
              <GrowthChart data={growthData} />
            </div>

            {/* Recent Activities - narrower */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Activities</h2>
                <Link
                  href="/employees"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="flex-1 divide-y divide-gray-100">
                {recentEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-sm">No activities yet</span>
                  </div>
                ) : (
                  recentEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">New employee onboarded</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {timeAgo(emp.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/employees/new"
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
            <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors">
              Generate Report
            </button>
            <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors">
              Schedule Review
            </button>
            <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors">
              Export Data
            </button>
          </div>

          {/* Bottom padding so last element isn't flush against edge */}
          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}