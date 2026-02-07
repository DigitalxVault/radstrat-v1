import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { adminImportRoute } from './import.js'
import { adminListUsersRoute } from './list.js'
import { adminUserDetailRoute } from './detail.js'
import { adminUpdateUserRoute } from './update.js'
import { adminResetPasswordRoute } from './reset-password.js'

export const adminUsersRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(adminImportRoute)
  await app.register(adminListUsersRoute)
  await app.register(adminUserDetailRoute)
  await app.register(adminUpdateUserRoute)
  await app.register(adminResetPasswordRoute)
}
