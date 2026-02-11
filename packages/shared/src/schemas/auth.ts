/** Authentication schemas — login, token refresh, password change (player + admin). */
import { z } from 'zod/v4'

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  mustChangePassword: z.boolean(),
  user: userProfileSchema,
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export const adminUpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.email().optional(),
})
