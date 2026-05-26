import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client'
import { notFound } from 'next/navigation';
import EmployeeDetailClient from '@/components/EmployeeDetailClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* SQL: Find single employee by primary key */
  const employeeRows = await prisma.$queryRaw<Array<{
    id: string; firstName: string; lastName: string;
    email: string; phone: string | null;
    address: string | null; department: string;
    role: string; status: string; salary: number | null;
    hireDate: Date; sssNumber: string | null;
    philhealthNumber: string | null; pagibigNumber: string | null;
    tinNumber: string | null; employeeId: string | null;
    employmentType: string | null; profileImage: string | null;
    dateOfBirth: Date | null;
    createdAt: Date; updatedAt: Date;
  }>>`
    SELECT id, firstName, lastName, email, phone,
           address, department, role, status, salary,
           hireDate, sssNumber, philhealthNumber,
           pagibigNumber, tinNumber, employeeId,
           employmentType, profileImage, dateOfBirth,
           createdAt, updatedAt
    FROM Employee
    WHERE id = ${id}
    LIMIT 1
  `

  if (!employeeRows || employeeRows.length === 0) notFound()
  const employee = employeeRows[0]

  /* SQL: Get contribution history for specific employee */
  const records = await prisma.$queryRaw<Array<{
    month: string; year: string; type: string;
  }>>`
    SELECT month, year, type
    FROM ContributionRecord
    WHERE employeeId = ${id}
    ORDER BY year DESC, month DESC
  `

  const processedMonths = new Set(
    records.map((r) => `${r.month} ${r.year}`)
  );

  const serialized = {
    ...employee,
    hireDate: employee.hireDate.toISOString(),
    dateOfBirth: employee.dateOfBirth?.toISOString() ?? null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };

  return (
    <EmployeeDetailClient
      employee={serialized}
      processedMonths={Array.from(processedMonths)}
    />
  );
}
