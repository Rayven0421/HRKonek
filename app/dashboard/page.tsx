import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const totalEmployees = await prisma.employee.count();

  const pendingTasks = await prisma.applicant.count({
    where: { status: "Applied" }
  });

  const recentEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const allEmployees = await prisma.employee.findMany({
    select: {
      id: true, firstName: true, lastName: true,
      department: true, role: true, status: true,
      createdAt: true, salary: true
    },
    orderBy: { createdAt: 'asc' },
  });

  const allApplicants = await prisma.applicant.findMany({
    select: {
      id: true, firstName: true, lastName: true,
      position: true, status: true, appliedAt: true
    },
    orderBy: { appliedAt: 'desc' },
  });

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
