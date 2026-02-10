/**
 * RADStrat v1 — Database Seed Script
 *
 * Creates demo players, progress records, events, and a Super Admin.
 * Re-runnable: deletes stale events/progress and regenerates with fresh timestamps.
 *
 * Run from monorepo root:
 *   pnpm db:seed
 *
 * Or from packages/database:
 *   pnpm seed
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from monorepo root (3 levels up from packages/database/prisma/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { PrismaClient, Prisma } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import argon2 from 'argon2'

// ---------------------------------------------------------------------------
// Prisma client (standalone — not reusing the singleton from src/client.ts
// because the seed runs outside the normal build pipeline)
// ---------------------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Argon2 helper — identical params to apps/api/src/lib/password.ts
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB (OWASP minimum)
    timeCost: 2,
    parallelism: 1,
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Random date within the last `days` days */
function randomRecentDate(days: number): Date {
  const now = Date.now()
  const offset = Math.random() * days * 24 * 60 * 60 * 1000
  return new Date(now - offset)
}

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

/** Generate a secure random password (8-12 chars, upper+lower+digit+symbol) */
function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O to avoid confusion
  const lower = 'abcdefghjkmnpqrstuvwxyz' // no i/l/o
  const digits = '23456789' // no 0/1
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  const length = randInt(8, 12)

  // Guarantee at least one of each category
  const required = [
    upper[randInt(0, upper.length - 1)],
    lower[randInt(0, lower.length - 1)],
    digits[randInt(0, digits.length - 1)],
    symbols[randInt(0, symbols.length - 1)],
  ]

  // Fill remaining with random from all
  const remaining: string[] = []
  for (let i = required.length; i < length; i++) {
    remaining.push(all[randInt(0, all.length - 1)])
  }

  // Shuffle all characters
  const chars = [...required, ...remaining]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES = {
  GAME_START: 'game_start',
  GAME_COMPLETE: 'game_complete',
  INITIAL_ASSESSMENT: 'initial_assessment',
} as const

const MODULES = [
  'radio_telephony_basics',
  'emergency_procedures',
  'standard_phraseology',
  'airspace_classification',
  'weather_reporting',
  'navigation_comms',
] as const

const SCENARIO_NAMES = [
  'Tower Departure Clearance',
  'Approach Frequency Change',
  'Emergency Mayday Call',
  'ATIS Copy & Readback',
  'VFR Circuit Entry',
  'IFR Clearance Delivery',
  'Go-Around Procedure',
  'Distress Relay',
  'Weather Deviation Request',
  'Position Report Enroute',
] as const

// ---------------------------------------------------------------------------
// Player definitions — 10 Singaporean military-style names
// ---------------------------------------------------------------------------

interface PlayerDef {
  firstName: string
  lastName: string
  isActive: boolean
}

const PLAYERS: PlayerDef[] = [
  { firstName: 'Wei Ming', lastName: 'Tan', isActive: true },
  { firstName: 'Jun Hao', lastName: 'Lim', isActive: true },
  { firstName: 'Kai Wen', lastName: 'Ng', isActive: true },
  { firstName: 'Zhi Hao', lastName: 'Chen', isActive: true },
  { firstName: 'Yi Xuan', lastName: 'Wong', isActive: true },
  { firstName: 'Jia Le', lastName: 'Ong', isActive: true },
  { firstName: 'Rui En', lastName: 'Koh', isActive: true },
  { firstName: 'Shi Ting', lastName: 'Goh', isActive: true },
  { firstName: 'Ming Wei', lastName: 'Chua', isActive: false },
  { firstName: 'Jia Hui', lastName: 'Lee', isActive: false },
]

const ADMIN_PASSWORD = 'admin_admin01'
const EUGENE_ADMIN_PASSWORD = 'MAGESCR1'

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

function generateProgressData(): Record<string, unknown> {
  const completedScenarios = randInt(3, SCENARIO_NAMES.length)
  const scenariosCompleted = SCENARIO_NAMES.slice(0, completedScenarios)

  const bestScores: Record<string, number> = {}
  for (const scenario of scenariosCompleted) {
    bestScores[scenario] = randInt(60, 100)
  }

  const totalTrainingMinutes = randInt(30, 480)

  return {
    currentModule: pick([...MODULES]),
    modulesUnlocked: MODULES.slice(0, randInt(1, MODULES.length)),
    scenariosCompleted,
    totalScenariosAvailable: SCENARIO_NAMES.length,
    bestScores,
    totalTrainingTime: totalTrainingMinutes * 60, // seconds
    accuracyRate: parseFloat((Math.random() * 0.35 + 0.60).toFixed(3)), // 0.600 – 0.950
    streak: randInt(0, 14),
    rank: pick(['Recruit', 'Trainee', 'Cadet', 'Specialist', 'Expert']),
    lastSessionAt: randomRecentDate(3).toISOString(),
  }
}

function generateEventPayload(
  eventType: string,
): Record<string, unknown> | null {
  switch (eventType) {
    case EVENT_TYPES.GAME_START:
      return {
        module: pick([...MODULES]),
        scenario: pick([...SCENARIO_NAMES]),
        devicePlatform: pick(['ios', 'android']),
      }

    case EVENT_TYPES.GAME_COMPLETE:
      return {
        module: pick([...MODULES]),
        scenario: pick([...SCENARIO_NAMES]),
        score: randInt(40, 100),
        duration: randInt(60, 600), // seconds
        errors: randInt(0, 8),
        accuracyRate: parseFloat((Math.random() * 0.4 + 0.55).toFixed(3)),
        passed: Math.random() > 0.2,
      }

    case EVENT_TYPES.INITIAL_ASSESSMENT:
      return {
        overallScore: randInt(30, 85),
        categories: {
          phraseology: randInt(20, 100),
          procedures: randInt(20, 100),
          situational_awareness: randInt(20, 100),
        },
        recommendedModule: pick([...MODULES]),
      }

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- RADStrat v1 Database Seed ---\n')

  const adminHash = await hashPassword(ADMIN_PASSWORD)
  const eugeneHash = await hashPassword(EUGENE_ADMIN_PASSWORD)

  // -----------------------------------------------------------------------
  // 1. Super Admins
  // -----------------------------------------------------------------------

  const jacintaAdmin = await prisma.user.upsert({
    where: { email: 'jacintayee98@gmail.com' },
    update: {},
    create: {
      email: 'jacintayee98@gmail.com',
      firstName: 'Jacinta',
      lastName: 'Yee',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: randomRecentDate(5),
    },
  })
  console.log(`  [admin]  ${jacintaAdmin.email} (${jacintaAdmin.role})`)

  const eugeneAdmin = await prisma.user.upsert({
    where: { email: 'eugene.tan@magesstudio.com.sg' },
    update: {},
    create: {
      email: 'eugene.tan@magesstudio.com.sg',
      firstName: 'Eugene',
      lastName: 'Tan',
      passwordHash: eugeneHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
    },
  })
  console.log(`  [admin]  ${eugeneAdmin.email} (${eugeneAdmin.role})`)

  // -----------------------------------------------------------------------
  // 2. Players + Progress + Events (with unique passwords & fresh data)
  // -----------------------------------------------------------------------

  // Collect credentials for console output
  const credentials: Array<{ email: string; name: string; password: string }> = []

  for (const player of PLAYERS) {
    const email = `${player.firstName.toLowerCase().replace(/\s+/g, '.')}.${player.lastName.toLowerCase()}@demo.radstrat.mil.sg`
    const password = generatePassword()
    const passwordHash = await hashPassword(password)
    const hasLoggedIn = Math.random() > 0.25 // ~75% have logged in
    const lastLoginAt = hasLoggedIn ? randomRecentDate(5) : null

    // Upsert user — update password hash on re-run
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, lastLoginAt },
      create: {
        email,
        firstName: player.firstName,
        lastName: player.lastName,
        passwordHash,
        role: 'PLAYER',
        isActive: player.isActive,
        mustChangePassword: false,
        lastLoginAt,
      },
    })

    credentials.push({
      email,
      name: `${player.firstName} ${player.lastName}`,
      password,
    })

    // Delete old progress and events, then recreate with fresh timestamps
    await prisma.event.deleteMany({ where: { userId: user.id } })
    await prisma.playerProgress.deleteMany({ where: { userId: user.id } })

    // Fresh progress
    await prisma.playerProgress.create({
      data: {
        userId: user.id,
        progressData: generateProgressData() as unknown as Prisma.InputJsonValue,
        version: randInt(1, 12),
        savedAt: randomRecentDate(2),
      },
    })

    // Fresh events — guarantee at least 1 initial_assessment + 1 game_complete
    const events: Prisma.EventCreateManyInput[] = []

    // 1) Guaranteed initial_assessment (oldest — player's first login)
    events.push({
      userId: user.id,
      eventType: EVENT_TYPES.INITIAL_ASSESSMENT,
      payload: generateEventPayload(EVENT_TYPES.INITIAL_ASSESSMENT) as Prisma.InputJsonValue,
      createdAt: randomRecentDate(5), // within 7-day chart window
    })

    // 2) Guaranteed game_start + game_complete pair
    const startTime = randomRecentDate(4)
    events.push({
      userId: user.id,
      eventType: EVENT_TYPES.GAME_START,
      payload: generateEventPayload(EVENT_TYPES.GAME_START) as Prisma.InputJsonValue,
      createdAt: startTime,
    })
    events.push({
      userId: user.id,
      eventType: EVENT_TYPES.GAME_COMPLETE,
      payload: generateEventPayload(EVENT_TYPES.GAME_COMPLETE) as Prisma.InputJsonValue,
      createdAt: new Date(startTime.getTime() + randInt(60, 600) * 1000),
    })

    // 3) Additional random events (3-6 more)
    const extraCount = randInt(3, 6)
    const eventTypes = Object.values(EVENT_TYPES)
    for (let i = 0; i < extraCount; i++) {
      const eventType = pick(eventTypes)
      const payload = generateEventPayload(eventType)
      events.push({
        userId: user.id,
        eventType,
        payload: (payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        createdAt: randomRecentDate(5),
      })
    }

    await prisma.event.createMany({ data: events })

    const status = player.isActive ? 'active' : 'inactive'
    console.log(`  [player] ${email} (${status})`)
  }

  // -----------------------------------------------------------------------
  // 3. Print credentials table
  // -----------------------------------------------------------------------

  console.log('\n--- Player Credentials ---\n')
  console.log('  Email                                              | Name            | Password')
  console.log('  ---------------------------------------------------|-----------------|----------')
  for (const c of credentials) {
    const emailPad = c.email.padEnd(51)
    const namePad = c.name.padEnd(15)
    console.log(`  ${emailPad} | ${namePad} | ${c.password}`)
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------

  const userCount = await prisma.user.count()
  const progressCount = await prisma.playerProgress.count()
  const eventCount = await prisma.event.count()

  console.log('\n--- Seed Complete ---')
  console.log(`  Users:    ${userCount}`)
  console.log(`  Progress: ${progressCount}`)
  console.log(`  Events:   ${eventCount}`)
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
