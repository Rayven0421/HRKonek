"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  status: string;
}

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        emp.role.toLowerCase().includes(search) ||
        emp.department.toLowerCase().includes(search)
      );
    });
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredEmployees.slice(startIndex, endIndex);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-[#D1FAE5] text-[#065F46]";
      case "On Leave":
        return "bg-[#FEF3C7] text-[#92400E]";
      case "Inactive":
        return "bg-[#FEE2E2] text-[#991B1B]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (filteredEmployees.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500">No employees found. Add your first employee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Row */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-600">
          <span>🔍</span> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentData.map((emp) => {
                // ID display like E001, E002...
                // Using absolute index in the filtered list or just a padded number
                // The prompt says "format the index as E + padded number"
                // Usually this means global index in the dataset, but since it's a table, 
                // we'll use the index in the original employees list if possible, or the current filter's index.
                // Actually, let's use the index in the original list for consistency.
                const globalIndex = employees.findIndex(e => e.id === emp.id) + 1;
                const displayId = `E${globalIndex.toString().padStart(3, "0")}`;

                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{displayId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{emp.firstName} {emp.lastName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(emp.status)}`}>
                        {emp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline font-medium">
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentPage === page
                    ? "bg-[#1E3A8A] text-white"
                    : "border border-gray-300 hover:bg-gray-50 text-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
