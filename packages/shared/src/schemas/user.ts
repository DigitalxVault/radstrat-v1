import { z } from 'zod/v4'

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  role: z.string(),
  mustChangePassword: z.boolean(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  initialRt: z.number().nullable().optional(),
  currentRt: z.number().nullable().optional(),
})

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  role: z.enum(['PLAYER', 'SUPER_ADMIN']).optional(),
  sortBy: z.enum(['name', 'email', 'role', 'status', 'lastLogin', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const userListResponseSchema = z.object({
  users: z.array(userResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const updateUserRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.email().optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
})

export const importUserSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['PLAYER', 'SUPER_ADMIN']).optional().default('PLAYER'),
})

export const importUsersRequestSchema = z.object({
  users: z.array(importUserSchema).min(1).max(500),
})

export const importResultSchema = z.object({
  created: z.number(),
  skipped: z.number(),
  errors: z.array(
    z.object({
      email: z.string(),
      reason: z.string(),
    }),
  ),
  temporaryPasswords: z.array(
    z.object({
      email: z.string(),
      temporaryPassword: z.string(),
    }),
  ),
})

export const resetPasswordResponseSchema = z.object({
  temporaryPassword: z.string(),
  message: z.string(),
})
