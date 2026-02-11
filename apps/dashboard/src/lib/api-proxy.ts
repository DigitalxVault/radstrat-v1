import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = process.env.API_URL!

const ACCESS_COOKIE_MAX_AGE = 55 * 60          // 55 minutes (access JWT is 1h)
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days (admin refresh JWT is 30d)

export async function apiProxy(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('radstrat_access')?.value
  const refreshToken = cookieStore.get('radstrat_refresh')?.value

  // No access token — try silent refresh before giving up
  if (!accessToken && refreshToken) {
    const refreshed = await tryRefresh(refreshToken)
    if (refreshed) {
      accessToken = refreshed.accessToken
      // Make the request with new token, then set cookies on response
      const res = await fetchApi(path, accessToken, init)
      const data = await res.json()
      const response = NextResponse.json(data, { status: res.status })
      setAuthCookies(response, refreshed.accessToken, refreshed.refreshToken)
      return response
    }
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Session expired' },
      { status: 401 },
    )
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No access token' },
      { status: 401 },
    )
  }

  const res = await fetchApi(path, accessToken, init)

  // If Fastify returns 401 and we have a refresh token, try refreshing
  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh(refreshToken)
    if (refreshed) {
      const retryRes = await fetchApi(path, refreshed.accessToken, init)
      const data = await retryRes.json()
      const response = NextResponse.json(data, { status: retryRes.status })
      setAuthCookies(response, refreshed.accessToken, refreshed.refreshToken)
      return response
    }
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

async function fetchApi(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<globalThis.Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })
}

async function tryRefresh(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (res.ok) {
      return res.json()
    }
  } catch {
    // Refresh failed
  }
  return null
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set('radstrat_access', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
  })

  response.cookies.set('radstrat_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  })
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('radstrat_access')
  response.cookies.delete('radstrat_refresh')
}
