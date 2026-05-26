import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    /* SQL: Check employee exists before updating */
    const existsRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Employee
      WHERE id = ${id}
      LIMIT 1
    `

    if (!existsRows || existsRows.length === 0) {
      return Response.json(
        { message: 'Employee not found' },
        { status: 404 }
      )
    }

    /* SQL: Update employee profile fields */
    await prisma.$executeRaw`
      UPDATE Employee SET
        firstName        = COALESCE(${data.firstName ?? null}, firstName),
        lastName         = COALESCE(${data.lastName ?? null}, lastName),
        email            = COALESCE(${data.email ?? null}, email),
        phone            = COALESCE(${data.phone ?? null}, phone),
        address          = COALESCE(${data.address ?? null}, address),
        department       = COALESCE(${data.department ?? null}, department),
        role             = COALESCE(${data.role ?? null}, role),
        status           = COALESCE(${data.status ?? null}, status),
        salary           = COALESCE(${data.salary !== undefined ? (data.salary ? parseFloat(data.salary) : null) : null}, salary),
        sssNumber        = COALESCE(${data.sssNumber ?? null}, sssNumber),
        philhealthNumber = COALESCE(${data.philhealthNumber ?? null}, philhealthNumber),
        pagibigNumber    = COALESCE(${data.pagibigNumber ?? null}, pagibigNumber),
        tinNumber        = COALESCE(${data.tinNumber ?? null}, tinNumber),
        profileImage     = COALESCE(${data.profileImage ?? null}, profileImage),
        dateOfBirth      = COALESCE(${data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null}, dateOfBirth),
        hireDate         = COALESCE(${data.hireDate ? new Date(data.hireDate).toISOString() : null}, hireDate),
        updatedAt        = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    /* SQL: Return the updated employee record */
    const updatedRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      address: string | null; department: string;
      role: string; status: string; salary: number | null;
      hireDate: Date; employeeId: string | null;
      dateOfBirth: Date | null; tinNumber: string | null;
      sssNumber: string | null;
      philhealthNumber: string | null;
      pagibigNumber: string | null;
      employmentType: string | null;
      profileImage: string | null;
      createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Employee
      WHERE id = ${id}
      LIMIT 1
    `
    const updated = updatedRows[0]

    return NextResponse.json(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred";
    console.error("PATCH Employee Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
