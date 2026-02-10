import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { importUsersRequestSchema, importResultSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { importUsers } from '../../../services/user.service.js'

export const adminImportRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/import',
    schema: {
      tags: ['Admin'],
      summary: 'Import users (whitelist)',
      description: 'Batch import players with temporary passwords. Skips existing emails. Max 500 per request.',
      security: [{ adminBearerAuth: [] }],
      body: importUsersRequestSchema,
      response: {
        200: importResultSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async (request) => {
      return importUsers(request.body.users)
    },
  })
}
