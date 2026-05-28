"use client";

import { useState, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import NavbarUserMenu from "@/components/NavbarUserMenu";
import {
  Shield,
  Heart,
  Home,
  Download,
  DollarSign,
  Calendar,
  CheckSquare,
  FileText,
  Table2,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  History,
} from "lucide-react";

type BenefitType = "SSS" | "PhilHealth" | "PAG-IBIG";

type Transaction = {
  type: "SSS" | "PhilHealth" | "PAG-IBIG";
  name: string;
  date: string;
  amount: number;
  status: "Processed" | "Pending";
  employeeId: string;
};

type EmployeeData = {
  id: string;
  firstName: string;
  lastName: string;
  salary: number | null;
  status: string;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  hireDate: Date | null;
  createdAt: Date;
};

const fmt = (n: number) =>
  "\u20B1" +
  n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function computeSSS(salary: number | null): number {
  if (!salary || salary <= 0) return 135;
  const contribution = salary * 0.045;
  return Math.min(Math.max(Math.round(contribution / 100) * 100, 135), 900);
}

function computePhilHealth(salary: number | null): number {
  if (!salary || salary <= 0) return 250;
  const contribution = salary * 0.025;
  return Math.min(Math.max(Math.round(contribution / 50) * 50, 250), 2500);
}

function computePagibig(salary: number | null): number {
  if (!salary || salary <= 0) return 100;
  return Math.min(Math.round((salary * 0.02) / 50) * 50, 200);
}

function getBenefitIconCircle(type: BenefitType): string {
  switch (type) {
    case "SSS":
      return "bg-blue-100 text-blue-600";
    case "PhilHealth":
      return "bg-red-100 text-red-600";
    case "PAG-IBIG":
      return "bg-green-100 text-green-600";
  }
}

const sssTableData = [
  {
    salaryRange: "\u20B11,000 - \u20B11,249.99",
    employeeShare: "\u20B136.30",
    employerShare: "\u20B184.70",
    total: "\u20B1121.00",
  },
  {
    salaryRange: "\u20B11,250 - \u20B11,749.99",
    employeeShare: "\u20B154.50",
    employerShare: "\u20B1127.10",
    total: "\u20B1181.60",
  },
  {
    salaryRange: "\u20B12,250 - \u20B12,749.99",
    employeeShare: "\u20B190.80",
    employerShare: "\u20B1211.90",
    total: "\u20B1302.70",
  },
  {
    salaryRange: "\u20B14,250 - \u20B14,749.99",
    employeeShare: "\u20B1163.50",
    employerShare: "\u20B1381.50",
    total: "\u20B1545.00",
  },
  {
    salaryRange: "\u20B120,000+",
    employeeShare: "\u20B1800.00",
    employerShare: "\u20B11,760.00",
    total: "\u20B12,560.00",
  },
];

const philhealthTableData = [
  {
    salaryRange: "\u20B110,000 and below",
    employeeShare: "\u20B1200.00",
    employerShare: "\u20B1200.00",
    total: "\u20B1400.00",
  },
  {
    salaryRange: "\u20B110,000 - \u20B149,999.99",
    employeeShare: "2% of salary",
    employerShare: "2% of salary",
    total: "Split equally",
  },
  {
    salaryRange: "\u20B150,000 and above",
    employeeShare: "\u20B1500.00",
    employerShare: "\u20B1500.00",
    total: "\u20B11,000.00",
  },
];

const pagibigTableData = [
  {
    salaryRange: "\u20B11,500 and below",
    employeeShare: "1%",
    employerShare: "2%",
    total: "3%",
  },
  {
    salaryRange: "Above \u20B11,500",
    employeeShare: "2%",
    employerShare: "2%",
    total: "4%",
  },
  {
    salaryRange: "Voluntary",
    employeeShare: "Up to 5%",
    employerShare: "2%",
    total: "Variable",
  },
];

function downloadTableCSV(benefit: string) {
  let data: {
    salaryRange: string;
    employeeShare: string;
    employerShare: string;
    total: string;
  }[];

  switch (benefit) {
    case "SSS":
      data = sssTableData;
      break;
    case "PhilHealth":
      data = philhealthTableData;
      break;
    case "PAG-IBIG":
      data = pagibigTableData;
      break;
    default:
      return;
  }

  const headers = [
    "Salary Range",
    "Employee Share",
    "Employer Share",
    "Total Contribution",
  ];

  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = data.map((r) => [
    escapeCell(r.salaryRange),
    escapeCell(r.employeeShare),
    escapeCell(r.employerShare),
    escapeCell(r.total),
  ]);

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${benefit}_Contribution_Table.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ModalWrapper({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BenefitCheckboxRow({
  checked,
  onChange,
  icon,
  label,
  subtitle,
  iconStyle,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  iconStyle: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors mb-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600 rounded"
      />
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </label>
  );
}

function ProcessContributionsModal({
  onClose,
  sssChecked,
  setSssChecked,
  philhealthChecked,
  setPhilhealthChecked,
  pagibigChecked,
  setPagibigChecked,
  sssEnrolled,
  philhealthEnrolled,
  pagibigEnrolled,
  sssMonthlyTotal,
  philhealthMonthlyTotal,
  pagibigMonthlyTotal,
  activeEmployees,
  onSuccess,
}: {
  onClose: () => void;
  sssChecked: boolean;
  setSssChecked: (v: boolean) => void;
  philhealthChecked: boolean;
  setPhilhealthChecked: (v: boolean) => void;
  pagibigChecked: boolean;
  setPagibigChecked: (v: boolean) => void;
  sssEnrolled: number;
  philhealthEnrolled: number;
  pagibigEnrolled: number;
  sssMonthlyTotal: number;
  philhealthMonthlyTotal: number;
  pagibigMonthlyTotal: number;
  activeEmployees: number;
  onSuccess?: (msg: string) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  const [processSuccess, setProcessSuccess] = useState(false);

  let grandTotal = 0;
  if (sssChecked) grandTotal += sssMonthlyTotal;
  if (philhealthChecked) grandTotal += philhealthMonthlyTotal;
  if (pagibigChecked) grandTotal += pagibigMonthlyTotal;

  const handleProcess = async () => {
    if (!sssChecked && !philhealthChecked && !pagibigChecked) {
      setProcessError("Please select at least one benefit to process.");
      return;
    }

    setIsProcessing(true);
    setProcessError("");

    try {
      const res = await fetch("/api/benefits/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          benefits: {
            sss: sssChecked,
            philhealth: philhealthChecked,
            pagibig: pagibigChecked,
          },
          totals: {
            sss: sssChecked ? sssMonthlyTotal : 0,
            philhealth: philhealthChecked ? philhealthMonthlyTotal : 0,
            pagibig: pagibigChecked ? pagibigMonthlyTotal : 0,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to process contributions");
      }

      setProcessSuccess(true);
      setTimeout(() => {
        setProcessSuccess(false);
        onClose();
        onSuccess?.(
          "Contributions processed successfully for " +
            selectedMonth +
            " " +
            selectedYear
        );
      }, 1500);
    } catch (err) {
      setProcessError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalWrapper title="Process Monthly Contributions" onClose={onClose}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Contribution Period <span className="text-blue-600">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          {["2023", "2024", "2025", "2026"].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Benefits to Process <span className="text-blue-600">*</span>
      </label>
      <BenefitCheckboxRow
        checked={sssChecked}
        onChange={setSssChecked}
        icon={<Shield className="w-4 h-4" />}
        label="SSS Contributions"
        subtitle={`${sssEnrolled} employees - Est. ${fmt(sssMonthlyTotal)}`}
        iconStyle="bg-blue-100 text-blue-600"
      />
      <BenefitCheckboxRow
        checked={philhealthChecked}
        onChange={setPhilhealthChecked}
        icon={<Heart className="w-4 h-4" />}
        label="PhilHealth Contributions"
        subtitle={`${philhealthEnrolled} employees - Est. ${fmt(philhealthMonthlyTotal)}`}
        iconStyle="bg-red-100 text-red-500"
      />
      <BenefitCheckboxRow
        checked={pagibigChecked}
        onChange={setPagibigChecked}
        icon={<Home className="w-4 h-4" />}
        label="PAG-IBIG Contributions"
        subtitle={`${pagibigEnrolled} employees - Est. ${fmt(pagibigMonthlyTotal)}`}
        iconStyle="bg-green-100 text-green-600"
      />

      <div className="bg-blue-50 rounded-lg p-4 mt-4">
        <p className="font-bold text-blue-900 mb-3">Processing Summary</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Total Employees:</span>
          <span className="text-gray-900">{activeEmployees}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Total Contributions:</span>
          <span className="text-gray-900">{fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Processing Fee:</span>
          <span className="text-gray-900">{fmt(0)}</span>
        </div>
        <hr className="my-2 border-gray-300" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-blue-900">Grand Total:</span>
          <span className="text-blue-900">{fmt(grandTotal)}</span>
        </div>
      </div>

      {processError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-xs">{processError}</p>
        </div>
      )}

      {processSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-green-700 text-xs font-medium">
            Processing complete!
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className={`flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isProcessing ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4" /> Process Contributions
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
}

function GenerateReportModal({
  onClose,
  reportType,
  setReportType,
  reportFormat,
  setReportFormat,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  allEmployees,
  onSuccess,
}: {
  onClose: () => void;
  reportType: string;
  setReportType: (v: string) => void;
  reportFormat: string;
  setReportFormat: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  allEmployees: EmployeeData[];
  onSuccess?: (msg: string) => void;
}) {
  const [includeEmployeeDetails, setIncludeEmployeeDetails] = useState(true);
  const [includeContributionBreakdown, setIncludeContributionBreakdown] =
    useState(true);
  const [includeMonthlySummary, setIncludeMonthlySummary] = useState(true);
  const [includeYTD, setIncludeYTD] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportError, setReportError] = useState("");

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      setReportError("Please select a date range");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      setReportError('"From" date must be before "To" date');
      return;
    }

    setIsGenerating(true);
    setReportError("");

    try {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      const filtered = allEmployees.filter((e) => {
        const d = new Date(e.hireDate ?? e.createdAt);
        return d >= from && d <= to;
      });

      if (filtered.length === 0) {
        setReportError(
          "No employee data found for the selected date range."
        );
        setIsGenerating(false);
        return;
      }

      const BOM = "\uFEFF";
      const escapeCell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      const fmtNum = (n: number) =>
        n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

      if (reportFormat === "pdf") {
        const fmtDate = (d: Date) =>
          d.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

        const doc = new jsPDF({ orientation: "landscape" });

        // Title
        doc.setFontSize(18);
        doc.setTextColor(30, 58, 138);
        doc.text("HRKonek Benefits Report", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(
          `Report Type: ${reportType}  |  Date Range: ${dateFrom} to ${dateTo}  |  Generated: ${fmtDate(new Date())}`,
          14,
          28
        );

        // Summary
        let y = 38;
        doc.setFontSize(12);
        doc.setTextColor(30, 58, 138);
        doc.text("Summary", 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Total Employees in Range: ${filtered.length}`, 18, y);

        const sumItems: string[] = [];
        if (reportType === "All Benefits" || reportType === "SSS Only") {
          const sssCount = filtered.filter((e) => e.sssNumber).length;
          const sssTotal = filtered
            .filter((e) => e.sssNumber)
            .reduce((s, e) => s + computeSSS(e.salary), 0);
          sumItems.push(
            `SSS Enrolled: ${sssCount}  |  SSS Monthly Total: ${fmtNum(sssTotal)}`
          );
        }
        if (reportType === "All Benefits" || reportType === "PhilHealth Only") {
          const phCount = filtered.filter((e) => e.philhealthNumber).length;
          const phTotal = filtered
            .filter((e) => e.philhealthNumber)
            .reduce((s, e) => s + computePhilHealth(e.salary), 0);
          sumItems.push(
            `PhilHealth Enrolled: ${phCount}  |  PhilHealth Monthly Total: ${fmtNum(phTotal)}`
          );
        }
        if (reportType === "All Benefits" || reportType === "PAG-IBIG Only") {
          const pgCount = filtered.filter((e) => e.pagibigNumber).length;
          const pgTotal = filtered
            .filter((e) => e.pagibigNumber)
            .reduce((s, e) => s + computePagibig(e.salary), 0);
          sumItems.push(
            `PAG-IBIG Enrolled: ${pgCount}  |  PAG-IBIG Monthly Total: ${fmtNum(pgTotal)}`
          );
        }
        for (const item of sumItems) {
          y += 6;
          doc.text(item, 18, y);
        }

        if (includeEmployeeDetails) {
          y += 10;
          const tableHeaders = [
            "Name",
            "Status",
            "Hire Date",
            "SSS #",
            "SSS Monthly",
            "PhilHealth #",
            "PH Monthly",
            "PAG-IBIG #",
            "PAG-IBIG Monthly",
            "Total Monthly",
          ];
          const tableRows = filtered.map((emp) => {
            const sss = emp.sssNumber ? computeSSS(emp.salary) : 0;
            const ph = emp.philhealthNumber
              ? computePhilHealth(emp.salary)
              : 0;
            const pg = emp.pagibigNumber ? computePagibig(emp.salary) : 0;
            return [
              `${emp.firstName} ${emp.lastName}`,
              emp.status,
              fmtDate(new Date(emp.hireDate ?? emp.createdAt)),
              emp.sssNumber || "Not enrolled",
              emp.sssNumber ? fmtNum(sss) : "\u2014",
              emp.philhealthNumber || "Not enrolled",
              emp.philhealthNumber ? fmtNum(ph) : "\u2014",
              emp.pagibigNumber || "Not enrolled",
              emp.pagibigNumber ? fmtNum(pg) : "\u2014",
              fmtNum(sss + ph + pg),
            ];
          });

          autoTable(doc, {
            startY: y,
            head: [tableHeaders],
            body: tableRows,
            theme: "grid",
            headStyles: {
              fillColor: [30, 58, 138],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 36 },
              1: { cellWidth: 18 },
              2: { cellWidth: 22 },
              3: { cellWidth: 22 },
              4: { cellWidth: 20, halign: "right" },
              5: { cellWidth: 22 },
              6: { cellWidth: 20, halign: "right" },
              7: { cellWidth: 22 },
              8: { cellWidth: 22, halign: "right" },
              9: { cellWidth: 22, halign: "right" },
            },
            margin: { top: 14 },
          });
        }

        doc.save(`HRKonek_Benefits_Report_${dateFrom}_${dateTo}.pdf`);
        onSuccess?.("Benefits report downloaded successfully!");
        onClose();
        setIsGenerating(false);
        return;
      }

      if (reportFormat === "print") {
        const fmtDate = (d: Date) =>
          d.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

        let summaryHtml = "";
        if (reportType === "All Benefits" || reportType === "SSS Only") {
          const sssCount = filtered.filter((e) => e.sssNumber).length;
          const sssTotal = filtered
            .filter((e) => e.sssNumber)
            .reduce((s, e) => s + computeSSS(e.salary), 0);
          summaryHtml += `<p style="font-size:13px;margin:2px 0">SSS Enrolled: ${sssCount} | SSS Monthly Total: ${fmtNum(sssTotal)}</p>`;
        }
        if (reportType === "All Benefits" || reportType === "PhilHealth Only") {
          const phCount = filtered.filter((e) => e.philhealthNumber).length;
          const phTotal = filtered
            .filter((e) => e.philhealthNumber)
            .reduce((s, e) => s + computePhilHealth(e.salary), 0);
          summaryHtml += `<p style="font-size:13px;margin:2px 0">PhilHealth Enrolled: ${phCount} | PhilHealth Monthly Total: ${fmtNum(phTotal)}</p>`;
        }
        if (reportType === "All Benefits" || reportType === "PAG-IBIG Only") {
          const pgCount = filtered.filter((e) => e.pagibigNumber).length;
          const pgTotal = filtered
            .filter((e) => e.pagibigNumber)
            .reduce((s, e) => s + computePagibig(e.salary), 0);
          summaryHtml += `<p style="font-size:13px;margin:2px 0">PAG-IBIG Enrolled: ${pgCount} | PAG-IBIG Monthly Total: ${fmtNum(pgTotal)}</p>`;
        }

        let tableHtml = "";
        if (includeEmployeeDetails) {
          const headers = ["Name", "Status", "Hire Date", "SSS #", "SSS Monthly", "PhilHealth #", "PH Monthly", "PAG-IBIG #", "PAG-IBIG Monthly", "Total Monthly"];
          tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:#1E3A8A;color:white">${headers.map(h => `<th style="padding:8px 10px;border:1px solid #1E3A8A;text-align:left">${h}</th>`).join("")}</tr></thead>
            <tbody>`;
          for (const emp of filtered) {
            const sss = emp.sssNumber ? computeSSS(emp.salary) : 0;
            const ph = emp.philhealthNumber ? computePhilHealth(emp.salary) : 0;
            const pg = emp.pagibigNumber ? computePagibig(emp.salary) : 0;
            tableHtml += `<tr>
              <td style="padding:6px 10px;border:1px solid #ccc">${emp.firstName} ${emp.lastName}</td>
              <td style="padding:6px 10px;border:1px solid #ccc">${emp.status}</td>
              <td style="padding:6px 10px;border:1px solid #ccc">${fmtDate(new Date(emp.hireDate ?? emp.createdAt))}</td>
              <td style="padding:6px 10px;border:1px solid #ccc">${emp.sssNumber || "Not enrolled"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc;text-align:right">${emp.sssNumber ? fmtNum(sss) : "\u2014"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc">${emp.philhealthNumber || "Not enrolled"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc;text-align:right">${emp.philhealthNumber ? fmtNum(ph) : "\u2014"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc">${emp.pagibigNumber || "Not enrolled"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc;text-align:right">${emp.pagibigNumber ? fmtNum(pg) : "\u2014"}</td>
              <td style="padding:6px 10px;border:1px solid #ccc;text-align:right;font-weight:bold">${fmtNum(sss + ph + pg)}</td>
            </tr>`;
          }
          tableHtml += "</tbody></table>";
        }

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HRKonek Benefits Report</title>
          <style>
            @media print { @page { margin: 15mm; } body { font-family: Arial, sans-serif; } }
          </style></head>
          <body style="font-family:Arial,sans-serif;color:#333;padding:20px">
            <h1 style="color:#1E3A8A;margin-bottom:4px">HRKonek Benefits Report</h1>
            <p style="color:#666;font-size:13px;margin:2px 0">Report Type: ${reportType} | Date Range: ${dateFrom} to ${dateTo}</p>
            <p style="color:#666;font-size:13px;margin:2px 0">Generated: ${fmtDate(new Date())}</p>
            <hr style="border:none;border-top:2px solid #1E3A8A;margin:12px 0" />
            <h2 style="color:#1E3A8A;font-size:16px">Summary</h2>
            <p style="font-size:13px">Total Employees in Range: ${filtered.length}</p>
            ${summaryHtml}
            ${includeEmployeeDetails ? '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0" /><h2 style="color:#1E3A8A;font-size:16px">Employee Details</h2>' + tableHtml : ""}
            <p style="margin-top:20px;font-size:11px;color:#999;text-align:center">HRKonek - Benefits Management Report</p>
          </body></html>`;

        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        } else {
          setReportError("Popup blocked. Please allow popups for this site to print reports.");
          setIsGenerating(false);
          return;
        }
        onSuccess?.("Benefits report opened for printing!");
        onClose();
        setIsGenerating(false);
        return;
      }

      let csvContent = "";

      csvContent += escapeCell("HRKonek Benefits Report") + "\n";
      csvContent += escapeCell(`Report Type: ${reportType}`) + "\n";
      csvContent +=
        escapeCell(`Date Range: ${dateFrom} to ${dateTo}`) + "\n";
      csvContent +=
        escapeCell(
          `Generated: ${new Date().toLocaleDateString("en-PH")}`
        ) + "\n\n";

      csvContent += '"SUMMARY"\n';
      csvContent += `"Total Employees in Range","${filtered.length}"\n`;

      if (reportType === "All Benefits" || reportType === "SSS Only") {
        const sssCount = filtered.filter((e) => e.sssNumber).length;
        const sssTotal = filtered
          .filter((e) => e.sssNumber)
          .reduce((s, e) => s + computeSSS(e.salary), 0);
        csvContent += `"SSS Enrolled","${sssCount}"\n`;
        csvContent += `"SSS Monthly Total","${fmtNum(sssTotal)}"\n`;
      }
      if (reportType === "All Benefits" || reportType === "PhilHealth Only") {
        const phCount = filtered.filter((e) => e.philhealthNumber).length;
        const phTotal = filtered
          .filter((e) => e.philhealthNumber)
          .reduce((s, e) => s + computePhilHealth(e.salary), 0);
        csvContent += `"PhilHealth Enrolled","${phCount}"\n`;
        csvContent += `"PhilHealth Monthly Total","${fmtNum(phTotal)}"\n`;
      }
      if (reportType === "All Benefits" || reportType === "PAG-IBIG Only") {
        const pgCount = filtered.filter((e) => e.pagibigNumber).length;
        const pgTotal = filtered
          .filter((e) => e.pagibigNumber)
          .reduce((s, e) => s + computePagibig(e.salary), 0);
        csvContent += `"PAG-IBIG Enrolled","${pgCount}"\n`;
        csvContent += `"PAG-IBIG Monthly Total","${fmtNum(pgTotal)}"\n`;
      }

      csvContent += "\n";

      if (includeEmployeeDetails) {
        csvContent += '"EMPLOYEE DETAILS"\n';
        const headers = [
          "Name",
          "Status",
          "Hire Date",
          "SSS Number",
          "SSS Monthly",
          "PhilHealth Number",
          "PhilHealth Monthly",
          "PAG-IBIG Number",
          "PAG-IBIG Monthly",
          "Total Monthly Contribution",
        ];
        csvContent += headers.map(escapeCell).join(",") + "\n";

        for (const emp of filtered) {
          const sss = emp.sssNumber ? computeSSS(emp.salary) : 0;
          const ph = emp.philhealthNumber
            ? computePhilHealth(emp.salary)
            : 0;
          const pg = emp.pagibigNumber ? computePagibig(emp.salary) : 0;

          csvContent +=
            [
              `${emp.firstName} ${emp.lastName}`,
              emp.status,
              new Date(emp.hireDate ?? emp.createdAt).toLocaleDateString(
                "en-PH"
              ),
              emp.sssNumber || "Not enrolled",
              emp.sssNumber ? fmtNum(sss) : "\u2014",
              emp.philhealthNumber || "Not enrolled",
              emp.philhealthNumber ? fmtNum(ph) : "\u2014",
              emp.pagibigNumber || "Not enrolled",
              emp.pagibigNumber ? fmtNum(pg) : "\u2014",
              fmtNum(sss + ph + pg),
            ]
              .map(escapeCell)
              .join(",") + "\n";
        }
      }

      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HRKonek_Benefits_Report_${dateFrom}_${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onSuccess?.("Benefits report downloaded successfully!");
      onClose();
    } catch (err) {
      setReportError("Failed to generate report. Please try again.");
      console.error("Report generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ModalWrapper title="Generate Report" onClose={onClose} wide>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Report Type
      </label>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mb-4"
      >
        {[
          "All Benefits",
          "SSS Only",
          "PhilHealth Only",
          "PAG-IBIG Only",
          "Employee Summary",
          "Contribution Summary",
        ].map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Date Range
      </label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <span className="text-xs text-gray-500">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mt-1"
          />
        </div>
        <div>
          <span className="text-xs text-gray-500">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mt-1"
          />
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Report Format
      </label>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setReportFormat("pdf")}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${reportFormat === "pdf" ? "border-[#1E3A8A] bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => setReportFormat("csv")}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${reportFormat === "csv" ? "border-[#1E3A8A] bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        >
          <Table2 className="w-4 h-4" />
          CSV
        </button>
        <button
          onClick={() => setReportFormat("print")}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${reportFormat === "print" ? "border-[#1E3A8A] bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        >
          <FileText className="w-4 h-4" />
          Print
        </button>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Include in Report
      </label>
      <div className="space-y-2 mb-4">
        {[
          {
            label: "Employee Details",
            checked: includeEmployeeDetails,
            set: setIncludeEmployeeDetails,
          },
          {
            label: "Contribution Breakdown",
            checked: includeContributionBreakdown,
            set: setIncludeContributionBreakdown,
          },
          {
            label: "Monthly Summary",
            checked: includeMonthlySummary,
            set: setIncludeMonthlySummary,
          },
          {
            label: "Year-to-Date Totals",
            checked: includeYTD,
            set: setIncludeYTD,
          },
        ].map((item) => (
          <label
            key={item.label}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => item.set(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>

      {reportError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-xs">{reportError}</p>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isGenerating ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Generate & Download
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
}

function BulkEnrollmentModal({
  onClose,
  notEnrolledSss,
  notEnrolledPhilhealth,
  notEnrolledPagibig,
  totalEmployees,
  onSuccess,
}: {
  onClose: () => void;
  notEnrolledSss: { id: string; name: string }[];
  notEnrolledPhilhealth: { id: string; name: string }[];
  notEnrolledPagibig: { id: string; name: string }[];
  totalEmployees: number;
  onSuccess?: (msg: string) => void;
}) {
  const [enrollSss, setEnrollSss] = useState(true);
  const [enrollPhilhealth, setEnrollPhilhealth] = useState(true);
  const [enrollPagibig, setEnrollPagibig] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<
    "all" | "new" | "custom"
  >("all");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  const handleEnroll = async () => {
    if (!effectiveDate) {
      setEnrollError("Effective date is required");
      return;
    }
    if (!enrollSss && !enrollPhilhealth && !enrollPagibig) {
      setEnrollError("Select at least one benefit");
      return;
    }

    setIsEnrolling(true);
    setEnrollError("");

    try {
      const res = await fetch("/api/benefits/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefits: {
            sss: enrollSss,
            philhealth: enrollPhilhealth,
            pagibig: enrollPagibig,
          },
          scope: selectedEmployees,
          effectiveDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Enrollment failed");
      }

      const data = await res.json();
      onSuccess?.(`${data.enrolled} employees enrolled successfully!`);
      onClose();
    } catch (err) {
      setEnrollError(
        err instanceof Error
          ? err.message
          : "Enrollment failed. Please try again."
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <ModalWrapper title="Bulk Enrollment" onClose={onClose}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Enroll multiple employees in government benefits at once.
        </p>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Benefits to Enroll
      </label>
      <BenefitCheckboxRow
        checked={enrollSss}
        onChange={setEnrollSss}
        icon={<Shield className="w-4 h-4" />}
        label="SSS"
        subtitle={`${notEnrolledSss.length} not yet enrolled`}
        iconStyle="bg-blue-100 text-blue-600"
      />
      <BenefitCheckboxRow
        checked={enrollPhilhealth}
        onChange={setEnrollPhilhealth}
        icon={<Heart className="w-4 h-4" />}
        label="PhilHealth"
        subtitle={`${notEnrolledPhilhealth.length} not yet enrolled`}
        iconStyle="bg-red-100 text-red-500"
      />
      <BenefitCheckboxRow
        checked={enrollPagibig}
        onChange={setEnrollPagibig}
        icon={<Home className="w-4 h-4" />}
        label="PAG-IBIG"
        subtitle={`${notEnrolledPagibig.length} not yet enrolled`}
        iconStyle="bg-green-100 text-green-600"
      />

      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
        Select Employees
      </label>
      <div className="space-y-2 mb-4">
        {[
          {
            value: "all" as const,
            label: `All Employees (${totalEmployees} total)`,
          },
          {
            value: "new" as const,
            label: `New/Unenrolled (SSS: ${notEnrolledSss.length}, PH: ${notEnrolledPhilhealth.length}, PAG-IBIG: ${notEnrolledPagibig.length})`,
          },
        ].map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="radio"
              name="employeeSelection"
              checked={selectedEmployees === opt.value}
              onChange={() => setSelectedEmployees(opt.value)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Effective Date <span className="text-blue-600">*</span>
      </label>
      <input
        type="date"
        value={effectiveDate}
        onChange={(e) => setEffectiveDate(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mb-4"
      />

      {enrollError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-xs">{enrollError}</p>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleEnroll}
          disabled={isEnrolling}
          className={`flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isEnrolling ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isEnrolling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enrolling...
            </>
          ) : (
            <>
              <Users className="w-4 h-4" /> Enroll Employees
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
}

function UpdateBenefitRatesModal({
  onClose,
  expandedSection,
  setExpandedSection,
  onSuccess,
}: {
  onClose: () => void;
  expandedSection: "sss" | "philhealth" | "pagibig" | null;
  setExpandedSection: (v: "sss" | "philhealth" | "pagibig" | null) => void;
  onSuccess?: (msg: string) => void;
}) {
  const RATES_KEY = "hrkonek_benefit_rates";

  const defaultRates = {
    sss: {
      employeeRate: "4.00",
      employerRate: "8.00",
      ceiling: "20000",
    },
    philhealth: {
      premiumRate: "5.00",
      minContribution: "400",
      maxContribution: "3200",
    },
    pagibig: {
      employeeRate: "2.00",
      employerRate: "2.00",
      maxContribution: "200",
    },
  };

  type Rates = {
    sss: { employeeRate: string; employerRate: string; ceiling: string };
    philhealth: { premiumRate: string; minContribution: string; maxContribution: string };
    pagibig: { employeeRate: string; employerRate: string; maxContribution: string };
  };

  const [rates, setRates] = useState<Rates>(() => {
    try {
      const stored = localStorage.getItem(RATES_KEY);
      if (stored) return { ...defaultRates, ...JSON.parse(stored) };
    } catch {
      // use defaults silently
    }
    return defaultRates;
  });
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});

  function toggleSection(section: "sss" | "philhealth" | "pagibig") {
    setExpandedSection(expandedSection === section ? null : section);
  }

  const handleSave = () => {
    const errors: Record<string, string> = {};

    const sssEmpRate = parseFloat(rates.sss.employeeRate);
    if (isNaN(sssEmpRate) || sssEmpRate < 0 || sssEmpRate > 100)
      errors.sssEmployee = "Must be between 0-100";

    const sssEmpRate2 = parseFloat(rates.sss.employerRate);
    if (isNaN(sssEmpRate2) || sssEmpRate2 < 0 || sssEmpRate2 > 100)
      errors.sssEmployer = "Must be between 0-100";

    const sssCeiling = parseFloat(rates.sss.ceiling);
    if (isNaN(sssCeiling) || sssCeiling <= 0)
      errors.sssCeiling = "Must be a positive number";

    const phRate = parseFloat(rates.philhealth.premiumRate);
    if (isNaN(phRate) || phRate < 0 || phRate > 100)
      errors.philhealthPremium = "Must be between 0-100";

    const phMin = parseFloat(rates.philhealth.minContribution);
    if (isNaN(phMin) || phMin <= 0)
      errors.philhealthMin = "Must be a positive number";

    const phMax = parseFloat(rates.philhealth.maxContribution);
    if (isNaN(phMax) || phMax <= 0)
      errors.philhealthMax = "Must be a positive number";

    const pgEmpRate = parseFloat(rates.pagibig.employeeRate);
    if (isNaN(pgEmpRate) || pgEmpRate < 0 || pgEmpRate > 100)
      errors.pagibigEmployee = "Must be between 0-100";

    const pgEmpRate2 = parseFloat(rates.pagibig.employerRate);
    if (isNaN(pgEmpRate2) || pgEmpRate2 < 0 || pgEmpRate2 > 100)
      errors.pagibigEmployer = "Must be between 0-100";

    const pgMax = parseFloat(rates.pagibig.maxContribution);
    if (isNaN(pgMax) || pgMax <= 0)
      errors.pagibigMax = "Must be a positive number";

    if (Object.keys(errors).length > 0) {
      setRateErrors(errors);
      return;
    }

    try {
      localStorage.setItem(RATES_KEY, JSON.stringify(rates));
      onSuccess?.("Benefit rates updated successfully!");
      onClose();
    } catch {
      setRateErrors({
        general: "Failed to save rates. Please try again.",
      });
    }
  };

  const updateRate = (
    section: "sss" | "philhealth" | "pagibig",
    field: string,
    value: string
  ) => {
    setRates((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setRateErrors({});
  };

  return (
    <ModalWrapper title="Update Benefit Rates" onClose={onClose}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-700">
          Changes will affect all future contribution calculations.
        </p>
      </div>

      {rateErrors.general && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-xs">{rateErrors.general}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("sss")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-l-4 border-l-blue-500"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="flex-1 font-medium text-gray-900 text-sm">
              SSS Rates
            </span>
            {expandedSection === "sss" ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSection === "sss" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Employee Rate (%)
                </label>
                <input
                  type="text"
                  value={rates.sss.employeeRate}
                  onChange={(e) =>
                    updateRate("sss", "employeeRate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.sssEmployee && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.sssEmployee}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Employer Rate (%)
                </label>
                <input
                  type="text"
                  value={rates.sss.employerRate}
                  onChange={(e) =>
                    updateRate("sss", "employerRate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.sssEmployer && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.sssEmployer}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Salary Ceiling
                </label>
                <input
                  type="text"
                  value={rates.sss.ceiling}
                  onChange={(e) =>
                    updateRate("sss", "ceiling", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.sssCeiling && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.sssCeiling}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("philhealth")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-l-4 border-l-red-500"
          >
            <Heart className="w-4 h-4 text-red-500" />
            <span className="flex-1 font-medium text-gray-900 text-sm">
              PhilHealth Rates
            </span>
            {expandedSection === "philhealth" ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSection === "philhealth" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Premium Rate (%)
                </label>
                <input
                  type="text"
                  value={rates.philhealth.premiumRate}
                  onChange={(e) =>
                    updateRate("philhealth", "premiumRate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.philhealthPremium && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.philhealthPremium}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Contribution
                </label>
                <input
                  type="text"
                  value={rates.philhealth.minContribution}
                  onChange={(e) =>
                    updateRate("philhealth", "minContribution", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.philhealthMin && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.philhealthMin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Contribution
                </label>
                <input
                  type="text"
                  value={rates.philhealth.maxContribution}
                  onChange={(e) =>
                    updateRate("philhealth", "maxContribution", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.philhealthMax && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.philhealthMax}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("pagibig")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-l-4 border-l-green-500"
          >
            <Home className="w-4 h-4 text-green-600" />
            <span className="flex-1 font-medium text-gray-900 text-sm">
              PAG-IBIG Rates
            </span>
            {expandedSection === "pagibig" ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSection === "pagibig" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Employee Rate (%)
                </label>
                <input
                  type="text"
                  value={rates.pagibig.employeeRate}
                  onChange={(e) =>
                    updateRate("pagibig", "employeeRate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.pagibigEmployee && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.pagibigEmployee}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Employer Rate (%)
                </label>
                <input
                  type="text"
                  value={rates.pagibig.employerRate}
                  onChange={(e) =>
                    updateRate("pagibig", "employerRate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.pagibigEmployer && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.pagibigEmployer}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Contribution
                </label>
                <input
                  type="text"
                  value={rates.pagibig.maxContribution}
                  onChange={(e) =>
                    updateRate("pagibig", "maxContribution", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
                {rateErrors.pagibigMax && (
                  <p className="text-red-600 text-xs mt-1">
                    {rateErrors.pagibigMax}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </ModalWrapper>
  );
}

function TransactionHistoryModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 20;

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/benefits/transactions?page=${p}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load transaction history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const startItem = data ? (data.page - 1) * limit + 1 : 0;
  const endItem = data ? Math.min(data.page * limit, data.total) : 0;

  return (
    <ModalWrapper title="Transaction History" onClose={onClose} wide>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      ) : data && data.transactions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <DollarSign className="w-8 h-8 opacity-30" />
          <p className="text-sm">No transactions found</p>
        </div>
      ) : data ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1E3A8A]">
                  <th className="px-4 py-3 text-xs font-semibold text-white text-left uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white text-left uppercase tracking-wider">Benefit</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white text-left uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white text-right uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-white text-center uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.transactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{tx.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                        tx.type === "SSS" ? "bg-blue-100 text-blue-700" :
                        tx.type === "PhilHealth" ? "bg-red-100 text-red-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {tx.type === "SSS" ? <Shield className="w-3 h-3" /> :
                         tx.type === "PhilHealth" ? <Heart className="w-3 h-3" /> :
                         <Home className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{fmt(tx.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs font-medium rounded-full px-2.5 py-0.5 ${
                        tx.status === "Processed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {startItem}–{endItem} of {data.total} items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-[#1E3A8A] text-white"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </ModalWrapper>
  );
}

export default function BenefitsClient({
  totalEmployees,
  activeEmployees,
  sssEnrolled,
  philhealthEnrolled,
  pagibigEnrolled,
  sssMonthlyTotal,
  philhealthMonthlyTotal,
  pagibigMonthlyTotal,
  recentTransactions,
  notEnrolledSss,
  notEnrolledPhilhealth,
  notEnrolledPagibig,
  allEmployees,
}: {
  totalEmployees: number;
  activeEmployees: number;
  sssEnrolled: number;
  philhealthEnrolled: number;
  pagibigEnrolled: number;
  sssMonthlyTotal: number;
  philhealthMonthlyTotal: number;
  pagibigMonthlyTotal: number;
  recentTransactions: Transaction[];
  notEnrolledSss: { id: string; name: string }[];
  notEnrolledPhilhealth: { id: string; name: string }[];
  notEnrolledPagibig: { id: string; name: string }[];
  allEmployees: EmployeeData[];
}) {
  const [activeBenefit, setActiveBenefit] = useState<BenefitType>("SSS");
  const [activeModal, setActiveModal] = useState<
    "contributions" | "report" | "enrollment" | "rates" | "history" | null
  >(null);
  const [sssChecked, setSssChecked] = useState(true);
  const [philhealthChecked, setPhilhealthChecked] = useState(true);
  const [pagibigChecked, setPagibigChecked] = useState(true);
  const [reportType, setReportType] = useState("All Benefits");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedSection, setExpandedSection] = useState<
    "sss" | "philhealth" | "pagibig" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const benefitCards = [
    {
      id: "SSS" as BenefitType,
      title: "SSS (Social Security System)",
      subtitle:
        "Provides retirement, disability, death, and other benefits",
      icon: <Shield className="w-5 h-5" />,
      iconContainer: "bg-blue-100 text-blue-600",
      progressColor: "bg-blue-500",
      enrolled: sssEnrolled,
      total: totalEmployees,
      monthlyTotal: sssMonthlyTotal,
    },
    {
      id: "PhilHealth" as BenefitType,
      title: "PhilHealth",
      subtitle:
        "National Health Insurance Program for healthcare coverage",
      icon: <Heart className="w-5 h-5" />,
      iconContainer: "bg-red-100 text-red-500",
      progressColor: "bg-red-400",
      enrolled: philhealthEnrolled,
      total: totalEmployees,
      monthlyTotal: philhealthMonthlyTotal,
    },
    {
      id: "PAG-IBIG" as BenefitType,
      title: "PAG-IBIG Fund",
      subtitle:
        "National Home Development Mutual Fund for housing",
      icon: <Home className="w-5 h-5" />,
      iconContainer: "bg-green-100 text-green-600",
      progressColor: "bg-green-500",
      enrolled: pagibigEnrolled,
      total: totalEmployees,
      monthlyTotal: pagibigMonthlyTotal,
    },
  ];

  function renderActiveTable() {
    let rows: {
      salaryRange: string;
      employeeShare: string;
      employerShare: string;
      total: string;
    }[];
    switch (activeBenefit) {
      case "SSS":
        rows = sssTableData;
        break;
      case "PhilHealth":
        rows = philhealthTableData;
        break;
      case "PAG-IBIG":
        rows = pagibigTableData;
        break;
      default:
        rows = [];
    }
    return rows.map((row, i) => (
      <tr
        key={i}
        className="divide-x divide-gray-100 hover:bg-gray-50 transition-colors"
      >
        <td className="px-4 py-3 text-sm text-gray-700">
          {row.salaryRange}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {row.employeeShare}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {row.employerShare}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
          {row.total}
        </td>
      </tr>
    ));
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
          <div className="flex items-center gap-3">
            <NotificationBell />
            <NavbarUserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Benefits Management
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage employee benefits and enrollments
            </p>
          </div>

          {totalEmployees === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">
                No employees found. Add employees to see benefit enrollment
                data.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {benefitCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setActiveBenefit(card.id)}
                className={`bg-white rounded-xl p-5 text-left transition-all ${
                  activeBenefit === card.id
                    ? "border-2 border-[#1E3A8A] shadow-md"
                    : "border border-gray-200 shadow-sm hover:shadow-md cursor-pointer"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mb-3 ${card.iconContainer}`}
                >
                  {card.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {card.subtitle}
                </p>

                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Enrolled</span>
                  <span className="text-gray-900">
                    {card.enrolled}/{card.total}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 w-full mb-3">
                  <div
                    className={`${card.progressColor} rounded-full h-2 transition-all`}
                    style={{
                      width:
                        card.total > 0
                          ? `${(card.enrolled / card.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Total</span>
                  <span className="font-semibold text-gray-900">
                    {fmt(card.monthlyTotal)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                {activeBenefit} Contribution Table
              </h3>
              <button
                onClick={() => downloadTableCSV(activeBenefit)}
                className="bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Download Table
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1E3A8A]">
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">
                      Salary Range
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">
                      Employee Share
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">
                      Employer Share
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">
                      Total Contribution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {renderActiveTable()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setActiveModal("history")}
                  className="text-sm font-medium text-[#1E3A8A] hover:text-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
              </div>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <DollarSign className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                  <p className="text-xs text-gray-400">
                    Transactions appear when employees have government
                    benefit IDs and are enrolled.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentTransactions.map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getBenefitIconCircle(tx.type)}`}
                        >
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {tx.type} Contribution
                          </p>
                          <p className="text-sm text-gray-500">
                            {tx.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {tx.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {fmt(tx.amount)}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium rounded-full px-2.5 py-0.5 mt-0.5 ${
                            tx.status === "Processed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveModal("contributions")}
                  className="w-full border border-[#1E3A8A] text-[#1E3A8A] rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Calendar className="w-4 h-4" />
                  Process Monthly Contributions
                </button>
                <button
                  onClick={() => setActiveModal("report")}
                  className="w-full border border-[#1E3A8A] text-[#1E3A8A] rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Download className="w-4 h-4" />
                  Generate Report
                </button>
                <button
                  onClick={() => setActiveModal("enrollment")}
                  className="w-full border border-[#1E3A8A] text-[#1E3A8A] rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Shield className="w-4 h-4" />
                  Bulk Enrollment
                </button>
                <button
                  onClick={() => setActiveModal("rates")}
                  className="w-full border border-[#1E3A8A] text-[#1E3A8A] rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Heart className="w-4 h-4" />
                  Update Benefit Rates
                </button>
              </div>
            </div>
          </div>

          <div className="h-6" />
        </main>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-sm ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeModal === "contributions" && (
        <ProcessContributionsModal
          onClose={() => setActiveModal(null)}
          sssChecked={sssChecked}
          setSssChecked={setSssChecked}
          philhealthChecked={philhealthChecked}
          setPhilhealthChecked={setPhilhealthChecked}
          pagibigChecked={pagibigChecked}
          setPagibigChecked={setPagibigChecked}
          sssEnrolled={sssEnrolled}
          philhealthEnrolled={philhealthEnrolled}
          pagibigEnrolled={pagibigEnrolled}
          sssMonthlyTotal={sssMonthlyTotal}
          philhealthMonthlyTotal={philhealthMonthlyTotal}
          pagibigMonthlyTotal={pagibigMonthlyTotal}
          activeEmployees={activeEmployees}
          onSuccess={showToast}
        />
      )}
      {activeModal === "report" && (
        <GenerateReportModal
          onClose={() => setActiveModal(null)}
          reportType={reportType}
          setReportType={setReportType}
          reportFormat={reportFormat}
          setReportFormat={setReportFormat}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          allEmployees={allEmployees}
          onSuccess={showToast}
        />
      )}
      {activeModal === "enrollment" && (
        <BulkEnrollmentModal
          onClose={() => setActiveModal(null)}
          notEnrolledSss={notEnrolledSss}
          notEnrolledPhilhealth={notEnrolledPhilhealth}
          notEnrolledPagibig={notEnrolledPagibig}
          totalEmployees={totalEmployees}
          onSuccess={showToast}
        />
      )}
      {activeModal === "rates" && (
        <UpdateBenefitRatesModal
          onClose={() => setActiveModal(null)}
          expandedSection={expandedSection}
          setExpandedSection={setExpandedSection}
          onSuccess={showToast}
        />
      )}
      {activeModal === "history" && (
        <TransactionHistoryModal
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
