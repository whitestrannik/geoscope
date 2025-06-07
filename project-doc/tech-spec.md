# 📘 GeoScope – Technical Specification

## Section 1: 🧱 Stack Overview

| Layer           | Technology                                       |
|------------------|--------------------------------------------------|
| Frontend         | React (with Vite) + TypeScript                  |
| Styling          | TailwindCSS v4 + PostCSS + shadcn/ui            |
| State Mgmt       | Zustand (light global state, optional)          |
| Backend          | Node.js + Express.js + tRPC                     |
| Real-Time        | Socket.IO                                       |
| Auth             | Supabase Auth (Email/Password)                  |
| Database         | PostgreSQL (via Railway)                        |
| ORM              | Prisma                                          |
| Hosting          | Railway (Frontend + Backend + DB)              |
| External Images  | Geo-tagged image APIs (e.g. Mapillary, Unsplash)|
| Dev Environment  | Local: Windows with PowerShell-compatible CLI   |
| Testing          | Vitest, Jest, Supertest, Playwright             |

> ⚠️ All commands and scripts must be compatible with PowerShell.

---

## Section 2: 🗺️ Architecture Diagram & Request Flow

### 📐 Overview

```
  [ User Browser ]
        |
        v
[ React App (Vite) ]
        |
   ┌────────────┐
   |  tRPC API  |
   └────────────┘
        |
[ Express Server (Node.js) ]
        |
   ┌────┴─────┐
   |          |
[ PostgreSQL ] [ External Photo API ]
     |                     |
[ Prisma ORM ]        [ Mapillary, etc. ]
```

---

### 🔄 Request Flow: Solo Mode

1. User clicks “Play Solo”
2. Frontend calls `gameRouter.startSoloRound()` (tRPC)
3. Backend fetches a geo-tagged image from external API
4. Backend returns image URL and stores correct lat/lng
5. User places pin and submits guess
6. Frontend calls `gameRouter.submitGuess()`
7. Backend calculates distance, returns score and true location

---

### 🔄 Request Flow: Multiplayer Mode

1. Host creates room: `multiplayerRouter.createRoom()`
2. Peers join using room code via Socket.IO
3. Host starts the game → backend fetches image via API
4. All clients receive the image via WebSocket
5. Players submit guesses via `submitGuess()` socket event
6. Backend calculates scores, broadcasts results
7. Loop continues until round limit reached

---

## Section 3: 🖼️ Dynamic Image Fetching

### 📡 Description

Images shown in each round (solo or multiplayer) are fetched **dynamically in real-time** from a geo-tagged photo service.

> ❌ No image uploads or admin panel required in MVP.

---

### 📌 Requirements

- Each image must include:
  - **Public image URL**
  - **Latitude and longitude coordinates**
- Images should represent outdoor/street-level scenes
- Avoid duplicates across multiple rounds

---

### ✅ Candidate APIs

| Provider      | Notes                                                       |
|---------------|-------------------------------------------------------------|
| Mapillary     | High-quality street-level, great for location guessing. Preferred !      |
| Unsplash      | Good variety, needs filtering for `location.position` tags  |
| Wikimedia     | Open images, limited location data                          |

---

### 🛡️ Rate Limits & Fallbacks

- API Keys must be protected in backend `.env`
- Implement:
  - Retry logic on failure
  - Minimal caching for current multiplayer round
  - Local fallback list of seed images (optional)

---

## Section 4: 🎨 Frontend Architecture

### 📁 Folder Structure

```
/client
  /src
    /pages               # Route-linked pages (Home, Solo, Room, etc.)
    /components          # Reusable UI elements (e.g. Header, Button)
    /features            # Domain-specific modules (SoloGame, Lobby, Leaderboard)
    /hooks               # Custom React hooks (e.g. useSocket, useAuth)
    /lib                 # Utility functions, constants, and types
    /api                 # tRPC clients (auto-generated)
    /styles              # Global and Tailwind entry file
  tailwind.config.ts     # (Optional) Tailwind config if extended
  vite.config.ts         # Vite + Tailwind plugin integration
```

---

### 🧭 Routing and Navigation

| Route              | Description                                         |
|--------------------|-----------------------------------------------------|
| `/`                | Home page: entry point to solo/multiplayer modes   |
| `/solo`            | Solo game screen: guess real-world locations       |
| `/room/create`     | Room creation page: generates a joinable code      |
| `/room/:roomId`    | Multiplayer room interface                         |
| `/leaderboard`     | Displays top scores and personal bests             |
| `/stats`           | Shows user’s past rounds and progress              |

All routes require authentication via Supabase.

---

### 💅 UI Stack

| Library        | Purpose                                       |
|----------------|-----------------------------------------------|
| TailwindCSS v4 | Core styling (PostCSS handled internally)     |
| shadcn/ui      | Pre-built, accessible, Tailwind-based components |
| Lucide Icons   | Modern, lightweight icon set                  |

> ✅ Tailwind v4 has no external PostCSS setup. Only `tailwind.config.ts` is needed if customizing theme or variants.

---

### 🧠 State Management

- **Zustand** will manage global, shared state:
  - WebSocket connection state
  - Room metadata and user presence
  - Timer state and player actions
  - Current guess or result state

- Local state (e.g. input values, UI toggles) remains in component-level `useState`.

---

### 🧪 Frontend Testing

| Type               | Tool                                |
|--------------------|-------------------------------------|
| Unit tests         | Vitest + Testing Library            |
| Component testing  | `@testing-library/react`            |
| DOM mocking        | `happy-dom` or `jsdom`              |
| E2E (covered later)| Playwright                          |

Test coverage must include:
- Visual and state changes triggered by interactions (e.g. map clicks)
- Navigation between pages
- Multiplayer game flow from a single-client perspective

> 📝 All test scripts must be PowerShell-compatible for Windows development environment.

---

## Section 5: 🧠 Backend Architecture

### 📁 Folder Structure

```
/server
  /src
    /trpc               # tRPC routers (game, multiplayer, stats)
    /sockets            # Socket.IO handlers (multiplayer real-time events)
    /middleware         # Supabase Auth verification, context builders
    /lib                # Shared utilities and validators
  prisma/               # Prisma schema, migrations, and DB client
  index.ts              # Entry point: Express app, tRPC, WebSocket server
  .env                  # Environment variables (DB, Supabase keys, etc.)
```

---

### 🔧 Core Stack

| Layer         | Technology                     |
|---------------|---------------------------------|
| Server        | Node.js + Express              |
| API           | tRPC                           |
| Real-time     | Socket.IO                      |
| Auth          | Supabase Auth (JWT)            |
| ORM           | Prisma                         |
| Database      | PostgreSQL (via Railway)       |
| Hosting       | Railway                        |

---

### 🧩 API Architecture with tRPC

tRPC is used instead of REST for frontend–backend communication in solo mode and non-real-time features.

| Router             | Purpose                                              |
|--------------------|------------------------------------------------------|
| `gameRouter`       | Solo image fetch, submit guess, scoring logic        |
| `multiplayerRouter`| Room validation, game state sync (tRPC or socket)    |
| `statsRouter`      | Leaderboard access, personal history queries         |

> All routers are protected via Supabase JWT using custom middleware.

---

### 🔐 Middleware

All tRPC procedures share a common `createContext()` function that:
- Verifies Supabase JWT passed from frontend
- Loads user info into `ctx.user`
- Rejects unauthorized access automatically

---

### 🌐 Real-Time Layer: Socket.IO

Socket.IO handles real-time multiplayer coordination:

| Event               | Direction     | Description                            |
|---------------------|---------------|----------------------------------------|
| `createRoom`        | Client → Server | Host starts a multiplayer session      |
| `joinRoom`          | Client → Server | Player joins an existing room          |
| `startRound`        | Host → Server  | Begins new image round for all players |
| `imageReady`        | Server → All   | Broadcasts fetched image to all players|
| `submitGuess`       | Client → Server | Player submits their pin location      |
| `roundResult`       | Server → All   | Shares scores and correct location     |
| `disconnect`        | Server         | Handles player drops or exits          |

All Socket.IO logic is modularized in `/sockets/`.


## Section 6: 🗃️ Database Models

GeoScope uses **PostgreSQL** (hosted via Railway) with **Prisma** as the ORM. The schema below is optimized for solo and multiplayer modes in the MVP and supports session-based scoring and stat tracking.

---

### 🔑 Core Relationships

- A `User` can play many `Games`
- Each `Game` is tied to one image and one correct location (lat/lng)
- A `Game` has one or more `Guesses` (one in solo, many in multiplayer)
- All player stats are accumulated in `UserStats` (also used for leaderboard)

---

### 🧑 `User`

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String
  avatarUrl     String?    // Optional profile image
  createdAt     DateTime @default(now())

  stats         UserStats?
  guesses       Guess[]
}
```

> 🛂 Auth is handled by Supabase. This model is for game-related data.

---

### 🧩 `Game`

Represents a single game session (solo or multiplayer).

```prisma
model Game {
  id            String   @id @default(uuid())
  mode          GameMode             // SOLO or MULTIPLAYER
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  hostUserId    String?              // Only for multiplayer
  imageUrl      String               // Queried at runtime
  actualLat     Float
  actualLng     Float

  guesses       Guess[]
}
```

---

### 📍 `Guess`

Represents one user's guess in a game session.

```prisma
model Guess {
  id            String   @id @default(uuid())
  gameId        String
  userId        String
  guessLat      Float
  guessLng      Float
  distanceKm    Float
  score         Int
  timestamp     DateTime @default(now())

  game          Game     @relation(fields: [gameId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}
```

---

### 📊 `UserStats`

Stores persistent stats for each user and powers the leaderboard.

```prisma
model UserStats {
  id            String   @id @default(uuid())
  userId        String   @unique
  totalGames    Int      @default(0)
  totalPoints   Int      @default(0)
  bestScore     Int?
  avgDistance   Float?

  user          User     @relation(fields: [userId], references: [id])
}
```

---

### 🧾 `GameMode` enum

```prisma
enum GameMode {
  SOLO
  MULTIPLAYER
}
```

## Section 7: 🔐 Authentication & Authorization

GeoScope uses **Supabase Auth** for user authentication and secure access control. All app features require users to be logged in.

---

### ✅ Login & Signup Flow (Frontend)

- Supabase provides prebuilt auth UI or custom email/password forms.
- On successful login/signup:
  - User receives a JWT (access token)
  - JWT is stored in local storage or via `@supabase/auth-helpers`
  - Token is automatically included in requests (via headers or tRPC context)

---

### 🛂 Auth State (Frontend)

The auth state is accessed using:

```ts
const { user, session } = useSupabaseUser()
```

- Controls route access (e.g., `/solo`, `/room/*`)
- Enables conditional rendering for login/logout buttons

---

### 🔐 Backend Validation with Supabase JWT

The backend verifies the JWT token passed by the frontend using Supabase's JWKS public key:

1. The token is attached to each API or tRPC request
2. A backend middleware (`validateJwt`) decodes and verifies it
3. If valid, user data is attached to the tRPC context (`ctx.user`)
4. If invalid/expired, the request is rejected with a `401 Unauthorized`

---

### 🔁 Token Flow Diagram

```
Frontend (React + Supabase JS)
        │
        ▼
User logs in → Receives JWT
        │
        ▼
JWT sent with each API/tRPC/Socket call
        │
        ▼
Backend (Express + tRPC)
- Validates JWT via Supabase
- Attaches user to request context
```

---

### 🎮 Auth Enforcement by Route

| Route / Action             | Requires Login | Notes                                    |
|----------------------------|----------------|------------------------------------------|
| `/`                        | ❌             | Landing page is public                   |
| `/solo`                   | ✅             | Fetch image, submit guess                |
| `/room/create`            | ✅             | Only authenticated users can host rooms |
| `/room/:roomId`           | ✅             | Socket connection requires valid token   |
| `/leaderboard`            | ✅             | View requires auth (can be public later) |
| `/stats`                  | ✅             | User-specific stats                      |
| tRPC procedures            | ✅             | All protected by JWT in context          |
| Socket.IO connect          | ✅             | JWT passed during handshake              |

---

### 🧱 Role Management (Simple for MVP)

- No roles or permissions beyond login
- Future versions may add `ADMIN` role for content moderation or image reporting


## Section 8: 🔄 Real-Time Multiplayer Protocol

GeoScope supports real-time multiplayer gameplay using **Socket.IO**, allowing multiple players to compete in guessing the same location within a shared room.

---

### 🌐 WebSocket Overview

- **Library:** `socket.io`
- **Transport:** WebSocket with fallback to HTTP polling
- **Setup:** Socket.IO server is initialized in `index.ts` and integrated with the Express server
- **Authentication:** JWT from Supabase is passed in the initial handshake and validated before accepting the connection

---

### 🏠 Room Lifecycle

| Phase           | Description                                           |
|-----------------|-------------------------------------------------------|
| Room Creation   | A logged-in user creates a room (becomes Host)        |
| Join Room       | Other users join via room code                        |
| Start Game      | Host starts the round, server fetches image/location |
| Submit Guesses  | All players submit their guesses                     |
| Show Results    | Server computes scores, sends result to all players  |
| Next Round      | (Optional in future)                                  |

---

### 📡 Socket.IO Event Protocol

| Event            | Direction          | Payload                             | Description                               |
|------------------|--------------------|-------------------------------------|-------------------------------------------|
| `createRoom`     | Client → Server    | `{ username }`                      | Host creates room                         |
| `roomCreated`    | Server → Host      | `{ roomId }`                        | Room ID sent to host                      |
| `joinRoom`       | Client → Server    | `{ roomId, username }`              | Player joins room                         |
| `playerJoined`   | Server → All       | `{ username }`                      | Broadcast new player                      |
| `startRound`     | Host → Server      | none                                | Host starts the round                     |
| `imageReady`     | Server → All       | `{ imageUrl }`                      | Server sends fetched image to all         |
| `submitGuess`    | Client → Server    | `{ lat, lng }`                      | Player submits their guess                |
| `roundResult`    | Server → All       | `{ actualLat, actualLng, scores[] }`| Server shares result & scores             |
| `disconnect`     | Server event       |                                     | Handles player disconnects                |

---

### 🔐 Socket Authentication

- JWT token is passed as part of connection:
  ```ts
  const socket = io(SOCKET_URL, {
    auth: { token: supabase.auth.getAccessToken() }
  });
  ```
- Server validates token on `connection` event
- If valid, attaches user info to socket context

---

### 🧩 Internal Room State (Server Memory)

Each room is stored temporarily in server memory:

```ts
interface Room {
  id: string;
  hostId: string;
  players: Player[];
  imageUrl: string;
  actualLat: number;
  actualLng: number;
  guesses: Map<socketId, Guess>;
}
```

> Room data is not persisted to the DB in MVP.

---

### ⏳ Round Flow Summary

```text
[Host] → createRoom
[Players] → joinRoom
[Host] → startRound
[Server] → fetch image + location
[Server] → emit imageReady
[Each Player] → submitGuess
[Server] → calculate scores
[Server] → emit roundResult
```


## Section 9: 🖼️ Image Querying & Rate Limiting

GeoScope dynamically fetches real-world street-level imagery for each guessing round rather than storing a local image set. This provides variety, replayability, and low maintenance overhead.

---

### 🌍 Image Source

- **Primary Provider (MVP):** [Mapillary API](https://www.mapillary.com/)
- Alternative options (future): Google Street View, OpenStreetCam, Wikimedia Commons (for landmarks)

---

### 🧭 Image Fetch Strategy

- Backend (Node.js server) fetches a **random image and location** via API before each round
- Data returned includes:
  - `imageUrl`: Public URL for rendering
  - `lat`, `lng`: Correct coordinates for scoring

> Backend uses internal logic or predefined bounding boxes to ensure diversity and fair distribution

---

### 📦 Data Flow (Image Fetching)

```text
[Host] → startRound
[Backend] → call Mapillary API (with auth key + filters)
[Backend] → receive imageURL + lat/lng
[Server] → emit `imageReady` to all players
```

---

### 📉 Rate Limiting Protection

To avoid abuse and manage API quotas:

#### ⛔ Image Fetching Limits (Backend)
- Hard limit: 1 image per `startRound` call
- Soft limit: Max 10 game starts per user per minute
- Protection layer: Express middleware or in-memory counter per user/socket

#### 🧪 Guess Submission Limits (Frontend)
- Prevent spamming guesses
- Allow **only one submission per user per round**
- Client disables “Submit” button after sending guess

---

### 🔑 API Key Management

- API keys (e.g., Mapillary access token) stored in `.env` and not exposed to the frontend
- Backend handles all external API calls
