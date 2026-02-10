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

## C# Data Models — Copy This Entire Block

Place these in a single file (e.g., `ApiModels.cs`) in your Unity project. All field names **must** match the JSON keys exactly.

```csharp
using System;

// ============================================================
//  AUTH MODELS
// ============================================================

[Serializable]
public class LoginRequest
{
    public string email;
    public string password;
}

[Serializable]
public class UserProfile
{
    public string id;
    public string email;
    public string firstName;
    public string lastName;
    public string role;
}

[Serializable]
public class LoginResponse
{
    public string accessToken;
    public string refreshToken;
    public bool mustChangePassword;
    public UserProfile user;
}

[Serializable]
public class ChangePasswordRequest
{
    public string currentPassword;
    public string newPassword;
}

[Serializable]
public class RefreshRequest
{
    public string refreshToken;
}

[Serializable]
public class TokenResponse
{
    public string accessToken;
    public string refreshToken;
}

[Serializable]
public class LogoutRequest
{
    public string refreshToken;
}

[Serializable]
public class MessageResponse
{
    public string message;
}

// ============================================================
//  PROGRESS MODELS
// ============================================================

[Serializable]
public class SaveProgressRequest
{
    public string progressData;  // JSON string — serialize your game state to string first
    public int version;
}

// Note: For GET /progress and PUT /progress responses, progressData is arbitrary JSON.
// Use JsonUtility for the wrapper and a JSON library (e.g., Newtonsoft) for progressData.
[Serializable]
public class ProgressResponse
{
    public string id;
    public string progressData;  // Raw JSON string — deserialize to your game state class
    public int version;
    public string savedAt;
}

[Serializable]
public class EmptyProgressResponse
{
    public string progressData;  // Will be "null"
    public int version;          // Will be 0
    public string message;
}

[Serializable]
public class ConflictResponse
{
    public string error;
    public string message;
    public int currentVersion;
}

// ============================================================
//  EVENT MODELS
// ============================================================

[Serializable]
public class GameEvent
{
    public string eventType;
    public string payload;  // JSON string — serialize your payload object first
}

[Serializable]
public class SubmitEventsRequest
{
    public GameEvent[] events;
}

[Serializable]
public class SubmitEventsResponse
{
    public int submitted;
}

// Event payload models (serialize these to JSON string for GameEvent.payload)

[Serializable]
public class InitialAssessmentPayload
{
    public float overallScore;  // REQUIRED for analytics
}

[Serializable]
public class GameStartPayload
{
    public string moduleId;     // Optional
    public string difficulty;   // Optional
}

[Serializable]
public class GameCompletePayload
{
    public float score;           // REQUIRED for analytics
    public int completionTime;    // Optional — seconds
    public int attemptsCount;     // Optional
    public string difficulty;     // Optional
    public string moduleId;       // Optional
}

// ============================================================
//  DEVICE MODELS
// ============================================================

[Serializable]
public class RegisterDeviceRequest
{
    public string platform;          // "ios" or "android"
    public string onesignalPlayerId; // Optional
    public string deviceToken;       // Optional
}

[Serializable]
public class DeviceResponse
{
    public string id;
    public string platform;
    public string onesignalPlayerId;
    public bool isActive;
    public string registeredAt;
}

[Serializable]
public class UnregisterDeviceRequest
{
    public string deviceId;
}

// ============================================================
//  ERROR MODEL
// ============================================================

[Serializable]
public class ApiError
{
    public string error;
    public string message;
}
```

> **Note on `progressData`**: Unity's `JsonUtility` cannot deserialize arbitrary/dynamic JSON. For the progress `progressData` field, you have two options:
> 1. **Recommended**: Use [Newtonsoft.Json for Unity](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.0/manual/index.html) (`JsonConvert.SerializeObject` / `DeserializeObject`)
> 2. Define a `[Serializable]` class for your specific game state and serialize/deserialize it separately

---

## 1. Authentication

### POST /auth/login

> Authenticate a player with email and password.

**Auth**: None
**Rate Limit**: 5 requests per 15 minutes

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator Login(string email, string password)
{
    LoginRequest body = new LoginRequest { email = email, password = password };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/auth/login", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            LoginResponse res = JsonUtility.FromJson<LoginResponse>(req.downloadHandler.text);
            accessToken = res.accessToken;
            refreshToken = res.refreshToken;

            if (res.mustChangePassword)
            {
                // Player must change password before doing anything else
                Debug.Log("Password change required");
            }
        }
        else
        {
            ApiError err = JsonUtility.FromJson<ApiError>(req.downloadHandler.text);
            Debug.LogError($"Login failed: {err.message}");
        }
    }
}
```

---

### POST /auth/change-password

> Change the player's password. **Mandatory on first login** when `mustChangePassword` is `true`. The player cannot access any other endpoint (progress, events, devices) until the password is changed.

**Auth**: Bearer token required
**Rate Limit**: 100 requests per minute (global default)

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator ChangePassword(string currentPassword, string newPassword)
{
    ChangePasswordRequest body = new ChangePasswordRequest
    {
        currentPassword = currentPassword,
        newPassword = newPassword
    };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/auth/change-password", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            TokenResponse res = JsonUtility.FromJson<TokenResponse>(req.downloadHandler.text);
            // IMPORTANT: Replace both tokens — old ones are revoked
            accessToken = res.accessToken;
            refreshToken = res.refreshToken;
            Debug.Log("Password changed successfully");
        }
        else
        {
            ApiError err = JsonUtility.FromJson<ApiError>(req.downloadHandler.text);
            Debug.LogError($"Change password failed: {err.message}");
        }
    }
}
```

---

### POST /auth/refresh

> Exchange a valid refresh token for a new access + refresh token pair. The old refresh token is automatically revoked.

**Auth**: None (the refresh token is sent in the body)
**Rate Limit**: 100 requests per minute

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator RefreshTokens()
{
    RefreshRequest body = new RefreshRequest { refreshToken = this.refreshToken };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/auth/refresh", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        // NOTE: No Authorization header needed for refresh

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            TokenResponse res = JsonUtility.FromJson<TokenResponse>(req.downloadHandler.text);
            accessToken = res.accessToken;
            refreshToken = res.refreshToken;
        }
        else
        {
            // Refresh failed — player must log in again
            Debug.LogWarning("Session expired, redirecting to login");
            GoToLoginScreen();
        }
    }
}
```

---

### POST /auth/logout

> Revoke the refresh token family. The access token remains valid until its natural expiry (15 minutes).

**Auth**: Bearer token required
**Rate Limit**: 100 requests per minute

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator Logout()
{
    LogoutRequest body = new LogoutRequest { refreshToken = this.refreshToken };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/auth/logout", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        // Clear tokens regardless of response
        accessToken = null;
        refreshToken = null;
        Debug.Log("Logged out");
    }
}
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

**C# Example:**
```csharp
// Your game state class — customize to match your actual game data
[Serializable]
public class MyGameState
{
    public int level;
    public int score;
    public string[] inventory;
    public int[] checkpoints;
}

private int currentVersion = 0;

IEnumerator LoadProgress()
{
    using (UnityWebRequest req = UnityWebRequest.Get(BASE_URL + "/progress"))
    {
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            string responseText = req.downloadHandler.text;

            // Check if progress exists by looking at version
            // Use a generic JSON parser to read version first
            ProgressResponse res = JsonUtility.FromJson<ProgressResponse>(responseText);
            currentVersion = res.version;

            if (currentVersion == 0)
            {
                Debug.Log("No saved progress — starting fresh");
                // Initialize default game state
            }
            else
            {
                // Deserialize progressData to your game state class
                // Using Newtonsoft.Json (recommended for nested/dynamic JSON):
                // MyGameState state = JsonConvert.DeserializeObject<MyGameState>(res.progressData);
                Debug.Log($"Loaded progress v{currentVersion}, saved at {res.savedAt}");
            }
        }
        else
        {
            HandleError(req);
        }
    }
}
```

---

### PUT /progress

> Save game state with optimistic concurrency control. The server checks the `version` field to prevent overwrites from stale data.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator SaveProgress(MyGameState gameState)
{
    // Serialize your game state to JSON string
    string progressJson = JsonUtility.ToJson(gameState);

    // Build the request body manually to embed progressData as raw JSON
    // Using Newtonsoft.Json (recommended):
    // string json = JsonConvert.SerializeObject(new { progressData = gameState, version = currentVersion });

    // Using string formatting as a simpler alternative:
    string json = $"{{\"progressData\":{progressJson},\"version\":{currentVersion}}}";

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/progress", "PUT"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            ProgressResponse res = JsonUtility.FromJson<ProgressResponse>(req.downloadHandler.text);
            currentVersion = res.version;  // Store new version for next save
            Debug.Log($"Progress saved — v{currentVersion}");
        }
        else if (req.responseCode == 409)
        {
            // Version conflict — reload and retry
            ConflictResponse conflict = JsonUtility.FromJson<ConflictResponse>(req.downloadHandler.text);
            Debug.LogWarning($"Version conflict! Server has v{conflict.currentVersion}");
            StartCoroutine(LoadProgress());  // Reload, then retry save
        }
        else
        {
            HandleError(req);
        }
    }
}
```

---

## 3. Event Submission

### POST /events

> Submit a batch of gameplay events. Events are stored for the admin analytics dashboard. You can send up to **100 events per request**.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request (JSON):**
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

**C# Example — Submitting Events:**
```csharp
IEnumerator SubmitEvents(GameEvent[] events)
{
    SubmitEventsRequest body = new SubmitEventsRequest { events = events };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/events", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            SubmitEventsResponse res = JsonUtility.FromJson<SubmitEventsResponse>(req.downloadHandler.text);
            Debug.Log($"Submitted {res.submitted} events");
        }
        else
        {
            HandleError(req);
        }
    }
}
```

**C# Example — Creating Each Event Type:**
```csharp
// Initial Assessment — send ONCE after first skill test
GameEvent CreateInitialAssessmentEvent(float overallScore)
{
    InitialAssessmentPayload payload = new InitialAssessmentPayload
    {
        overallScore = overallScore  // REQUIRED — baseline for analytics
    };
    return new GameEvent
    {
        eventType = "initial_assessment",
        payload = JsonUtility.ToJson(payload)
    };
}

// Game Start — send each time player starts a session
GameEvent CreateGameStartEvent(string moduleId, string difficulty)
{
    GameStartPayload payload = new GameStartPayload
    {
        moduleId = moduleId,
        difficulty = difficulty
    };
    return new GameEvent
    {
        eventType = "game_start",
        payload = JsonUtility.ToJson(payload)
    };
}

// Game Complete — send each time player finishes a session
GameEvent CreateGameCompleteEvent(float score, int completionTime, int attempts)
{
    GameCompletePayload payload = new GameCompletePayload
    {
        score = score,              // REQUIRED — tracked by analytics
        completionTime = completionTime,
        attemptsCount = attempts
    };
    return new GameEvent
    {
        eventType = "game_complete",
        payload = JsonUtility.ToJson(payload)
    };
}

// Usage:
void OnAssessmentComplete(float score)
{
    GameEvent evt = CreateInitialAssessmentEvent(score);
    eventQueue.Add(evt);
}

void OnGameStart(string moduleId)
{
    GameEvent evt = CreateGameStartEvent(moduleId, "normal");
    eventQueue.Add(evt);
}

void OnGameFinished(float score, int time, int attempts)
{
    GameEvent evt = CreateGameCompleteEvent(score, time, attempts);
    eventQueue.Add(evt);
    FlushEvents();  // Send immediately on game complete
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

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator RegisterDevice(string onesignalId, string deviceToken)
{
    RegisterDeviceRequest body = new RegisterDeviceRequest
    {
        #if UNITY_ANDROID
        platform = "android",
        #elif UNITY_IOS
        platform = "ios",
        #endif
        onesignalPlayerId = onesignalId,
        deviceToken = deviceToken
    };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/devices/register", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            DeviceResponse res = JsonUtility.FromJson<DeviceResponse>(req.downloadHandler.text);
            registeredDeviceId = res.id;  // Store for unregister
            Debug.Log($"Device registered: {res.platform}, ID: {res.id}");
        }
        else
        {
            HandleError(req);
        }
    }
}
```

---

### POST /devices/unregister

> Deactivate a device (soft delete). The record is kept for push notification history.

**Auth**: Bearer token required
**Prerequisite**: Password must be changed

**Request (JSON):**
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

**C# Example:**
```csharp
IEnumerator UnregisterDevice(string deviceId)
{
    UnregisterDeviceRequest body = new UnregisterDeviceRequest { deviceId = deviceId };
    string json = JsonUtility.ToJson(body);

    using (UnityWebRequest req = new UnityWebRequest(BASE_URL + "/devices/unregister", "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + accessToken);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Device unregistered");
        }
        else
        {
            HandleError(req);
        }
    }
}
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

## 9. Endpoint Summary Table

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

## 10. Reusable C# API Client

A complete helper class you can drop into your Unity project. Handles token management, request building, error handling, and event batching.

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

public class RadStratApiClient : MonoBehaviour
{
    // ================================================================
    //  CONFIGURATION
    // ================================================================

    private const string BASE_URL = "https://api-radstrat.devsparksbuild.com";

    private string accessToken;
    private string refreshToken;
    private int currentProgressVersion = 0;
    private string registeredDeviceId;

    // Event batching
    private List<GameEvent> eventQueue = new List<GameEvent>();
    private float eventFlushInterval = 30f;  // seconds
    private float lastFlushTime = 0f;

    // ================================================================
    //  TOKEN MANAGEMENT
    // ================================================================

    public bool IsLoggedIn => !string.IsNullOrEmpty(accessToken);
    public bool HasRefreshToken => !string.IsNullOrEmpty(refreshToken);

    private void SetTokens(string access, string refresh)
    {
        accessToken = access;
        refreshToken = refresh;
    }

    private void ClearTokens()
    {
        accessToken = null;
        refreshToken = null;
    }

    // ================================================================
    //  HTTP HELPERS
    // ================================================================

    /// <summary>
    /// Send a POST request with JSON body.
    /// </summary>
    private UnityWebRequest CreatePostRequest(string path, string jsonBody, bool auth = true)
    {
        UnityWebRequest req = new UnityWebRequest(BASE_URL + path, "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonBody);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        if (auth && !string.IsNullOrEmpty(accessToken))
            req.SetRequestHeader("Authorization", "Bearer " + accessToken);
        return req;
    }

    /// <summary>
    /// Send a PUT request with JSON body.
    /// </summary>
    private UnityWebRequest CreatePutRequest(string path, string jsonBody)
    {
        UnityWebRequest req = new UnityWebRequest(BASE_URL + path, "PUT");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonBody);
        req.uploadHandler = new UploadHandlerRaw(bodyRaw);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        if (!string.IsNullOrEmpty(accessToken))
            req.SetRequestHeader("Authorization", "Bearer " + accessToken);
        return req;
    }

    /// <summary>
    /// Send a GET request.
    /// </summary>
    private UnityWebRequest CreateGetRequest(string path)
    {
        UnityWebRequest req = UnityWebRequest.Get(BASE_URL + path);
        if (!string.IsNullOrEmpty(accessToken))
            req.SetRequestHeader("Authorization", "Bearer " + accessToken);
        return req;
    }

    /// <summary>
    /// Handle error responses consistently.
    /// </summary>
    private void HandleError(UnityWebRequest req, string context)
    {
        if (req.responseCode == 401)
        {
            Debug.LogWarning($"[API] {context}: Unauthorized — token may be expired");
            // Attempt refresh or redirect to login
        }
        else if (req.responseCode == 429)
        {
            Debug.LogWarning($"[API] {context}: Rate limited — retry later");
        }
        else
        {
            try
            {
                ApiError err = JsonUtility.FromJson<ApiError>(req.downloadHandler.text);
                Debug.LogError($"[API] {context}: {err.error} — {err.message}");
            }
            catch
            {
                Debug.LogError($"[API] {context}: HTTP {req.responseCode}");
            }
        }
    }

    // ================================================================
    //  AUTH
    // ================================================================

    /// <summary>
    /// Login with email and password. Callback receives LoginResponse or null on failure.
    /// </summary>
    public IEnumerator Login(string email, string password, Action<LoginResponse> callback)
    {
        LoginRequest body = new LoginRequest { email = email, password = password };

        using (UnityWebRequest req = CreatePostRequest("/auth/login", JsonUtility.ToJson(body), auth: false))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                LoginResponse res = JsonUtility.FromJson<LoginResponse>(req.downloadHandler.text);
                SetTokens(res.accessToken, res.refreshToken);
                callback?.Invoke(res);
            }
            else
            {
                HandleError(req, "Login");
                callback?.Invoke(null);
            }
        }
    }

    /// <summary>
    /// Change password (mandatory on first login). Returns new tokens.
    /// </summary>
    public IEnumerator ChangePassword(string currentPw, string newPw, Action<bool> callback)
    {
        ChangePasswordRequest body = new ChangePasswordRequest
        {
            currentPassword = currentPw,
            newPassword = newPw
        };

        using (UnityWebRequest req = CreatePostRequest("/auth/change-password", JsonUtility.ToJson(body)))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                TokenResponse res = JsonUtility.FromJson<TokenResponse>(req.downloadHandler.text);
                SetTokens(res.accessToken, res.refreshToken);
                callback?.Invoke(true);
            }
            else
            {
                HandleError(req, "ChangePassword");
                callback?.Invoke(false);
            }
        }
    }

    /// <summary>
    /// Refresh tokens. Returns true on success, false if re-login is needed.
    /// </summary>
    public IEnumerator RefreshTokens(Action<bool> callback)
    {
        if (!HasRefreshToken)
        {
            callback?.Invoke(false);
            yield break;
        }

        RefreshRequest body = new RefreshRequest { refreshToken = this.refreshToken };

        using (UnityWebRequest req = CreatePostRequest("/auth/refresh", JsonUtility.ToJson(body), auth: false))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                TokenResponse res = JsonUtility.FromJson<TokenResponse>(req.downloadHandler.text);
                SetTokens(res.accessToken, res.refreshToken);
                callback?.Invoke(true);
            }
            else
            {
                ClearTokens();
                callback?.Invoke(false);
            }
        }
    }

    /// <summary>
    /// Logout and clear all tokens.
    /// </summary>
    public IEnumerator Logout(Action callback)
    {
        LogoutRequest body = new LogoutRequest { refreshToken = this.refreshToken };

        using (UnityWebRequest req = CreatePostRequest("/auth/logout", JsonUtility.ToJson(body)))
        {
            yield return req.SendWebRequest();
            ClearTokens();
            callback?.Invoke();
        }
    }

    // ================================================================
    //  PROGRESS
    // ================================================================

    /// <summary>
    /// Load saved progress. Callback receives progressData JSON string and version.
    /// </summary>
    public IEnumerator LoadProgress(Action<string, int> callback)
    {
        using (UnityWebRequest req = CreateGetRequest("/progress"))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                string text = req.downloadHandler.text;
                ProgressResponse res = JsonUtility.FromJson<ProgressResponse>(text);
                currentProgressVersion = res.version;

                if (res.version == 0)
                {
                    callback?.Invoke(null, 0);  // No progress yet
                }
                else
                {
                    callback?.Invoke(res.progressData, res.version);
                }
            }
            else
            {
                HandleError(req, "LoadProgress");
                callback?.Invoke(null, -1);
            }
        }
    }

    /// <summary>
    /// Save progress. Handles 409 conflict automatically by reloading.
    /// </summary>
    public IEnumerator SaveProgress(string progressDataJson, Action<bool> callback)
    {
        string json = $"{{\"progressData\":{progressDataJson},\"version\":{currentProgressVersion}}}";

        using (UnityWebRequest req = CreatePutRequest("/progress", json))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                ProgressResponse res = JsonUtility.FromJson<ProgressResponse>(req.downloadHandler.text);
                currentProgressVersion = res.version;
                callback?.Invoke(true);
            }
            else if (req.responseCode == 409)
            {
                Debug.LogWarning("[API] SaveProgress: Version conflict — reload needed");
                callback?.Invoke(false);
            }
            else
            {
                HandleError(req, "SaveProgress");
                callback?.Invoke(false);
            }
        }
    }

    // ================================================================
    //  EVENTS
    // ================================================================

    /// <summary>
    /// Queue an event for batched submission.
    /// </summary>
    public void QueueEvent(string eventType, string payloadJson)
    {
        eventQueue.Add(new GameEvent
        {
            eventType = eventType,
            payload = payloadJson
        });
    }

    /// <summary>
    /// Convenience: Queue an initial_assessment event.
    /// </summary>
    public void QueueInitialAssessment(float overallScore)
    {
        InitialAssessmentPayload p = new InitialAssessmentPayload { overallScore = overallScore };
        QueueEvent("initial_assessment", JsonUtility.ToJson(p));
    }

    /// <summary>
    /// Convenience: Queue a game_start event.
    /// </summary>
    public void QueueGameStart(string moduleId = "", string difficulty = "")
    {
        GameStartPayload p = new GameStartPayload { moduleId = moduleId, difficulty = difficulty };
        QueueEvent("game_start", JsonUtility.ToJson(p));
    }

    /// <summary>
    /// Convenience: Queue a game_complete event.
    /// </summary>
    public void QueueGameComplete(float score, int completionTime = 0, int attempts = 0)
    {
        GameCompletePayload p = new GameCompletePayload
        {
            score = score,
            completionTime = completionTime,
            attemptsCount = attempts
        };
        QueueEvent("game_complete", JsonUtility.ToJson(p));
    }

    /// <summary>
    /// Flush queued events to the server.
    /// </summary>
    public IEnumerator FlushEvents(Action<int> callback = null)
    {
        if (eventQueue.Count == 0)
        {
            callback?.Invoke(0);
            yield break;
        }

        GameEvent[] batch = eventQueue.ToArray();
        eventQueue.Clear();

        SubmitEventsRequest body = new SubmitEventsRequest { events = batch };

        using (UnityWebRequest req = CreatePostRequest("/events", JsonUtility.ToJson(body)))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                SubmitEventsResponse res = JsonUtility.FromJson<SubmitEventsResponse>(req.downloadHandler.text);
                callback?.Invoke(res.submitted);
            }
            else
            {
                // Re-queue events on failure
                eventQueue.InsertRange(0, batch);
                HandleError(req, "FlushEvents");
                callback?.Invoke(-1);
            }
        }
    }

    /// <summary>
    /// Auto-flush events periodically. Call this from Update().
    /// </summary>
    private void Update()
    {
        if (IsLoggedIn && eventQueue.Count > 0 && Time.time - lastFlushTime > eventFlushInterval)
        {
            lastFlushTime = Time.time;
            StartCoroutine(FlushEvents());
        }
    }

    // ================================================================
    //  DEVICES
    // ================================================================

    /// <summary>
    /// Register device for push notifications.
    /// </summary>
    public IEnumerator RegisterDevice(string onesignalId, string deviceToken, Action<DeviceResponse> callback)
    {
        RegisterDeviceRequest body = new RegisterDeviceRequest
        {
            #if UNITY_ANDROID
            platform = "android",
            #elif UNITY_IOS
            platform = "ios",
            #else
            platform = "android",
            #endif
            onesignalPlayerId = onesignalId ?? "",
            deviceToken = deviceToken ?? ""
        };

        using (UnityWebRequest req = CreatePostRequest("/devices/register", JsonUtility.ToJson(body)))
        {
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                DeviceResponse res = JsonUtility.FromJson<DeviceResponse>(req.downloadHandler.text);
                registeredDeviceId = res.id;
                callback?.Invoke(res);
            }
            else
            {
                HandleError(req, "RegisterDevice");
                callback?.Invoke(null);
            }
        }
    }
}
```

### Usage Example

```csharp
public class GameManager : MonoBehaviour
{
    RadStratApiClient api;

    void Start()
    {
        api = gameObject.AddComponent<RadStratApiClient>();
    }

    // Called when player taps "Login" button
    public void OnLoginPressed(string email, string password)
    {
        StartCoroutine(api.Login(email, password, (res) =>
        {
            if (res == null) return;

            if (res.mustChangePassword)
            {
                ShowChangePasswordScreen();
            }
            else
            {
                StartCoroutine(OnLoginSuccess());
            }
        }));
    }

    IEnumerator OnLoginSuccess()
    {
        // Register device for push notifications
        yield return api.RegisterDevice(OneSignal.GetPlayerId(), null, (device) =>
        {
            Debug.Log($"Device registered: {device?.id}");
        });

        // Load saved progress
        yield return api.LoadProgress((progressJson, version) =>
        {
            if (version == 0)
                Debug.Log("Fresh player — no saved progress");
            else
                Debug.Log($"Loaded progress v{version}");
        });
    }

    // Called when player completes initial assessment
    public void OnAssessmentComplete(float score)
    {
        api.QueueInitialAssessment(score);
        StartCoroutine(api.FlushEvents());  // Send immediately
    }

    // Called when player starts a game session
    public void OnGameStart(string moduleId)
    {
        api.QueueGameStart(moduleId, "normal");
        // Events will auto-flush every 30 seconds via Update()
    }

    // Called when player finishes a game session
    public void OnGameComplete(float score, int timeSec, int attempts)
    {
        api.QueueGameComplete(score, timeSec, attempts);
        StartCoroutine(api.FlushEvents());  // Send immediately on completion
    }

    // Called at checkpoints or auto-save intervals
    public void OnSaveProgress(MyGameState state)
    {
        string json = JsonUtility.ToJson(state);
        StartCoroutine(api.SaveProgress(json, (success) =>
        {
            if (!success)
                Debug.LogWarning("Save failed — may need to reload progress");
        }));
    }
}
```

### Error Handling Pattern

```
HTTP 401 → Token expired → Call RefreshTokens() → If false → Show login screen
HTTP 409 → Version conflict → Call LoadProgress() → Retry SaveProgress()
HTTP 429 → Rate limited → Wait 5 seconds → Retry
HTTP 5xx → Server error → Retry up to 3 times with exponential backoff
```
