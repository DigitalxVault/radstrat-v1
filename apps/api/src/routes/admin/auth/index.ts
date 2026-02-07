import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { adminLoginRoute } from './login.js'
import { adminRefreshRoute } from './refresh.js'
import { adminLogoutRoute } from './logout.js'
import { adminMeRoute } from './me.js'

export const adminAuthRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(adminLoginRoute)
  await app.register(adminRefreshRoute)
  await app.register(adminLogoutRoute)
  await app.register(adminMeRoute)
}
