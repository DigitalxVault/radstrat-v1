# RADStrat v1

## What This Is

A backend API (Node.js + Prisma + Postgres) and admin dashboard (Next.js) for a Unity mobile training game used by Republic of Singapore Air Force (RSAF) service members. The backend handles whitelist-based player authentication, player progress persistence, push notifications via OneSignal, and provides an admin portal for user management, analytics, and push campaigns.

## Core Value

Unity team can authenticate whitelisted RSAF players and save/load their training progress — this unblocks mobile game development and is the foundation everything else builds on.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] AWS infrastructure (RDS Postgres, EC2, security groups, HTTPS)
- [ ] Whitelist-based player auth (temp password, forced change, JWT access+refresh)
- [ ] Player progress save/load (JSON snapshots)
- [ ] Device registration for push notifications (OneSignal player IDs)
- [ ] Automated push notifications (inactivity reminders, streak nudges, daily reminders)
- [ ] Admin push campaigns (create, send, schedule, cancel — no OneSignal UI access)
- [ ] Admin authentication (single Super Admin role)
- [ ] Admin user management (import whitelist, reset password, enable/disable)
- [ ] Admin analytics (progress overview, per-user details, event trends)
- [ ] Analytics event ingestion from Unity client
- [ ] Admin dashboard frontend (Next.js)
- [ ] Swagger/OpenAPI documentation at `/docs`
- [ ] Production deployment with monitoring (CloudWatch)

### Out of Scope

- OAuth/social login — whitelist-only auth per RSAF requirements
- Mobile app development — Unity team owns the client
- Gameplay logic, scenarios, audio — Unity-owned
- Real-time multiplayer/WebSocket — not needed for training game
- Granular RBAC (multiple admin roles) — single Super Admin for v1
- OneSignal UI access for admins — all push operations through backend API

## Context

- **Client**: RSAF (Republic of Singapore Air Force) — military training context
- **Unity team**: Building the mobile game, waiting on API endpoints ASAP for integration
- **Spec document**: `docs/Backend Build Spec v2.1.md` — collaborative spec, source of truth
- **Previous work**: Earlier planning docs deleted due to major auth model and feature changes
- **Admin users**: RSAF administrators managing player accounts and sending push notifications
- **Players**: RSAF service members using the Unity mobile game for training
- **Push strategy**: DB-driven targeting (not OneSignal tag-driven) for v1

## Constraints

- **Cloud**: AWS only (EC2 + RDS) — organizational requirement
- **Runtime**: Node.js with TypeScript — team expertise
- **ORM**: Prisma with PostgreSQL — spec requirement
- **Push service**: OneSignal — spec requirement (account not yet created)
- **Dashboard**: Next.js (React) — chosen during project initialization
- **Timeline**: ASAP — Unity team is blocked waiting for auth + progress endpoints
- **Security**: HTTPS only, RDS not public, password hashing, rate limiting on auth
- **Admin model**: Single Super Admin role with full access (no granular RBAC in v1)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Whitelist-only auth (no OAuth) | RSAF controls who accesses the system | — Pending |
| Single Super Admin role | Simplifies v1, granular RBAC deferred | — Pending |
| Next.js for admin dashboard | React ecosystem, SSR capabilities | — Pending |
| DB-driven push targeting | More predictable than OneSignal tags | — Pending |
| Prioritize auth + progress first | Unblocks Unity team integration ASAP | — Pending |
| Node.js + Prisma + Postgres | Team expertise, spec requirement | — Pending |

---
*Last updated: 2026-02-06 after initialization*
