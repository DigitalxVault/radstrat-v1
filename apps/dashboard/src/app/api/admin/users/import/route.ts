import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return apiProxy('/admin/users/import', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
