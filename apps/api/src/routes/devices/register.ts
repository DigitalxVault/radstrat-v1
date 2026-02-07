import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { registerDeviceRequestSchema, deviceResponseSchema } from '@repo/shared'
import { playerAuth } from '../../middleware/auth.js'
import { requirePasswordChanged } from '../../middleware/require-password-changed.js'

export const registerDeviceRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/register',
    schema: {
      tags: ['Devices'],
      summary: 'Register device for push notifications',
      description: 'Register or update a device for push notifications. Idempotent — re-registering the same platform updates the existing record.',
      body: registerDeviceRequestSchema,
      response: {
        200: deviceResponseSchema,
      },
    },
    preHandler: [playerAuth, requirePasswordChanged],
    handler: async (request) => {
      const { platform, onesignalPlayerId, deviceToken } = request.body
      const userId = request.user.id

      // Upsert: same user + platform = update existing
      const existing = await prisma.device.findFirst({
        where: { userId, platform },
      })

      if (existing) {
        const updated = await prisma.device.update({
          where: { id: existing.id },
          data: {
            onesignalPlayerId: onesignalPlayerId ?? existing.onesignalPlayerId,
            deviceToken: deviceToken ?? existing.deviceToken,
            isActive: true,
          },
        })

        return {
          id: updated.id,
          platform: updated.platform,
          onesignalPlayerId: updated.onesignalPlayerId,
          isActive: updated.isActive,
          registeredAt: updated.registeredAt.toISOString(),
        }
      }

      const device = await prisma.device.create({
        data: {
          userId,
          platform,
          onesignalPlayerId: onesignalPlayerId ?? null,
          deviceToken: deviceToken ?? null,
          isActive: true,
        },
      })

      return {
        id: device.id,
        platform: device.platform,
        onesignalPlayerId: device.onesignalPlayerId,
        isActive: device.isActive,
        registeredAt: device.registeredAt.toISOString(),
      }
    },
  })
}
