import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { loginRequestSchema, loginResponseSchema } from '@repo/shared'
import { verifyPassword } from '../../lib/password.js'
import { createTokenPair } from '../../services/token.service.js'

export const loginRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/login',
    schema: {
      tags: ['Auth'],
      summary: 'Player login',
      description: 'Authenticate a player with email and password. Returns JWT tokens.',
      body: loginRequestSchema,
      response: {
        200: loginResponseSchema,
        401: z.object({ error: z.string(), message: z.string() }),
      },
    },
    config: {
      rateLimit: { max: 5, timeWindow: '15 minutes' },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        })
      }

      if (!user.isActive) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Account is disabled',
        })
      }

      const validPassword = await verifyPassword(user.passwordHash, password)
      if (!validPassword) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        })
      }

      const { accessToken, refreshToken } = await createTokenPair(
        user.id,
        user.email,
        user.role,
        false,
      )

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      return {
        accessToken,
        refreshToken,
        mustChangePassword: user.mustChangePassword,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      }
    },
  })
}
