import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return apiProxy(`/admin/users/${id}`)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()
  return apiProxy(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
