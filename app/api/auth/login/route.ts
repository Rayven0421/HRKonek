import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + 'hrkonek_salt_2026')
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    let body: {
      email?: string
      username?: string
      password?: string
    }

    try {
      body = await request.json()
    } catch {
      return Response.json(
        { message: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, username, password } = body

    if (!password || password.trim() === '') {
      return Response.json(
        { message: 'Password is required' },
        { status: 400 }
      )
    }

    if (!email && !username) {
      return Response.json(
        { message: 'Email or username is required' },
        { status: 400 }
      )
    }

    let adminRows: {
      id: string
      email: string
      username: string
      passwordHash: string
      name: string
      role: string
    }[] = []

    if (email) {
      adminRows = await prisma.$queryRaw`
        SELECT id, email, username, passwordHash,
               name, role
        FROM AdminUser
        WHERE email = ${email.toLowerCase().trim()}
        LIMIT 1`
    } else if (username) {
      adminRows = await prisma.$queryRaw`
        SELECT id, email, username, passwordHash,
               name, role
        FROM AdminUser
        WHERE username = ${username.trim()}
        LIMIT 1`
    }

    if (!adminRows || adminRows.length === 0) {
      return Response.json(
        { message: 'Invalid credentials. Please check your email/username and password.' },
        { status: 401 }
      )
    }

    const admin = adminRows[0]
    const hashedInput = hashPassword(password)

    if (hashedInput !== admin.passwordHash) {
      return Response.json(
        { message: 'Invalid credentials. Please check your email/username and password.' },
        { status: 401 }
      )
    }

    return Response.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { message: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
