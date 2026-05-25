"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Bell, UserCircle, Shield, Heart, Home, Download,
  DollarSign, Calendar, CheckSquare, FileText,
  Table2, Users, AlertTriangle, ChevronDown,
  ChevronUp, Save, X, Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

const sssTableData = [
  { salaryRange: "\u20B11,000 - \u20B11,249.99", employeeShare: "\u20B136.30", employerShare: "\u20B184.70", total: "\u20B1121.00" },
  { salaryRange: "\u20B11,250 - \u20B11,749.99", employeeShare: "\u20B154.50", employerShare: "\u20B1127.10", total: "\u20B1181.60" },
  { salaryRange: "\u20B12,250 - \u20B12,749.99", employeeShare: "\u20B190.80", employerShare: "\u20B1211.90", total: "\u20B1302.70" },
  { salaryRange: "\u20B14,250 - \u20B14,749.99", employeeShare: "\u20B1163.50", employerShare: "\u20B1381.50", total: "\u20B1545.00" },
  { salaryRange: "\u20B120,000+", employeeShare: "\u20B1800.00", employerShare: "\u20B11,760.00", total: "\u20B12,560.00" },
];

const philhealthTableData = [
  { salaryRange: "\u20B110,000 and below", employeeShare: "\u20B1200.00", employerShare: "\u20B1200.00", total: "\u20B1400.00" },
  { salaryRange: "\u20B110,000 - \u20B149,999.99", employeeShare: "2% of salary", employerShare: "2% of salary", total: "Split equally" },
  { salaryRange: "\u20B150,000 and above", employeeShare: "\u20B1500.00", employerShare: "\u20B1500.00", total: "\u20B11,000.00" },
];

const pagibigTableData = [
  { salaryRange: "\u20B11,500 and below", employeeShare: "1%", employerShare: "2%", total: "3%" },
  { salaryRange: "Above \u20B11,500", employeeShare: "2%", employerShare: "2%", total: "4%" },
  { salaryRange: "Voluntary", employeeShare: "Up to 5%", employerShare: "2%", total: "Variable" },
];

const transactions = [
  { type: "SSS" as const, name: "Maria Santos", date: "May 15, 2026", amount: "\u20B11,200.00", status: "Processed" },
  { type: "PhilHealth" as const, name: "Juan Reyes", date: "May 15, 2026", amount: "\u20B1800.00", status: "Processed" },
  { type: "PAG-IBIG" as const, name: "Anna Garcia", date: "May 14, 2026", amount: "\u20B1200.00", status: "Processed" },
  { type: "SSS" as const, name: "Pedro Cruz", date: "May 14, 2026", amount: "\u20B11,200.00", status: "Pending" },
];

type BenefitType = "SSS" | "PhilHealth" | "PAG-IBIG";

function getBenefitIcon(type: BenefitType) {
  switch (type) {
    case "SSS": return <Shield className="w-4 h-4" />;
    case "PhilHealth": return <Heart className="w-4 h-4" />;
    case "PAG-IBIG": return <Home className="w-4 h-4" />;
  }
}

function getBenefitIconStyle(type: BenefitType): string {
  switch (type) {
    case "SSS": return "bg-blue-100 text-blue-600";
    case "PhilHealth": return "bg-red-100 text-red-500";
    case "PAG-IBIG": return "bg-green-100 text-green-600";
  }
}

function getBenefitIconCircle(type: BenefitType): string {
  switch (type) {
    case "SSS": return "bg-blue-100 text-blue-600";
    case "PhilHealth": return "bg-red-100 text-red-600";
    case "PAG-IBIG": return "bg-green-100 text-green-600";
  }
}

function getBenefitProgressColor(type: BenefitType): string {
  switch (type) {
    case "SSS": return "bg-blue-500";
    case "PhilHealth": return "bg-red-400";
    case "PAG-IBIG": return "bg-green-500";
  }
}

function downloadTableCSV(benefit: string) {
  let data: { 
    salaryRange: string
    employeeShare: string
    employerShare: string
    total: string 
  }[]

  switch (benefit) {
    case "SSS":       data = sssTableData; break
    case "PhilHealth": data = philhealthTableData; break
    case "PAG-IBIG":  data = pagibigTableData; break
    default: return
  }

  const headers = [
    "Salary Range",
    "Employee Share", 
    "Employer Share",
    "Total Contribution"
  ]

  const escapeCell = (val: string) => 
    `"${val.replace(/"/g, '""')}"`

  const rows = data.map((r) => [
    escapeCell(r.salaryRange),
    escapeCell(r.employeeShare),
    escapeCell(r.employerShare),
    escapeCell(r.total),
  ])

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.join(","))
  ].join("\n")

  const BOM = "\uFEFF"
  const blob = new Blob(
    [BOM + csvContent], 
    { type: "text/csv;charset=utf-8;" }
  )

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${benefit}_Contribution_Table.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ModalWrapper({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BenefitCheckboxRow({ checked, onChange, icon, label, subtitle, iconStyle }: {
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </label>
  );
}

function ProcessContributionsModal({ onClose, sssChecked, setSssChecked, philhealthChecked, setPhilhealthChecked, pagibigChecked, setPagibigChecked }: {
  onClose: () => void;
  sssChecked: boolean;
  setSssChecked: (v: boolean) => void;
  philhealthChecked: boolean;
  setPhilhealthChecked: (v: boolean) => void;
  pagibigChecked: boolean;
  setPagibigChecked: (v: boolean) => void;
}) {
  const sssTotal = 283200.00;
  const philhealthTotal = 188800.00;
  const pagibigTotal = 47200.00;

  let grandTotal = 0;
  if (sssChecked) grandTotal += sssTotal;
  if (philhealthChecked) grandTotal += philhealthTotal;
  if (pagibigChecked) grandTotal += pagibigTotal;

  return (
    <ModalWrapper title="Process Monthly Contributions" onClose={onClose}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Select Contribution Period <span className="text-blue-600">*</span></label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]">
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]">
          {["2023", "2024", "2025", "2026"].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">Select Benefits to Process <span className="text-blue-600">*</span></label>
      <BenefitCheckboxRow
        checked={sssChecked}
        onChange={setSssChecked}
        icon={<Shield className="w-4 h-4" />}
        label="SSS Contributions"
        subtitle="236 employees - Est. \u20B1283,200.00"
        iconStyle="bg-blue-100 text-blue-600"
      />
      <BenefitCheckboxRow
        checked={philhealthChecked}
        onChange={setPhilhealthChecked}
        icon={<Heart className="w-4 h-4" />}
        label="PhilHealth Contributions"
        subtitle="236 employees - Est. \u20B1188,800.00"
        iconStyle="bg-red-100 text-red-500"
      />
      <BenefitCheckboxRow
        checked={pagibigChecked}
        onChange={setPagibigChecked}
        icon={<Home className="w-4 h-4" />}
        label="PAG-IBIG Contributions"
        subtitle="236 employees - Est. \u20B147,200.00"
        iconStyle="bg-green-100 text-green-600"
      />

      <div className="bg-blue-50 rounded-lg p-4 mt-4">
        <p className="font-bold text-blue-900 mb-3">Processing Summary</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Total Employees:</span>
          <span className="text-gray-900">236</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Total Contributions:</span>
          <span className="text-gray-900">{`\u20B1${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Processing Fee:</span>
          <span className="text-gray-900">{`\u20B10.00`}</span>
        </div>
        <hr className="my-2 border-gray-300" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-blue-900">Grand Total:</span>
          <span className="text-blue-900">{`\u20B1${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          Cancel
        </button>
        <button className="flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Process Contributions
        </button>
      </div>
    </ModalWrapper>
  );
}

function GenerateReportModal({ onClose, reportType, setReportType, reportFormat, setReportFormat, dateFrom, setDateFrom, dateTo, setDateTo }: {
  onClose: () => void;
  reportType: string;
  setReportType: (v: string) => void;
  reportFormat: string;
  setReportFormat: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
}) {
  const [includeEmployeeDetails, setIncludeEmployeeDetails] = useState(true);
  const [includeContributionBreakdown, setIncludeContributionBreakdown] = useState(true);
  const [includeMonthlySummary, setIncludeMonthlySummary] = useState(true);
  const [includeYTD, setIncludeYTD] = useState(false);

  return (
    <ModalWrapper title="Generate Report" onClose={onClose} wide>
      <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mb-4"
      >
        {["All Benefits", "SSS Only", "PhilHealth Only", "PAG-IBIG Only", "Employee Summary", "Contribution Summary"].map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <span className="text-xs text-gray-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mt-1" />
        </div>
        <div>
          <span className="text-xs text-gray-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mt-1" />
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setReportFormat("pdf")}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${reportFormat === "pdf" ? "border-[#1E3A8A] bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => setReportFormat("csv")}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${reportFormat === "csv" ? "border-[#1E3A8A] bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        >
          <Table2 className="w-4 h-4" />
          Excel/CSV
        </button>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">Include in Report</label>
      <div className="space-y-2 mb-4">
        {[
          { label: "Employee Details", checked: includeEmployeeDetails, set: setIncludeEmployeeDetails },
          { label: "Contribution Breakdown", checked: includeContributionBreakdown, set: setIncludeContributionBreakdown },
          { label: "Monthly Summary", checked: includeMonthlySummary, set: setIncludeMonthlySummary },
          { label: "Year-to-Date Totals", checked: includeYTD, set: setIncludeYTD },
        ].map((item) => (
          <label key={item.label} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          Cancel
        </button>
        <button className="flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Generate &amp; Download
        </button>
      </div>
    </ModalWrapper>
  );
}

function BulkEnrollmentModal({ onClose, totalEmployees }: { onClose: () => void; totalEmployees: number }) {
  const [enrollSss, setEnrollSss] = useState(true);
  const [enrollPhilhealth, setEnrollPhilhealth] = useState(true);
  const [enrollPagibig, setEnrollPagibig] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<"all" | "new" | "custom">("all");
  const [customSearch, setCustomSearch] = useState("");

  const enrolled = Math.max(0, totalEmployees - 12);

  return (
    <ModalWrapper title="Bulk Enrollment" onClose={onClose}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">Enroll multiple employees in government benefits at once.</p>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-2">Select Benefits to Enroll</label>
      <BenefitCheckboxRow
        checked={enrollSss}
        onChange={setEnrollSss}
        icon={<Shield className="w-4 h-4" />}
        label="SSS"
        subtitle={`${enrolled} employees enrolled`}
        iconStyle="bg-blue-100 text-blue-600"
      />
      <BenefitCheckboxRow
        checked={enrollPhilhealth}
        onChange={setEnrollPhilhealth}
        icon={<Heart className="w-4 h-4" />}
        label="PhilHealth"
        subtitle={`${enrolled} employees enrolled`}
        iconStyle="bg-red-100 text-red-500"
      />
      <BenefitCheckboxRow
        checked={enrollPagibig}
        onChange={setEnrollPagibig}
        icon={<Home className="w-4 h-4" />}
        label="PAG-IBIG"
        subtitle={`${enrolled} employees enrolled`}
        iconStyle="bg-green-100 text-green-600"
      />

      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Select Employees</label>
      <div className="space-y-2 mb-4">
        {[
          { value: "all" as const, label: `All Employees (${totalEmployees} total)` },
          { value: "new" as const, label: `New Employees Only (12 not yet enrolled)` },
          { value: "custom" as const, label: "Custom Selection" },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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

      {selectedEmployees === "custom" && (
        <div className="mb-4">
          <input
            type="text"
            value={customSearch}
            onChange={(e) => setCustomSearch(e.target.value)}
            placeholder="Search employees to add..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
          />
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date <span className="text-blue-600">*</span></label>
      <input type="date"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] mb-4"
      />

      <div className="flex gap-3 mt-2">
        <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          Cancel
        </button>
        <button className="flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <Users className="w-4 h-4" />
          Enroll Employees
        </button>
      </div>
    </ModalWrapper>
  );
}

function UpdateBenefitRatesModal({ onClose, expandedSection, setExpandedSection }: {
  onClose: () => void;
  expandedSection: "sss" | "philhealth" | "pagibig" | null;
  setExpandedSection: (v: "sss" | "philhealth" | "pagibig" | null) => void;
}) {
  function toggleSection(section: "sss" | "philhealth" | "pagibig") {
    setExpandedSection(expandedSection === section ? null : section);
  }

  return (
    <ModalWrapper title="Update Benefit Rates" onClose={onClose}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-700">Changes will affect all future contribution calculations.</p>
      </div>

      <div className="space-y-3">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("sss")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-l-4 border-l-blue-500"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="flex-1 font-medium text-gray-900 text-sm">SSS Rates</span>
            {expandedSection === "sss" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSection === "sss" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee Rate (%)</label>
                <input type="text" defaultValue="4.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employer Rate (%)</label>
                <input type="text" defaultValue="8.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Salary Ceiling</label>
                <input type="text" defaultValue="20000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
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
            <span className="flex-1 font-medium text-gray-900 text-sm">PhilHealth Rates</span>
            {expandedSection === "philhealth" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSection === "philhealth" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Premium Rate (%)</label>
                <input type="text" defaultValue="5.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Contribution</label>
                <input type="text" defaultValue="400"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Contribution</label>
                <input type="text" defaultValue="3200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
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
            <span className="flex-1 font-medium text-gray-900 text-sm">PAG-IBIG Rates</span>
            {expandedSection === "pagibig" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSection === "pagibig" && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee Rate (%)</label>
                <input type="text" defaultValue="2.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employer Rate (%)</label>
                <input type="text" defaultValue="2.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Contribution</label>
                <input type="text" defaultValue="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          Cancel
        </button>
        <button className="flex-1 bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </ModalWrapper>
  );
}

export default function BenefitsPage() {
  const [activeBenefit, setActiveBenefit] = useState<BenefitType>("SSS");
  const [activeModal, setActiveModal] = useState<"contributions" | "report" | "enrollment" | "rates" | null>(null);
  const [sssChecked, setSssChecked] = useState(true);
  const [philhealthChecked, setPhilhealthChecked] = useState(true);
  const [pagibigChecked, setPagibigChecked] = useState(true);
  const [reportType, setReportType] = useState("All Benefits");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<"all" | "new" | "custom">("all");
  const [expandedSection, setExpandedSection] = useState<"sss" | "philhealth" | "pagibig" | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(248);

  useEffect(() => {
    fetch("/api/employees/count")
      .then((r) => r.json())
      .then((d) => { if (d.count) setTotalEmployees(d.count); })
      .catch(() => {});
  }, []);

  const enrolledEmployees = Math.max(0, totalEmployees - 12);

  const benefitCards = [
    {
      id: "SSS" as BenefitType,
      title: "SSS (Social Security System)",
      subtitle: "Provides retirement, disability, death, and other benefits",
      icon: <Shield className="w-5 h-5" />,
      iconContainer: "bg-blue-100 text-blue-600",
      progressColor: "bg-blue-500",
      enrolled: enrolledEmployees,
      total: totalEmployees,
      monthlyTotal: "\u20B1283,200.00",
    },
    {
      id: "PhilHealth" as BenefitType,
      title: "PhilHealth",
      subtitle: "National Health Insurance Program for healthcare coverage",
      icon: <Heart className="w-5 h-5" />,
      iconContainer: "bg-red-100 text-red-500",
      progressColor: "bg-red-400",
      enrolled: enrolledEmployees,
      total: totalEmployees,
      monthlyTotal: "\u20B1188,800.00",
    },
    {
      id: "PAG-IBIG" as BenefitType,
      title: "PAG-IBIG Fund",
      subtitle: "National Home Development Mutual Fund for housing",
      icon: <Home className="w-5 h-5" />,
      iconContainer: "bg-green-100 text-green-600",
      progressColor: "bg-green-500",
      enrolled: enrolledEmployees,
      total: totalEmployees,
      monthlyTotal: "\u20B147,200.00",
    },
  ];

  function renderActiveTable() {
    let rows: { salaryRange: string; employeeShare: string; employerShare: string; total: string }[];
    switch (activeBenefit) {
      case "SSS": rows = sssTableData; break;
      case "PhilHealth": rows = philhealthTableData; break;
      case "PAG-IBIG": rows = pagibigTableData; break;
      default: rows = [];
    }
    return rows.map((row, i) => (
      <tr key={i} className="divide-x divide-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-700">{row.salaryRange}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{row.employeeShare}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{row.employerShare}</td>
        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.total}</td>
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
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Benefits Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage employee benefits and enrollments</p>
          </div>

          {/* SECTION 1 — Benefit Cards */}
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
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mb-3 ${card.iconContainer}`}>
                  {card.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{card.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{card.subtitle}</p>

                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Enrolled</span>
                  <span className="text-gray-900">{card.enrolled}/{card.total}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 w-full mb-3">
                  <div
                    className={`${card.progressColor} rounded-full h-2 transition-all`}
                    style={{ width: `${(card.enrolled / card.total) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Total</span>
                  <span className="font-semibold text-gray-900">{card.monthlyTotal}</span>
                </div>
              </button>
            ))}
          </div>

          {/* SECTION 2 — Contribution Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">{activeBenefit} Contribution Table</h3>
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
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">Salary Range</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">Employee Share</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">Employer Share</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white">Total Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {renderActiveTable()}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3 — Bottom Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: Recent Transactions */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                <button className="text-blue-600 hover:underline text-sm font-medium">View All</button>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getBenefitIconCircle(tx.type)}`}>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 capitalize">{tx.type} Contribution</p>
                        <p className="text-sm text-gray-500">{tx.name}</p>
                        <p className="text-xs text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{tx.amount}</p>
                      <span className={`inline-block text-xs font-medium rounded-full px-2.5 py-0.5 mt-0.5 ${
                        tx.status === "Processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
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

      {/* MODALS */}
      {activeModal === "contributions" && (
        <ProcessContributionsModal
          onClose={() => setActiveModal(null)}
          sssChecked={sssChecked}
          setSssChecked={setSssChecked}
          philhealthChecked={philhealthChecked}
          setPhilhealthChecked={setPhilhealthChecked}
          pagibigChecked={pagibigChecked}
          setPagibigChecked={setPagibigChecked}
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
        />
      )}
      {activeModal === "enrollment" && (
        <BulkEnrollmentModal
          onClose={() => setActiveModal(null)}
          totalEmployees={totalEmployees}
        />
      )}
      {activeModal === "rates" && (
        <UpdateBenefitRatesModal
          onClose={() => setActiveModal(null)}
          expandedSection={expandedSection}
          setExpandedSection={setExpandedSection}
        />
      )}
    </div>
  );
}
