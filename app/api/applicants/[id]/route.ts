import { prisma } from '@/lib/prisma';
import { sanitizeApplicantStatus, getFriendlyError } from '@/lib/sanitize'
import { createNotification } from '@/lib/notifications'
import { requireApiAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const url = new URL(request.url)
    const archived = url.searchParams.get('archived') === '1'

    const applicants = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      position: string; status: string;
      applicantId: string | null;
      archivedAt: Date | null;
    }>>`
      SELECT id, firstName, lastName, position, status,
             applicantId, archivedAt
      FROM Applicant
      WHERE isArchived = ${archived ? 1 : 0}
      ORDER BY archivedAt DESC, createdAt DESC
    `

    return Response.json(applicants)
  } catch (error) {
    console.error('Get applicants error:', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const newStatus = sanitizeApplicantStatus(body.status)
    if (!newStatus) {
      return Response.json(
        { message: 'Invalid status value. Allowed values: Applied, Under Review, Interview Scheduled, Pending Review, Hired, Rejected' },
        { status: 400 }
      )
    }

    const existsRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Applicant WHERE id = ${id} LIMIT 1
    `
    if (!existsRows || existsRows.length === 0) {
      return Response.json({ error: 'Applicant not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      UPDATE Applicant
      SET status = ${newStatus}, updatedAt = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    const updatedRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null;
      address: string | null; position: string;
      expectedSalary: string | null;
      yearsOfExperience: string | null;
      sssNumber: string | null; pagibigNumber: string | null;
      philhealthNumber: string | null; tinNumber: string | null;
      resumeUrl: string | null; coverLetterUrl: string | null;
      otherDocsUrl: string | null; status: string;
      convertedEmployeeId: string | null;
      appliedAt: Date; createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Applicant WHERE id = ${id} LIMIT 1
    `
    const updatedApplicant = updatedRows[0]

    if (newStatus === 'Hired') {
      await createNotification({
        type: 'status_changed',
        title: 'Applicant Hired',
        message: `${updatedApplicant.firstName} ${updatedApplicant.lastName} has been marked as Hired.`,
        link: '/applicants'
      })
    }
    if (newStatus === 'Interview Scheduled') {
      await createNotification({
        type: 'status_changed',
        title: 'Interview Scheduled',
        message: `An interview has been scheduled for ${updatedApplicant.firstName} ${updatedApplicant.lastName}.`,
        link: '/applicants'
      })
    }

    return Response.json(updatedApplicant)
  } catch (error) {
    console.error('PATCH Applicant Error:', error)
    const { message, status } = getFriendlyError(error)
    return Response.json({ error: message }, { status })
  }
}
