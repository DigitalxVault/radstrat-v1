import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return apiProxy(`/admin/users/${id}/reset-password`, {
    method: 'POST',
  })
}
