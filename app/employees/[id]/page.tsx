import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, Shield, Heart, Home, ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employee = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!employee) notFound();

  const salary = employee.salary ?? 0;
  const sssMonthly = Math.min(Math.max(Math.round(salary * 0.045 / 100) * 100, 135), 900);
  const philMonthly = Math.min(Math.max(Math.round(salary * 0.025 / 50) * 50, 250), 2500);
  const pagibigMonthly = Math.min(Math.round(salary * 0.02 / 50) * 50, 200);

  const lastPayment = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  const contributionHistory = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
      sss: sssMonthly,
      phil: philMonthly,
      pagi: pagibigMonthly,
      status: i === 0 ? 'Pending' : 'Paid',
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/employees" className="hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
            <p className="text-gray-500 text-sm">{employee.role} — {employee.department}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2 rounded-lg text-sm font-medium">Edit Profile</button>
          <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2 rounded-lg text-sm font-medium">Print Details</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{employee.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-sm font-medium text-gray-900">{employee.address || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="text-sm font-medium text-gray-900">{employee.dateOfBirth?.toLocaleDateString() || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Hire Date</p>
              <p className="text-sm font-medium text-gray-900">{employee.hireDate.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">TIN</p>
              <p className="text-sm font-medium text-gray-900">{employee.tinNumber || '—'}</p>
            </div>
          </div>
          <hr className="border-gray-100 my-4" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Employment Type</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{employee.employmentType || "Regular"}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Status</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">{employee.status}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Government Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex justify-between mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
              </div>
              <p className="font-bold text-gray-900 text-sm">SSS</p>
              <p className="text-xs text-gray-600 mb-2">ID: {employee.sssNumber || "Not on file"}</p>
              <div className="flex justify-between text-xs">
                <span>₱{sssMonthly}</span>
                <span>{lastPayment}</span>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <div className="flex justify-between mb-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
              </div>
              <p className="font-bold text-gray-900 text-sm">PhilHealth</p>
              <p className="text-xs text-gray-600 mb-2">ID: {employee.philhealthNumber || "Not on file"}</p>
              <div className="flex justify-between text-xs">
                <span>₱{philMonthly}</span>
                <span>{lastPayment}</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex justify-between mb-2">
                <Home className="w-6 h-6 text-green-600" />
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
              </div>
              <p className="font-bold text-gray-900 text-sm">PAG-IBIG</p>
              <p className="text-xs text-gray-600 mb-2">ID: {employee.pagibigNumber || "Not on file"}</p>
              <div className="flex justify-between text-xs">
                <span>₱{pagibigMonthly}</span>
                <span>{lastPayment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 p-6 pb-2">Recent Contribution History</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-500 font-semibold text-xs uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Month</th>
              <th className="px-6 py-3 text-left">SSS</th>
              <th className="px-6 py-3 text-left">PhilHealth</th>
              <th className="px-6 py-3 text-left">PAG-IBIG</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contributionHistory.map((row) => (
              <tr key={row.month}>
                <td className="px-6 py-4 font-medium text-gray-900">{row.month}</td>
                <td className="px-6 py-4 text-gray-600">₱{row.sss}</td>
                <td className="px-6 py-4 text-gray-600">₱{row.phil}</td>
                <td className="px-6 py-4 text-gray-600">₱{row.pagi}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
