import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

const PUBLIC_PATHS = ['/api/auth/', '/api/auth/sign-in', '/api/auth/sign-up', '/api/auth/sign-out']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public auth routes
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow non-API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check session using BetterAuth
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.user.id)
  requestHeaders.set('x-user-email', session.user.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/api/:path*'],
}
