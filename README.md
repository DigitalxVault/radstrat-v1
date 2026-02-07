<div align="center">

# RADStrat

**Backend API & Admin Dashboard for RADSTRAT Mobile Training Game**

[![Deploy](https://github.com/DigitalxVault/radstrat-v1/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/DigitalxVault/radstrat-v1/actions)
[![API](https://img.shields.io/badge/API-live-brightgreen?logo=fastify)](https://api-radstrat.devsparksbuild.com/health)
[![Swagger](https://img.shields.io/badge/docs-Swagger%20UI-85EA2D?logo=swagger)](https://api-radstrat.devsparksbuild.com/docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-private-red)](/)

</div>

---

## Overview

RADStrat is a Unity mobile RT training game. It provides player authentication, progress persistence, device management, event tracking, and admin user management — all secured with JWT token rotation and family-based reuse detection.

### Key Highlights

| | Feature | Detail |
|---|---------|--------|
| **Auth** | JWT Token Rotation | Access (15 min) + Refresh (7 days) with family-based reuse detection |
| **Security** | Argon2id Hashing | OWASP-recommended, GPU-resistant password hashing |
| **Performance** | Fastify 5.7 | 2x Express throughput with auto-generated OpenAPI spec |
| **Database** | Prisma 7 + PostgreSQL | Type-safe ORM with driver-based adapter (no engine binary) |
| **CI/CD** | GitHub Actions | Auto-deploy to EC2 on push to `main` |
| **Docs** | Swagger UI | Interactive API documentation at `/docs` |

---

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │          Turborepo Monorepo         │
                        │                                     │
  Unity Game ──────┐    │  apps/api          Fastify 5.7      │
                   │    │  apps/dashboard    Next.js (Phase 4)│
  Admin Panel ─────┼───▶│  packages/database Prisma 7         │
                   │    │  packages/shared   Zod schemas      │
  Swagger UI ──────┘    │                                     │
                        └──────────────┬──────────────────────┘
                                       │
                        ┌──────────────▼──────────────────────┐
                        │        Production (AWS)             │
                        │                                     │
                        │  EC2 ── Nginx (TLS) ── PM2 ── :3001 │
                        │                  │                  │
                        │            RDS PostgreSQL           │
                        │           (private subnet)          │
                        └─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 22 | Server runtime |
| Framework | Fastify 5.7 | HTTP server + Zod type provider |
| Language | TypeScript 5.9 | Type safety across the stack |
| Database | PostgreSQL (RDS) | Relational data store |
| ORM | Prisma 7 | Type-safe database access + migrations |
| Validation | Zod 4 | Runtime validation + OpenAPI spec generation |
| Auth | jose + argon2 | JWT signing + password hashing |
| Build | tsup + Turborepo | ESM bundling + monorepo orchestration |
| Process | PM2 | Production process management |
| Proxy | Nginx + Certbot | TLS termination + security headers |
| CI/CD | GitHub Actions | Auto-deploy on push to main |

---

## API Endpoints

### Player Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Player login | - |
| `POST` | `/auth/change-password` | Change password (required on first login) | Player |
| `POST` | `/auth/refresh` | Rotate refresh token | - |
| `POST` | `/auth/logout` | Revoke refresh token | Player |
| `GET` | `/progress` | Load saved progress | Player |
| `PUT` | `/progress` | Save progress (optimistic concurrency) | Player |
| `POST` | `/devices/register` | Register device for push notifications | Player |
| `POST` | `/devices/unregister` | Unregister device | Player |
| `POST` | `/events` | Submit gameplay events (batch up to 100) | Player |

### Admin Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/admin/auth/login` | Admin login | - |
| `POST` | `/admin/auth/refresh` | Rotate admin refresh token | - |
| `POST` | `/admin/auth/logout` | Revoke admin token | Admin |
| `GET` | `/admin/me` | Current admin profile | Admin |
| `POST` | `/admin/users/import` | Bulk import users (up to 500) | Admin |
| `GET` | `/admin/users` | List users (paginated, searchable) | Admin |
| `GET` | `/admin/users/:id` | User detail | Admin |
| `PATCH` | `/admin/users/:id` | Update user (enable/disable) | Admin |
| `POST` | `/admin/users/:id/reset-password` | Reset user password | Admin |
| `GET` | `/admin/analytics/overview` | Aggregate analytics | Admin |
| `GET` | `/admin/analytics/users/:id` | Per-user analytics | Admin |

### System

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Health check + DB connectivity | - |

> **Interactive docs:** [api-radstrat.devsparksbuild.com/docs](https://api-radstrat.devsparksbuild.com/docs)

---

## Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│      users       │       │  refresh_tokens  │
├──────────────────┤       ├──────────────────┤
│ id           PK  │──┐    │ id           PK  │
│ email     UNIQUE │  ├───▶│ userId       FK  │
│ firstName        │  │    │ tokenHash UNIQUE │
│ lastName         │  │    │ family           │
│ passwordHash     │  │    │ expiresAt        │
│ role             │  │    │ revokedAt        │
│ isActive         │  │    └──────────────────┘
│ mustChangePassword│ │
│ lastLoginAt      │  │    ┌──────────────────┐
└──────────────────┘  │    │ player_progress  │
                      │    ├──────────────────┤
                      ├───▶│ userId    FK, UQ │
                      │    │ progressData JSON│
                      │    │ version      INT │
                      │    └──────────────────┘
                      │
                      │    ┌──────────────────┐
                      ├───▶│     devices      │
                      │    ├──────────────────┤
                      │    │ userId       FK  │
                      │    │ platform         │
                      │    │ onesignalPlayerId│
                      │    └──────────────────┘
                      │
                      │    ┌──────────────────┐
                      └───▶│     events       │
                           ├──────────────────┤
                           │ userId       FK  │
                           │ eventType        │
                           │ payload     JSON │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  push_campaigns  │──────▶│   push_send_logs │
├──────────────────┤       ├──────────────────┤
│ title, message   │       │ campaignId   FK  │
│ audienceType     │       │ userId, deviceId │
│ status           │       │ status           │
└──────────────────┘       └──────────────────┘
```

---

## Project Structure

```
radstrat-v1/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── config/         # Environment validation
│   │   │   ├── lib/            # JWT, password, crypto utilities
│   │   │   ├── middleware/     # Auth guards (player, admin, password-change)
│   │   │   ├── routes/         # Route handlers by domain
│   │   │   │   ├── auth/       # Player authentication
│   │   │   │   ├── admin/      # Admin auth, users, analytics
│   │   │   │   ├── progress/   # Save/load game progress
│   │   │   │   ├── devices/    # Device registration
│   │   │   │   └── events/     # Gameplay event ingestion
│   │   │   ├── services/       # Business logic (token, user)
│   │   │   └── types/          # TypeScript declarations
│   │   └── tsup.config.ts
│   └── dashboard/              # Next.js admin UI (Phase 4)
├── packages/
│   ├── database/               # Prisma schema, client, migrations
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── prisma.config.ts
│   └── shared/                 # Zod schemas shared across apps
│       └── src/schemas/        # auth, user, progress, device, event
├── docs/                       # Project documentation
├── .github/workflows/          # CI/CD pipeline
├── deploy.sh                   # Production deployment script
├── ecosystem.config.cjs        # PM2 process configuration
├── turbo.json                  # Turborepo task pipeline
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9.15
- **PostgreSQL** 15+ (local or RDS)

### Setup

```bash
# Clone the repository
git clone https://github.com/DigitalxVault/radstrat-v1.git
cd radstrat-v1

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# Generate Prisma client & run migrations
pnpm db:generate
pnpm db:migrate

# Start development server
pnpm dev --filter=@repo/api
```

The API will be running at `http://localhost:3001` with Swagger UI at `http://localhost:3001/docs`.

### Common Commands

```bash
pnpm dev                          # Start all packages in dev mode
pnpm build                        # Build all packages
pnpm check-types                  # Type check all packages
pnpm db:generate                  # Regenerate Prisma client
pnpm db:migrate                   # Create new migration (dev only)
pnpm db:deploy                    # Apply migrations (production)
```

---

## Security

This project is built for a military training context. Security measures include:

- **Separate JWT secrets** for player and admin tokens (cross-usage rejected)
- **Token rotation** with family-based reuse detection (compromised tokens revoke entire family)
- **Argon2id** password hashing with OWASP-recommended parameters
- **Rate limiting** on authentication endpoints (5 attempts / 15 minutes)
- **Force password change** on first login
- **Helmet** security headers (HSTS, X-Frame-Options, CSP, etc.)
- **RDS in private subnet** (not publicly accessible)
- **TLS** via Let's Encrypt with auto-renewal

---

## Deployment

Production deploys automatically via GitHub Actions on push to `main`.

```
Push to main  →  GitHub Actions  →  SSH to EC2  →  deploy.sh
                                                      │
                                    git pull ──────────┤
                                    pnpm install ──────┤
                                    prisma migrate ────┤
                                    pnpm build ────────┤
                                    pm2 reload ────────┤
                                    health check ──────┘
```

| Component | Detail |
|-----------|--------|
| **Server** | EC2 (ap-southeast-1) |
| **Database** | RDS PostgreSQL (private) |
| **Domain** | `api-radstrat.devsparksbuild.com` |
| **TLS** | Let's Encrypt (Certbot auto-renew) |
| **Process** | PM2 with reboot survival |
| **Proxy** | Nginx reverse proxy |

---

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | AWS Infrastructure + Project Foundation | Done |
| 2 | Player Auth + Progress + Admin Management | Done |
| 3 | Push Notifications + Automated Jobs | Planned |
| 4 | Admin Dashboard (Next.js) | Planned |
| 5 | Analytics + Production Monitoring | Planned |

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Plain-language endpoint guide |
| [Database Reference](docs/database-quick-reference.md) | Schema diagram and table details |
| [Architecture Decision](docs/akshay.md) | Why separate backend vs Next.js API routes |
| [Changelog](docs/CHANGELOG.md) | Detailed build log with issues and debugging |

---

<div align="center">

Built by [MAGES Studio](https://www.magesstudio.com/) | Powered by [Fastify](https://fastify.dev/) + [Prisma](https://www.prisma.io/)

</div>
