"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Filter, ChevronLeft, ChevronRight, Search, X, Users } from "lucide-react";

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
    if (!searchTerm.trim()) return employees;
    const search = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      return (
        fullName.includes(search) ||
        emp.role.toLowerCase().includes(search) ||
        emp.department.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search)
      );
    });
  }, [employees, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":     return "bg-green-100 text-green-800";
      case "On Leave":   return "bg-orange-100 text-orange-800";
      case "Inactive":   return "bg-red-100 text-red-800";
      default:           return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col">

      {/* ── Search & Filter row — always visible ── */}
      <div className="flex gap-3 items-center p-4 sm:p-5 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, position, or department..."
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white text-sm transition-all"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {/* Clear button — only shows when there's text */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button className="px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 bg-white font-medium text-sm flex-shrink-0">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* ── Table headers — always visible ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">ID</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((emp) => {
                const globalIndex = employees.findIndex(e => e.id === emp.id) + 1;
                const displayId = `E${globalIndex.toString().padStart(3, "0")}`;
                return (
                  <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500 font-mono">{displayId}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{emp.role}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 hidden md:table-cell">{emp.department}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(emp.status)}`}>
                        {emp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-right">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              /* ── Empty state: inline, never full-screen ── */
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium text-sm">No employees found</p>
                      {searchTerm ? (
                        <p className="text-gray-400 text-xs mt-1">
                          No results for &ldquo;{searchTerm}&rdquo;
                        </p>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1">
                          Add your first employee to get started
                        </p>
                      )}
                    </div>
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination — only shows when there are results ── */}
      {filteredEmployees.length > 0 && (
        <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 order-2 sm:order-1">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-gray-700 bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}