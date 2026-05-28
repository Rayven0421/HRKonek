import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeDate, getFriendlyError } from '@/lib/sanitize'
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

    const effectiveDate = sanitizeDate(body.effectiveDate)
    if (!effectiveDate) {
      return Response.json({ message: 'Effective date is required' }, { status: 400 })
    }

    const benefits = body.benefits as Record<string, boolean> | undefined
    if (!benefits || (!benefits.sss && !benefits.philhealth && !benefits.pagibig)) {
      return Response.json({ message: 'Select at least one benefit' }, { status: 400 })
    }

    const employees = await prisma.$queryRaw<Array<{
      id: string; sssNumber: string | null;
      philhealthNumber: string | null; pagibigNumber: string | null;
    }>>`
      SELECT id, sssNumber, philhealthNumber, pagibigNumber
      FROM Employee
    `

    const scope = sanitizeString(body.scope)
    let targets = employees
    if (scope === 'new') {
      targets = employees.filter(
        (e) =>
          (benefits.sss && !e.sssNumber) ||
          (benefits.philhealth && !e.philhealthNumber) ||
          (benefits.pagibig && !e.pagibigNumber)
      )
    }

    if (targets.length === 0) {
      return Response.json({ message: 'No employees need enrollment', enrolled: 0 }, { status: 200 })
    }

    let enrolled = 0
    for (const emp of targets) {
      if (benefits.sss && !emp.sssNumber) {
        const sssVal = `SSS-PENDING-${emp.id.slice(0, 6).toUpperCase()}`
        await prisma.$executeRaw`
          UPDATE Employee
          SET sssNumber = ${sssVal}, updatedAt = ${new Date().toISOString()}
          WHERE id = ${emp.id}
        `
        enrolled++
      }
      if (benefits.philhealth && !emp.philhealthNumber) {
        const phVal = `PH-PENDING-${emp.id.slice(0, 6).toUpperCase()}`
        await prisma.$executeRaw`
          UPDATE Employee
          SET philhealthNumber = ${phVal}, updatedAt = ${new Date().toISOString()}
          WHERE id = ${emp.id}
        `
        enrolled++
      }
      if (benefits.pagibig && !emp.pagibigNumber) {
        const piVal = `PI-PENDING-${emp.id.slice(0, 6).toUpperCase()}`
        await prisma.$executeRaw`
          UPDATE Employee
          SET pagibigNumber = ${piVal}, updatedAt = ${new Date().toISOString()}
          WHERE id = ${emp.id}
        `
        enrolled++
      }
    }

    return Response.json({ success: true, enrolled, message: `${enrolled} employees enrolled` })
  } catch (error) {
    console.error('Bulk enrollment error:', error)
    const { message } = getFriendlyError(error)
    return Response.json({ message }, { status: 500 })
  }
}
