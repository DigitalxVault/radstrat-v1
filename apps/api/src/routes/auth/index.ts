import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { loginRoute } from './login.js'
import { changePasswordRoute } from './change-password.js'
import { refreshRoute } from './refresh.js'
import { logoutRoute } from './logout.js'

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(loginRoute)
  await app.register(changePasswordRoute)
  await app.register(refreshRoute)
  await app.register(logoutRoute)
}
