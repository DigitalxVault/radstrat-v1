import { z } from 'zod/v4'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT secrets (separate for player and admin — cross-usage rejection)
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ADMIN_ACCESS_SECRET: z.string().min(32, 'JWT_ADMIN_ACCESS_SECRET must be at least 32 characters'),
  JWT_ADMIN_REFRESH_SECRET: z.string().min(32, 'JWT_ADMIN_REFRESH_SECRET must be at least 32 characters'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
})

// Fail-fast at startup -- crashes immediately if env is misconfigured
export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
