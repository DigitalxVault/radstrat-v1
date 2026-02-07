# Separate Backend Architecture Decision

> To: Akshay (Dev Advisor)
> From: RADStrat v1 Development Team
> Date: 2025-02-07
> Subject: Implementation of Separate Backend Recommendation

---

## Your Advice

> *"Let me know if you need any help with the DB. Also, create a separate backend instead of using the API router of Next.js."*

## What This Means

Your recommendation was to **build a standalone backend server** rather than using Next.js API routes (`app/api/` directory). Here's what that means:

### Next.js API Routes (What We Did NOT Use)

```typescript
// ❌ NOT this approach
// apps/dashboard/app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ users: [] })
}
```

- API routes run **within the Next.js server process**
- Share resources with frontend rendering (SSR, page generation)
- Scaling = scaling the entire Next.js application
- Subject to Next.js middleware vulnerabilities (e.g., CVE-2025-29927)

### Standalone Backend (What We DID Use)

```typescript
// ✅ This approach - Fastify standalone server
// apps/api/src/app.ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.get('/health', async () => ({ status: 'ok' }))

app.listen({ port: 3001 })
```

- Backend runs as a **separate Node.js process**
- Independent scaling, deployment, and monitoring
- No dependency on Next.js for API functionality
- Unity mobile client can consume REST API directly (no SSR needed)

---

## Why This Matters

### 1. Independent Scaling
- **API and Dashboard scale separately**
- High Unity game traffic ≠ High admin dashboard traffic
- Can allocate resources where actually needed

### 2. Security Isolation
- API vulnerabilities don't affect dashboard (and vice versa)
- No shared middleware attack surface
- Can apply stricter security policies to API without breaking dashboard

### 3. Performance
- **Fastify 5.7** has ~2x the throughput of Express
- No SSR overhead blocking API requests
- Dedicated worker processes for API (PM2 clustering independent)

### 4. Better for Unity Clients
- Mobile apps don't need server-rendered HTML
- Pure JSON REST API is simpler to consume
- No Next.js-specific quirks to work around

### 5. Operational Simplicity
- API and dashboard have separate deploy pipelines
- API can restart without affecting dashboard availability
- Separate logging, monitoring, and alerting

---

## Proof It Was Implemented

### 1. Monorepo Structure

```
radstrat-v1/
├── apps/
│   ├── api/           ← Standalone Fastify backend (port 3001)
│   └── dashboard/     ← Next.js admin dashboard (future)
├── packages/
│   ├── database/      ← Prisma 7 client (shared)
│   └── shared/        ← Zod schemas (shared)
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

### 2. Separate PM2 Processes

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'radstrat-api',
      script: './apps/api/dist/server.js',
      instances: 1, // API runs standalone
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    // dashboard will have its own entry when implemented
  ],
}
```

### 3. Zero Next.js Dependency in API

```bash
# apps/api/package.json has NO Next.js dependency
{
  "dependencies": {
    "@fastify/swagger": "^9.0.0",
    "@fastify/swagger-ui": "^2.0.0",
    "fastify": "^5.7.0",
    "jose": "^5.9.6",
    "argon2": "^0.31.2",
    "@repo/database": "workspace:*",
    "@repo/shared": "workspace:*"
    // NO "next", no Next.js API routes
  }
}
```

### 4. Separate Nginx Proxy Routes

```nginx
# /etc/nginx/sites-available/radstrat
server {
    server_name api-radstrat.devsparksbuild.com;

    location / {
        proxy_pass http://localhost:3001;  # ← Standalone Fastify
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard will have its own subdomain when deployed
# server {
#     server_name dashboard-radstrat.devsparksbuild.com;
#     location / {
#         proxy_pass http://localhost:3000;  # ← Next.js
#     }
# }
```

### 5. Live Swagger Documentation

You can verify the standalone API is running at:

**Swagger UI**: https://api-radstrat.devsparksbuild.com/docs

This proves:
- API is deployed independently
- Fastify + Swagger integration working
- All 21 Phase 2 endpoints documented
- OpenAPI spec available at `/openapi.json`

---

## Technology Stack Summary

| Component | Technology | Notes |
|-----------|------------|-------|
| **HTTP Framework** | Fastify 5.7 | ~2x Express throughput, native Zod→OpenAPI |
| **API Docs** | @fastify/swagger | Auto-generated from Zod schemas |
| **Validation** | Zod v4 | Single source of truth for types + OpenAPI |
| **JWT** | jose | ESM-native, zero dependencies |
| **Passwords** | argon2 | OWASP-recommended, GPU-resistant |
| **ORM** | Prisma 7 | @prisma/adapter-pg (driver-based) |
| **Deployment** | PM2 | Standalone process, independent scaling |

---

## Next Steps

1. **Admin Dashboard** (Phase 6+) will be a separate Next.js app consuming this API
2. **Unity Mobile Client** already has all endpoints documented in Swagger
3. **Push Notifications** will be handled by API worker process (no dashboard involvement)

---

**Confirmation**: Your advice to use a separate backend has been fully implemented. The API is production-ready at https://api-radstrat.devsparksbuild.com with Swagger documentation available for the Unity team.
