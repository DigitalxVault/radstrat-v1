import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { registerDeviceRoute } from './register.js'
import { unregisterDeviceRoute } from './unregister.js'

export const devicesRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerDeviceRoute)
  await app.register(unregisterDeviceRoute)
}
