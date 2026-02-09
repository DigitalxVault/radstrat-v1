import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/api-proxy'

const API_BASE = process.env.API_URL!

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('radstrat_access')?.value
  const refreshToken = cookieStore.get('radstrat_refresh')?.value

  if (refreshToken && accessToken) {
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // Best effort - clear cookies regardless
    })
  }

  const response = NextResponse.json({ success: true })
  clearAuthCookies(response)

  return response
}
