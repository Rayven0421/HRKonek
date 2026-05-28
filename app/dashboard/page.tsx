import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let totalEmployees = 0
  let pendingTasks = 0
  let recentEmployees: Array<Record<string, unknown>> = []
  let allEmployees: Array<Record<string, unknown>> = []
  let allApplicants: Array<Record<string, unknown>> = []
  let activeBenefits = 0
  let benefitsTrend: number | null = null
  let pageError: string | null = null

  try {
    const totalEmployeesResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Employee
    `
    totalEmployees = Number(totalEmployeesResult[0].count)

    const pendingTasksResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Applicant WHERE status = 'Applied'
    `
    pendingTasks = Number(pendingTasksResult[0].count)

    recentEmployees = await prisma.$queryRaw`
      SELECT id, firstName, lastName, email, phone,
             department, role, status, createdAt
      FROM Employee
      ORDER BY createdAt DESC LIMIT 5
    `

    allEmployees = await prisma.$queryRaw`
      SELECT id, firstName, lastName, department,
             role, status, createdAt, salary
      FROM Employee
      ORDER BY createdAt ASC
    `

    allApplicants = await prisma.$queryRaw`
      SELECT id, firstName, lastName,
             position, status, appliedAt
      FROM Applicant
      ORDER BY appliedAt DESC
    `

    try {
      const activeBenefitsResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM Employee
        WHERE status = 'Active'
        AND (
          (sssNumber IS NOT NULL AND sssNumber != '') OR
          (philhealthNumber IS NOT NULL AND philhealthNumber != '') OR
          (pagibigNumber IS NOT NULL AND pagibigNumber != '')
        )
      `
      activeBenefits = Number(activeBenefitsResult[0].count)

      const thisMonthStart = new Date()
      thisMonthStart.setDate(1)
      thisMonthStart.setHours(0, 0, 0, 0)

      const lastMonthBenefitsResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM Employee
        WHERE status = 'Active'
        AND hireDate < ${thisMonthStart.toISOString()}
        AND (
          (sssNumber IS NOT NULL AND sssNumber != '') OR
          (philhealthNumber IS NOT NULL AND philhealthNumber != '') OR
          (pagibigNumber IS NOT NULL AND pagibigNumber != '')
        )
      `
      const lastMonthBenefits = Number(lastMonthBenefitsResult[0].count)
      benefitsTrend = lastMonthBenefits === 0 ? null : Math.round(((activeBenefits - lastMonthBenefits) / lastMonthBenefits) * 100)
    } catch (error) {
      console.error('Benefits count error:', error)
    }
  } catch (error) {
    console.error('Dashboard page query error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('invalid characters') || msg.includes('Conversion failed')) {
      pageError = 'Some records contain invalid data. Please contact your administrator.'
    } else {
      pageError = 'Unable to load dashboard data. Please refresh the page.'
    }
  }

  return (
    <DashboardClient
      totalEmployees={totalEmployees}
      pendingTasks={pendingTasks}
      recentEmployees={JSON.parse(JSON.stringify(recentEmployees)) as any}
      allEmployees={JSON.parse(JSON.stringify(allEmployees)) as any}
      allApplicants={JSON.parse(JSON.stringify(allApplicants)) as any}
      activeBenefits={activeBenefits}
      benefitsTrend={benefitsTrend}
      pageError={pageError}
    />
  );
}
