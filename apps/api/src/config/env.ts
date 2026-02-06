import { z } from 'zod/v4'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
})

// Fail-fast at startup -- crashes immediately if env is misconfigured
export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
