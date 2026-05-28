import { getCurrentSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentSession()
    if (!user) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 })
    }
    return Response.json({ user })
  } catch (error) {
    console.error('Auth me error:', error)
    return Response.json({ message: 'Failed to get session' }, { status: 500 })
  }
}
