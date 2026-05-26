import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import DashboardClient from "@/components/DashboardClient";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  /* SQL: Count all employees */
  const totalEmployeesResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Employee
  `
  const totalEmployees = Number(totalEmployeesResult[0].count)

  /* SQL: Count applicants with Applied status */
  const pendingTasksResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Applicant
    WHERE status = 'Applied'
  `
  const pendingTasks = Number(pendingTasksResult[0].count)

  /* SQL: Get 5 most recently added employees */
  const recentEmployees = await prisma.$queryRaw<Array<{
    id: string; firstName: string; lastName: string;
    email: string; phone: string | null;
    department: string; role: string; status: string;
    createdAt: Date;
  }>>`
    SELECT id, firstName, lastName, email, phone,
           department, role, status, createdAt
    FROM Employee
    ORDER BY createdAt DESC
    LIMIT 5
  `

  /* SQL: Get all employees ordered by creation date */
  const allEmployees = await prisma.$queryRaw<Array<{
    id: string; firstName: string; lastName: string;
    department: string; role: string; status: string;
    createdAt: Date; salary: number | null;
  }>>`
    SELECT id, firstName, lastName, department,
           role, status, createdAt, salary
    FROM Employee
    ORDER BY createdAt ASC
  `

  /* SQL: Get all applicants ordered by application date */
  const allApplicants = await prisma.$queryRaw<Array<{
    id: string; firstName: string; lastName: string;
    position: string; status: string; appliedAt: Date;
  }>>`
    SELECT id, firstName, lastName,
           position, status, appliedAt
    FROM Applicant
    ORDER BY appliedAt DESC
  `

  return (
    <DashboardClient
      totalEmployees={totalEmployees}
      pendingTasks={pendingTasks}
      recentEmployees={JSON.parse(JSON.stringify(recentEmployees))}
      allEmployees={JSON.parse(JSON.stringify(allEmployees))}
      allApplicants={JSON.parse(JSON.stringify(allApplicants))}
    />
  );
}
