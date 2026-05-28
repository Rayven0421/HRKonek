import { prisma } from "@/lib/prisma";
import { sanitizeString } from '@/lib/sanitize'
import { createNotification } from '@/lib/notifications'
import { requireApiAuth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params

    let body: { reason?: string; note?: string }
    try {
      body = await request.json()
    } catch {
      return Response.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const reason = sanitizeString(body.reason)
    const note = sanitizeString(body.note)

    const allowedReasons = ['Fired', 'Resigned', 'Contract Ended', 'Other']
    if (!reason || !allowedReasons.includes(reason)) {
      return Response.json(
        { message: 'Valid reason is required: ' + allowedReasons.join(', ') },
        { status: 400 }
      )
    }

    const existing = await prisma.$queryRaw<{
      id: string; firstName: string; lastName: string;
      employeeId: string | null; isArchived: boolean;
      sssNumber: string | null; philhealthNumber: string | null;
      pagibigNumber: string | null;
    }[]>`
      SELECT id, firstName, lastName, employeeId,
             isArchived, sssNumber, philhealthNumber, pagibigNumber
      FROM Employee
      WHERE id = ${id}
      LIMIT 1`

    if (!existing || existing.length === 0) {
      return Response.json({ message: 'Employee not found' }, { status: 404 })
    }

    if (existing[0].isArchived) {
      return Response.json({ message: 'Employee is already archived' }, { status: 409 })
    }

    const emp = existing[0]
    const now = new Date().toISOString()

    await prisma.$executeRaw`
      UPDATE Employee SET
        status        = ${reason},
        isArchived    = 1,
        archivedAt    = ${now},
        archiveReason = ${reason},
        archiveNote   = ${note ?? null},
        updatedAt     = ${now}
      WHERE id = ${id}`

    await createNotification({
      type: 'status_changed',
      title: `Employee ${reason}`,
      message: `${emp.firstName} ${emp.lastName} (${emp.employeeId ?? emp.id.slice(0, 6)}) has been ${reason.toLowerCase()}.`,
      link: '/employees/archive'
    })

    return Response.json({
      success: true,
      message: `${emp.firstName} ${emp.lastName} has been archived (${reason}).`,
      employeeId: emp.employeeId
    })

  } catch (error) {
    console.error('Archive employee error:', error)
    return Response.json({ message: 'Failed to archive employee. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params

    const existing = await prisma.$queryRaw<{
      id: string; firstName: string; lastName: string;
      employeeId: string | null; isArchived: boolean;
    }[]>`
      SELECT id, firstName, lastName, employeeId, isArchived
      FROM Employee
      WHERE id = ${id}
      LIMIT 1`

    if (!existing || existing.length === 0) {
      return Response.json({ message: 'Employee not found' }, { status: 404 })
    }

    if (!existing[0].isArchived) {
      return Response.json({ message: 'Employee is not archived' }, { status: 409 })
    }

    const emp = existing[0]
    const now = new Date().toISOString()

    await prisma.$executeRaw`
      UPDATE Employee SET
        status        = 'Active',
        isArchived    = 0,
        archivedAt    = NULL,
        archiveReason = NULL,
        archiveNote   = NULL,
        updatedAt     = ${now}
      WHERE id = ${id}`

    await createNotification({
      type: 'new_employee',
      title: 'Employee Restored',
      message: `${emp.firstName} ${emp.lastName} (${emp.employeeId}) has been restored to Active status.`,
      link: `/employees/${emp.id}`
    })

    return Response.json({
      success: true,
      message: `${emp.firstName} ${emp.lastName} has been restored successfully.`,
      employeeId: emp.employeeId
    })

  } catch (error) {
    console.error('Restore employee error:', error)
    return Response.json({ message: 'Failed to restore employee.' }, { status: 500 })
  }
}
