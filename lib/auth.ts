import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes, randomUUID } from 'crypto'

export const SESSION_COOKIE = 'hrkonek_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function joinCookie(value: string, maxAgeSeconds?: number) {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
  ]
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }
  if (maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${maxAgeSeconds}`)
  }
  return parts.join('; ')
}

export async function createSession(userId: string, rememberMe = false) {
  const token = generateToken()
  const maxAge = rememberMe ? REMEMBER_MAX_AGE : SESSION_MAX_AGE

  await prisma.$executeRaw`
    INSERT INTO AdminSession (id, userId, token, expiresAt, createdAt)
    VALUES (${randomUUID()}, ${userId}, ${token},
            ${new Date(Date.now() + maxAge).toISOString()},
            ${new Date().toISOString()})
  `

  return { token, maxAge: rememberMe ? REMEMBER_MAX_AGE / 1000 : undefined }
}

export function setSessionCookie(token: string, maxAgeSeconds?: number) {
  return joinCookie(token, maxAgeSeconds)
}

export function clearSessionCookie() {
  return joinCookie('', 0)
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await prisma.$queryRaw<Array<{
    id: string
    userId: string
    token: string
    expiresAt: string
    email: string
    username: string
    name: string
    role: string
  }>>`
    SELECT s.id, s.userId, s.token, s.expiresAt,
           u.email, u.username, u.name, u.role
    FROM AdminSession s
    JOIN AdminUser u ON u.id = s.userId
    WHERE s.token = ${token}
    LIMIT 1
  `

  if (!rows || rows.length === 0) return null

  const session = rows[0]
  if (new Date(session.expiresAt) < new Date()) {
    await prisma.$executeRaw`DELETE FROM AdminSession WHERE id = ${session.id}`
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    username: session.username,
    name: session.name,
    role: session.role,
  }
}

export async function requireAuth() {
  const user = await getCurrentSession()
  if (!user) {
    redirect('/')
  }
  return user
}

export async function requireApiAuth() {
  const user = await getCurrentSession()
  if (!user) {
    return null
  }
  return user
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.$executeRaw`DELETE FROM AdminSession WHERE token = ${token}`
  }
}
