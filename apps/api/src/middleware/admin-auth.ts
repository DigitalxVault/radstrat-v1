import { type FastifyRequest, type FastifyReply } from 'fastify'
import { verifyToken } from '../lib/jwt.js'
import { env } from '../config/env.js'
import { prisma } from '@repo/database'

export async function adminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    })
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verifyToken(token, env.JWT_ADMIN_ACCESS_SECRET)
    if (payload.type !== 'access') {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token type',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub! },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Account not found or disabled',
      })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      })
    }

    request.user = { id: user.id, email: user.email, role: user.role }
  } catch {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    })
  }
}
