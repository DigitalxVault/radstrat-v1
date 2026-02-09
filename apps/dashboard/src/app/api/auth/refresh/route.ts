import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { setAuthCookies, clearAuthCookies } from '@/lib/api-proxy'

const API_BASE = process.env.API_URL!

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('radstrat_refresh')?.value

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No refresh token' },
      { status: 401 },
    )
  }

  const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const data = await res.json()

  if (!res.ok) {
    const response = NextResponse.json(data, { status: res.status })
    clearAuthCookies(response)
    return response
  }

  const response = NextResponse.json({ success: true })
  setAuthCookies(response, data.accessToken, data.refreshToken)

  return response
}
