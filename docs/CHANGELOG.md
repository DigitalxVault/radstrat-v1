# RADStrat v1 - Changelog

Build log tracking features, issues, debugging, and progress for the RADStrat backend API and admin dashboard.

---

## Phase 1: AWS Infrastructure + Project Foundation

**Status:** Complete
**Dates:** 2026-02-04 to 2026-02-06
**Goal:** Deployed, reachable API on secure AWS stack with monorepo structure and repeatable deployment pipeline

### Features Added

#### Turborepo Monorepo (`b5ebf79`)
- **What:** pnpm workspace monorepo with Turborepo orchestration
- **Structure:** `apps/api`, `apps/dashboard` (placeholder), `packages/database`, `packages/shared`
- **Purpose:** Shared code (Zod schemas, Prisma types) between API and future dashboard without duplication. Turbo handles the build dependency graph (`db:generate` -> `build database` -> `build api`).

#### Fastify 5.7 API (`b5ebf79`)
- **What:** HTTP server with Zod type provider, auto-generated Swagger UI at `/docs`
- **Endpoints:** `GET /health` (returns DB connectivity status, uptime, timestamp)
- **Purpose:** High-performance API framework (2x Express throughput). Zod schemas serve triple duty: runtime validation, TypeScript types, and OpenAPI spec generation.

#### Prisma 7 Database Layer (`b5ebf79`, `14adb7c`)
- **What:** Prisma 7.3 with `@prisma/adapter-pg` (driver-based, no Prisma engine binary)
- **Schema:** Initial migration with Player, Admin, RefreshToken, Device, GameEvent, GameProgress, PushNotification, Campaign tables
- **Purpose:** Type-safe database access with zero-cost schema evolution via migrations. Driver adapter eliminates the Prisma engine binary for smaller deployments.

#### PM2 Process Manager (`b5ebf79`)
- **What:** `ecosystem.config.cjs` with API app config, dotenv `.env.production` loading
- **Purpose:** Production process management with auto-restart, log rotation, and reboot survival. Uses `.cjs` extension because the project is ESM (`"type": "module"`) but PM2 config must be CommonJS.

#### Nginx Reverse Proxy (`b5ebf79`)
- **What:** TLS termination (Certbot), security headers, CVE-2025-29927 mitigation
- **Headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Purpose:** Sits in front of Fastify on port 3001, handles TLS, strips dangerous headers (Next.js middleware bypass prevention for future dashboard).

#### Deploy Script (`b5ebf79`, `b5e908e`, `5187946`)
- **What:** `deploy.sh` — git pull, pnpm install, prisma migrate deploy, build all, pm2 reload
- **Purpose:** One-command deployment from EC2. Idempotent (safe to run multiple times). Handles both first-run (`pm2 start`) and subsequent runs (`pm2 reload`).

#### AWS Infrastructure (manual provisioning)
- **EC2:** t3.micro in ap-southeast-1, Node 22 via nodesource, pnpm + PM2 global
- **RDS:** db.t3.micro PostgreSQL, private subnet, security group restricts to EC2 only
- **Domain:** `api-radstrat.devsparksbuild.com` via Hostinger DNS (A record to EC2 IP)
- **TLS:** Let's Encrypt via Certbot with auto-renewal
- **Purpose:** Minimal viable AWS setup for military training app. RDS is private (not publicly accessible) per security requirements.

### Issues & Debugging

#### 1. Prisma config location (`14adb7c`)
- **Issue:** Prisma 7 couldn't find `prisma.config.ts` when placed inside the `prisma/` subdirectory
- **Root cause:** Prisma 7 requires `prisma.config.ts` at the package root, not in `prisma/`
- **Fix:** Moved `prisma.config.ts` to `packages/database/prisma.config.ts` (package root)
- **Lesson:** Prisma 7 changed config file resolution from Prisma 6

#### 2. DATABASE_URL not reaching Prisma through Turbo (`d9e2786`)
- **Issue:** `prisma generate` failed during `turbo build` because it couldn't see DATABASE_URL
- **Root cause:** Turborepo sandboxes environment variables by default for build caching
- **Fix:** Added `globalPassThroughEnv: ["DATABASE_URL"]` to `turbo.json`
- **Lesson:** Turbo treats env vars as cache keys — must explicitly pass through vars needed by tools like Prisma

#### 3. Workspace packages not bundled for production (`f93c97a`)
- **Issue:** API build failed to resolve `@repo/database` and `@repo/shared` imports at runtime
- **Root cause:** tsup doesn't bundle workspace packages by default — they're treated as external
- **Fix:** Added workspace packages to tsup `noExternal` config in the API build
- **Lesson:** Workspace package references need explicit bundling for standalone production builds

#### 4. Dynamic require error from Prisma (`936ba36`)
- **Issue:** After bundling workspace packages, got `Dynamic require of @prisma/client is not supported` at runtime
- **Root cause:** `@prisma/*` packages use CommonJS `require()` internally. Bundling them into ESM output via `noExternal` converts the require calls, which breaks
- **Fix:** Removed `@prisma/*` from `noExternal` (let them stay as external imports). Removed dotenv import from the database client (not needed at runtime, only at build time)
- **Lesson:** Never bundle `@prisma/*` packages into ESM — they must remain external CJS imports

#### 5. Database package not built before API (`c0b5a3e`)
- **Issue:** API couldn't import from `@repo/database` because the database package had no `dist/` output
- **Root cause:** Prisma 7 generates `.ts` files (not `.js`), so Node.js can't import them directly at runtime. The database package needs its own tsup build step.
- **Fix:** Added tsup config and build script to `packages/database`, updated Turbo task graph so database builds before API
- **Lesson:** Prisma 7's `.ts` output means every consuming package needs a compiled build, not just the API

#### 6. PM2 start vs reload detection (`b5e908e`)
- **Issue:** `pm2 reload` failed on first deploy because no PM2 process existed yet
- **Root cause:** deploy.sh assumed PM2 process already existed
- **Fix:** Added detection logic — `pm2 start` on first run, `pm2 reload` on subsequent runs
- **Lesson:** Deploy scripts must be idempotent and handle cold-start scenarios

#### 7. Safety check grep false positive (`5187946`)
- **Issue:** deploy.sh safety check (`grep -r "prisma migrate dev"`) was matching itself and unrelated strings
- **Root cause:** Grep pattern was too broad, matching the grep command's own arguments and partial string matches
- **Fix:** Narrowed the grep pattern and excluded the deploy script itself
- **Lesson:** Safety checks in shell scripts need careful pattern scoping to avoid self-matching

### Verification

- `GET /health` returns `{"status":"ok","database":"connected"}` with 200
- Swagger UI accessible at `https://api-radstrat.devsparksbuild.com/docs`
- PM2 survives reboot (tested with actual EC2 reboot)
- RDS not publicly accessible (verified via AWS console)
- TLS certificate valid, auto-renewal configured
- Deploy script idempotent (ran multiple times without error)

---

## Phase 2: Player Auth + Progress

**Status:** Complete
**Dates:** 2026-02-07
**Goal:** Unity team can authenticate players, save/load progress, register devices, and submit events. Admin user management and basic analytics.

### Features Added

#### Authentication System (9 endpoints)
- **Player Auth:** `POST /auth/login`, `POST /auth/change-password`, `POST /auth/refresh`, `POST /auth/logout`
- **Admin Auth:** `POST /admin/auth/login`, `POST /admin/auth/refresh`, `POST /admin/auth/logout`, `GET /admin/me`
- **JWT Library:** jose (ESM-native, zero dependencies)
- **Password Hashing:** argon2id (OWASP-recommended, GPU-resistant)
- **Token Rotation:** Access tokens (15 min) + Refresh tokens (7 days) with family-based reuse detection
- **Rate Limiting:** 5 attempts / 15 minutes on login endpoints
- **Separate Secrets:** Player and admin tokens use different JWT secrets (cross-usage rejected)
- **Force Password Change:** Middleware blocks all endpoints except `/auth/change-password` when `mustChangePassword=true`

#### Player Features (5 endpoints)
- **Progress:** `GET /progress`, `PUT /progress` (optimistic concurrency via version field)
- **Devices:** `POST /devices/register` (idempotent upsert), `POST /devices/unregister` (soft delete)
- **Events:** `POST /events` (batch up to 100 events)

#### Admin User Management (5 endpoints)
- **Import:** `POST /admin/users/import` (up to 500 users, returns temp passwords)
- **List:** `GET /admin/users` (paginated, search by name/email, filter by isActive/role)
- **Detail:** `GET /admin/users/:id`
- **Update:** `PATCH /admin/users/:id` (enable/disable, force password change)
- **Reset Password:** `POST /admin/users/:id/reset-password`

#### Admin Analytics (2 endpoints)
- **Overview:** `GET /admin/analytics/overview` (aggregate counts)
- **User Detail:** `GET /admin/analytics/users/:id` (per-player activity)

#### Shared Schemas (packages/shared/src/schemas/)
- `common.ts` - Pagination, error response, ID param schemas
- `auth.ts` - Login, change-password, refresh, logout schemas
- `user.ts` - User response, import, list/filter schemas
- `progress.ts` - Progress save/load schemas (permissive JSON)
- `device.ts` - Device register/unregister schemas
- `event.ts` - Event submission schema (batch up to 100)

#### Services Layer (apps/api/src/services/)
- `token.service.ts` - Refresh token rotation + family-based reuse detection
- `user.service.ts` - User CRUD, batch import, search, password reset

#### Middleware (apps/api/src/middleware/)
- `auth.ts` - Player JWT verification (JWT_ACCESS_SECRET)
- `admin-auth.ts` - Admin JWT verification (JWT_ADMIN_ACCESS_SECRET) + role check
- `require-password-changed.ts` - Blocks access if `mustChangePassword=true`

#### Security Enhancements
- Swagger security schemes (Bearer auth for player/admin)
- Helmet CSP refinement (disabled for Swagger UI compatibility)
- CORS production config (configurable via CORS_ORIGIN env var)
- Enhanced error handler (429 rate limit, Zod validation → 400)

### Documentation Deliverables
- **docs/akshay.md** - Explanation of separate backend decision (per dev advisor's recommendation)
- **docs/API.md** - Plain-language API reference for non-technical stakeholders
- **docs/database-quick-reference.md** - Updated with visual ASCII schema diagram

### Issues & Debugging

#### 1. Prisma 7 JSON type compatibility
- **Issue:** `Record<string, unknown>` not assignable to Prisma `JsonValue` type
- **Root cause:** Prisma 7 uses stricter `InputJsonValue` type for JSON fields
- **Fix:** Added `as Prisma.InputJsonValue` type cast when passing JSON data to Prisma
- **Lesson:** Prisma 7 requires explicit type casting for JSON fields in TypeScript

#### 2. Export name mismatch
- **Issue:** Import errors for `devicesRoutes` and `eventsRoutes`
- **Root cause:** Export was named `deviceRoutes` and `eventRoutes` (singular)
- **Fix:** Renamed exports to match plural naming convention
- **Lesson:** Maintain consistent plural naming for route exports

#### 3. Prisma namespace exports
- **Issue:** `Prisma.JsonNull` not accessible as a value
- **Root cause:** Prisma 7 exports JsonNull from internal namespace, not as a type
- **Fix:** Exported `DbNull`, `JsonNull` and `Prisma.*` from database package index
- **Lesson:** Prisma 7 utility values need explicit re-export from internal files

### Verification
- Type checks pass (`pnpm check-types`)
- Build succeeds (`pnpm build`)
- All 21 endpoints registered in app.ts
- Swagger UI shows all endpoints with proper tags and security schemes
- Progress endpoints use optimistic concurrency (409 on version conflict)
- Device register is idempotent (upsert by userId+platform)
- Events accept batches (up to 100)

---

## Phase 3: Push Notifications + Automated Jobs

**Status:** Not started
**Goal:** Automated push notifications and admin campaign management via OneSignal

---

## Phase 4: Admin Dashboard

**Status:** Not started
**Goal:** Next.js admin UI for user management, campaigns, and analytics

---

## Phase 5: Analytics + Production Monitoring

**Status:** Not started
**Goal:** Analytics aggregation endpoints, CloudWatch alarms, structured logging
