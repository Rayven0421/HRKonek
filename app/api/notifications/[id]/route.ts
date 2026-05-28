import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/auth'

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
    await prisma.$executeRaw`
      UPDATE Notification
      SET isRead = true
      WHERE id = ${id}`
    return Response.json({ success: true })
  } catch (_error) {
    return Response.json(
      { message: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
