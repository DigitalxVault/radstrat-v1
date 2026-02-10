import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { unregisterDeviceRequestSchema, messageResponseSchema } from '@repo/shared'
import { playerAuth } from '../../middleware/auth.js'
import { requirePasswordChanged } from '../../middleware/require-password-changed.js'

export const unregisterDeviceRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/unregister',
    schema: {
      tags: ['Devices'],
      summary: 'Unregister device',
      description: 'Deactivate a device (soft delete). The device record is kept for push history.',
      security: [{ playerBearerAuth: [] }],
      body: unregisterDeviceRequestSchema,
      response: {
        200: messageResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [playerAuth, requirePasswordChanged],
    handler: async (request, reply) => {
      const { deviceId } = request.body
      const userId = request.user.id

      const device = await prisma.device.findFirst({
        where: { id: deviceId, userId },
      })

      if (!device) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'Device not found',
        })
      }

      await prisma.device.update({
        where: { id: device.id },
        data: { isActive: false },
      })

      return { message: 'Device unregistered successfully' }
    },
  })
}
