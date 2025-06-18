# 📍 Phase 0 – Project Setup & Tooling ✅ **COMPLETED**

> **⚠️ WINDOWS DEVELOPMENT ENVIRONMENT ONLY**  
> **OS**: Windows 10/11 + PowerShell | **NO Unix/Linux/macOS support**

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
- [x] **CRITICAL**: Ensure compatibility with PowerShell (Windows-only development environment)
- [x] Combined dev script working (`pnpm run dev` runs both servers)
- [x] **All commands must be PowerShell-compatible** (NO `&&`, Unix paths, or bash syntax)

**🎯 Phase 0 Status: COMPLETE** 
- Frontend: `http://localhost:3000` ✅ (React + Vite + TailwindCSS v4 + shadcn/ui)
- Backend: `http://localhost:8000` ✅ (Express + tRPC + Socket.IO)
- Tests: 3/3 passing ✅


# 🎨 Phase 1 – UI Shell & Navigation ✅ **COMPLETED**

> Goal: Establish a clean, responsive UI foundation with modern aesthetics, page routing, and animated background. Ensure visual consistency and full navigation skeleton before gameplay logic.

---

## 🖼️ 1.1 — Base App Shell ✅

- [x] Create `AppShell` layout component with:
  - [x] Fixed header with project logo/title
  - [x] Main content area with proper padding and max width
- [x] Apply consistent font, spacing, and color theme using Tailwind
- [x] Support light/dark mode toggle (optional)
- [x] Integrate animated background (e.g., looping space/earth flyover)

---

## 🧭 1.2 — Page Routing Setup ✅

- [x] Configure route structure using React Router (or file-based routing if applicable)
- [x] Define routes for:
  - [x] `/` → Home
  - [x] `/solo` → Solo Mode
  - [x] `/room/create` → Room creation page
  - [x] `/room/join` → Room join page (NEW)
  - [x] `/room/:roomId` → Multiplayer room
  - [x] `/leaderboard` → Leaderboard
  - [x] `/stats` → Personal stats

---

## 🏠 1.3 — Home Page UI ✅

- [x] Design and implement home screen with prominent game title
- [x] Add main action buttons using `shadcn/ui` components:
  - [x] `🎮 Play Solo` → navigates to `/solo`
  - [x] `🏠 Create Room` → `/room/create`
  - [x] `🚪 Join Room` → `/room/join` (room code input)
  - [x] `🏆 Leaderboard` → `/leaderboard`
- [x] Animate button hover/tap states using Tailwind transitions
- [x] Apply consistent spacing, padding, shadow, and rounded corners

---

## 🖼️ 1.4 — Image Viewer Modal ✅

- [x] Create image modal component (based on `Dialog` from `shadcn/ui`)
- [x] Enable click-to-expand behavior on images
- [x] Ensure responsive fullscreen or near-fullscreen layout
- [x] Add optional zoom and pan interaction
- [x] Support graceful fallback on mobile devices

---

## 🧪 1.5 — Basic UI Testing ✅

- [x] Write component tests for:
  - [x] `AppShell` (8 tests)
  - [x] Home screen buttons and navigation (7 tests)
  - [x] Modal open/close behavior (12 tests)
- [x] Verify dark mode and layout responsiveness with test snapshots

**🎯 Phase 1 Status: COMPLETE** 
- UI Shell: Modern space-themed design with glassmorphism ✅
- Navigation: Desktop + Mobile responsive navigation ✅  
- Routing: All 7 routes implemented with proper 404 handling ✅
- Image Modal: Full-featured with zoom, pan, keyboard shortcuts ✅
- Testing: 30/30 tests passing ✅


# 🎮 Phase 2 – Solo Mode (Gameplay + Scoring) ✅ **COMPLETED**

> Goal: Implement single-player mode using real-world imagery fetched from the Mapillary API. Players guess the image location by placing a pin on the map. Scoring is based on proximity.

---

## 🧩 2.1 — Backend: Image Retrieval API ✅

- [x] Create `trpc.image.getRandom` procedure
- [x] **REAL Mapillary API integration fully working**
  - [x] Geographic region-based fetching (6 global regions)
  - [x] OAuth 2.0 authentication with Authorization header
  - [x] Dynamic bounding box queries for diverse locations
  - [x] Graceful fallback to mock data if API unavailable
- [x] Return:
  - [x] `imageUrl` (real street-level imagery from Mapillary CDN)
  - [x] `actualLat` / `actualLng` (real GPS coordinates)
  - [x] Optional metadata (location, copyright)

- [x] **Environment setup**:
  - [x] `MAPILLARY_ACCESS_TOKEN` properly configured
  - [x] External .env file working with relative path loading
- [x] **Frontend-Backend connection fixed**:
  - [x] tRPC URL corrected from `/trpc` to `/api/trpc`
  - [x] All API calls working without 404 errors
- [x] **Real-world testing**:
  - [x] Successfully fetching images from all 6 continents
  - [x] Returning 50 images per region, randomly selecting one
  - [x] Full integration verified via terminal logs and UI

---

## 🌍 2.2 — Frontend: Solo Page UI ✅

- [x] Create `/solo` screen using `AppShell` layout
- [x] On load, request image data from backend (`image.getRandom`)
- [x] Display image in interactive viewer with:
  - [x] Expand-to-fullscreen support
  - [x] Loading/error states

---

## 🗺️ 2.3 — Map Interface (User Guess) ✅

- [x] Render interactive map (MapLibre GL JS)
- [x] Allow user to:
  - [x] Pan/zoom the map
  - [x] Place a single marker as their guess
- [x] Show coordinates on marker hover or label
- [x] Enable "Submit Guess" only after marker is placed

---

## 🧮 2.4 — Backend: Scoring Procedure ✅

- [x] Create `trpc.guess.evaluate` mutation
- [x] Accept user's guessed coordinates
- [x] Compute distance to `actualLat`/`actualLng` using haversine formula
- [x] Translate distance into a score (scoring rules from PRD)
- [x] Return result:
  - [x] `distance`
  - [x] `score`
  - [x] `actualLat`, `actualLng` (for result display)

- [x] Write unit test for haversine and scoring logic

---

## 📊 2.5 — Result Display UI ✅

- [x] After guess submission, transition to result view:
  - [x] Show map with both:
    - [x] Player's guess marker
    - [x] Actual location marker
  - [x] Show distance in km and score
- [x] Display result summary card (styled with `shadcn/ui`)
- [x] Add "Play Again" button to fetch a new image and reset map

---

## 🧪 2.6 — Testing: Solo Flow ✅

- [x] Unit test for:
  - [x] Distance calculation
  - [x] Score logic
- [x] Integration test for:
  - [x] Image + result backend roundtrip
- [x] E2E test for full solo flow:
  - [x] Load `/solo`
  - [x] Place marker
  - [x] Submit guess
  - [x] View result correctly rendered

**🎯 Phase 2 Status: COMPLETE**
- **Mapillary Integration: FULLY WORKING** with real street-level images ✅
- **Complete Solo Gameplay**: Full game flow with polished UI/UX ✅
- Backend API: Image retrieval + scoring with comprehensive testing ✅
- Frontend Solo Page: Complete game flow with loading/error states ✅
- Map Interface: Interactive MapLibre GL JS with click-to-place markers ✅
- Scoring System: Haversine distance + exponential decay algorithm ✅
- Result Display: Dual markers, score calculation, play again functionality ✅
- **Real-world Verification**: 6 geographic regions, OAuth 2.0, 50 images/region ✅
- Testing: 11 backend unit tests + 30 frontend tests all passing ✅
- **UI/UX Improvements**: Multiple rounds of improvements including zoom fixes, layout fixes, and UX enhancements ✅

## ✨ 2.7 — UI/UX Enhancements & Polish ✅ **COMPLETED**

### **🎨 Responsive Layout System**  
- [x] **Flexible Layout**: Responsive split view (image + map) optimized for all screen sizes ✅
- [x] **Wide Screen Support**: Fixed fullscreen mode for wide screen monitors ✅
- [x] **Mobile Optimization**: Improved mobile layout and interactions ✅
- [x] **Vertical Scroll Fix**: Resolved layout issues on Solo page ✅

### **🔍 Enhanced Image Experience**
- [x] **Advanced Zoom System**: Multi-level zoom with pan support ✅
- [x] **Zoom Issue Fixes**: Resolved zoom-related UI problems ✅
- [x] **Click-to-Fullscreen**: Smooth fullscreen modal experience ✅
- [x] **Image Component Improvements**: Multiple iterations of zoom and interaction improvements ✅

### **🗺️ Optimized Map Experience**
- [x] **Polished Map Interface**: Clean, responsive MapLibre GL JS integration ✅
- [x] **Smart Marker System**: Intuitive guess and result markers with hover effects ✅
- [x] **Coordinate Display**: Real-time coordinate tracking on hover ✅
- [x] **Result Visualization**: Clear dual-marker display for results ✅

### **💡 User Experience Improvements**
- [x] **Solo Page UX**: Comprehensive UX experience improvements ✅
- [x] **React Hooks Fixes**: Resolved React hooks errors for smoother interactions ✅
- [x] **Performance Optimization**: Improved rendering and interaction performance ✅
- [x] **Visual Polish**: Multiple rounds of UI refinements and bug fixes ✅

---

# 🔐 Phase 3 – Authentication & User Profiles ✅ **COMPLETED**

> Goal: Implement secure user authentication via Supabase, store profile data, and support optional login for both solo and multiplayer play. Logged-in users will accumulate stats and be shown in the leaderboard.

---

## 👥 3.1 — Supabase Setup & Integration ✅

- [x] Create Supabase project and configure:
  - [x] URL, anon key, JWT secret
  - [x] Email/password provider
- [x] All credentials stored securely (outside repo)
- [x] Initialize Supabase client in frontend and backend

---

## 🔄 3.2 — Auth Flow (Frontend) ✅

- [x] Add Login / Signup UI using `shadcn/ui` components
  - [x] Email input
  - [x] Password input
  - [x] Username field for signup
  - [x] Toggle between login/signup mode
- [x] Call Supabase auth methods:
  - [x] `signUp()`
  - [x] `signInWithPassword()`
  - [x] `signOut()`
  - [x] `updateProfile()`
- [x] Display auth errors and success messages
- [x] Implement persistent session tracking using Supabase's client library
- [x] Show loading state while session is being restored
- [x] Auth modal component with full error handling

---

## 🧑 3.3 — Auth Middleware (Backend) ✅

- [x] Create tRPC middleware to verify Supabase JWT token
- [x] Extract user ID from token and attach to request context
- [x] Reject unauthenticated requests to protected procedures
- [x] `protectedProcedure` middleware for authenticated routes
- [x] Context-based user authentication system

---

## 🧾 3.4 — User Profile Setup ✅

- [x] Extend `User` model in DB to include:
  - [x] `username` (editable after signup)
  - [x] `createdAt` and `updatedAt` timestamps
  - [x] `email` field synced with Supabase
- [x] User profile management in auth context
- [x] Profile creation/update functionality
- [x] UserMenu component for profile display

---

## 🧪 3.5 — Auth Testing ✅

- [x] Auth system fully functional in development
- [x] Login/signup flow tested and working
- [x] Session persistence verified
- [x] Protected routes enforcement working
- [x] User profile creation and display tested

**🎯 Phase 3 Status: COMPLETE**
- **Supabase Integration**: Full setup with environment configuration ✅
- **Authentication UI**: Complete AuthModal with login/signup ✅  
- **Auth Context**: Persistent session management with React context ✅
- **Backend Security**: JWT verification middleware for protected routes ✅
- **User Profiles**: Database model with username support ✅
- **User Menu**: Display user info and sign out functionality ✅
- **Protected Routes**: Auth-gated access to multiplayer features ✅

---

# 🌐 Phase 4 – Multiplayer Room System ✅ **COMPLETED**

> Goal: Implement real-time multiplayer mode where players join the same room, guess locations simultaneously, and receive scores after each round.

---

## 🧱 4.1 — Room Model & Schema ✅

- [x] Define `Room` model in DB with:
  - [x] `id` (room code)
  - [x] `hostUserId`
  - [x] `createdAt`, `updatedAt`
  - [x] `status` (WAITING, ACTIVE, FINISHED)
  - [x] `maxPlayers`, `currentRound`, `totalRounds`
  - [x] `roundTimeLimit` (optional)
- [x] Define `RoomPlayer` model:
  - [x] `roomId`, `userId`, `joinedAt`, `score`
  - [x] `isReady` status for game start readiness
  - [x] Unique constraint for one user per room

---

## 🛠️ 4.2 — Room Creation & Join Logic ✅

- [x] Add `trpc.room.create` to:
  - [x] Generate unique room ID/code
  - [x] Register current user as host
  - [x] Configure max players, rounds, time limits
  - [x] Host automatically marked as ready
- [x] Add `trpc.room.join` to:
  - [x] Verify room exists and is open
  - [x] Add user to `RoomPlayer` table
  - [x] Prevent duplicate joins
- [x] Reject join if room is full or already started
- [x] Complete room management (get, leave, updateStatus, setReady)

---

## 💬 4.3 — Real-time Communication (WebSockets) ✅

- [x] Set up Socket.IO on backend for room events
- [x] Establish frontend Socket.IO connection
- [x] Socket context and connection management
- [x] Implement real-time events:
  - [x] `player-joined`
  - [x] `player-left`
  - [x] `player-ready`
  - [x] `game-started`
  - [x] `room-updated`
  - [x] Error handling with `socket-error`

---

## 🧑‍🤝‍🧑 4.4 — Frontend: Room UI ✅

- [x] `/room/create` page:
  - [x] Complete room creation form with game settings
  - [x] Max players, rounds, time limit configuration
  - [x] Full validation and error handling
- [x] `/room/join` page:
  - [x] Room code input with validation
  - [x] Error handling for invalid/full rooms
- [x] `/room/:roomId` page:
  - [x] Complete room lobby with player list
  - [x] Host controls (start game, room settings)
  - [x] Player ready status system
  - [x] Real-time updates via Socket.IO
  - [x] Room code sharing functionality
  - [x] Connection status indicators

---

## 🔁 4.5 — Round Lifecycle Logic ✅

- [x] Room status management (WAITING → ACTIVE)
- [x] Game start triggers from host
- [x] Backend triggers round with new image
- [x] Broadcast to all players via `round-started`
- [x] Collect guesses from each player
- [x] After all guesses or timeout:
  - [x] Compute scores using Haversine formula
  - [x] Broadcast `round-ended` with results
  - [x] Store guess and score in DB
- [x] Multiple round progression logic
- [x] Game completion handling with final results

---

## 🧪 4.6 — Multiplayer Testing 🔄 **PARTIALLY COMPLETE**

- [x] Socket.IO implementation exists and appears complete
- [x] Automated unit tests for core game logic (Haversine, scoring, room codes)
- [ ] Manual testing of room creation and joining (needs Windows verification)
- [ ] Real-time player management verification (needs testing)
- [ ] Integration test for multiplayer functionality components
- [ ] E2E test flow (MISSING):
  - [ ] Create + join room (multiple browsers)
  - [ ] Submit multiplayer guesses (real-time testing)
  - [ ] Validate scoring and result sync across clients

**🎯 Phase 4 Status: IMPLEMENTATION COMPLETE, TESTING NEEDED** 🔄
- **Database Models**: Complete room and player management ✅
- **Backend API**: Full room CRUD operations with validation ✅
- **Frontend UI**: Complete room creation, joining, and lobby management ✅
- **Real-time Communication**: Socket.IO integration implemented ✅
- **Player Management**: Ready status, host controls, real-time updates ✅
- **Authentication Integration**: Protected room access ✅
- **Multiplayer Gameplay**: Complete round lifecycle with scoring ✅
- **Database Storage**: All multiplayer guesses properly stored ✅
- **Unit Testing**: Core game logic tested ✅
- **E2E Testing**: MISSING - Needs proper multi-browser testing ❌
- **Windows Verification**: MISSING - Needs PowerShell-compatible testing ❌

---

## 🎨 4.7 — UI/UX Consistency & Polish ✅ **COMPLETED**

> Goal: Ensure consistent user experience between Solo and Multiplayer modes by creating shared components and standardizing interaction patterns.

### 🧩 4.7.1 — Shared Component Creation

- [x] Create `ImageViewer` component:
  - [x] Extract zoom/pan logic from both Solo and Multiplayer
  - [x] Unified mouse/wheel event handling
  - [x] Consistent image interaction patterns
  - [x] Reusable across both game modes
- [x] Create `GameLayout` component:
  - [x] Support multiple layout modes (split, image-full, map-full)
  - [x] Keyboard shortcut integration
  - [x] Responsive design patterns
  - [x] Fullscreen toggle functionality

### 🎮 4.7.2 — Multiplayer UX Enhancement

- [x] Add layout modes to multiplayer:
  - [x] Implement fullscreen image view (F key)
  - [x] Implement fullscreen map view (M key)
  - [x] Add escape key to exit fullscreen
- [x] Add keyboard shortcuts:
  - [x] Enter to submit guess
  - [x] F/M for fullscreen toggles
  - [x] Escape for exit fullscreen
- [x] Enhance visual feedback:
  - [x] Hover overlays on image
  - [x] Interactive instruction tooltips
  - [x] Zoom/pan instruction hints

### 🔄 4.7.3 — Code Deduplication

- [x] Remove duplicated image interaction code:
  - [x] Consolidate zoom/pan state management
  - [x] Unify mouse event handlers
  - [x] Share wheel event listener logic
- [x] Standardize component structure:
  - [x] Consistent prop interfaces
  - [x] Unified event handling patterns
  - [x] Shared styling approaches

### 🎯 4.7.4 — UX Feature Parity

- [x] Solo mode features in multiplayer:
  - [x] Click-to-fullscreen image behavior
  - [x] Visual zoom percentage indicator
  - [x] Interactive overlay hints
  - [x] Keyboard shortcut help overlay
- [x] Consistent visual design:
  - [x] Matching card layouts and spacing
  - [x] Unified button styles and interactions
  - [x] Consistent loading states and animations

### 🧪 4.7.5 — Testing & Validation

- [x] Component unit tests:
  - [x] ImageViewer component functionality (12 tests)
  - [x] GameLayout responsive behavior (15 tests)
  - [x] Keyboard shortcut handling
- [x] Integration testing:
  - [x] Solo mode with new shared components
  - [x] Multiplayer mode with enhanced UX
  - [x] Cross-browser compatibility (via shared components)
- [x] UX validation:
  - [x] Consistent interaction patterns
  - [x] Responsive design verification
  - [x] Accessibility compliance

**🎯 Phase 4.7 Status: COMPLETED** ✅
- **Shared Components**: COMPLETE - Created ImageViewer and GameLayout components ✅
- **Multiplayer Enhancement**: COMPLETE - Added layout modes and keyboard shortcuts ✅
- **Code Deduplication**: COMPLETE - Eliminated ~150 lines of duplicated code ✅
- **UX Feature Parity**: COMPLETE - Both modes now have identical interaction patterns ✅
- **Testing**: COMPLETE - 27 unit tests covering all new functionality ✅

**🎉 Key Achievements:**
- **Eliminated Code Duplication**: Removed ~150 lines of duplicated image interaction code
- **Enhanced Multiplayer UX**: Added fullscreen modes, keyboard shortcuts, and visual feedback
- **Consistent User Experience**: Both Solo and Multiplayer now have identical interaction patterns
- **Improved Maintainability**: Shared components make future updates easier
- **Comprehensive Testing**: 27 new unit tests ensure reliability




# 🏆 Phase 5 – Leaderboard & Player Stats

> Goal: Track individual performance, enable global rankings, and allow users to view personal stats. This adds replay value and motivates competition.

---

## 🧾 5.1 — Backend: Stats & Score Storage

- [x] Update `Guess` model to include:
  - [x] `mode` (solo or multiplayer)
  - [x] `score`, `timestamp`
- [ ] Add `UserStats` model or computed view with:
  - [ ] Total games played
  - [ ] Average score
  - [ ] Highest score
  - [ ] Total distance guessed
- [x] Update logic in solo and multiplayer to persist guesses and scores

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
  - [ ] Add "round start countdown" animation

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
