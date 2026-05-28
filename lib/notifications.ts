import { prisma } from '@/lib/prisma'

export async function createNotification({
  type, title, message, link
}: {
  type: string
  title: string
  message: string
  link?: string
}) {
  try {
    const id = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO Notification (
        id, type, title, message, isRead, 
        link, createdAt
      ) VALUES (
        ${id}, ${type}, ${title}, ${message},
        ${false}, ${link ?? null},
        ${new Date().toISOString()}
      )`
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
