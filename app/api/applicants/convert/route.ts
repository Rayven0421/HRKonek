import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client'

export async function POST(request: NextRequest) {
  const { applicantId, employeeData } = await request.json();

  try {
    const newEmployeeId = crypto.randomUUID()
    const displayId = `E${Date.now().toString().slice(-4)}`

    /* SQL: Insert converted applicant as new employee */
    await prisma.$executeRaw`
      INSERT INTO Employee (
        id, firstName, lastName, email, phone,
        role, department, status, hireDate, salary,
        sssNumber, philhealthNumber, pagibigNumber,
        tinNumber, employmentType, employeeId,
        createdAt, updatedAt
      ) VALUES (
        ${newEmployeeId},
        ${employeeData.firstName},
        ${employeeData.lastName},
        ${employeeData.email},
        ${employeeData.phone || null},
        ${employeeData.position},
        ${employeeData.department},
        'Active',
        ${new Date(employeeData.startDate).toISOString()},
        ${employeeData.salary ? parseFloat(employeeData.salary) : null},
        ${employeeData.sssNumber || null},
        ${employeeData.philhealthNumber || null},
        ${employeeData.pagibigNumber || null},
        ${employeeData.tinNumber || null},
        ${employeeData.employmentType || 'Regular'},
        ${displayId},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `

    /* SQL: Mark original applicant as Hired and link to created Employee record */
    await prisma.$executeRaw`
      UPDATE Applicant
      SET status              = 'Hired',
          convertedEmployeeId = ${newEmployeeId},
          updatedAt           = ${new Date().toISOString()}
      WHERE id = ${applicantId}
    `

    return NextResponse.json({
      success: true,
      employeeId: newEmployeeId,
      employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to convert applicant',
    }, { status: 500 });
  }
}
