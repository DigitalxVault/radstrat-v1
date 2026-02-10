import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from monorepo root in dev BEFORE any other imports that read process.env
// Dynamic import avoids bundling dotenv's CJS require('fs') into ESM output
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const { config } = await import('dotenv')
  config({ path: resolve(__dirname, '../../../.env') })
} catch {
  // dotenv not available in production — env vars set by deploy script
}

// Dynamic imports after env is loaded
const { buildApp } = await import('./app.js')
const { env } = await import('./config/env.js')

const app = await buildApp()

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`Server running on port ${env.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
