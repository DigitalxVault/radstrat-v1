import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getProgressRoute } from './get.js'
import { saveProgressRoute } from './save.js'

export const progressRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(getProgressRoute)
  await app.register(saveProgressRoute)
}
