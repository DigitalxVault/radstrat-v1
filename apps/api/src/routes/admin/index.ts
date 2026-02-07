import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { adminAuthRoutes } from './auth/index.js'
import { adminUsersRoutes } from './users/index.js'
import { adminAnalyticsRoutes } from './analytics/index.js'

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(adminAuthRoutes, { prefix: '/auth' })
  await app.register(adminUsersRoutes, { prefix: '/users' })
  await app.register(adminAnalyticsRoutes, { prefix: '/analytics' })
}
