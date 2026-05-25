import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { applicantId, employeeData } = await request.json();

  try {
    const employee = await prisma.employee.create({
      data: {
        firstName:        employeeData.firstName,
        lastName:         employeeData.lastName,
        email:            employeeData.email,
        phone:            employeeData.phone || null,
        role:             employeeData.position,
        department:       employeeData.department,
        status:           'Active',
        hireDate:         new Date(employeeData.startDate),
        salary:           employeeData.salary ? parseFloat(employeeData.salary) : null,
        sssNumber:        employeeData.sssNumber || null,
        philhealthNumber: employeeData.philhealthNumber || null,
        pagibigNumber:    employeeData.pagibigNumber || null,
        tinNumber:        employeeData.tinNumber || null,
        employmentType:   employeeData.employmentType || 'Regular',
      },
    });

    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        status: 'Hired',
        convertedEmployeeId: employee.id,
      },
    });

    return NextResponse.json({
      success: true,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to convert applicant',
    }, { status: 500 });
  }
}
