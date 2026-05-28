import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/sanitize'
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
      body = {}
    }

    const reason = sanitizeString(body.reason) ?? 'Rejected'
    const note = sanitizeString(body.note)

    const existing = await prisma.$queryRaw<{
      id: string; firstName: string; lastName: string;
      applicantId: string | null; isArchived: boolean; status: string;
    }[]>`
      SELECT id, firstName, lastName, applicantId, isArchived, status
      FROM Applicant
      WHERE id = ${id}
      LIMIT 1`

    if (!existing || existing.length === 0) {
      return Response.json({ message: 'Applicant not found' }, { status: 404 })
    }

    if (existing[0].isArchived) {
      return Response.json({ message: 'Applicant is already archived' }, { status: 409 })
    }

    const app = existing[0]
    const now = new Date().toISOString()

    await prisma.$executeRaw`
      UPDATE Applicant SET
        status        = 'Rejected',
        isArchived    = 1,
        archivedAt    = ${now},
        archiveReason = ${reason},
        archiveNote   = ${note ?? null},
        updatedAt     = ${now}
      WHERE id = ${id}`

    return Response.json({
      success: true,
      message: `${app.firstName} ${app.lastName} has been archived.`,
      applicantId: app.applicantId
    })

  } catch (error) {
    console.error('Archive applicant error:', error)
    return Response.json({ message: 'Failed to archive applicant.' }, { status: 500 })
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
      applicantId: string | null; isArchived: boolean;
    }[]>`
      SELECT id, firstName, lastName, applicantId, isArchived
      FROM Applicant
      WHERE id = ${id}
      LIMIT 1`

    if (!existing || existing.length === 0) {
      return Response.json({ message: 'Applicant not found' }, { status: 404 })
    }

    if (!existing[0].isArchived) {
      return Response.json({ message: 'Applicant is not archived' }, { status: 409 })
    }

    const app = existing[0]
    const now = new Date().toISOString()

    await prisma.$executeRaw`
      UPDATE Applicant SET
        status        = 'Applied',
        isArchived    = 0,
        archivedAt    = NULL,
        archiveReason = NULL,
        archiveNote   = NULL,
        updatedAt     = ${now}
      WHERE id = ${id}`

    return Response.json({
      success: true,
      message: `${app.firstName} ${app.lastName} restored to active applicants.`,
      applicantId: app.applicantId
    })

  } catch (error) {
    console.error('Restore applicant error:', error)
    return Response.json({ message: 'Failed to restore applicant.' }, { status: 500 })
  }
}
