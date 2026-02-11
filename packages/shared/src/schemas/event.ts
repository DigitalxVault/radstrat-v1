/** Gameplay event ingestion schemas — generic event type + JSON payload from Unity. */
import { z } from 'zod/v4'

export const submitEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const submitEventsRequestSchema = z.object({
  events: z.array(submitEventSchema).min(1).max(100),
})

export const eventsResponseSchema = z.object({
  submitted: z.number(),
})
