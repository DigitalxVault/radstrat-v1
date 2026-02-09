import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookies } from '@/lib/api-proxy'

const API_BASE = process.env.API_URL!

export async function POST(request: NextRequest) {
  const body = await request.json()

  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  const response = NextResponse.json({
    user: data.user,
    mustChangePassword: data.mustChangePassword,
  })

  setAuthCookies(response, data.accessToken, data.refreshToken)

  return response
}
