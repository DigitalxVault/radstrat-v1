import { NextRequest } from 'next/server'
import { apiProxy } from '@/lib/api-proxy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString()
  const query = searchParams ? `?${searchParams}` : ''
  return apiProxy(`/admin/users${query}`)
}
