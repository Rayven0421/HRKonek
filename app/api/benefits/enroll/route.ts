import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { benefits, scope, effectiveDate } = body;

    if (!effectiveDate) {
      return NextResponse.json(
        { message: "Effective date is required" },
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
    });

    let targets = employees;
    if (scope === "new") {
      targets = employees.filter(
        (e) =>
          (benefits?.sss && !e.sssNumber) ||
          (benefits?.philhealth && !e.philhealthNumber) ||
          (benefits?.pagibig && !e.pagibigNumber)
      );
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { message: "No employees need enrollment", enrolled: 0 },
        { status: 200 }
      );
    }

    let enrolled = 0;
    for (const emp of targets) {
      const updateData: Record<string, string> = {};

      if (benefits?.sss && !emp.sssNumber)
        updateData.sssNumber = `SSS-PENDING-${emp.id.slice(0, 6).toUpperCase()}`;
      if (benefits?.philhealth && !emp.philhealthNumber)
        updateData.philhealthNumber = `PH-PENDING-${emp.id.slice(0, 6).toUpperCase()}`;
      if (benefits?.pagibig && !emp.pagibigNumber)
        updateData.pagibigNumber = `PI-PENDING-${emp.id.slice(0, 6).toUpperCase()}`;

      if (Object.keys(updateData).length > 0) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: updateData,
        });
        enrolled++;
      }
    }

    return NextResponse.json({
      success: true,
      enrolled,
      message: `${enrolled} employees enrolled`,
    });
  } catch (err) {
    console.error("Bulk enrollment error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
