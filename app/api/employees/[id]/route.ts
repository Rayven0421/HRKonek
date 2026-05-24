import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        ...(data.hireDate ? { hireDate: new Date(data.hireDate) } : {}),
        ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
        ...(data.salary !== undefined ? { salary: data.salary ? parseFloat(data.salary) : null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred";
    console.error("PATCH Employee Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
