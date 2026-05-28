import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/auth'

export async function PATCH() {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.$executeRaw`
      UPDATE Notification SET isRead = true`
    return Response.json({ success: true })
  } catch (_error) {
    return Response.json(
      { message: 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
