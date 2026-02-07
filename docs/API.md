# RADStrat API Reference

> Plain-language guide for non-technical stakeholders. For full technical documentation, see the [Swagger UI](https://api-radstrat.devsparksbuild.com/docs).

---

## Base URL

```
Production:  https://api-radstrat.devsparksbuild.com
Local:       http://localhost:3001
```

---

## What is this API?

This is the **backend server** for the RADStrat RSAF Unity mobile training game. It handles:

- **Player Authentication** – Login, password changes, session management
- **Game Progress** – Saving and loading player progress
- **Device Registration** – For push notifications
- **Gameplay Events** – Tracking player actions for analytics
- **Admin Management** – User import, account management, analytics

---

## Quick Flows

### Player Flow (How Players Use the Game)

1. **Login** → `POST /auth/login`
   - Player enters military email and temporary password
   - API returns access token (15 min) + refresh token (7 days)
   - Also returns `mustChangePassword: true` for first-time login

2. **Change Password** → `POST /auth/change-password`
   - Player must set their own password before playing
   - All other endpoints are blocked until password is changed

3. **Save/Load Progress** → `GET/PUT /progress`
   - Game saves player progress to cloud
   - Uses "optimistic locking" to prevent overwriting newer saves

4. **Submit Events** → `POST /events`
   - Game sends gameplay events (missions completed, achievements, etc.)
   - Batches up to 100 events at once

### Admin Flow (How Admins Manage Players)

1. **Admin Login** → `POST /admin/auth/login`
   - Separate admin login (Super Admin only)
   - Different token secrets than player tokens

2. **Import Players** → `POST /admin/users/import`
   - Bulk import up to 500 players at once
   - API generates temporary passwords for each player
   - Admin distributes these to players

3. **Manage Players** → `GET/PATCH /admin/users`
   - View all players with search and filters
   - Enable/disable accounts
   - Force password change (e.g., if compromise suspected)

4. **View Analytics** → `GET /admin/analytics/overview`
   - See aggregate stats (total players, active today, etc.)
   - Drill down to individual player activity

---

## Endpoint Summary

| # | Method | Path | What It Does | Who Uses It |
|---|--------|------|--------------|-------------|
| 1 | GET | `/health` | API health check | Anyone |
| 2 | POST | `/auth/login` | Player login | Unity Game |
| 3 | POST | `/auth/change-password` | Change player password | Unity Game |
| 4 | POST | `/auth/refresh` | Get new access token | Unity Game |
| 5 | POST | `/auth/logout` | Logout (invalidate tokens) | Unity Game |
| 6 | POST | `/admin/auth/login` | Admin login | Admin Dashboard |
| 7 | POST | `/admin/auth/refresh` | Refresh admin token | Admin Dashboard |
| 8 | POST | `/admin/auth/logout` | Admin logout | Admin Dashboard |
| 9 | GET | `/admin/me` | Get current admin profile | Admin Dashboard |
| 10 | GET | `/progress` | Load player progress | Unity Game |
| 11 | PUT | `/progress` | Save player progress | Unity Game |
| 12 | POST | `/devices/register` | Register device for push | Unity Game |
| 13 | POST | `/devices/unregister` | Unregister device | Unity Game |
| 14 | POST | `/events` | Submit gameplay events | Unity Game |
| 15 | POST | `/admin/users/import` | Bulk import players | Admin Dashboard |
| 16 | GET | `/admin/users` | List/search players | Admin Dashboard |
| 17 | GET | `/admin/users/:id` | Get player details | Admin Dashboard |
| 18 | PATCH | `/admin/users/:id` | Update player (disable, etc.) | Admin Dashboard |
| 19 | POST | `/admin/users/:id/reset-password` | Reset player password | Admin Dashboard |
| 20 | GET | `/admin/analytics/overview` | Aggregate analytics | Admin Dashboard |
| 21 | GET | `/admin/analytics/users/:id` | Player-specific analytics | Admin Dashboard |

---

## Common Questions

### How does authentication work?

**Two-token system** for security:

1. **Access Token** (valid 15 minutes)
   - Used for every API request
   - Sent in header: `Authorization: Bearer <token>`
   - Short lifetime = less damage if stolen

2. **Refresh Token** (valid 7 days)
   - Used to get new access tokens
   - Stored securely on device
   - Automatically rotated for security

**Why?** Military-grade security. If a token is stolen, it expires quickly. The refresh token can be revoked without affecting other players.

### What if a token expires?

The Unity game automatically:
1. Detects the 401 (Unauthorized) error
2. Calls `POST /auth/refresh` with the refresh token
3. Gets a new access token
4. Retries the original request

Players don't see any interruption.

### What happens when internet is lost?

The Unity game caches events locally. When connection returns:
1. `POST /events` sends all cached events (up to 100)
2. `PUT /progress` syncs the latest save

### How to import users?

Admin provides a JSON file:
```json
{
  "users": [
    { "name": "John Tan", "email": "john.tan@rsaf.mil.sg" },
    { "name": "Sarah Lee", "email": "sarah.lee@rsaf.mil.sg" }
  ]
}
```

API responds with temporary passwords:
```json
{
  "results": [
    { "email": "john.tan@rsaf.mil.sg", "tempPassword": "xK7mP9qL2n" },
    { "email": "sarah.lee@rsaf.mil.sg", "tempPassword": "jH5rT8wV3p" }
  ]
}
```

Admin distributes these passwords securely (e.g., via secure messaging).

### How do push notifications work?

1. Unity game calls `POST /devices/register` with device token
2. API stores the device + player association
3. When sending push notifications, API queries for player's devices
4. **No OneSignal tags** – fully database-driven targeting

---

## Error Codes

| Code | Meaning | What Happens |
|------|---------|--------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid input (validation error) |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Token valid but not allowed (e.g., password not changed) |
| 409 | Conflict | Progress version conflict (retry with latest version) |
| 429 | Too Many Requests | Rate limit exceeded (try again later) |
| 500 | Server Error | Something went wrong on our end |

---

## Security Features

- **Password hashing** using argon2 (GPU-resistant, military-grade)
- **Token rotation** prevents replay attacks
- **Family-based token reuse detection** revokes all tokens if compromise detected
- **Separate secrets** for player vs admin tokens (cross-usage rejected)
- **Rate limiting** on login endpoints (5 attempts / 15 minutes)
- **HTTPS required** in production (TLS via Certbot)

---

## Need Help?

- **Live API Docs**: https://api-radstrat.devsparksbuild.com/docs
- **OpenAPI Spec**: https://api-radstrat.devsparksbuild.com/openapi.json
- **GitHub**: https://github.com/DigitalxVault/radstrat-v1
- **Tech Lead**: [Contact info for escalation]
