import { createHash, randomBytes } from 'node:crypto'

export function generateTempPassword(): string {
  return randomBytes(9).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateFamily(): string {
  return randomBytes(16).toString('hex')
}
