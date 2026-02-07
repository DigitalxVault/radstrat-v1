import { z } from 'zod/v4'

export const registerDeviceRequestSchema = z.object({
  platform: z.enum(['ios', 'android']),
  onesignalPlayerId: z.string().optional(),
  deviceToken: z.string().optional(),
})

export const deviceResponseSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  onesignalPlayerId: z.string().nullable(),
  isActive: z.boolean(),
  registeredAt: z.string(),
})

export const unregisterDeviceRequestSchema = z.object({
  deviceId: z.string().uuid(),
})
