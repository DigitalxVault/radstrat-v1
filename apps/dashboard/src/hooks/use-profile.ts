'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface UpdateProfileData {
  firstName?: string
  lastName?: string
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      api('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })
}
