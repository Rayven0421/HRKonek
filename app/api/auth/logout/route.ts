import { destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    await destroySession()

    const response = Response.json({ success: true })
    response.headers.set('Set-Cookie', clearSessionCookie())

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json(
      { message: 'Logout failed. Please try again.' },
      { status: 500 }
    )
  }
}
