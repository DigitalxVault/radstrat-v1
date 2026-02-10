import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

interface TokenPayload {
  sub: string
  email: string
  role: string
  type: 'access' | 'refresh'
  family?: string
}

function secretToKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(
  payload: { sub: string; email: string; role: string },
  secret: string,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretToKey(secret))
}

export async function signRefreshToken(
  payload: { sub: string; email: string; role: string; family: string },
  secret: string,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secretToKey(secret))
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload & JWTPayload> {
  const { payload } = await jwtVerify(token, secretToKey(secret))
  return payload as TokenPayload & JWTPayload
}
