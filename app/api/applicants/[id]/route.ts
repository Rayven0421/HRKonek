import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status: newStatus } = await request.json();

  try {
    /* SQL: Check applicant exists before status update */
    const existsRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Applicant
      WHERE id = ${id}
      LIMIT 1
    `

    if (!existsRows || existsRows.length === 0) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    /* SQL: Update applicant review status */
    await prisma.$executeRaw`
      UPDATE Applicant
      SET status    = ${newStatus},
          updatedAt = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    /* SQL: Return updated applicant record */
    const updatedRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null;
      address: string | null; position: string;
      expectedSalary: string | null;
      yearsOfExperience: string | null;
      sssNumber: string | null; pagibigNumber: string | null;
      philhealthNumber: string | null; tinNumber: string | null;
      resumeUrl: string | null; coverLetterUrl: string | null;
      otherDocsUrl: string | null; status: string;
      convertedEmployeeId: string | null;
      appliedAt: Date; createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Applicant
      WHERE id = ${id}
      LIMIT 1
    `
    const updatedApplicant = updatedRows[0]

    return NextResponse.json(updatedApplicant);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 });
  }
}
