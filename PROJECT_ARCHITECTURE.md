# skyra-social-service — Project Architecture & Design Specification (PAD)

## 1. Executive Summary & Core Responsibilities
`skyra-social-service` is the Automated Social Media Publisher of the Skyra Tech ecosystem. It uses Node.js and TypeScript to expose HTTP REST endpoints for scheduling, formatting, and publishing multi-platform social media posts across LinkedIn, Twitter (X), Instagram, and Facebook.

### Service SLAs
* **Social Post Dispatches**: Deliver post content payloads to social platform gateways in under 2.0 seconds.
* **Health Checks**: Return health status check updates in under 200ms.

---

## 2. High-Level Architecture & Lifecycle Diagrams

```text
  Client (Jarvis Call)
            │
            ▼ [HTTP POST]
    Express Server (strictly 127.0.0.1:8005)
            │
      ┌─────┼─────┬─────┐
      ▼     ▼     ▼     ▼
  LinkedIn Twitter Insta Facebook
   Adapter Adapter Adapter Adapter
      │     │     │     │
      └─────┴─────┼─────┘
                  ▼
         Promise.allSettled() Broadcast
```

### Component Interaction Matrix

| Source Component | Target Component | Protocol | Payload Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skyra-jarvis` | `/linkedin/post` | HTTP POST | JSON | Formats and publishes text/link updates to LinkedIn |
| `skyra-jarvis` | `/twitter/post` | HTTP POST | JSON | Formats and delivers content updates to Twitter (X) |
| `skyra-jarvis` | `/instagram/post`| HTTP POST | JSON | Dispatches image URLs and captions to Instagram |
| `skyra-jarvis` | `/facebook/post` | HTTP POST | JSON | Delivers post content to Facebook Page feed |
| `skyra-jarvis` | `/broadcast`     | HTTP POST | JSON | Executes parallel posting across multiple selected platforms |
| `skyra-jarvis` | `/health`        | HTTP GET  | JSON | Inspects adapter configurations and readiness |

---

## 3. Directory Structure & Code Taxonomy
```text
apps/skyra-social-service/
├── package.json             ← Node package dependencies
├── tsconfig.json            ← TypeScript compilations definitions
├── .env                     ← Service token configuration
├── .gitignore               ← Credentials lock rules
└── src/
    ├── config.ts            ← Environment loader (port, mock toggles)
    ├── social.ts            ← SocialMediaService (Constraints checks, Promise.allSettled broadcast)
    └── index.ts             ← Express HTTP routes (CORS, loopback 127.0.0.1)
```

### Lifecycle Scopes
* **Singleton Social Publisher (`SocialMediaService`)**: Initialized once on startup, checking adapter mock parameters and active credentials.
* **Request-Scoped API Postings**: Compiles, validates, and dispatches JSON payloads to social endpoints per platform constraints during the request lifetime.

---

## 4. Technical Specs & Feature Deep-Dive

### Pluggable Adapter Pattern (`ISocialAdapter`)
Platform API calls delegate through a mockable interface structure:
* If mock switches are set to `true` (default), the service writes raw output logs to console stdout and returns simulated post metadata, bypassing actual API calls.
* When set to `false`, the client executes actual HTTP fetch queries against Twitter, LinkedIn, and Meta graph APIs.

### API Endpoint Schemas

#### A. `/health` (GET)
Returns platform adapter configuration states and readiness profiles.
* **Response Schema**:
  ```json
  {
    "status": "OK",
    "adapters": {
      "linkedin": { "configured": true, "mock": true },
      "twitter": { "configured": true, "mock": true },
      "instagram": { "configured": true, "mock": true },
      "facebook": { "configured": true, "mock": true }
    }
  }
  ```

#### B. `/linkedin/post` (POST)
Publishes to LinkedIn. Enforces a maximum size limit of **3,000 characters**.
* **Request Schema**:
  ```json
  {
    "title": "Skyra Tech Launch",
    "content": "Announcing the official launch of the suite!"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "platform": "linkedin",
    "postId": "mock-li-12345",
    "mocked": true,
    "timestamp": "2026-08-17T12:00:00Z"
  }
  ```

#### C. `/twitter/post` (POST)
Publishes updates to Twitter. Enforces a strict maximum limit of **280 characters** (throws HTTP 400 if violated).
* **Request Schema**:
  ```json
  {
    "content": "Skyra Tech systems are live!"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "platform": "twitter",
    "postId": "mock-tw-12345",
    "mocked": true,
    "timestamp": "2026-08-17T12:00:00Z"
  }
  ```

#### D. `/instagram/post` (POST)
Publishes image updates. Requires a valid `imageUrl` and enforces a maximum caption size of **2,200 characters** (throws HTTP 400 if violated).
* **Request Schema**:
  ```json
  {
    "imageUrl": "https://example.com/image.png",
    "caption": "Scenic views"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "platform": "instagram",
    "postId": "mock-ig-12345",
    "mocked": true,
    "timestamp": "2026-08-17T12:00:00Z"
  }
  ```

#### E. `/facebook/post` (POST)
Publishes to a Facebook Page. Requires valid `pageId` and `content`.
* **Request Schema**:
  ```json
  {
    "content": "Official announcement details...",
    "pageId": "page-12345",
    "link": "https://example.com",
    "imageUrl": "https://example.com/logo.png"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "platform": "facebook",
    "postId": "mock-fb-12345",
    "mocked": true,
    "timestamp": "2026-08-17T12:00:00Z"
  }
  ```

#### F. `/broadcast` (POST)
Executes concurrent broadcasts across selected channels using `Promise.allSettled()`.
* **Request Schema**:
  ```json
  {
    "content": "Broadcasting the Skyra Tech launch details!",
    "title": "Ecosystem Launch",
    "imageUrl": "https://example.com/logo.png",
    "platforms": ["twitter", "linkedin"]
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "results": [
      {
        "success": true,
        "platform": "twitter",
        "postId": "mock-tw-12345",
        "mocked": true,
        "timestamp": "2026-08-17T12:00:00Z"
      },
      {
        "success": true,
        "platform": "linkedin",
        "postId": "mock-li-12345",
        "mocked": true,
        "timestamp": "2026-08-17T12:00:00Z"
      }
    ]
  }
  ```

---

## 5. Security, Environment & Configuration
* **Port Binding**: Port `8005`. Binds strictly to `127.0.0.1` (localhost).
* **CORS Settings**: Origin allowed headers strictly restricted to `http://127.0.0.1:8000` and `http://localhost:8000`. Wildcard CORS `*` is disabled.
* **Credentials Isolation**: Platform tokens are isolated inside each environment config file.

---

## 6. Resilience, Error Handling & Recovery Strategies
* **Validation Bounds checks**: Posts that violate platform-specific character limits or missing parameter conditions throw HTTP 400 Bad Request error payloads immediately.
* **Aggregated Broadcast Errors**: If one platform fails during a unified `/broadcast` call, `Promise.allSettled()` ensures other channels execute successfully and returns the partial results mapped by platform.
* **Structured Errors**: Catches API faults and formats them into standardized JSON error payloads.

---

## 7. Ecosystem Integration & Dependencies
Called by `skyra-jarvis` to execute social posting, status updates, and broadcast alerts. Exposes REST API over loopback port `8005`.
