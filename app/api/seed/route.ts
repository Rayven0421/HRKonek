import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export async function GET() {
  try {
    function hashPassword(p: string) {
      return createHash('sha256')
        .update(p + 'hrkonek_salt_2026')
        .digest('hex')
    }

    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM AdminUser WHERE username = 'admin' LIMIT 1`

    if (existing.length > 0) {
      return Response.json({
        message: 'Admin already exists.',
        credentials: {
          username: 'admin',
          email: 'admin@hrkonek.com',
          password: '123'
        }
      })
    }

    const id = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO AdminUser (
        id, email, username, passwordHash,
        name, role, createdAt, updatedAt
      ) VALUES (
        ${id}, ${'admin@hrkonek.com'}, ${'admin'},
        ${hashPassword('123')}, ${'Admin User'},
        ${'admin'}, ${new Date().toISOString()},
        ${new Date().toISOString()}
      )`

    return Response.json({
      success: true,
      message: 'Admin created successfully.',
      credentials: {
        username: 'admin',
        email: 'admin@hrkonek.com',
        password: '123'
      }
    })

  } catch (error) {
    return Response.json(
      { message: 'Seed failed', error: String(error) },
      { status: 500 }
    )
  }
}
