# 📄 Product Requirements Document (PRD) – GeoScope

## 🧩 Overview

**GeoScope** is a multiplayer geography guessing game where players must identify real-world locations by placing a pin on a map based on visual cues from real photos. The game will support solo and competitive multiplayer modes, real-time gameplay, and dynamic image sourcing from external APIs.

---

## 🎯 Goals

- Create an engaging, fast-paced geography guessing game
- Support solo and multiplayer modes from launch
- Integrate dynamic image fetching via real-world APIs (not pre-uploaded)
- Deliver high-quality, responsive, and modern UI
- Offer real-time interaction in multiplayer
- Include basic authentication, leaderboard, and user stats
- Host on cost-effective, scalable platforms

---

## 🎮 Game Modes

### 1. **Solo Mode**
- Player is shown a real photo and must guess its location by placing a pin on the map
- After submitting the guess, the system calculates the distance between the guess and the actual location
- Score is calculated based on proximity
- Feedback is shown on a result screen, including both the guess and true location on a map

### 2. **Multiplayer Mode (Real-Time Match)**
- One player creates a room and receives a room code
- Others join via code
- All players view the same image and place guesses simultaneously
- After the round ends, results are shown as a scoreboard comparing players' distances and scores
- The game proceeds to the next round or ends after a fixed number of rounds

---

## 🖼️ Image Source (Dynamic via API)

- Images will be fetched dynamically using **real-world geo-tagged image APIs** (e.g. Mapillary, Unsplash, Wikimedia Commons)
- Must include:
  - Image URL
  - Latitude/Longitude of the original photo
- Backend fetches image and location metadata in real-time or caches them for multiplayer rounds
- Ensures increased variety, randomness, and global coverage
- No need for image uploading or admin image management in MVP

---

## 👥 User Flow

1. **Unauthenticated User**
   - Lands on login/registration page
   - Can create account or log in with email/password (via Supabase)

2. **Authenticated User**
   - Redirected to Home Page
   - Options:
     - Play Solo
     - Create Room
     - Join Room
     - View Leaderboard

3. **Solo Mode**
   - Image is fetched from API
   - User places a pin and submits
   - Result shown with actual vs. guessed location

4. **Multiplayer Mode**
   - Host creates room and shares code
   - Players join lobby
   - When started, all players receive same image (from API)
   - Each player submits a guess
   - Results shown in scoreboard after each round

5. **Leaderboard**
   - View top scores (solo/multiplayer)
   - Track personal bests and history

---

## 🧪 MVP Scope Summary

| Feature                          | Included in MVP |
|----------------------------------|-----------------|
| Authentication (email/password) | ✅ Yes           |
| Solo Game Mode                   | ✅ Yes           |
| Multiplayer Game Mode (real-time)| ✅ Yes           |
| Dynamic image API integration    | ✅ Yes           |
| Leaderboard                      | ✅ Yes           |
| User Stats                       | ✅ Yes           |
| Admin image upload               | ❌ No            |
| Game History                     | ✅ Yes           |
| E2E Functional Testing           | ✅ Yes           |
| Deployment & Hosting             | ✅ Yes (Railway) |

---

## 📱 UI Screens

| Screen Name             | Purpose                                                 |
|--------------------------|----------------------------------------------------------|
| Login/Register           | Email/password auth (Supabase)                           |
| Home Page                | Central navigation with buttons: Solo, Multiplayer, etc. |
| Solo Game                | Image, map pin, timer, submit                            |
| Solo Result              | Show guess vs. true location, score                      |
| Create Room              | Generate room, show code                                 |
| Join Room                | Enter code to join room                                  |
| Room Lobby               | Player list, host controls                               |
| Multiplayer Game         | Shared image, player submissions                         |
| Multiplayer Results      | Scoreboard view                                          |
| Leaderboard              | Top users by score                                       |
| My Stats                 | Personal performance overview                            |

---

## 🔒 Authentication & Access Control

- Supabase Auth (email/password)
- Protected routes (solo, multiplayer, stats, etc.)
- Only authenticated users may play or view scores

##  📊 Scoring Rules

- Players receive a score per round based on how close their guess is to the actual location.
- Maximum possible score: 1000
- Score decreases as distance increases.
- In multiplayer, scores are cumulative across rounds.
- Closest guess gets a bonus highlight.

---

## 📈 Leaderboard

- Leaderboards are visible after each multiplayer round and at the end of a game session.
- Separate leaderboard available for:
  - Daily solo scores
  - Weekly or monthly top players
- Displays: avatar, username, total score, number of rounds played

---

## 💡 UX Notes

- All game transitions should be smooth and animated (fade in/out or slide).
- Map interactions should be intuitive: pan, zoom, pin drop with animation.
- Timer countdown should be highly visible.
- Responsive across desktop, tablet, and mobile.
- Clean, modern UI with dark mode default and game-like visual elements.

---

##  🚀 MVP Goals

- Fully working Solo Mode with scoring and result display
- Fully working Multiplayer Mode with room creation, game rounds, and leaderboard
- Clean, modern, responsive UI across all game screens
- Required login/signup flow
- Post-round leaderboard and cumulative score system
