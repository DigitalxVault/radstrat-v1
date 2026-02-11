'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  initialRt: number | null
  currentRt: number | null
}

interface UserDetail extends User {
  progressSummary: {
    hasProgress: boolean
    lastSavedAt: string | null
  }
  deviceCount: number
  eventCount: number
}

interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ImportResult {
  created: number
  skipped: number
  errors: Array<{ email: string; reason: string }>
  temporaryPasswords: Array<{ email: string; temporaryPassword: string }>
}

interface ResetPasswordResponse {
  temporaryPassword: string
  message: string
}

export function useUsers(params: {
  page?: number
  limit?: number
  search?: string
  isActive?: string
  role?: string
  sortBy?: string
  sortOrder?: string
}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.isActive) searchParams.set('isActive', params.isActive)
  if (params.role) searchParams.set('role', params.role)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const query = searchParams.toString()

  return useQuery<UserListResponse>({
    queryKey: ['users', params],
    queryFn: () => api(`/api/admin/users${query ? `?${query}` : ''}`),
  })
}

export function useUser(id: string) {
  return useQuery<UserDetail>({
    queryKey: ['users', id],
    queryFn: () => api(`/api/admin/users/${id}`),
    enabled: !!id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        firstName?: string
        lastName?: string
        email?: string
        isActive?: boolean
        mustChangePassword?: boolean
      }
    }) =>
      api(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useImportUsers() {
  const queryClient = useQueryClient()

  return useMutation<
    ImportResult,
    Error,
    Array<{ email: string; firstName: string; lastName: string; role?: string }>
  >({
    mutationFn: (users) =>
      api('/api/admin/users/import', {
        method: 'POST',
        body: JSON.stringify({ users }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, string>({
    mutationFn: (id) =>
      api(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
      }),
  })
}
