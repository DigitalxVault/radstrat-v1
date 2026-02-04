# Requirements: RADStrat Backend

**Defined:** 2026-02-04
**Core Value:** Users can authenticate and their game progress persists across sessions and devices

## v1 Requirements

Requirements for SIT deadline (Feb 10, 2026). Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: RDS Postgres instance provisioned (private access, EC2-only inbound)
- [ ] **INFRA-02**: EC2 instance running Node.js + PM2 + Nginx
- [ ] **INFRA-03**: Security groups configured (443 inbound to EC2, 5432 from EC2 SG to RDS only)
- [ ] **INFRA-04**: HTTPS domain with Let's Encrypt certificate (api-staging.{domain})

### Authentication

- [ ] **AUTH-01**: User can register with email and password
- [ ] **AUTH-02**: User can login with email and password
- [ ] **AUTH-03**: User can login via Google Sign-In (Unity sends ID token, backend verifies and returns JWT)
- [ ] **AUTH-04**: User can login via Apple Sign-In (Unity sends identity token, backend verifies and returns JWT)
- [ ] **AUTH-05**: JWT access tokens issued on successful auth (15-60 min TTL)
- [ ] **AUTH-06**: Refresh tokens stored hashed in DB (7-30 day TTL)
- [ ] **AUTH-07**: User can refresh access token using refresh token
- [ ] **AUTH-08**: User can logout (invalidates refresh token session)

### Progress

- [ ] **PROG-01**: User can save game progress (JSON blob via PUT /progress)
- [ ] **PROG-02**: User can load game progress (JSON blob via GET /progress)

### Push Notifications

- [ ] **PUSH-01**: User can register device for push notifications (iOS/Android token)
- [ ] **PUSH-02**: User can unregister device from push notifications
- [ ] **PUSH-03**: Admin/dev can send test push notification to registered device

### Documentation

- [ ] **DOCS-01**: Swagger UI hosted at GET /docs
- [ ] **DOCS-02**: OpenAPI spec available at GET /openapi.json
- [ ] **DOCS-03**: All endpoints documented with request/response schemas and examples

## v2 Requirements

Deferred to future releases. Not in current roadmap.

### Analytics
- **ANLY-01**: Dashboard showing daily active users
- **ANLY-02**: Progress completion metrics by role

### Admin
- **ADMN-01**: Admin portal to view user accounts
- **ADMN-02**: Admin can disable user accounts

### Notifications
- **NOTF-01**: Automated training reminder notifications (e.g., "You haven't practiced in 3 days")
- **NOTF-02**: New scenario available notifications

## Out of Scope

Explicitly excluded from backend scope.

| Feature | Reason |
|---------|--------|
| Scenario content storage | Unity-owned — scenarios bundled in app |
| Audio file storage | Unity-owned — audio bundled in app |
| Gameplay logic | Unity-owned — backend is dumb storage |
| Role validation | Roles (ST, MAC, AFE) are Unity concepts — backend stores whatever JSON Unity sends |
| Leaderboards | Not requested |
| Real-time multiplayer | Not applicable to training app |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| AUTH-08 | Phase 2 | Pending |
| PROG-01 | Phase 2 | Pending |
| PROG-02 | Phase 2 | Pending |
| PUSH-01 | Phase 4 | Pending |
| PUSH-02 | Phase 4 | Pending |
| PUSH-03 | Phase 4 | Pending |
| DOCS-01 | Phase 2 | Pending |
| DOCS-02 | Phase 2 | Pending |
| DOCS-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after initial definition*
