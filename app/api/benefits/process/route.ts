import { prisma } from "@/lib/prisma";
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

    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        sssNumber: true,
        philhealthNumber: true,
        pagibigNumber: true,
      },
      where: { status: "Active" },
    });

    const records: { employeeId: string; type: string; month: string; year: string }[] = [];

    for (const emp of employees) {
      if (benefits.sss && emp.sssNumber) {
        records.push({ employeeId: emp.id, type: "SSS", month, year });
      }
      if (benefits.philhealth && emp.philhealthNumber) {
        records.push({ employeeId: emp.id, type: "PhilHealth", month, year });
      }
      if (benefits.pagibig && emp.pagibigNumber) {
        records.push({ employeeId: emp.id, type: "PAG-IBIG", month, year });
      }
    }

    if (records.length > 0) {
      await prisma.contributionRecord.createMany({ data: records });
    }

    return NextResponse.json({
      success: true,
      message: `Contributions processed for ${month} ${year}`,
      processed: {
        sss: benefits.sss ? totals?.sss : null,
        philhealth: benefits.philhealth ? totals?.philhealth : null,
        pagibig: benefits.pagibig ? totals?.pagibig : null,
      },
      recordsCreated: records.length,
    });
  } catch (err) {
    console.error("Process contributions error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
