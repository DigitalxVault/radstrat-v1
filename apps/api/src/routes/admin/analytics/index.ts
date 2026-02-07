import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { adminAnalyticsOverviewRoute } from './overview.js'
import { adminUserAnalyticsRoute } from './user-detail.js'

export const adminAnalyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(adminAnalyticsOverviewRoute)
  await app.register(adminUserAnalyticsRoute)
}
