import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from monorepo root BEFORE any other imports that read process.env
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

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
