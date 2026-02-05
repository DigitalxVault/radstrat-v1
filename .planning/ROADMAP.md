# Roadmap: RADStrat Backend

**Created:** 2026-02-04
**Target:** SIT by Feb 10, 2026 (6 days)
**Core Value:** Users can authenticate and their game progress persists across sessions and devices

## Milestone 1: v1.0 — SIT Release

### Phase 1: AWS Infrastructure

**Goal:** Production-ready AWS environment exists with secure networking

**Requirements:**
- INFRA-01: RDS Postgres instance (private, EC2-only access)
- INFRA-02: EC2 instance with Node.js + PM2 + Nginx
- INFRA-03: Security groups configured
- INFRA-04: HTTPS domain with Let's Encrypt

**Plans:** 3 plans

Plans:
- [ ] 01-PLAN-01.md — Create security groups, launch EC2, allocate Elastic IP
- [ ] 01-PLAN-02.md — Create RDS PostgreSQL instance, verify private connectivity
- [ ] 01-PLAN-03.md — Install Node.js stack, deploy health check, configure Nginx + SSL

**Success Criteria:**
1. RDS Postgres instance accessible from EC2 only (psql test from EC2 succeeds, fails from elsewhere)
2. EC2 instance running with Node.js 20 LTS, PM2 process manager, and Nginx reverse proxy
3. Security groups allow only 443 inbound to EC2, 5432 from EC2 SG to RDS
4. HTTPS endpoint responds at api-staging domain with valid certificate
5. GET /health returns `{"status":"ok"}` with 200

**Parallel user action:** None — this phase must complete before API development

---

### Phase 2: Core API (Email Auth + Progress)

**Goal:** Unity team can integrate basic authentication and progress storage — delivers core value without external dependencies

**Requirements:**
- AUTH-01: Register with email/password
- AUTH-02: Login with email/password
- AUTH-05: JWT access tokens
- AUTH-06: Refresh tokens (hashed in DB)
- AUTH-07: Refresh token endpoint
- AUTH-08: Logout
- PROG-01: Save progress
- PROG-02: Load progress
- DOCS-01: Swagger UI at /docs
- DOCS-02: OpenAPI spec at /openapi.json
- DOCS-03: All endpoints documented

**Success Criteria:**
1. POST /auth/register creates user and returns accessToken + refreshToken
2. POST /auth/login validates credentials and returns accessToken + refreshToken
3. POST /auth/refresh returns new accessToken given valid refreshToken
4. POST /auth/logout invalidates session (refresh token no longer works)
5. PUT /progress saves JSON blob for authenticated user
6. GET /progress returns saved JSON blob for authenticated user
7. GET /docs shows Swagger UI with all implemented endpoints documented

**Parallel user action:** Set up Google Cloud Console OAuth credentials + Apple Developer Sign In configuration

---

### Phase 3: OAuth Integration

**Goal:** Users can authenticate via Google and Apple sign-in from Unity client

**Requirements:**
- AUTH-03: Google Sign-In (token exchange)
- AUTH-04: Apple Sign-In (token exchange)

**Success Criteria:**
1. POST /auth/oauth/google accepts Unity ID token, verifies with Google, returns JWT tokens
2. POST /auth/oauth/apple accepts Unity identity token, verifies signature, returns JWT tokens
3. OAuth-authenticated users can save/load progress identically to email users
4. Existing user with same email can link OAuth account (no duplicate accounts)

**Parallel user action:** Set up OneSignal account and configure iOS/Android push

---

### Phase 4: Push Notifications

**Goal:** Devices can register for and receive push notifications via OneSignal

**Requirements:**
- PUSH-01: Register device
- PUSH-02: Unregister device
- PUSH-03: Test send

**Success Criteria:**
1. POST /push/register-device stores device token (platform, token, appVersion)
2. POST /push/unregister-device removes device token
3. POST /push/test sends push notification that arrives on registered device
4. Duplicate device tokens are handled (upsert, not error)

**Parallel user action:** None — ready for SIT

---

## Phase Dependencies

```
Phase 1 (Infrastructure)
    |
    v
Phase 2 (Core API) -------> Unity team can start integration
    |
    v
Phase 3 (OAuth) ----------> Full auth suite complete
    |
    v
Phase 4 (Push) ------------> SIT Ready
```

## Requirement Coverage

| Category | Requirements | Phase | Count |
|----------|--------------|-------|-------|
| Infrastructure | INFRA-01, INFRA-02, INFRA-03, INFRA-04 | 1 | 4 |
| Authentication | AUTH-01, AUTH-02, AUTH-05, AUTH-06, AUTH-07, AUTH-08 | 2 | 6 |
| Authentication | AUTH-03, AUTH-04 | 3 | 2 |
| Progress | PROG-01, PROG-02 | 2 | 2 |
| Push | PUSH-01, PUSH-02, PUSH-03 | 4 | 3 |
| Documentation | DOCS-01, DOCS-02, DOCS-03 | 2 | 3 |

**Total:** 20 requirements mapped across 4 phases
**Unmapped:** 0

---
*Roadmap created: 2026-02-04*
*Last updated: 2026-02-05 after Phase 1 planning*
