import { prisma } from "@/lib/prisma";
import { sanitizeMonth, sanitizeYear, getFriendlyError } from '@/lib/sanitize'
import { requireApiAuth } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const month = sanitizeMonth(body.month)
    if (!month) {
      return Response.json({ message: 'A valid month is required (e.g. January, February)' }, { status: 400 })
    }

    const year = sanitizeYear(body.year)
    if (!year) {
      return Response.json({ message: 'A valid 4-digit year is required' }, { status: 400 })
    }

    const benefits = body.benefits as Record<string, boolean> | undefined
    if (!benefits?.sss && !benefits?.philhealth && !benefits?.pagibig) {
      return Response.json({ message: 'Select at least one benefit' }, { status: 400 })
    }

    const activeEmployees = await prisma.$queryRaw<Array<{
      id: string; sssNumber: string | null;
      philhealthNumber: string | null; pagibigNumber: string | null;
    }>>`
      SELECT id, sssNumber, philhealthNumber, pagibigNumber
      FROM Employee WHERE status = 'Active' AND isArchived = 0
    `

    const duplicateCheck = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM ContributionRecord
      WHERE month = ${month} AND year = ${year}
    `
    if (Number(duplicateCheck[0].count) > 0) {
      return Response.json({
        message: `Contributions for ${month} ${year} have already been processed.`
      }, { status: 409 })
    }

    let recordsCreated = 0
    for (const emp of activeEmployees) {
      if (benefits.sss && emp.sssNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'SSS', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
      if (benefits.philhealth && emp.philhealthNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'PhilHealth', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
      if (benefits.pagibig && emp.pagibigNumber) {
        await prisma.$executeRaw`
          INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
          VALUES (${crypto.randomUUID()}, ${emp.id}, 'PAG-IBIG', ${month}, ${year}, ${new Date().toISOString()})
        `
        recordsCreated++
      }
    }

    return Response.json({
      success: true,
      message: `Contributions processed for ${month} ${year}`,
      recordsCreated,
    })
  } catch (error) {
    console.error('Process contributions error:', error)
    const { message } = getFriendlyError(error)
    return Response.json({ message }, { status: 500 })
  }
}
