import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  return apiProxy('/admin/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
