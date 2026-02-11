/**
 * Blocks access until the user changes their temporary password.
 * Returns 403 PasswordChangeRequired so Unity/dashboard can redirect
 * to the change-password flow.
 */
import { type FastifyRequest, type FastifyReply } from 'fastify'
import { prisma } from '@repo/database'

export async function requirePasswordChanged(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: { mustChangePassword: true },
  })

  if (user?.mustChangePassword) {
    return reply.code(403).send({
      error: 'PasswordChangeRequired',
      message: 'You must change your password before accessing this resource. Use POST /auth/change-password.',
    })
  }
}
