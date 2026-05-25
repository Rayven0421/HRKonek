import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EmployeeDetailClient from '@/components/EmployeeDetailClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
  });
  if (!employee) notFound();

  const records = await prisma.contributionRecord.findMany({
    where: { employeeId: id },
    select: { month: true, year: true, type: true },
  });

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
