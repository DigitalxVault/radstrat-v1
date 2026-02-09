import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { adminUpdateProfileSchema, userProfileSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'

export const adminProfileRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'PATCH',
    url: '/profile',
    schema: {
      tags: ['Admin'],
      summary: 'Update admin profile',
      description: 'Update the authenticated admin user\'s first name and/or last name.',
      body: adminUpdateProfileSchema,
      response: {
        200: userProfileSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      const userId = request.user.id
      const updates = request.body

      const existing = await prisma.user.findUnique({ where: { id: userId } })
      if (!existing) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      })

      return user
    },
  })
}
