"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import GrowthChart from "@/components/GrowthChart";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import NavbarUserMenu from "@/components/NavbarUserMenu";
import {
  Users, Award, ClipboardList, UserCircle, Bell,
  Plus, TrendingUp, TrendingDown, FileText, Calendar, Download,
  Database, CheckCircle, AlertCircle, X, Loader2
} from "lucide-react";

type EmployeeSummary = {
  id: string; firstName: string; lastName: string;
  department: string; role: string; status: string;
  createdAt: string; salary: string | null;
};

type RecentEmployee = {
  id: string; firstName: string; lastName: string;
  email: string; phone: string | null;
  department: string; role: string; status: string;
  hireDate: string; salary: string | null;
  address: string | null; employeeId: string;
  createdAt: string; updatedAt: string;
};

type ApplicantSummary = {
  id: string; firstName: string; lastName: string;
  position: string; status: string; appliedAt: string;
};

type ChartView = "day" | "month" | "year";

interface DashboardClientProps {
  totalEmployees: number;
  pendingTasks: number;
  recentEmployees: RecentEmployee[];
  allEmployees: EmployeeSummary[];
  allApplicants: ApplicantSummary[];
  activeBenefits: number;
  benefitsTrend: number | null;
  pageError?: string | null;
}

type ToastData = {
  message: string;
  type: "success" | "error";
  link?: { label: string; href: string };
} | null;

export default function DashboardClient({
  totalEmployees, pendingTasks,
  recentEmployees, allEmployees, allApplicants,
  activeBenefits, benefitsTrend, pageError
}: DashboardClientProps) {
  const [chartView, setChartView] = useState<ChartView>("month");
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [showScheduleReview, setShowScheduleReview] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [toast, setToast] = useState<ToastData>(null);

  const showToast = (message: string, type: "success" | "error" = "success", link?: { label: string; href: string }) => {
    setToast({ message, type, link });
    setTimeout(() => setToast(null), 4000);
  };

  const now = useMemo(() => new Date(), []);

  const chartData = useMemo(() => {
    if (chartView === "day") {
      const currentDay = now.getDate();
      return Array.from({ length: currentDay }, (_, i) => {
        const day = i + 1;
        const count = allEmployees.filter(emp => {
          const d = new Date(emp.createdAt);
          return d.getFullYear() === now.getFullYear() &&
                 d.getMonth() === now.getMonth() &&
                 d.getDate() === day;
        }).length;
        return { label: `${day}`, count };
      });
    }
    if (chartView === "month") {
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const count = allEmployees.filter(emp => {
          const d = new Date(emp.createdAt);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        }).length;
        return { label: monthNames[date.getMonth()], count };
      });
    }
    return Array.from({ length: 5 }, (_, i) => {
      const year = now.getFullYear() - (4 - i);
      const count = allEmployees.filter(emp => new Date(emp.createdAt).getFullYear() === year).length;
      return { label: String(year), count };
    });
  }, [chartView, allEmployees, now]);

  const chartTitle = chartView === "day"
    ? `Daily Hires — ${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`
    : chartView === "month"
    ? "Employee Growth (Last 6 Months)"
    : "Employee Growth (Last 5 Years)";

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // ── Generate Report Modal ──
  const [reportType, setReportType] = useState("Employee Summary");
  const [reportDateFrom, setReportDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportFormat, setReportFormat] = useState("csv");
  const [reportLoading, setReportLoading] = useState(false);

  function generateCSV() {
    const BOM = "\uFEFF";
    let csv = BOM;
    if (reportType === "Employee Summary" || reportType === "Full HR Report") {
      const filtered = allEmployees.filter(emp => {
        const d = new Date(emp.createdAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });
      csv += "Name,Department,Role,Status,Hire Date,Salary\n";
      filtered.forEach(emp => {
        csv += `"${emp.firstName} ${emp.lastName}","${emp.department}","${emp.role}","${emp.status}","${new Date(emp.createdAt).toLocaleDateString()}","${emp.salary || ''}"\n`;
      });
      if (reportType === "Employee Summary") return csv;
      csv += "\n";
    }
    if (reportType === "Applicant Summary" || reportType === "Full HR Report") {
      const filtered = allApplicants.filter(app => {
        const d = new Date(app.appliedAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });
      csv += "Name,Position,Status,Applied Date\n";
      filtered.forEach(app => {
        csv += `"${app.firstName} ${app.lastName}","${app.position}","${app.status}","${new Date(app.appliedAt).toLocaleDateString()}"\n`;
      });
    }
    if (reportType === "Department Breakdown") {
      const deptMap = new Map<string, { count: number; roles: Set<string> }>();
      allEmployees.forEach(emp => {
        if (!deptMap.has(emp.department)) deptMap.set(emp.department, { count: 0, roles: new Set() });
        const entry = deptMap.get(emp.department)!;
        entry.count++;
        entry.roles.add(emp.role);
      });
      csv += "Department,Employee Count,Roles\n";
      deptMap.forEach((val, dept) => {
        csv += `"${dept}",${val.count},"${Array.from(val.roles).join("; ")}"\n`;
      });
    }
    return csv;
  }

  function generatePDF() {
    const dateStr = `${reportDateFrom} to ${reportDateTo}`;
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const doc = new jsPDF({ orientation: "landscape" });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text(`HRKonek — ${reportType}`, 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Period: ${dateStr}  |  Generated: ${today}`, 14, 28);

    let y = 38;

    if (reportType === "Employee Summary" || reportType === "Full HR Report") {
      const filtered = allEmployees.filter(emp => {
        const d = new Date(emp.createdAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });

      // Summary stats
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("Summary", 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(60);
      const active = allEmployees.filter(e => e.status === "Active").length;
      const onLeave = allEmployees.filter(e => e.status === "On Leave").length;
      const inactive = allEmployees.filter(e => e.status === "Inactive").length;
      doc.text(`Total Employees: ${totalEmployees}  |  Active: ${active}  |  On Leave: ${onLeave}  |  Inactive: ${inactive}`, 14, y);
      y += 8;

      if (filtered.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [[{ content: "Employee Details", colSpan: 6, styles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 } }]],
          body: [],
          margin: { top: 14 },
        });
        const lastY = (doc as any).lastAutoTable.finalY || y;
        autoTable(doc, {
          startY: lastY + 2,
          head: [["Name", "Department", "Role", "Status", "Hire Date", "Salary"]],
          body: filtered.map(emp => [
            `${emp.firstName} ${emp.lastName}`,
            emp.department,
            emp.role,
            emp.status,
            new Date(emp.createdAt).toLocaleDateString(),
            emp.salary ? `₱${Number(emp.salary).toLocaleString()}` : "—",
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { top: 14 },
        });
      }
    }

    if (reportType === "Applicant Summary" || reportType === "Full HR Report") {
      const filtered = allApplicants.filter(app => {
        const d = new Date(app.appliedAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });

      const hired = filtered.filter(a => a.status === "Hired").length;
      const rejected = filtered.filter(a => a.status === "Rejected").length;
      const conversionRate = filtered.length ? Math.round(hired / filtered.length * 100) : 0;

      if (reportType !== "Full HR Report") {
        doc.setFontSize(12);
        doc.setTextColor(30, 58, 138);
        doc.text("Summary", 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(60);
      }
      doc.text(`Total Applicants: ${filtered.length}  |  Hired: ${hired}  |  Rejected: ${rejected}  |  Conversion Rate: ${conversionRate}%`, 14, y);
      y += 8;

      if (filtered.length > 0) {
        const lastY = (doc as any).lastAutoTable?.finalY || y;
        autoTable(doc, {
          startY: lastY + 2,
          head: [["Name", "Position", "Status", "Applied Date"]],
          body: filtered.map(app => [
            `${app.firstName} ${app.lastName}`,
            app.position,
            app.status,
            new Date(app.appliedAt).toLocaleDateString(),
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { top: 14 },
        });
      }
    }

    if (reportType === "Department Breakdown") {
      const deptMap = new Map<string, number>();
      allEmployees.forEach(emp => deptMap.set(emp.department, (deptMap.get(emp.department) || 0) + 1));

      autoTable(doc, {
        startY: y,
        head: [["Department", "Employee Count", "Roles"]],
        body: Array.from(deptMap.entries()).map(([dept, count]) => [
          dept,
          String(count),
          allEmployees.filter(e => e.department === dept).map(e => e.role).filter((v, i, a) => a.indexOf(v) === i).join(", "),
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { top: 14 },
      });
    }

    doc.save(`${reportType.replace(/\s+/g, '_')}_${reportDateFrom}_${reportDateTo}.pdf`);
  }

  function generatePrintHTML() {
    const dateStr = `${reportDateFrom} to ${reportDateTo}`;
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    let summaryHtml = "";
    let tableHtml = "";
    let tableHeaders = "";

    if (reportType === "Employee Summary" || reportType === "Full HR Report") {
      const filtered = allEmployees.filter(emp => {
        const d = new Date(emp.createdAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });
      const active = allEmployees.filter(e => e.status === "Active").length;
      const onLeave = allEmployees.filter(e => e.status === "On Leave").length;
      const inactive = allEmployees.filter(e => e.status === "Inactive").length;
      summaryHtml += `<div class="stat-card"><span class="stat-label">Total Employees</span><span class="stat-value">${totalEmployees}</span></div>
        <div class="stat-card"><span class="stat-label">Active</span><span class="stat-value">${active}</span></div>
        <div class="stat-card"><span class="stat-label">On Leave</span><span class="stat-value">${onLeave}</span></div>
        <div class="stat-card"><span class="stat-label">Inactive</span><span class="stat-value">${inactive}</span></div>`;
      filtered.forEach(emp => {
        tableHtml += `<tr><td>${emp.firstName} ${emp.lastName}</td><td>${emp.department}</td><td>${emp.role}</td><td>${emp.status}</td><td>${new Date(emp.createdAt).toLocaleDateString()}</td><td>${emp.salary ? '₱' + Number(emp.salary).toLocaleString() : '—'}</td></tr>`;
      });
      if (reportType === "Full HR Report") tableHeaders = '<th>Name</th><th>Department</th><th>Role</th><th>Status</th><th>Hire Date</th><th>Salary</th>';
      else tableHeaders = '<th>Name</th><th>Department</th><th>Role</th><th>Status</th><th>Hire Date</th><th>Salary</th>';
    }
    if (reportType === "Applicant Summary" || reportType === "Full HR Report") {
      const filtered = allApplicants.filter(app => {
        const d = new Date(app.appliedAt);
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      });
      const hired = filtered.filter(a => a.status === "Hired").length;
      const rejected = filtered.filter(a => a.status === "Rejected").length;
      const conversionRate = filtered.length ? Math.round(hired / filtered.length * 100) : 0;
      summaryHtml += `<div class="stat-card"><span class="stat-label">Total Applications</span><span class="stat-value">${filtered.length}</span></div>
        <div class="stat-card"><span class="stat-label">Hired</span><span class="stat-value">${hired}</span></div>
        <div class="stat-card"><span class="stat-label">Rejected</span><span class="stat-value">${rejected}</span></div>
        <div class="stat-card"><span class="stat-label">Conversion Rate</span><span class="stat-value">${conversionRate}%</span></div>`;
      filtered.forEach(app => {
        tableHtml += `<tr><td>${app.firstName} ${app.lastName}</td><td>${app.position}</td><td>${app.status}</td><td>${new Date(app.appliedAt).toLocaleDateString()}</td></tr>`;
      });
      if (reportType === "Full HR Report" && tableHeaders === "") tableHeaders = '<th>Name</th><th>Position</th><th>Status</th><th>Date</th>';
      else if (reportType !== "Full HR Report") tableHeaders = '<th>Name</th><th>Position</th><th>Status</th><th>Date</th>';
    }
    if (reportType === "Department Breakdown") {
      const deptMap = new Map<string, number>();
      allEmployees.forEach(emp => deptMap.set(emp.department, (deptMap.get(emp.department) || 0) + 1));
      deptMap.forEach((count, dept) => {
        tableHtml += `<tr><td>${dept}</td><td>${count}</td><td>${allEmployees.filter(e => e.department === dept).map(e => e.role).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</td></tr>`;
      });
      tableHeaders = '<th>Department</th><th>Count</th><th>Roles</th>';
    }

    return `<!DOCTYPE html><html><head>
      <style>
        @media print { @page { margin: 20mm; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
        .header { background: #1E3A8A; color: white; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 4px 0 0; opacity: 0.8; font-size: 13px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 32px; }
        .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { display: block; font-size: 24px; font-weight: bold; color: #1E3A8A; margin-top: 4px; }
        table { width: calc(100% - 64px); margin: 0 32px; border-collapse: collapse; }
        th { background: #1E3A8A; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { text-align: center; margin: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head><body>
      <div class="header"><h1>HRKonek — ${reportType}</h1><p>Period: ${dateStr} &mdash; Generated: ${today}</p></div>
      <div class="stats-grid">${summaryHtml}</div>
      ${tableHtml ? `<table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableHtml}</tbody></table>` : ""}
      <div class="footer">HRKonek Management System &mdash; Confidential &mdash; Page 1</div>
    </body></html>`;
  }

  function handleGenerateReport() {
    setReportLoading(true);
    setTimeout(() => {
      setReportLoading(false);
      if (reportFormat === "csv") {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType.replace(/\s+/g, '_')}_${reportDateFrom}_${reportDateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (reportFormat === "pdf") {
        generatePDF();
      } else {
        const html = generatePrintHTML();
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      }
      setShowGenerateReport(false);
      showToast("Report generated successfully!");
    }, 800);
  }

  // ── Schedule Review Modal ──
  const [reviewType, setReviewType] = useState("Performance Review");
  const [reviewEmployeeSearch, setReviewEmployeeSearch] = useState("");
  const [reviewEmployeeSelectOpen, setReviewEmployeeSelectOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [reviewDate, setReviewDate] = useState("");
  const [reviewTime, setReviewTime] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [notifyEmployee, setNotifyEmployee] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  const filteredEmployees = allEmployees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(reviewEmployeeSearch.toLowerCase())
  );

  function handleScheduleReview() {
    const errs: Record<string, string> = {};
    if (!selectedEmployee) errs.employee = "Please select an employee";
    if (!reviewDate) errs.date = "Review date is required";
    if (!reviewTime) errs.time = "Review time is required";
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const review = {
      id: Date.now().toString(),
      type: reviewType,
      employeeId: selectedEmployee!.id,
      employeeName: selectedEmployee!.name,
      date: reviewDate,
      time: reviewTime,
      reviewer: reviewerName,
      notes: reviewNotes,
      notify: notifyEmployee,
      createdAt: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem('scheduledReviews') || '[]');
    localStorage.setItem('scheduledReviews', JSON.stringify([...existing, review]));
    setShowScheduleReview(false);
    resetReviewForm();
    showToast(`Review scheduled for ${selectedEmployee!.name} on ${new Date(reviewDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  }

  function resetReviewForm() {
    setReviewType("Performance Review");
    setReviewEmployeeSearch("");
    setSelectedEmployee(null);
    setReviewDate("");
    setReviewTime("");
    setReviewerName("");
    setReviewNotes("");
    setNotifyEmployee(false);
    setReviewErrors({});
  }

  // ── Export Data Modal ──
  const [exportEmployees, setExportEmployees] = useState(true);
  const [exportApplicants, setExportApplicants] = useState(true);
  const [exportGrowth, setExportGrowth] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportFilename, setExportFilename] = useState(() => {
    const d = new Date().toISOString().split('T')[0];
    return `hrkonek-export-${d}`;
  });

  const totalExportRecords = useMemo(() => {
    let total = 0;
    if (exportEmployees) total += allEmployees.length;
    if (exportApplicants) total += allApplicants.length;
    if (exportGrowth) total += 12;
    return total;
  }, [exportEmployees, exportApplicants, exportGrowth, allEmployees, allApplicants]);

  function handleExport() {
    const BOM = "\uFEFF";
    if (exportFormat === "csv") {
      let csv = BOM;
      if (exportEmployees) {
        csv += "=== EMPLOYEES ===\n";
        csv += "ID,First Name,Last Name,Email,Department,Role,Status,Hire Date,Salary\n";
        allEmployees.forEach(emp => {
          csv += `"${emp.id}","${emp.firstName}","${emp.lastName}","","${emp.department}","${emp.role}","${emp.status}","${new Date(emp.createdAt).toLocaleDateString()}","${emp.salary || ''}"\n`;
        });
        csv += "\n";
      }
      if (exportApplicants) {
        csv += "=== APPLICANTS ===\n";
        csv += "ID,First Name,Last Name,Email,Position,Status,Applied Date\n";
        allApplicants.forEach(app => {
          csv += `"${app.id}","${app.firstName}","${app.lastName}","","${app.position}","${app.status}","${new Date(app.appliedAt).toLocaleDateString()}"\n`;
        });
        csv += "\n";
      }
      if (exportGrowth) {
        csv += "=== GROWTH DATA ===\n";
        csv += "Month,New Hires\n";
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          const count = allEmployees.filter(emp => {
            const d = new Date(emp.createdAt);
            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
          }).length;
          return { label: monthNames[date.getMonth()], count };
        }).forEach(row => {
          csv += `"${row.label}",${row.count}\n`;
        });
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFilename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const growthData = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const count = allEmployees.filter(emp => {
          const d = new Date(emp.createdAt);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        }).length;
        return { month: monthNames[date.getMonth()], count };
      });
      const exportObj = {
        exportedAt: new Date().toISOString(),
        exportedBy: "Admin User",
        data: {
          employees: exportEmployees ? allEmployees : undefined,
          applicants: exportApplicants ? allApplicants : undefined,
          growthData: exportGrowth ? growthData : undefined,
        }
      };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFilename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setShowExportData(false);
    showToast("Data exported successfully!");
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

          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor key metrics and recent activities</p>
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

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12% from last month</span>
                </div>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Benefits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeBenefits}</p>
                <div className="flex items-center gap-1 mt-2">
                  {benefitsTrend === null ? (
                    <>
                      <Award className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">
                        {activeBenefits === 0 ? "No enrollments yet" : "No previous data"}
                      </span>
                    </>
                  ) : benefitsTrend > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">+{benefitsTrend}% from last month</span>
                    </>
                  ) : benefitsTrend < 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">{benefitsTrend}% from last month</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">No change from last month</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ClipboardList className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-medium">Awaiting review</span>
                </div>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Chart + Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm sm:text-base">{chartTitle}</h2>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {(["day", "month", "year"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setChartView(view)}
                      className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                        chartView === view
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {view === "day" ? "Daily" : view === "month" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full h-52 sm:h-56">
                <GrowthChart data={chartData} />
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Activities</h2>
                <Link href="/employees" className="text-xs text-blue-600 hover:underline font-medium">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
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
                          <p className="text-xs text-gray-500">New employee onboarded</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {timeAgo(emp.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/employees/new"
              className="flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
            <button
              onClick={() => setShowGenerateReport(true)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button
              onClick={() => setShowScheduleReview(true)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Review
            </button>
            <button
              onClick={() => setShowExportData(true)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium text-sm bg-white transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>

          <div className="h-6" />
        </main>
      </div>

      {/* ── Generate Report Modal ── */}
      {showGenerateReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowGenerateReport(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Generate HR Report</h2>
              </div>
              <button onClick={() => setShowGenerateReport(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all">
                  <option>Employee Summary</option>
                  <option>Applicant Summary</option>
                  <option>Department Breakdown</option>
                  <option>Full HR Report</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input type="date" max="9999-12-31" value={reportDateFrom} onChange={e => {
                    const year = e.target.value.split('-')[0];
                    if (year && year.length > 4) return;
                    setReportDateFrom(e.target.value);
                  }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input type="date" max="9999-12-31" value={reportDateTo} onChange={e => {
                    const year = e.target.value.split('-')[0];
                    if (year && year.length > 4) return;
                    setReportDateTo(e.target.value);
                  }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportFormat("pdf")}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      reportFormat === "pdf"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setReportFormat("csv")}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      reportFormat === "csv"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setReportFormat("print")}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      reportFormat === "print"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    Print
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                {reportType === "Employee Summary" && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Total headcount by department</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Status breakdown (Active/On Leave/Inactive)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Recent hires in date range</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Salary summary</li>
                  </ul>
                )}
                {reportType === "Applicant Summary" && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Total applications in date range</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Status breakdown by stage</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Positions applied for</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Hired vs Rejected ratio</li>
                  </ul>
                )}
                {reportType === "Department Breakdown" && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Employee count per department</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Role distribution</li>
                  </ul>
                )}
                {reportType === "Full HR Report" && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> All of the above combined</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowGenerateReport(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleGenerateReport} disabled={reportLoading}
                className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#152e6f] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                {reportLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4" /> Generate &amp; Download</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Review Modal ── */}
      {showScheduleReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowScheduleReview(false); resetReviewForm(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Schedule Performance Review</h2>
              </div>
              <button onClick={() => { setShowScheduleReview(false); resetReviewForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Type<span className="text-blue-600">*</span></label>
                <select value={reviewType} onChange={e => setReviewType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all">
                  <option>Performance Review</option>
                  <option>Probationary Review</option>
                  <option>Annual Review</option>
                  <option>Department Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee<span className="text-blue-600">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={reviewEmployeeSearch}
                    onChange={e => { setReviewEmployeeSearch(e.target.value); setReviewEmployeeSelectOpen(true); }}
                    onFocus={() => setReviewEmployeeSelectOpen(true)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${reviewErrors.employee ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {selectedEmployee && (
                    <button onClick={() => { setSelectedEmployee(null); setReviewEmployeeSearch(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {reviewEmployeeSelectOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                      {filteredEmployees.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-400">No employees found</div>
                      ) : (
                        filteredEmployees.map(emp => (
                          <button key={emp.id}
                            onClick={() => { setSelectedEmployee({ id: emp.id, name: `${emp.firstName} ${emp.lastName}` }); setReviewEmployeeSearch(`${emp.firstName} ${emp.lastName}`); setReviewEmployeeSelectOpen(false); setReviewErrors(prev => { const rest = { ...prev }; delete rest.employee; return rest; }); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            {emp.firstName} {emp.lastName} <span className="text-gray-400">— {emp.role}, {emp.department}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {reviewErrors.employee && <p className="text-red-600 text-xs font-medium mt-1">{reviewErrors.employee}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date<span className="text-blue-600">*</span></label>
                  <input type="date" max="9999-12-31" value={reviewDate} onChange={e => {
                    const year = e.target.value.split('-')[0];
                    if (year && year.length > 4) return;
                    setReviewDate(e.target.value);
                  }}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${reviewErrors.date ? 'border-red-400' : 'border-gray-300'}`} />
                  {reviewErrors.date && <p className="text-red-600 text-xs font-medium mt-1">{reviewErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Time<span className="text-blue-600">*</span></label>
                  <input type="time" value={reviewTime} onChange={e => setReviewTime(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all ${reviewErrors.time ? 'border-red-400' : 'border-gray-300'}`} />
                  {reviewErrors.time && <p className="text-red-600 text-xs font-medium mt-1">{reviewErrors.time}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer/Assessor</label>
                <input type="text" value={reviewerName} onChange={e => setReviewerName(e.target.value)}
                  placeholder="Enter reviewer name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add any notes or agenda items..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all resize-none" />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Notify Employee</p>
                  <p className="text-xs text-gray-400">Send email notification</p>
                </div>
                <button
                  onClick={() => setNotifyEmployee(!notifyEmployee)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${notifyEmployee ? 'bg-[#1E3A8A]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifyEmployee ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {notifyEmployee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Employee will be notified via email</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowScheduleReview(false); resetReviewForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleScheduleReview}
                className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#152e6f] rounded-lg transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Data Modal ── */}
      {showExportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowExportData(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Export Data</h2>
              </div>
              <button onClick={() => setShowExportData(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-gray-700">What to Export</p>

              <div className={`border rounded-xl p-4 transition-colors cursor-pointer ${exportEmployees ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setExportEmployees(!exportEmployees)}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${exportEmployees ? 'bg-[#1E3A8A] border-[#1E3A8A]' : 'border-gray-300'}`}>
                    {exportEmployees && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Employees</p>
                    <p className="text-xs text-gray-400">All employee records</p>
                  </div>
                  <span className="text-xs text-gray-500">{allEmployees.length} records</span>
                </div>
              </div>

              <div className={`border rounded-xl p-4 transition-colors cursor-pointer ${exportApplicants ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setExportApplicants(!exportApplicants)}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${exportApplicants ? 'bg-[#1E3A8A] border-[#1E3A8A]' : 'border-gray-300'}`}>
                    {exportApplicants && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Applicants</p>
                    <p className="text-xs text-gray-400">All applicant records</p>
                  </div>
                  <span className="text-xs text-gray-500">{allApplicants.length} records</span>
                </div>
              </div>

              <div className={`border rounded-xl p-4 transition-colors cursor-pointer ${exportGrowth ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setExportGrowth(!exportGrowth)}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${exportGrowth ? 'bg-[#1E3A8A] border-[#1E3A8A]' : 'border-gray-300'}`}>
                    {exportGrowth && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Employee Growth Data</p>
                    <p className="text-xs text-gray-400">Monthly hire statistics</p>
                  </div>
                  <span className="text-xs text-gray-500">Last 12 months</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 font-medium">Total: {totalExportRecords} records will be exported</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      exportFormat === "csv"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    CSV (Excel)
                  </button>
                  <button
                    onClick={() => setExportFormat("json")}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      exportFormat === "json"
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                <input type="text" value={exportFilename} onChange={e => setExportFilename(e.target.value)}
                  placeholder="hrkonek-export"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowExportData(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleExport}
                className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#152e6f] rounded-lg transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-sm ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          <span>{toast.message}</span>
          {toast.link && (
            <Link href={toast.link.href} className="underline whitespace-nowrap">
              {toast.link.label}
            </Link>
          )}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
