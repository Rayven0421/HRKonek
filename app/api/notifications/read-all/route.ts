import { prisma } from '@/lib/prisma'

export async function PATCH() {
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
