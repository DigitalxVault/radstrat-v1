import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = process.env.API_URL!

export async function apiProxy(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('radstrat_access')?.value

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No access token' },
      { status: 401 },
    )
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
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
    maxAge: 14 * 60, // 14 minutes (access token is 15m)
  })

  response.cookies.set('radstrat_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 6 * 24 * 60 * 60, // 6 days (refresh token is 7d)
  })
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('radstrat_access')
  response.cookies.delete('radstrat_refresh')
}
