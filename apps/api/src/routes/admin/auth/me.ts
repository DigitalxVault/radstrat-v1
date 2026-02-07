import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { userProfileSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { prisma } from '@repo/database'

export const adminMeRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/me',
    schema: {
      tags: ['Admin'],
      summary: 'Get current admin profile',
      description: 'Returns the authenticated admin user profile.',
      response: {
        200: userProfileSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async (request) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: request.user.id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      })
      return user
    },
  })
}
