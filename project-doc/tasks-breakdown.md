# 📍 Phase 0 – Project Setup & Tooling ✅ **COMPLETED**

> Goal: Prepare a professional monorepo-based fullstack environment using Vite, Express, TailwindCSS v4, shadcn/ui, tRPC, and Vitest. Ensure security, type safety, and compatibility with Windows + PowerShell.

---

## 🔧 0.1 — Project Bootstrapping ✅

- [x] Create root project directory with `apps/frontend/` and `apps/backend/` subfolders
- [x] Initialize monorepo with workspace support (pnpm-workspace.yaml)
- [x] Add `.gitignore` and `README.md`
- [x] Create `.env.example` for LLM-safe sharing
- [x] Store real secrets in `.env.local` placed **outside the project directory** (documented)

---

## ⚙️ 0.2 — Frontend Setup (`apps/frontend`) ✅

- [x] Scaffold React + TypeScript app using Vite
- [x] Install and configure TailwindCSS v4.0 using the official Vite plugin
- [x] Add base global stylesheet and import Tailwind via `@import "tailwindcss";`
- [x] Verify Tailwind utility classes render correctly in development

---

## 🎨 0.3 — UI Framework Setup (shadcn/ui) ✅

- [x] Install and initialize `shadcn/ui` in the frontend
- [x] Enable proper theme structure and path aliases (`@/*`)
- [x] Render and style sample Button component
- [x] Verified shadcn/ui components working with TailwindCSS v4

---

## 🚀 0.4 — Backend Setup (`apps/backend`) ✅

- [x] Initialize backend with TypeScript and Express
- [x] Install and configure essential middlewares (CORS, JSON body parsing)
- [x] Set up initial folder structure:
  - [x] `src/trpc/` for routers and procedures
  - [x] `src/db/` for Prisma ORM setup (folder created)
  - [x] `src/lib/` for utility functions
- [x] Create a base Express server entry point
- [x] Add functional tRPC router with health check and test endpoints

---

## 🔐 0.5 — Environment Variables & Secrets ✅

- [x] Define all necessary keys in `.env.example` (Mapillary, Supabase, etc.)
- [x] Load environment variables using `dotenv` in backend
- [x] Validate env variables at runtime using `zod` schema

---

## 🧪 0.6 — Testing Tooling ✅

- [x] Install and configure `Vitest` as the unified test runner
- [x] Add `@testing-library/react` and `jsdom` for frontend component tests
- [x] Create basic unit tests for App component (3 tests passing)
- [x] Add scripts and configuration for test execution

---

## 🖥️ 0.7 — Local Dev Workflow ✅

- [x] Set up separate start scripts for frontend and backend
- [x] Ensure compatibility with PowerShell (Windows development environment)
- [x] Combined dev script working (`pnpm run dev` runs both servers)

**🎯 Phase 0 Status: COMPLETE** 
- Frontend: `http://localhost:3000` ✅ (React + Vite + TailwindCSS v4 + shadcn/ui)
- Backend: `http://localhost:8000` ✅ (Express + tRPC + Socket.IO)
- Tests: 3/3 passing ✅


# 🎨 Phase 1 – UI Shell & Navigation

> Goal: Establish a clean, responsive UI foundation with modern aesthetics, page routing, and animated background. Ensure visual consistency and full navigation skeleton before gameplay logic.

---

## 🖼️ 1.1 — Base App Shell

- [ ] Create `AppShell` layout component with:
  - [ ] Fixed header with project logo/title
  - [ ] Main content area with proper padding and max width
- [ ] Apply consistent font, spacing, and color theme using Tailwind
- [ ] Support light/dark mode toggle (optional)
- [ ] Integrate animated background (e.g., looping space/earth flyover)

---

## 🧭 1.2 — Page Routing Setup

- [ ] Configure route structure using React Router (or file-based routing if applicable)
- [ ] Define routes for:
  - [ ] `/` → Home
  - [ ] `/solo` → Solo Mode
  - [ ] `/room/create` → Room creation page
  - [ ] `/room/:roomId` → Multiplayer room
  - [ ] `/leaderboard` → Leaderboard
  - [ ] `/stats` → Personal stats

---

## 🏠 1.3 — Home Page UI

- [ ] Design and implement home screen with prominent game title
- [ ] Add main action buttons using `shadcn/ui` components:
  - [ ] `Play Now` → navigates to `/solo`
  - [ ] `Create Room` → `/room/create`
  - [ ] `Join Room` → `/room/:roomId` (prompt for room code)
  - [ ] `Leaderboard` → `/leaderboard`
- [ ] Animate button hover/tap states using Tailwind transitions
- [ ] Apply consistent spacing, padding, shadow, and rounded corners

---

## 🖼️ 1.4 — Image Viewer Modal

- [ ] Create image modal component (based on `Dialog` from `shadcn/ui`)
- [ ] Enable click-to-expand behavior on images
- [ ] Ensure responsive fullscreen or near-fullscreen layout
- [ ] Add optional zoom and pan interaction
- [ ] Support graceful fallback on mobile devices

---

## 🧪 1.5 — Basic UI Testing

- [ ] Write component tests for:
  - [ ] `AppShell`
  - [ ] Home screen buttons and navigation
  - [ ] Modal open/close behavior
- [ ] Verify dark mode and layout responsiveness with test snapshots


# 🎮 Phase 2 – Solo Mode (Gameplay + Scoring)

> Goal: Implement single-player mode using real-world imagery fetched from the Mapillary API. Players guess the image location by placing a pin on the map. Scoring is based on proximity.

---

## 🧩 2.1 — Backend: Image Retrieval API

- [ ] Create `trpc.image.getRandom` procedure
- [ ] Securely fetch a random image from Mapillary API
- [ ] Return:
  - [ ] `imageUrl`
  - [ ] `actualLat`
  - [ ] `actualLng`
  - [ ] Optional metadata (e.g., copyright)

- [ ] Add Mapillary API token handling via env variable
- [ ] Write integration test for image endpoint with mock API response

---

## 🌍 2.2 — Frontend: Solo Page UI

- [ ] Create `/solo` screen using `AppShell` layout
- [ ] On load, request image data from backend (`image.getRandom`)
- [ ] Display image in interactive viewer with:
  - [ ] Expand-to-fullscreen support
  - [ ] Loading/error states

---

## 🗺️ 2.3 — Map Interface (User Guess)

- [ ] Render interactive map (Leaflet or MapLibre)
- [ ] Allow user to:
  - [ ] Pan/zoom the map
  - [ ] Place a single marker as their guess
- [ ] Show coordinates on marker hover or label
- [ ] Enable "Submit Guess" only after marker is placed

---

## 🧮 2.4 — Backend: Scoring Procedure

- [ ] Create `trpc.guess.evaluate` mutation
- [ ] Accept user’s guessed coordinates
- [ ] Compute distance to `actualLat`/`actualLng` using haversine formula
- [ ] Translate distance into a score (scoring rules from PRD)
- [ ] Return result:
  - [ ] `distance`
  - [ ] `score`
  - [ ] `actualLat`, `actualLng` (for result display)

- [ ] Write unit test for haversine and scoring logic

---

## 📊 2.5 — Result Display UI

- [ ] After guess submission, transition to result view:
  - [ ] Show map with both:
    - [ ] Player’s guess marker
    - [ ] Actual location marker
  - [ ] Show distance in km and score
- [ ] Display result summary card (styled with `shadcn/ui`)
- [ ] Add "Play Again" button to fetch a new image and reset map

---

## 🧪 2.6 — Testing: Solo Flow

- [ ] Unit test for:
  - [ ] Distance calculation
  - [ ] Score logic
- [ ] Integration test for:
  - [ ] Image + result backend roundtrip
- [ ] E2E test for full solo flow:
  - [ ] Load `/solo`
  - [ ] Place marker
  - [ ] Submit guess
  - [ ] View result correctly rendered


# 🔐 Phase 3 – Authentication & User Profiles

> Goal: Implement secure user authentication via Supabase, store profile data, and support optional login for both solo and multiplayer play. Logged-in users will accumulate stats and be shown in the leaderboard.

---

## 👥 3.1 — Supabase Setup & Integration

- [ ] Create Supabase project and configure:
  - [ ] URL, anon key, JWT secret
  - [ ] Email/password provider
- [ ] All credentials will be stored by Senior developer (outside repo)
- [ ] Initialize Supabase client in frontend and backend

---

## 🔄 3.2 — Auth Flow (Frontend)

- [ ] Add Login / Signup UI using `shadcn/ui` components
  - [ ] Email input
  - [ ] Password input
  - [ ] Toggle between login/signup mode
- [ ] Call Supabase auth methods:
  - [ ] `signUp()`
  - [ ] `signInWithPassword()`
- [ ] Display auth errors and success messages
- [ ] Implement persistent session tracking using Supabase’s client library
- [ ] Show loading state while session is being restored

---

## 🧑 3.3 — Auth Middleware (Backend)

- [ ] Create tRPC middleware to verify Supabase JWT token
- [ ] Extract user ID from token and attach to request context
- [ ] Reject unauthenticated requests to protected procedures

---

## 🧾 3.4 — User Profile Setup

- [ ] Extend `User` model (if needed) in DB to include:
  - [ ] `username` (editable after signup)
  - [ ] `createdAt`
- [ ] Add `trpc.user.getProfile` procedure
- [ ] Add `trpc.user.updateProfile` (e.g., to change username)

---

## 🧪 3.5 — Auth Testing

- [ ] Unit test Supabase client logic (mocks)
- [ ] Integration test login/signup procedures
- [ ] E2E test:
  - [ ] Signup
  - [ ] Login
  - [ ] Profile fetch
  - [ ] Logout


# 🌐 Phase 4 – Multiplayer Room System

> Goal: Implement real-time multiplayer mode where players join the same room, guess locations simultaneously, and receive scores after each round.

---

## 🧱 4.1 — Room Model & Schema

- [ ] Define `Room` model in DB with:
  - [ ] `id` (room code)
  - [ ] `hostUserId`
  - [ ] `createdAt`
  - [ ] `status` (waiting, active, finished)
- [ ] Define `RoomPlayer` model:
  - [ ] `roomId`, `userId`, `joinedAt`, `score`

---

## 🛠️ 4.2 — Room Creation & Join Logic

- [ ] Add `trpc.room.create` to:
  - [ ] Generate room ID
  - [ ] Register current user as host
- [ ] Add `trpc.room.join` to:
  - [ ] Verify room exists and is open
  - [ ] Add user to `RoomPlayer` table
- [ ] Reject join if room is full or already started

---

## 💬 4.3 — Real-time Communication (WebSockets)

- [ ] Set up Socket.IO on backend for room events
- [ ] Establish frontend Socket.IO connection
- [ ] Implement real-time events:
  - [ ] `player-joined`
  - [ ] `start-round`
  - [ ] `guess-submitted`
  - [ ] `round-result`

---

## 🧑‍🤝‍🧑 4.4 — Frontend: Room UI

- [ ] `/room/create` page:
  - [ ] Show room code and waiting lobby
  - [ ] List players as they join
  - [ ] "Start Game" button for host
- [ ] `/room/:roomId` page:
  - [ ] Display current round image
  - [ ] Show timer, map input, and guess button
  - [ ] Disable controls after guess is submitted
- [ ] Display final result map after all players guess

---

## 🔁 4.5 — Round Lifecycle Logic

- [ ] Backend triggers round with new image
- [ ] Broadcast to all players via `start-round`
- [ ] Collect guesses from each player
- [ ] After all guesses or timeout:
  - [ ] Compute scores
  - [ ] Broadcast `round-result`
  - [ ] Store guess and score in DB

---

## 🧪 4.6 — Multiplayer Testing

- [ ] Unit test room creation and validation logic
- [ ] Integration test socket events using test clients
- [ ] E2E test:
  - [ ] Create + join room
  - [ ] Submit multiplayer guesses
  - [ ] Validate result sync across clients




# 🏆 Phase 5 – Leaderboard & Player Stats

> Goal: Track individual performance, enable global rankings, and allow users to view personal stats. This adds replay value and motivates competition.

---

## 🧾 5.1 — Backend: Stats & Score Storage

- [ ] Update `Guess` model to include:
  - [ ] `mode` (solo or multiplayer)
  - [ ] `score`, `timestamp`
- [ ] Add `UserStats` model or computed view with:
  - [ ] Total games played
  - [ ] Average score
  - [ ] Highest score
  - [ ] Total distance guessed
- [ ] Update logic in solo and multiplayer to persist guesses and scores

---

## 🥇 5.2 — Leaderboard Backend

- [ ] Create `trpc.leaderboard.getGlobalTop`:
  - [ ] Return top 10 users ranked by score or win rate
- [ ] Create `trpc.leaderboard.getRecentWinners`:
  - [ ] Show most recent top scorers from multiplayer rooms
- [ ] Add pagination support for scalability (optional)

---

## 📈 5.3 — Personal Stats Page

- [ ] Create `/stats` route
- [ ] Display:
  - [ ] Avatar/username
  - [ ] Total games played
  - [ ] Best guess distance
  - [ ] High score
  - [ ] Chart or table of recent games
- [ ] Use `shadcn/ui` for visual elements and stats cards

---

## 📊 5.4 — Leaderboard UI

- [ ] Create `/leaderboard` route
- [ ] Add tab switcher or toggle:
  - [ ] Global Top
  - [ ] Recent Winners
- [ ] Display:
  - [ ] Rank, name, score, date
  - [ ] Responsive layout for mobile/desktop
- [ ] Animate score updates or entry transitions

---

## 🧪 5.5 — Testing

- [ ] Unit test score aggregation and stat computation
- [ ] Integration test for leaderboard queries
- [ ] E2E test:
  - [ ] Submit valid guesses
  - [ ] View personal stats and confirm values
  - [ ] Leaderboard updates accurately



# 🚀 Phase 6 – Productionization & Deployment

> Goal: Prepare the fullstack app for production use, secure hosting, and enable continuous deployment from GitHub. Optimize for performance, reliability, and secure config management.

---

## 🌍 6.1 — Deployment Targets

- [ ] Host backend (Node.js) on **Railway**
- [ ] Host frontend (Vite) on **Railway** or **Vercel** (depending on domain and build control)
- [ ] Use Railway PostgreSQL as primary DB
- [ ] Supabase remains as:
  - [ ] Auth provider
  - [ ] Optional backup store for real-time events or analytics (if needed later)

---

## 🔐 6.2 — Secrets & Environment Config

- [ ] Set up environment variables on Railway Dashboard:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `MAPILLARY_ACCESS_TOKEN`
  - [ ] JWT secret
- [ ] Ensure `.env.local` is excluded from version control
- [ ] Use `.env.example` for sharing non-sensitive config format

---

## ⚙️ 6.3 — CI/CD via GitHub

- [ ] Set up GitHub Actions workflow:
  - [ ] Install dependencies
  - [ ] Run lint, build, test
  - [ ] Deploy to Railway (or Vercel) on `main` push
- [ ] Add deployment badge in `README.md`

---

## 🚦 6.4 — Readiness for Launch

- [ ] Confirm Solo mode works with live Mapillary images
- [ ] Confirm Multiplayer room lifecycle functions end-to-end
- [ ] Validate login/signup, session restore, and logout
- [ ] Validate leaderboard and stats computation
- [ ] Test deployment in private staging environment

---

## 🧪 6.5 — Final Testing Pass

- [ ] Full E2E walkthrough using seeded and live data
- [ ] Cross-browser and mobile responsiveness testing
- [ ] Confirm all animations, modals, and transitions work as expected



# 🌟 Phase 7 – Post-MVP Enhancements & Optional Features

> Goal: Expand GeoScope with new game modes, customization, polish, and admin utilities that enhance replay value, user retention, and moderation capabilities.

---

## 🗺️ 7.1 — Additional Game Modes

- [ ] **Multiplayer Timed Battle**:
  - [ ] Fixed timer for each round (e.g., 30 seconds)
  - [ ] All players guess simultaneously
  - [ ] Scores revealed only after timer ends
  - [ ] Add “round start countdown” animation

- [ ] **Daily Challenge**:
  - [ ] Same image shared for all users once per day
  - [ ] Players only allowed one try
  - [ ] Ranked in a dedicated leaderboard

---

## 🎨 7.2 — UI & UX Polish

- [ ] Add sound effects for guess submission, round start, and result reveal
- [ ] Add animated transitions (slide-in cards, loading spinners, etc.)
- [ ] Support dark/light theme toggle with saved preference
- [ ] Improve mobile responsiveness (bottom tab nav, fullscreen modals)

---

## 🔧 7.3 — Admin / Moderation Panel

- [ ] Protected admin route `/admin`
- [ ] Login-gated access with specific user email allowlist
- [ ] View and moderate reported users or results (future feature)
- [ ] Manual image moderation or banning (if needed)

---

## 🗃️ 7.4 — Storage (Optional)

- [ ] Add S3-compatible image storage for uploading custom game packs (future)
- [ ] Store archived games (solo + multiplayer) for analytics or replay

---

## 🧑‍💼 7.5 — User Profile Enhancements

- [ ] Let users edit avatar and display name
- [ ] Display global rank on profile
- [ ] Show detailed round history with scores, distances, and maps
- [ ] Add personal badge or achievement system (based on scoring milestones)

---

## 🌐 7.6 — Internationalization (i18n)

- [ ] Add multi-language support (starting with French, Spanish)
- [ ] Use JSON translation files and context provider for UI strings
- [ ] Allow browser-locale detection and language switcher

---

## 🧪 7.7 — QA, Feedback & Analytics

- [ ] Add user feedback modal
- [ ] Integrate basic usage analytics (e.g., Plausible or PostHog)
- [ ] Monitor error tracking with Sentry or similar

---

Let me know if you'd like a cleaned-up **master task summary document** across all phases or want to generate GitHub issues next.
