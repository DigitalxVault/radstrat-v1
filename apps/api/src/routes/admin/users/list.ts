import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { userListQuerySchema, userListResponseSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { listUsers } from '../../../services/user.service.js'

export const adminListUsersRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Admin'],
      summary: 'List users',
      description: 'Paginated user list with search and filter support.',
      security: [{ adminBearerAuth: [] }],
      querystring: userListQuerySchema,
      response: {
        200: userListResponseSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async (request) => {
      return listUsers(request.query)
    },
  })
}
