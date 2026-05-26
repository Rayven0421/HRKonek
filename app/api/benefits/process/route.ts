import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, year, benefits, totals } = body;

    if (!month || !year) {
      return NextResponse.json(
        { message: "Month and year are required" },
        { status: 400 }
      );
    }
    if (!benefits?.sss && !benefits?.philhealth && !benefits?.pagibig) {
      return NextResponse.json(
        { message: "Select at least one benefit" },
        { status: 400 }
      );
    }

    /* SQL: Get all active employees with gov benefit IDs */
    const activeEmployees = await prisma.$queryRaw<Array<{
      id: string;
      sssNumber: string | null;
      philhealthNumber: string | null;
      pagibigNumber: string | null;
    }>>`
      SELECT id, sssNumber, philhealthNumber, pagibigNumber
      FROM Employee
      WHERE status = 'Active'
    `

    /* SQL: Check for duplicate — same month/year already processed */
    const duplicateCheck = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM ContributionRecord
      WHERE month = ${month}
      AND   year  = ${year}
    `

    if (Number(duplicateCheck[0].count) > 0) {
      return NextResponse.json({
        message: `Contributions for ${month} ${year} have already been processed.`
      }, { status: 409 })
    }

    /* SQL: Bulk insert contribution records for all active enrolled employees */
    let recordsCreated = 0
    for (const emp of activeEmployees) {
      if (benefits.sss && emp.sssNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'SSS', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
      if (benefits.philhealth && emp.philhealthNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'PhilHealth', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
      if (benefits.pagibig && emp.pagibigNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'PAG-IBIG', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Contributions processed for ${month} ${year}`,
      processed: {
        sss: benefits.sss ? totals?.sss : null,
        philhealth: benefits.philhealth ? totals?.philhealth : null,
        pagibig: benefits.pagibig ? totals?.pagibig : null,
      },
      recordsCreated,
    });
  } catch (err) {
    console.error("Process contributions error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
