import { prisma } from '@repo/database'
import { hashPassword } from '../lib/password.js'
import { generateTempPassword } from '../lib/crypto.js'
import { revokeAllUserTokens } from './token.service.js'

interface ImportUser {
  email: string
  firstName: string
  lastName: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: { email: string; reason: string }[]
  temporaryPasswords: { email: string; temporaryPassword: string }[]
}

export async function importUsers(users: ImportUser[]): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    temporaryPasswords: [],
  }

  // Check existing emails in one query
  const emails = users.map((u) => u.email.toLowerCase())
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  })
  const existingSet = new Set(existing.map((u) => u.email))

  for (const user of users) {
    const email = user.email.toLowerCase()

    if (existingSet.has(email)) {
      result.skipped++
      continue
    }

    try {
      const tempPassword = generateTempPassword()
      const passwordHash = await hashPassword(tempPassword)

      await prisma.user.create({
        data: {
          email,
          firstName: user.firstName.trim(),
          lastName: user.lastName.trim(),
          passwordHash,
          mustChangePassword: true,
          isActive: true,
          role: 'PLAYER',
        },
      })

      result.created++
      result.temporaryPasswords.push({ email, temporaryPassword: tempPassword })
    } catch (error) {
      result.errors.push({
        email,
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

interface ListUsersParams {
  page: number
  limit: number
  search?: string
  isActive?: boolean
  role?: string
}

export async function listUsers(params: ListUsersParams) {
  const { page, limit, search, isActive, role } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  if (role) {
    where.role = role
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function resetPassword(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('User not found')
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  })

  // Revoke all sessions
  await revokeAllUserTokens(userId)

  return {
    temporaryPassword: tempPassword,
    message: `Password reset for ${user.email}. User must change password on next login.`,
  }
}
