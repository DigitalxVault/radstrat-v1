export { prisma } from './client.js'
export type * from '../generated/prisma/client.js'

// Re-export Prisma utility values from internal namespace
export { DbNull, JsonNull } from '../generated/prisma/internal/prismaNamespace.js'

// Re-export the Prisma namespace with its utility values
export * as Prisma from '../generated/prisma/internal/prismaNamespace.js'
