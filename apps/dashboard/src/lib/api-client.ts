export class ApiError extends Error {
  constructor(
    public status: number,
    public data: { error: string; message: string },
  ) {
    super(data.message)
    this.name = 'ApiError'
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, { error: 'Unauthorized', message: 'Session expired' })
  }

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, data)
  }

  return data as T
}
