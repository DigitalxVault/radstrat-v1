/**
 * Token lifecycle management — creation, refresh, and revocation.
 * Implements family-based refresh token rotation with reuse detection
 * to prevent stolen-token replay attacks (RSAF security requirement).
 */
import { prisma } from '@repo/database'
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js'
import { hashToken, generateFamily } from '../lib/crypto.js'
import { env } from '../config/env.js'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

export async function createTokenPair(
  userId: string,
  email: string,
  role: string,
  isAdmin: boolean,
): Promise<TokenPair> {
  const accessSecret = isAdmin ? env.JWT_ADMIN_ACCESS_SECRET : env.JWT_ACCESS_SECRET
  const refreshSecret = isAdmin ? env.JWT_ADMIN_REFRESH_SECRET : env.JWT_REFRESH_SECRET
  const family = generateFamily()

  const accessToken = await signAccessToken({ sub: userId, email, role }, accessSecret)
  const refreshToken = await signRefreshToken({ sub: userId, email, role, family }, refreshSecret, isAdmin)

  const refreshExpiryMs = isAdmin
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for admin
    : 7 * 24 * 60 * 60 * 1000   // 7 days for player

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      family,
      expiresAt: new Date(Date.now() + refreshExpiryMs),
    },
  })

  return { accessToken, refreshToken }
}

export async function refreshTokenPair(
  refreshTokenStr: string,
  isAdmin: boolean,
): Promise<TokenPair> {
  const refreshSecret = isAdmin ? env.JWT_ADMIN_REFRESH_SECRET : env.JWT_REFRESH_SECRET
  const accessSecret = isAdmin ? env.JWT_ADMIN_ACCESS_SECRET : env.JWT_ACCESS_SECRET

  // Verify JWT signature and expiration
  const payload = await verifyToken(refreshTokenStr, refreshSecret)
  if (payload.type !== 'refresh' || !payload.family) {
    throw new TokenError('Invalid token type')
  }

  const tokenHash = hashToken(refreshTokenStr)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  })

  if (!storedToken) {
    // Token not found — possibly already rotated. This is normal if client retries.
    throw new TokenError('Token not found')
  }

  if (storedToken.revokedAt) {
    // REUSE DETECTED — revoke entire family immediately (compromise indicator)
    await revokeFamily(storedToken.family)
    throw new TokenError('Token reuse detected')
  }

  if (storedToken.expiresAt < new Date()) {
    throw new TokenError('Token expired')
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  })

  // Issue new pair in the same family
  const newFamily = storedToken.family
  const accessToken = await signAccessToken(
    { sub: payload.sub!, email: payload.email as string, role: payload.role as string },
    accessSecret,
  )
  const newRefreshToken = await signRefreshToken(
    { sub: payload.sub!, email: payload.email as string, role: payload.role as string, family: newFamily },
    refreshSecret,
    isAdmin,
  )

  const refreshExpiryMs = isAdmin
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for admin
    : 7 * 24 * 60 * 60 * 1000   // 7 days for player

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      tokenHash: hashToken(newRefreshToken),
      family: newFamily,
      expiresAt: new Date(Date.now() + refreshExpiryMs),
    },
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function revokeFamily(family: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { family, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeFamilyByToken(refreshTokenStr: string): Promise<void> {
  const tokenHash = hashToken(refreshTokenStr)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  })

  if (storedToken) {
    await revokeFamily(storedToken.family)
  }
}

export class TokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenError'
  }
}
