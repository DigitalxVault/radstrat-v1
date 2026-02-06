# Backend Build Spec v2.1.md — Unity RT Game Backend
(AWS + Node.js + Prisma + Swagger + Whitelist Auth + OneSignal Automation + Admin Push Campaigns)

**Scope owner:** Full-Stack Backend  
**Frontend owner:** Unity Mobile Game team  
**Core intent:** Backend handles **Whitelist-based Player Auth**, **Player Progress**, **Push Notifications via OneSignal (Automated + Admin Campaigns)**, **Admin Dashboard (user ops + analytics + campaigns)**, and **API Contract (Swagger/OpenAPI)**.  
**Non-scope:** Scenarios, audio files, gameplay logic (Unity-owned).

---

## 0) High-level architecture

**Unity Client (mobile)** → **HTTPS** → **Node.js API (EC2)** → **Prisma ORM** → **AWS RDS (Postgres)**  
**Admin Dashboard (web)** → **HTTPS** → **Node.js API (EC2)** → **RDS**  
**Job runner** (cron/worker) → **OneSignal API** for automated pushes  
**Admin campaigns** (dashboard) → **Node.js API** → **OneSignal API**

**Rules**
- Unity **never** connects to RDS directly.
- Dashboard is **admin-only** (web).
- Players only use mobile.
- RSAF admins **do not** access OneSignal UI; all push sends happen via backend calling OneSignal API.

---

## 1) Deliverables

### 1.1 Infrastructure deliverables (AWS)
1. **RDS (Postgres)** with **private access**.
2. **EC2** hosting Node.js API (job runner may be co-located).
3. **Security Groups**
   - EC2 inbound: **443** (HTTPS), **80** (optional), **22** (SSH restricted).
   - RDS inbound: **5432 only from EC2 SG**.
4. **Domain + HTTPS**
   - `https://api-staging.<domain>` (staging)
   - `https://api.<domain>` (production)
5. **Logging/monitoring**
   - CloudWatch logs, alarms for high error rates + job failures + campaign failures.

### 1.2 Application deliverables (Node.js)
1. **Whitelist-based player auth**
   - Admin imports whitelist: First Name, Last Name, Email
   - Backend generates **temporary password**
   - First login forces password change
   - Persistent login using access+refresh tokens
2. **Player progress**
   - Save/load progress snapshot (JSON)
3. **Push notifications via OneSignal**
   - Device registration from Unity
   - Automated sends (scheduled job rules)
   - Admin-triggered push campaigns from dashboard (no OneSignal UI access)
4. **Admin portal APIs**
   - Admin login
   - User CRUD: import, disable/enable, reset password, force change
   - Analytics/reporting endpoints (read-only)
   - Push campaign management (create/send/schedule/cancel)
5. **Swagger/OpenAPI**
   - Swagger UI: `/docs`
   - OpenAPI spec: `/openapi.json` or `/openapi.yaml`

### 1.3 Handoff deliverables
**Unity team**
- Base URL + `/docs`
- Auth flow (login → forced password change → silent refresh)
- Progress endpoints
- Device registration endpoint for OneSignal
- Optional: event ingestion endpoint for analytics

**RSAF admins**
- Dashboard URL
- User import/reset flows
- Campaign sending flow (who can send, targeting options)
- Reporting definitions (metrics and improvement view)

---

## 2) Key decisions (v2.1)

### 2.1 Player auth = whitelist only
- No Google/Apple login.
- Email is unique identifier.
- Users start with a temp password and `mustChangePassword=true`.

### 2.2 Push notifications = backend-controlled
- Automated reminders are triggered by backend jobs.
- Manual/admin pushes are triggered via dashboard → backend → OneSignal API.
- OneSignal UI is not accessible to RSAF admins.

### 2.3 Admin dashboard capabilities
- User ops: import whitelist, reset password, enable/disable
- Analytics: view progress + event-based trends
- Campaigns: send now / schedule / cancel, with audit logging
- Single Super Admin role with full access to all dashboard features

---

## 3) AWS setup checklist (staging first)

### 3.1 RDS (Postgres)
- Create RDS Postgres (Public access: **NO**)
- RDS SG: inbound 5432 only from EC2 SG
- Store credentials via env/Secrets Manager

### 3.2 EC2 (API host)
- Ubuntu LTS
- Install Node.js LTS, PM2/systemd, Nginx
- Deploy API, run Prisma migrations, start service(s)

### 3.3 Domain + HTTPS
- Nginx + Let’s Encrypt (fast) OR ALB + ACM (enterprise)

### 3.4 Job scheduling (automated push)
Choose one:
- **A (simple):** cron on EC2 → `node dist/jobs/push-reminder.job.js`
- **B (recommended):** separate worker process (PM2) running node-cron
- **C (later):** EventBridge schedule → Lambda/container task

---

## 4) Suggested repo structure

```
backend/
  src/
    routes/
      auth.routes.ts
      progress.routes.ts
      devices.routes.ts
      events.routes.ts
      admin.auth.routes.ts
      admin.users.routes.ts
      admin.analytics.routes.ts
      admin.push.routes.ts
      health.routes.ts
    services/
      auth.service.ts
      session.service.ts
      progress.service.ts
      device.service.ts
      onesignal.service.ts
      push-campaign.service.ts
      analytics.service.ts
    middlewares/
      playerAuth.middleware.ts
      adminAuth.middleware.ts
      error.middleware.ts
    jobs/
      push-reminder.job.ts
  prisma/
    schema.prisma
    migrations/
  openapi/
    openapi.yaml
  .env.example
```

---

## 5) Database schema — additions for v2.1

Keep v2 core tables: `User`, `UserSession`, `PlayerProgress`, `Device`, `Admin`, `AdminSession`, `Event`.

### 5.1 Add: PushCampaign
Stores the *intent*, targeting and scheduling for manual/admin pushes.

**Fields (minimum)**
- `id` (uuid)
- `createdByAdminId` (fk)
- `title` (string)
- `message` (string)
- `deepLink` (nullable string) — optional in-app navigation
- `audienceType` (enum): `ALL | USERS | TAGS`
- `audiencePayload` (json)
  - `USERS`: `{ userIds: [...] }`
  - `TAGS`: `{ tags: { cohort?: "...", role?: "...", unit?: "..." } }`
- `scheduleAt` (nullable datetime) — if null, send immediately
- `status` (enum): `DRAFT | SCHEDULED | SENDING | SENT | CANCELLED | FAILED`
- `onesignalResponse` (json, nullable)
- `createdAt`, `updatedAt`

### 5.2 Add: PushSendLog (optional but recommended)
Stores outcome metrics for audit + troubleshooting.

- `id`
- `campaignId`
- `sentAt`
- `targetCount` (int)
- `successCount` (int)
- `failureCount` (int)
- `response` (json)

> If keeping it minimal, you can store response JSON on `PushCampaign` and add this table later.

### 5.3 Device tagging strategy (for targeting)
Because RSAF admins cannot use OneSignal UI, targeting must be resolvable in backend.

Two options:
- **Option 1 (DB-driven targeting):** Store user attributes in DB (cohort/unit/role) and select devices by joins.
- **Option 2 (OneSignal tag-driven):** Backend sets tags on OneSignal via API when users register/update; campaigns target by tags.

v2.1 recommendation: start with **DB-driven targeting** (more predictable), and optionally also set tags in OneSignal for future use.

---

## 6) Authentication & RBAC

### 6.1 Tokens
- Access token (JWT): short-lived (15–60 min)
- Refresh token: long-lived (14–30 days), stored hashed, revocable

### 6.2 Admin roles
- `SUPER_ADMIN`: full access to all dashboard features (user management, analytics, campaigns)

Single admin role for v1. Granular RBAC (ANALYST, USER_ADMIN, CAMPAIGN_ADMIN) deferred to v2 if needed.

---

## 7) API endpoints (v2.1 minimum)

### 7.1 Utility
- `GET /health`

### 7.2 Player auth (Unity)
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/change-password`
- `POST /auth/logout`

### 7.3 Player progress (Unity)
- `GET /progress` (auth)
- `PUT /progress` (auth) body: `{ progress: {...} }`

### 7.4 Devices (Unity → backend)
- `POST /devices/register` (auth) body: `{ platform, oneSignalPlayerId, appVersion? }`
- `POST /devices/unregister` (optional)

### 7.5 Analytics ingestion (Unity)
- `POST /events` (auth) body: `{ type, occurredAt?, payload }`

### 7.6 Admin auth (Dashboard)
- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`
- `GET /admin/me`

### 7.7 Admin user management (Dashboard)
- `POST /admin/users/import` (CSV/JSON batch; creates users + temp passwords)
- `GET /admin/users`
- `GET /admin/users/{id}`
- `PATCH /admin/users/{id}` (enable/disable, forcePasswordChange, optional cohort/unit fields)
- `POST /admin/users/{id}/reset-password`

### 7.8 Admin analytics (Dashboard)
- `GET /admin/analytics/overview`
- `GET /admin/analytics/users/{id}`
- `GET /admin/exports/progress.csv` (optional)

### 7.9 Admin push campaigns (Dashboard) — NEW in v2.1
- `POST /admin/push/campaigns`
  - body: `{ title, message, deepLink?, audienceType, audiencePayload, scheduleAt? }`
  - if `scheduleAt` null: send immediately
  - if `scheduleAt` set: create scheduled campaign
- `GET /admin/push/campaigns`
- `GET /admin/push/campaigns/{id}`
- `POST /admin/push/campaigns/{id}/cancel` (if scheduled and not sent)
- `POST /admin/push/campaigns/{id}/send-now` (if created as draft)

**Important:** RSAF admins do not need OneSignal UI access; backend performs all OneSignal API calls.

---

## 8) Push sending behavior

### 8.1 Automated pushes (jobs)
- inactivity reminders
- streak nudges
- daily reminders

Guardrails:
- `PUSH_AUTOMATION_ENABLED`
- per-user cooldown
- global caps per run

### 8.2 Manual/admin campaigns
Backend must:
1. Validate RBAC + payload + schedule
2. Resolve audience into OneSignal player IDs (or target by tags if implemented)
3. Call OneSignal API to send
4. Record response and status transitions
5. Expose campaign status to dashboard

**Scheduling**
- If `scheduleAt` is used, a scheduler/worker picks due campaigns and sends.

**Anti-spam**
- Optional: enforce per-admin daily cap and per-user cooldown, or bypass cooldown for high-priority system messages.

---

## 9) Analytics: recommended minimum data

### 9.1 Progress snapshot (fast dashboard)
Store in `PlayerProgress.progressJson`:
- current module/scenario/checkpoint (if Unity uses IDs)
- total runs completed
- rolling average score
- last played at
- streak count (optional)

### 9.2 Event log (improvement over time)
Events should include:
- session_start / session_end
- run_started / run_completed
- attempt_submitted (score + breakdown + error tags)

Minimum payload keys:
- sessionId
- scenarioId (if applicable)
- durationMs
- scoreTotal (+ breakdown)
- errorTags (array)
- appVersion/platform (optional)

---

## 10) Swagger/OpenAPI requirements

- Swagger UI: `/docs`
- Spec: `/openapi.yaml` or `/openapi.json`
- Must include:
  - Separate tags: Player / Admin / Campaigns
  - Examples for login (`mustChangePassword`), progress, device register, events, campaign create
  - Standard error shapes for 400/401/403/500

---

## 11) Environment variables (minimum)

```
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public

JWT_PLAYER_ACCESS_SECRET=change_me
JWT_PLAYER_REFRESH_SECRET=change_me
JWT_ADMIN_ACCESS_SECRET=change_me
JWT_ADMIN_REFRESH_SECRET=change_me

JWT_ACCESS_TTL_MINUTES=30
JWT_REFRESH_TTL_DAYS=14

ONESIGNAL_APP_ID=...
ONESIGNAL_API_KEY=...

PUSH_AUTOMATION_ENABLED=false
PUSH_AUTOMATION_CRON=0 9 * * *

CAMPAIGNS_ENABLED=true
CAMPAIGN_SCHEDULER_ENABLED=true
```

---

## 12) Security requirements

- RDS not public; only EC2 SG allowed
- HTTPS only
- Password hashing (bcrypt/argon2)
- Refresh tokens hashed and revocable
- Rate limit login endpoints
- Protect `/docs` in production (basic auth/IP allowlist)
- Admin endpoints require RBAC; consider IP allowlist for dashboard

---

## 13) Acceptance criteria (v2.1)

**Player UX**
- Whitelisted player logs in with temp password
- Forced password change on first login
- Silent refresh maintains “always logged in”
- Logout works

**Progress**
- GET/PUT consistent

**Push**
- Devices register and store OneSignal IDs
- Automated jobs send notifications based on rules
- Admin can create and send a push campaign from dashboard without OneSignal UI access
- Scheduled campaigns send at the correct time
- Campaign status and audit are visible in dashboard

**Admin**
- Admin can import/reset/disable users
- Admin can view analytics from progress/events
- Super Admin can access all dashboard features (user ops, analytics, campaigns)

---

**Last updated:** 2026-02-06
