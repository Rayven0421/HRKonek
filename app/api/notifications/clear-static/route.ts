import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/auth'

export async function GET() {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.$executeRaw`
      DELETE FROM Notification
      WHERE type = 'pending_review'
      AND message = 'You have applicants awaiting review.'`

    await prisma.$executeRaw`
      DELETE FROM Notification
      WHERE type = 'new_employee'
      AND message = 'HRKonek is set up and ready to use.'`

    return Response.json({
      success: true,
      message: 'Static notifications cleared.'
    })
  } catch (error) {
    return Response.json(
      { message: 'Failed', error: String(error) },
      { status: 500 }
    )
  }
}
