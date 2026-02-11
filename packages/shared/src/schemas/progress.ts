/** Player progress schemas — save/load game state from Unity. */
import { z } from 'zod/v4'

export const saveProgressRequestSchema = z.object({
  progressData: z.record(z.string(), z.unknown()),
  version: z.number().int().min(1),
})

export const progressResponseSchema = z.object({
  id: z.string().uuid(),
  progressData: z.unknown(),
  version: z.number(),
  savedAt: z.string(),
})

export const emptyProgressResponseSchema = z.object({
  progressData: z.null(),
  version: z.literal(0),
  message: z.string(),
})
