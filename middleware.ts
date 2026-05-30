import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'hrkonek_session'

const publicPaths = new Set([
  '/',
  '/apply',
])

const STATIC_EXT = /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|eot|otf|mp4|webm|pdf)$/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow static files and Next.js internals
  if (pathname.startsWith('/_next/') || STATIC_EXT.test(pathname)) {
    return NextResponse.next()
  }

  // Don't block API routes — they handle auth themselves via getCurrentSession()
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (publicPaths.has(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)
  if (!session?.value) {
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
