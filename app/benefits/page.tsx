import { prisma } from "@/lib/prisma";
import BenefitsClient from "@/components/BenefitsClient";

export const dynamic = "force-dynamic";

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

type Transaction = {
  type: "SSS" | "PhilHealth" | "PAG-IBIG";
  name: string;
  date: string;
  amount: number;
  status: "Processed" | "Pending";
  employeeId: string;
};

async function getBenefitsData() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      salary: true,
      status: true,
      sssNumber: true,
      philhealthNumber: true,
      pagibigNumber: true,
      hireDate: true,
      createdAt: true,
    },
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "Active").length;

  const sssEnrolled = employees.filter(
    (e) => e.sssNumber && e.sssNumber.trim() !== ""
  ).length;
  const philhealthEnrolled = employees.filter(
    (e) => e.philhealthNumber && e.philhealthNumber.trim() !== ""
  ).length;
  const pagibigEnrolled = employees.filter(
    (e) => e.pagibigNumber && e.pagibigNumber.trim() !== ""
  ).length;

  const sssMonthlyTotal = employees
    .filter((e) => e.sssNumber && e.status === "Active")
    .reduce((sum, e) => sum + computeSSS(e.salary), 0);

  const philhealthMonthlyTotal = employees
    .filter((e) => e.philhealthNumber && e.status === "Active")
    .reduce((sum, e) => sum + computePhilHealth(e.salary), 0);

  const pagibigMonthlyTotal = employees
    .filter((e) => e.pagibigNumber && e.status === "Active")
    .reduce((sum, e) => sum + computePagibig(e.salary), 0);

  const recentHires = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      salary: true,
      sssNumber: true,
      philhealthNumber: true,
      pagibigNumber: true,
      hireDate: true,
      createdAt: true,
    },
    orderBy: { hireDate: "desc" },
    take: 8,
  });

  const recentIds = recentHires.map((e) => e.id);
  const processedRecords = await prisma.contributionRecord.findMany({
    where: { employeeId: { in: recentIds } },
    select: { employeeId: true, type: true },
  });
  const processedSet = new Set(
    processedRecords.map((r) => `${r.employeeId}:${r.type}`)
  );

  const recentTransactions: Transaction[] = [];
  for (const emp of recentHires) {
    const name = `${emp.firstName} ${emp.lastName}`;
    const dateStr = new Date(emp.hireDate ?? emp.createdAt).toLocaleDateString(
      "en-PH",
      { month: "short", day: "numeric", year: "numeric" }
    );

    if (emp.sssNumber) {
      recentTransactions.push({
        type: "SSS",
        name,
        date: dateStr,
        amount: computeSSS(emp.salary),
        status: processedSet.has(`${emp.id}:SSS`) ? "Processed" : "Pending",
        employeeId: emp.id,
      });
    }
    if (emp.philhealthNumber) {
      recentTransactions.push({
        type: "PhilHealth",
        name,
        date: dateStr,
        amount: computePhilHealth(emp.salary),
        status: processedSet.has(`${emp.id}:PhilHealth`) ? "Processed" : "Pending",
        employeeId: emp.id,
      });
    }
    if (emp.pagibigNumber) {
      recentTransactions.push({
        type: "PAG-IBIG",
        name,
        date: dateStr,
        amount: computePagibig(emp.salary),
        status: processedSet.has(`${emp.id}:PAG-IBIG`) ? "Processed" : "Pending",
        employeeId: emp.id,
      });
    }
    if (recentTransactions.length >= 6) break;
  }

  const notEnrolledSss = employees
    .filter((e) => !e.sssNumber || e.sssNumber.trim() === "")
    .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const notEnrolledPhilhealth = employees
    .filter((e) => !e.philhealthNumber || e.philhealthNumber.trim() === "")
    .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const notEnrolledPagibig = employees
    .filter((e) => !e.pagibigNumber || e.pagibigNumber.trim() === "")
    .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const allEmployees = employees as EmployeeData[];

  return {
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
  };
}

const emptyData = {
  totalEmployees: 0,
  activeEmployees: 0,
  sssEnrolled: 0,
  philhealthEnrolled: 0,
  pagibigEnrolled: 0,
  sssMonthlyTotal: 0,
  philhealthMonthlyTotal: 0,
  pagibigMonthlyTotal: 0,
  recentTransactions: [] as Transaction[],
  notEnrolledSss: [] as { id: string; name: string }[],
  notEnrolledPhilhealth: [] as { id: string; name: string }[],
  notEnrolledPagibig: [] as { id: string; name: string }[],
  allEmployees: [] as EmployeeData[],
};

export default async function BenefitsPage() {
  let data: typeof emptyData;

  try {
    data = await getBenefitsData();
  } catch (error) {
    console.error("Benefits page DB error:", error);
    data = emptyData;
  }

  return <BenefitsClient {...data} />;
}
