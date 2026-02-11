import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_URL!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('radstrat_access')?.value
  const refreshToken = request.cookies.get('radstrat_refresh')?.value

  // Allow API routes and static assets through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Login page: redirect to dashboard if already authenticated
  if (pathname === '/login') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Protected routes: check authentication
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Access token expired but refresh token exists: try silent refresh
  if (!accessToken && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (refreshRes.ok) {
        const tokens = await refreshRes.json()
        const response = NextResponse.next()

        response.cookies.set('radstrat_access', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 55 * 60, // 55 minutes (access JWT is 1h)
        })
        response.cookies.set('radstrat_refresh', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 days (admin refresh JWT is 30d)
        })

        return response
      }
    } catch {
      // Refresh failed - redirect to login
    }

    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('radstrat_access')
    response.cookies.delete('radstrat_refresh')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
