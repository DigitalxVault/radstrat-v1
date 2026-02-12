import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'

/**
 * Generates X-Request-ID for every request.
 * Uses incoming header if present (e.g. from Nginx), otherwise creates a new UUID.
 * Adds the ID to the response headers for client-side correlation.
 */
export const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-request-id']
    const reqId = typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : randomUUID()

    // Fastify uses request.id for log binding
    ;(request as { id: string }).id = reqId
    void reply.header('X-Request-Id', reqId)
  })
}
