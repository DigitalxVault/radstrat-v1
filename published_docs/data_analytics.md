# RADStrat v1 — Unity Integration Guide

> **Base URL**: `https://api-radstrat.devsparksbuild.com`
> **Swagger UI**: `https://api-radstrat.devsparksbuild.com/docs`
> **OpenAPI Spec**: `https://api-radstrat.devsparksbuild.com/openapi.json`
> **Generated**: 2026-02-10

---

## Quick Start — Integration Flow

```
1. POST /auth/login              → Get accessToken + refreshToken + mustChangePassword
2. IF mustChangePassword == true:
   POST /auth/change-password    → Get new token pair (MANDATORY before any other call)
3. POST /devices/register        → Register device for push notifications
4. GET  /progress                → Load saved game state (or version: 0 if first time)
5. GAMEPLAY LOOP:
   ├─ POST /events               → Submit gameplay events (batch up to 100)
   └─ PUT  /progress             → Save game state (send current version for concurrency)
6. POST /auth/logout             → Revoke refresh token family on sign-out
```

**All endpoints except `/auth/login`, `/auth/refresh`, and `/health` require the access token:**
```
Authorization: Bearer {accessToken}
```

---

## 1. Authentication

### POST /auth/login

> Authenticate a player with email and password.

**Auth**: None
**Rate Limit**: 5 requests per 15 minutes

**Request:**
```json
{
  "email": "wei.ming.tan@demo.radstrat.mil.sg",
  "password": "qAn8S6*6kjpA"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 1 character |

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "mustChangePassword": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "wei.ming.tan@demo.radstrat.mil.sg",
    "firstName": "Wei Ming",
    "lastName": "Tan",
    "role": "PLAYER"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT, expires in 15 minutes |
| `refreshToken` | string | JWT, expires in 7 days |
| `mustChangePassword` | boolean | If `true`, call `/auth/change-password` before anything else |
| `user.id` | string (UUID) | Player's unique ID |
| `user.role` | string | Always `"PLAYER"` for player accounts |

**Error (401 Unauthorized):**
```json
{ "error": "Unauthorized", "message": "Invalid credentials" }
```
```json
{ "error": "Unauthorized", "message": "Account is disabled" }
```

---

### POST /auth/change-password

> Change the player's password. **Mandatory on first login** when `mustChangePassword` is `true`. The player cannot access any other endpoint (progress, events, devices) until the password is changed.

**Auth**: Bearer token required
**Rate Limit**: 100 requests per minute (global default)

**Request:**
```json
{
  "currentPassword": "qAn8S6*6kjpA",
  "newPassword": "MyNewSecure#Pass1"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `currentPassword` | string | Yes | Min 1 character |
| `newPassword` | string | Yes | 8–128 characters, must differ from current |

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> All previous tokens are revoked. Use the new tokens from this response.

**Error (400 Bad Request):**
```json
{ "error": "BadRequest", "message": "Current password is incorrect" }
```
```json
{ "error": "BadRequest", "message": "New password must be different from current password" }
```

---

### POST /auth/refresh

> Exchange a valid refresh token for a new access + refresh token pair. The old refresh token is automatically revoked.

**Auth**: None (the refresh token is sent in the body)
**Rate Limit**: 100 requests per minute

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `refreshToken` | string | Yes | Min 1 character |

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error (401 Unauthorized):**
```json
{ "error": "Unauthorized", "message": "Token refresh failed" }
```

**Security — Reuse Detection:**
If a revoked refresh token is reused (e.g., stolen token replay), the **entire token family** is revoked immediately. This forces all sessions for that user to re-authenticate. This is a military-grade security measure.

---

### POST /auth/logout

> Revoke the refresh token family. The access token remains valid until its natural expiry (15 minutes).

**Auth**: Bearer token required
**Rate Limit**: 100 requests per minute

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `refreshToken` | string | Yes | Min 1 character |

**Response (200 OK):**
```json
{ "message": "Logged out successfully" }
```

---

## 2. Game Progress

### GET /progress

> Load the latest saved game state for the authenticated player.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed (`mustChangePassword` must be `false`)

**Request:** No body. No query parameters.

**Response (200 OK) — Progress exists:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "progressData": {
    "level": 3,
    "score": 1500,
    "inventory": ["item_a", "item_b"],
    "checkpoints": [1, 2, 3]
  },
  "version": 5,
  "savedAt": "2026-02-10T08:30:00.000Z"
}
```

**Response (200 OK) — No progress saved yet:**
```json
{
  "progressData": null,
  "version": 0,
  "message": "No progress saved yet"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Progress record ID (absent if no progress yet) |
| `progressData` | object or null | Arbitrary JSON — your game state. `null` if never saved. |
| `version` | integer | Current version number. `0` if never saved. **Send this value back when saving.** |
| `savedAt` | string (ISO 8601) | Last save timestamp (absent if no progress yet) |

---

### PUT /progress

> Save game state with optimistic concurrency control. The server checks the `version` field to prevent overwrites from stale data.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request:**
```json
{
  "progressData": {
    "level": 4,
    "score": 2200,
    "inventory": ["item_a", "item_b", "item_c"],
    "checkpoints": [1, 2, 3, 4]
  },
  "version": 5
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `progressData` | object | Yes | Any valid JSON object (your game state) |
| `version` | integer | Yes | Min 1. Must match server's current version. For first save, send `1`. |

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "progressData": { "level": 4, "score": 2200, "..." : "..." },
  "version": 6,
  "savedAt": "2026-02-10T09:15:00.000Z"
}
```

> The returned `version` is incremented. Store it and send it with the next save.

**Error (409 Conflict) — Version mismatch:**
```json
{
  "error": "Conflict",
  "message": "Progress has been modified since your last read. Reload and retry.",
  "currentVersion": 7
}
```

**How to handle 409:**
1. Call `GET /progress` to reload the latest state
2. Merge or replace local state as appropriate
3. Retry `PUT /progress` with the correct `version`

---

## 3. Event Submission

### POST /events

> Submit a batch of gameplay events. Events are stored for the admin analytics dashboard. You can send up to **100 events per request**.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request:**
```json
{
  "events": [
    {
      "eventType": "initial_assessment",
      "payload": {
        "overallScore": 45.5
      }
    },
    {
      "eventType": "game_start",
      "payload": {
        "moduleId": "mod_training_basic",
        "difficulty": "normal"
      }
    },
    {
      "eventType": "game_complete",
      "payload": {
        "score": 78.3,
        "completionTime": 1245,
        "attemptsCount": 3
      }
    }
  ]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `events` | array | Yes | Min 1, max 100 events |
| `events[].eventType` | string | Yes | 1–100 characters |
| `events[].payload` | object or omit | No | Arbitrary key-value JSON. Omit or set `null` if no data. |

**Response (200 OK):**
```json
{
  "submitted": 3
}
```

---

### Event Types Reference

The API accepts **any** `eventType` string, but the following three are used by the admin analytics dashboard. If you send these event types, you **must** include the specified payload fields for the dashboard charts to work.

| Event Type | `eventType` String | Required Payload Fields | Optional Payload Fields |
|------------|-------------------|------------------------|------------------------|
| Initial Assessment | `"initial_assessment"` | `overallScore` (number) | Any additional fields |
| Game Start | `"game_start"` | None | `moduleId`, `difficulty`, etc. |
| Game Complete | `"game_complete"` | `score` (number) | `completionTime`, `attemptsCount`, `difficulty`, etc. |

### Event Payload Details

#### `initial_assessment`

Send **once** when the player completes their initial skill assessment (before gameplay begins).

```json
{
  "eventType": "initial_assessment",
  "payload": {
    "overallScore": 45.5
  }
}
```

| Payload Field | Type | Required | Description |
|---------------|------|----------|-------------|
| `overallScore` | number | **Yes** | The player's overall assessment score. Used as the baseline for measuring improvement. |

**Dashboard usage:**
- Score Comparison chart (initial average)
- Improvement Distribution (baseline for delta calculation)
- Top Improvers list (starting score)
- User Management table (Initial RT column)

#### `game_start`

Send each time the player starts a game session.

```json
{
  "eventType": "game_start",
  "payload": {
    "moduleId": "mod_training_basic",
    "difficulty": "normal"
  }
}
```

| Payload Field | Type | Required | Description |
|---------------|------|----------|-------------|
| (any) | any | No | All fields are optional. The event itself is counted for engagement tracking. |

**Dashboard usage:**
- Engagement Funnel ("Started" stage — counts distinct users with any event)
- Daily Active Users (counts any event activity)

#### `game_complete`

Send each time the player finishes a game session.

```json
{
  "eventType": "game_complete",
  "payload": {
    "score": 78.3,
    "completionTime": 1245,
    "attemptsCount": 3,
    "difficulty": "normal",
    "moduleId": "mod_training_basic"
  }
}
```

| Payload Field | Type | Required | Description |
|---------------|------|----------|-------------|
| `score` | number | **Yes** | The player's final score for this session. Used to track improvement over time. |
| `completionTime` | number | No | Time in seconds to complete the session |
| `attemptsCount` | number | No | Number of attempts in this session |
| `difficulty` | string | No | Difficulty level played |
| `moduleId` | string | No | Which training module was completed |

**Dashboard usage:**
- Score Comparison chart (current average — uses latest `game_complete` per player)
- Score Trend chart (daily average score over 7 days)
- Improvement Distribution (current score for delta calculation)
- Top Improvers list (current score)
- Repeat Players chart (counts multiple completions per user)
- Completion Rate (counts distinct users who completed)
- User Management table (Current RT column)

---

### Custom Event Types

You can send **any** `eventType` string beyond the three above. These are stored in the database and can be queried later for custom analytics. Examples:

```json
{ "eventType": "tutorial_completed", "payload": { "step": 5 } }
{ "eventType": "item_collected", "payload": { "itemId": "medkit_01" } }
{ "eventType": "level_failed", "payload": { "level": 3, "reason": "timeout" } }
```

These won't appear in the current dashboard charts but are available for future analytics.

---

## 4. Device Registration

### POST /devices/register

> Register or update a device for push notifications. Idempotent — re-registering the same platform updates the existing record.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request:**
```json
{
  "platform": "android",
  "onesignalPlayerId": "abc123-onesignal-id",
  "deviceToken": "fcm-or-apns-device-token"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `platform` | string | Yes | Must be `"ios"` or `"android"` |
| `onesignalPlayerId` | string | No | OneSignal player ID |
| `deviceToken` | string | No | FCM (Android) or APNs (iOS) device token |

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "android",
  "onesignalPlayerId": "abc123-onesignal-id",
  "isActive": true,
  "registeredAt": "2026-02-10T08:00:00.000Z"
}
```

---

### POST /devices/unregister

> Deactivate a device (soft delete). The record is kept for push notification history.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `deviceId` | string (UUID) | Yes | Must be a UUID of a device owned by the authenticated player |

**Response (200 OK):**
```json
{ "message": "Device unregistered successfully" }
```

**Error (404 Not Found):**
```json
{ "error": "NotFound", "message": "Device not found" }
```

---

## 5. Health Check

### GET /health

> Check API and database health.

**Auth**: None

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T09:09:16.934Z",
  "database": "connected",
  "uptime": 10.95
}
```

---

## 6. Authentication Details

### Token Format

All authenticated requests must include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Lifecycle

| Token | Expiry | Usage |
|-------|--------|-------|
| Access Token | 15 minutes | Sent with every API request in `Authorization` header |
| Refresh Token | 7 days | Used to get a new token pair via `POST /auth/refresh` |

### Recommended Token Refresh Strategy

1. Store both tokens securely on the device
2. Before each API call, check if the access token is about to expire (e.g., < 1 minute remaining)
3. If expiring, call `POST /auth/refresh` first to get a new pair
4. If refresh fails with 401, redirect the player to the login screen
5. On app launch, attempt `POST /auth/refresh` — if it fails, require re-login

### Security: Refresh Token Reuse Detection

The server uses **family-based reuse detection**:

- Each refresh token belongs to a "family" (chain of rotated tokens)
- When a refresh token is used, a new token is issued and the old one is revoked
- If a **revoked** refresh token is reused (indicating theft/replay), the **entire family** is revoked
- This forces all sessions for that user to re-authenticate

**Important**: Never use a refresh token more than once. Always store the latest token pair from the most recent refresh/login response.

---

## 7. Error Handling

### Standard Error Response

All errors follow this shape:

```json
{
  "error": "ErrorType",
  "message": "Human-readable description"
}
```

### HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Validation error (missing fields, invalid format, bad password rules) |
| 401 | Unauthorized | Invalid/expired token, bad credentials, disabled account |
| 404 | Not Found | Device not found (wrong ID or not owned by player) |
| 409 | Conflict | Progress version mismatch (stale data — reload and retry) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Global (all endpoints) | 100 requests | 1 minute |
| Login only | 5 requests | 15 minutes |

When rate limited, the response is:
```json
{ "error": "Too Many Requests", "message": "Rate limit exceeded. Please try again later." }
```

### Validation Errors

Request body validation failures return 400 with details about which fields failed:
```json
{
  "error": "BadRequest",
  "message": "Validation error",
  "details": [
    { "path": ["email"], "message": "Invalid email" },
    { "path": ["password"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

---

## 8. Analytics Dashboard — What Data Powers Each Chart

This table maps which event payload fields are consumed by the admin analytics dashboard. **Only `overallScore` and `score` are read from the JSON payload** — all other payload fields are stored but not currently queried.

| Dashboard Chart | Event Type(s) Used | Payload Field Read | How It's Used |
|-----------------|-------------------|--------------------|---------------|
| Daily Active Users | Any event | None (counts distinct users) | Users with any event in the last 7 days |
| Completion Rate | `game_complete` | None (counts distinct users) | Completed / Total players percentage |
| Repeat Players | `game_complete` | None (counts completions) | Single vs multiple completions per user |
| Engagement Funnel | All / `game_complete` | None (counts distinct users) | Whitelisted → Started → Completed |
| Score Comparison | `initial_assessment` + `game_complete` | `overallScore` + `score` | Avg initial score vs avg latest score |
| Score Trend | `game_complete` | `score` | Daily average score over last 7 days |
| Improvement Distribution | `initial_assessment` + `game_complete` | `overallScore` + `score` | Histogram of (latest score - initial score) |
| Top Improvers | `initial_assessment` + `game_complete` | `overallScore` + `score` | Top 5 players by score gain |
| User Table (Initial RT) | `initial_assessment` | `overallScore` | First assessment score per user |
| User Table (Current RT) | `game_complete` | `score` | Latest completion score per user |

### Key Rules

1. **`initial_assessment` should be sent once** — the first one per user is used as the baseline. If sent multiple times, the earliest is used.
2. **`game_complete` can be sent many times** — the latest one per user is used for current score comparisons. All of them are counted for completion metrics.
3. **`game_start` triggers engagement tracking** — any event counts a user as "Started". No specific payload fields are needed.
4. **Custom event types are stored but not charted** — you can send any `eventType` string for future use.

---

## 9. Complete Request/Response Reference

### Headers for All Authenticated Requests

```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

### Headers for Unauthenticated Requests (login, refresh, health)

```
Content-Type: application/json
```

### Endpoint Summary Table

| # | Method | Path | Auth | Password Changed | Description |
|---|--------|------|------|------------------|-------------|
| 1 | POST | `/auth/login` | No | N/A | Login, get tokens |
| 2 | POST | `/auth/refresh` | No | N/A | Refresh token pair |
| 3 | POST | `/auth/change-password` | Yes | N/A | Change password, get new tokens |
| 4 | POST | `/auth/logout` | Yes | N/A | Revoke refresh token family |
| 5 | GET | `/progress` | Yes | Yes | Load game state |
| 6 | PUT | `/progress` | Yes | Yes | Save game state |
| 7 | POST | `/events` | Yes | Yes | Submit gameplay events (batch) |
| 8 | POST | `/devices/register` | Yes | Yes | Register device for push |
| 9 | POST | `/devices/unregister` | Yes | Yes | Deactivate device |
| 10 | GET | `/health` | No | N/A | Health check |

> **"Password Changed" = Yes** means the endpoint will return 403 if the player hasn't changed their initial password yet.

---

## 10. Unity C# Integration Tips

### Recommended HTTP Client

Use `UnityWebRequest` or a wrapper library. Set headers:

```csharp
request.SetRequestHeader("Content-Type", "application/json");
request.SetRequestHeader("Authorization", "Bearer " + accessToken);
```

### Token Storage

- Store `accessToken` and `refreshToken` in memory (not PlayerPrefs for security)
- On app backgrounding, persist encrypted tokens to secure storage
- On app resume, check token validity and refresh if needed

### Event Batching

Instead of sending one event per API call, batch events locally and send them periodically:

```
1. Collect events in a local queue (List<GameEvent>)
2. Every 30 seconds (or on scene transition), POST /events with the batch
3. On batch success, clear the queue
4. On failure, retain events and retry on next interval
5. On app close/background, flush remaining events immediately
```

### Progress Save Strategy

```
1. On significant checkpoints (level complete, inventory change), save progress
2. Auto-save every 2-5 minutes during gameplay
3. Always include the current `version` from the last GET or PUT response
4. Handle 409 by reloading progress and re-saving with correct version
```

### Error Handling Pattern

```
HTTP 401 → Token expired → Try refresh → If refresh fails → Re-login
HTTP 409 → Version conflict → Reload progress → Retry save
HTTP 429 → Rate limited → Wait and retry with exponential backoff
HTTP 5xx → Server error → Retry with backoff (max 3 attempts)
```
