import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from '@/lib/auth'

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

export async function GET(request: NextRequest) {
  const user = await requireApiAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const employees = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      salary: number | null;
      sssNumber: string | null;
      philhealthNumber: string | null;
      pagibigNumber: string | null;
      hireDate: Date | null; createdAt: Date;
    }>>`
      SELECT id, firstName, lastName, salary,
             sssNumber, philhealthNumber, pagibigNumber,
             hireDate, createdAt
      FROM Employee
      ORDER BY hireDate DESC, createdAt DESC
    `

    const employeeIds = employees.map((e) => e.id);
    const processedRecords = employeeIds.length > 0
      ? await prisma.$queryRaw<Array<{ employeeId: string; type: string }>>`
          SELECT employeeId, type FROM ContributionRecord
          WHERE employeeId IN (${Prisma.join(employeeIds)})
        `
      : []
    const processedSet = new Set(
      processedRecords.map((r) => `${r.employeeId}:${r.type}`)
    );

    type Transaction = {
      type: "SSS" | "PhilHealth" | "PAG-IBIG";
      name: string;
      date: string;
      amount: number;
      status: "Processed" | "Pending";
      employeeId: string;
    };

    const allTransactions: Transaction[] = [];
    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`;
      const dateStr = new Date(emp.hireDate ?? emp.createdAt).toLocaleDateString(
        "en-PH",
        { month: "short", day: "numeric", year: "numeric" }
      );

      if (emp.sssNumber) {
        allTransactions.push({
          type: "SSS",
          name,
          date: dateStr,
          amount: computeSSS(emp.salary),
          status: processedSet.has(`${emp.id}:SSS`) ? "Processed" : "Pending",
          employeeId: emp.id,
        });
      }
      if (emp.philhealthNumber) {
        allTransactions.push({
          type: "PhilHealth",
          name,
          date: dateStr,
          amount: computePhilHealth(emp.salary),
          status: processedSet.has(`${emp.id}:PhilHealth`) ? "Processed" : "Pending",
          employeeId: emp.id,
        });
      }
      if (emp.pagibigNumber) {
        allTransactions.push({
          type: "PAG-IBIG",
          name,
          date: dateStr,
          amount: computePagibig(emp.salary),
          status: processedSet.has(`${emp.id}:PAG-IBIG`) ? "Processed" : "Pending",
          employeeId: emp.id,
        });
      }
    }

    const total = allTransactions.length;
    const paginated = allTransactions.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      transactions: paginated,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("Benefits transactions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
