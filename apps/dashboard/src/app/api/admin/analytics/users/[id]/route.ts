import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const query = searchParams ? `?${searchParams}` : ''
  return apiProxy(`/admin/analytics/users/${id}${query}`)
}
