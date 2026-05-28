import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
