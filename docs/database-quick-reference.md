# Database Quick Reference

Copy-paste commands for accessing the RADStrat database. See `database-access.md` for the security rationale.

## Visual Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              RADStrat Database Schema                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      User        │         │  PlayerProgress  │         │     Device       │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)         │────┐    │ id (PK)         │         │ id (PK)         │
│ name            │    │    │ userId (FK)─────┼─────────│ userId (FK)─────┼───┐
│ email           │    │    │ progressData    │         │ platform        │   │
│ passwordHash    │    │    │ version         │         │ deviceToken     │   │
│ role            │    │    │ savedAt         │         │ isActive        │   │
│ isActive        │    │    └──────────────────┘         │ registeredAt    │   │
│ mustChangePasswd│    │                               │ unregisteredAt │   │
│ createdAt       │    │                               └──────────────────┘   │
│ updatedAt       │    │                                                       │
└──────────────────┘    │                                                       │
        │               │                                                       │
        │               │                       ┌──────────────────────┐        │
        │               │                       │       Event           │        │
        │               │                       ├──────────────────────┤        │
        │               │    ┌──────────────────│ id (PK)              │        │
        │               │    │                  │ userId (FK)──────────┼────────┘
        │               │    │                  │ eventType            │
        │               │    │                  │ payload (JSONB)      │
        │               │    │                  │ timestamp            │
        │               │    │                  └──────────────────────┘
        │               │    │
        │               │    │       ┌──────────────────────┐
        │               └────┼───────│    RefreshToken       │
                            │       ├──────────────────────┤
                            └───────│ id (PK)              │
                                    │ userId (FK)──────────┘
                                    │ token (hashed)       │
                                    │ family               │
                                    │ expiresAt            │
                                    │ revokedAt            │
                                    └──────────────────────┘

LEGEND:
  PK  = Primary Key
  FK  = Foreign Key
  ─── = One-to-Many relationship
  ─── = One-to-One relationship

RELATIONSHIPS:
  ┌─────────────┐
  │    User     │
  └──────┬──────┘
         │
         ├─── 1:1 ──→ PlayerProgress  (each user has one progress record)
         │
         ├─── 1:N ──→ Device         (each user can have multiple devices)
         │
         ├─── 1:N ──→ Event          (each user can have many events)
         │
         └─── 1:N ──→ RefreshToken   (each user can have multiple active tokens)
```

## Table Details

### User
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | Player full name |
| email | String | Unique, used for login |
| passwordHash | String | argon2id hashed (NOT plain text) |
| role | String | `PLAYER` or `SUPER_ADMIN` |
| isActive | Boolean | Account enabled/disabled |
| mustChangePassword | Boolean | Force password change on next login |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### PlayerProgress
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID (FK) | References User.id |
| progressData | JSONB | Game progress (Unity-defined structure) |
| version | Int | Optimistic concurrency counter |
| savedAt | DateTime | Last save timestamp |

### Device
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID (FK) | References User.id |
| platform | String | `ios` or `android` |
| deviceToken | String | Push notification token |
| isActive | Boolean | Device currently active |
| registeredAt | DateTime | Registration timestamp |
| unregisteredAt | DateTime? | Soft delete timestamp |

### Event
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID (FK) | References User.id |
| eventType | String | Event type name |
| payload | JSONB | Event data (flexible schema) |
| timestamp | DateTime | Event occurrence time |

### RefreshToken
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID (FK) | References User.id |
| token | String | SHA-256 hashed token |
| family | String | Token family for rotation/reuse detection |
| expiresAt | DateTime | Token expiration (7 days) |
| revokedAt | DateTime? | Revocation timestamp (null if active) |

---

## Step 1 — Open SSH Tunnel (Terminal 1)

```bash
ssh -i ~/.ssh/radstrat-key.pem -L 5433:radstrat-db.cfwsowiao2ha.ap-southeast-1.rds.amazonaws.com:5432 -N ubuntu@13.228.99.8
```

Leave this terminal open. No output is normal.

## Step 2 — Choose Your Tool (Terminal 2)

### Prisma Studio (Visual UI)

```bash
cd "/Users/origene/1. MAGES STUDIO/RADStrat v1"
npx prisma studio --url "postgresql://radstrat_admin:m2VXFP%25tRvh6GaHuBxx1@localhost:5433/radstrat" --config packages/database/prisma.config.ts
```

Then open http://localhost:5555

### psql (Command Line SQL)

```bash
psql "postgresql://radstrat_admin:m2VXFP%25tRvh6GaHuBxx1@localhost:5433/radstrat"
```

### GUI Client (TablePlus, DBeaver, etc.)

| Field    | Value            |
|----------|------------------|
| Host     | localhost        |
| Port     | 5433             |
| Database | radstrat         |
| User     | radstrat_admin   |
| Password | *(see .env)*     |

## Step 3 — Cleanup

`Ctrl+C` in both terminals when done.
