import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...(env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
    },
  })

  // Zod type provider (MUST be before route registration)
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Security plugins
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Disable for Swagger UI
  })
  await app.register(fastifyCors, {
    origin: true, // Configure per-environment in Phase 2
  })

  // Swagger (MUST be before route registration)
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'RADStrat API',
        description: 'Backend API for RSAF Unity Mobile Training Game',
        version: '1.0.0',
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Player authentication' },
        { name: 'Admin', description: 'Admin authentication and management' },
        { name: 'Progress', description: 'Player progress management' },
      ],
    },
    transform: jsonSchemaTransform,
  })

  await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  })

  // Routes
  await app.register(healthRoutes)

  // OpenAPI JSON endpoint
  app.get('/openapi.json', async () => app.swagger())

  // Error handler for Zod validation errors
  app.setErrorHandler((error, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      })
    }

    const fastifyError = error as { statusCode?: number; message?: string }
    app.log.error(error)
    return reply.code(fastifyError.statusCode ?? 500).send({
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : (fastifyError.message ?? 'Unknown error'),
    })
  })

  return app
}
