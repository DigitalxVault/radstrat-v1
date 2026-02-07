import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { submitEventsRoute } from './submit.js'

export const eventsRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(submitEventsRoute)
}
