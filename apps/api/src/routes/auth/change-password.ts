import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { changePasswordRequestSchema, tokenResponseSchema } from '@repo/shared'
import { verifyPassword, hashPassword } from '../../lib/password.js'
import { createTokenPair, revokeAllUserTokens } from '../../services/token.service.js'
import { playerAuth } from '../../middleware/auth.js'

export const changePasswordRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/change-password',
    schema: {
      tags: ['Auth'],
      summary: 'Change password',
      description: 'Change the current password. Required on first login when mustChangePassword is true.',
      security: [{ playerBearerAuth: [] }],
      body: changePasswordRequestSchema,
      response: {
        200: tokenResponseSchema,
        400: z.object({ error: z.string(), message: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [playerAuth],
    handler: async (request, reply) => {
      const { currentPassword, newPassword } = request.body
      const userId = request.user.id

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      })

      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found',
        })
      }

      const validCurrent = await verifyPassword(user.passwordHash, currentPassword)
      if (!validCurrent) {
        return reply.code(400).send({
          error: 'BadRequest',
          message: 'Current password is incorrect',
        })
      }

      if (currentPassword === newPassword) {
        return reply.code(400).send({
          error: 'BadRequest',
          message: 'New password must be different from current password',
        })
      }

      const newHash = await hashPassword(newPassword)

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
        },
      })

      // Revoke all existing tokens and issue fresh pair
      await revokeAllUserTokens(userId)

      const { accessToken, refreshToken } = await createTokenPair(
        userId,
        request.user.email,
        request.user.role,
        false,
      )

      return { accessToken, refreshToken }
    },
  })
}
