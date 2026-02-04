# RADStrat Backend

## What This Is

Backend API for RADStrat, a radio telephony training mobile game for RSAF personnel. The backend handles authentication (email/password + Google/Apple OAuth), player progress storage, and push notifications. Unity mobile client consumes this API — Unity never touches the database directly.

## Core Value

**Users can authenticate and their game progress persists across sessions and devices.**

If push notifications fail, the game still works. If OAuth fails, email login still works. But if auth or progress storage breaks, the game is unusable.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Email/password authentication (register, login, logout)
- [ ] Google Sign-In (Unity obtains ID token, backend verifies)
- [ ] Apple Sign-In (Unity obtains identity token, backend verifies)
- [ ] JWT access tokens (short-lived) + refresh tokens (long-lived, stored hashed)
- [ ] Player progress save/load (JSON blob storage)
- [ ] Push notification device registration (iOS/Android tokens)
- [ ] Push notification sending (training reminders)
- [ ] Swagger/OpenAPI documentation at /docs
- [ ] AWS infrastructure (EC2 + RDS Postgres)
- [ ] HTTPS with staging domain (api-staging.radstrat.com or similar)

### Out of Scope

- Scenario content, audio files, gameplay logic — Unity-owned
- Admin portal — not for v1
- Analytics dashboards — not for v1
- Leaderboards — not requested
- Role validation — backend stores whatever JSON Unity sends, roles (ST, MAC, AFE) are Unity-side concepts

## Context

**Game domain**: Radio telephony training for military/aviation personnel. Users select a role (Security Trooper, Mindef Approved Contractor, or Airforce Engineer) for tutorial, then switch roles during gameplay based on scenario structure.

**Team structure**: Full-stack dev (backend) + separate Unity game dev team. Swagger docs must be clear enough for Unity team to integrate without constant back-and-forth.

**Target users**: Initially RSAF personnel, eventually public product (no special compliance requirements).

**AWS experience**: New to AWS. Need guidance on infrastructure setup.

**External dependencies** (all need setup):
- Google Cloud Console — OAuth credentials for Google Sign-In
- Apple Developer Portal — Sign In with Apple configuration
- OneSignal — push notification service

**Reference spec**: See `docs/Backend Build Spec.md` for detailed endpoint contracts, database schema, and security requirements.

## Constraints

- **Timeline**: SIT (System Integration Testing) deadline Feb 10, 2026 — 6 days from project start
- **Tech stack**: Node.js + Express + Prisma ORM + PostgreSQL (per spec, non-negotiable)
- **Infrastructure**: AWS EC2 + RDS in ap-southeast-1 (Singapore)
- **Security**: RDS not public, HTTPS only, passwords hashed (bcrypt), refresh tokens hashed, rate limiting on auth endpoints

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Roles stored in progress JSON, not validated by backend | Unity owns role logic, backend is dumb storage | — Pending |
| OneSignal for push (not raw FCM) | Simpler setup, handles both iOS/Android | — Pending |
| Email auth first, then OAuth | No external dependencies, unblocks Unity team faster | — Pending |
| Option 1 deployment (Nginx + Let's Encrypt on EC2) | Faster than ALB setup for staging | — Pending |

---
*Last updated: 2026-02-04 after initialization*
