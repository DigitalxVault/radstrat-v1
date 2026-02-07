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
import fastifyRateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth/index.js'
import { adminRoutes } from './routes/admin/index.js'
import { progressRoutes } from './routes/progress/index.js'
import { devicesRoutes } from './routes/devices/index.js'
import { eventsRoutes } from './routes/events/index.js'

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
    contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
  })
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Rate limiting (global default)
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Swagger (MUST be before route registration)
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'RADStrat API',
        description: 'Backend API for RSAF Unity Mobile Training Game',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          playerBearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Player access token from POST /auth/login',
          },
          adminBearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Admin access token from POST /admin/auth/login',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Player authentication' },
        { name: 'Admin', description: 'Admin authentication and management' },
        { name: 'Progress', description: 'Player progress management' },
        { name: 'Devices', description: 'Device registration for push notifications' },
        { name: 'Events', description: 'Gameplay event ingestion' },
        { name: 'Analytics', description: 'Admin analytics endpoints' },
      ],
    },
    transform: jsonSchemaTransform,
  })

  await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  })

  // Routes
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(progressRoutes, { prefix: '/progress' })
  await app.register(devicesRoutes, { prefix: '/devices' })
  await app.register(eventsRoutes, { prefix: '/events' })
  await app.register(adminRoutes, { prefix: '/admin' })

  // OpenAPI JSON endpoint
  app.get('/openapi.json', async () => app.swagger())

  // Error handler
  app.setErrorHandler((error, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      })
    }

    const statusCode = (error as { statusCode?: number }).statusCode ?? 500

    // Rate limit errors
    if (statusCode === 429) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      })
    }

    app.log.error(error)
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : ((error as Error).message ?? 'Unknown error'),
    })
  })

  return app
}
