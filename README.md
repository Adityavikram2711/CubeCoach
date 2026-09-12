# CubeCoach

### Solve. Learn. Practice. Master the Cube.

CubeCoach is a full-stack (MERN) Rubik's Cube platform built as a college project: a genuine, verified 3×3 solver, interactive cube input, 3D visualization, a complete verified algorithm library (57 OLL, 21 PLL, 24 F2L), user accounts with personalized algorithms, an algorithm trainer, and a speedcubing timer with statistics.

Every piece of cube logic — the solver, the 3D renderer, the algorithm library, the trainer — is driven by one shared, framework-independent cube engine. Nothing in this app "fakes" a solve, invents an algorithm, or displays a statistic that wasn't computed from real data; see [Known Limitations](#known-limitations) for the handful of places that's an explicit, documented trade-off rather than a hidden gap.

## 1. Features

- **Interactive cube input** — a 2D net UI for entering any physical cube's colors, with full validation (correct piece counts, no impossible orientations) before it's ever handed to the solver.
- **Real two-phase solver** — an actual implementation of the algorithm family behind Kociemba's solver (not a lookup table, not a scripted demo), running in a Web Worker so the UI never blocks, with every solution independently re-verified before being shown.
- **3D cube** — Three.js / React Three Fiber, driven entirely by the shared cube engine's state; there is no separate "visual" cube representation that could drift out of sync with the logical one.
- **Solution viewer** — move-by-move playback of any solve or algorithm, with keyboard shortcuts, speed control, and notation help.
- **Algorithm library** — 57 OLL + 21 PLL + 24 F2L cases (102 total), each independently generated and verified against the cube engine rather than transcribed from memory (see [Known Limitations](#known-limitations) on why F2L is 24, not the traditional 41).
- **Accounts & personalization** — register/login (JWT), and per-user favorites, "learned" status, a personal preferred algorithm, personal alternative algorithms, and notes on any case — all layered on top of the global verified data without ever modifying it.
- **Algorithm trainer** — recognition mode (identify a case from its 3D state) and recall mode (recall the algorithm, then reveal and self-assess), with filtering (all/favorites/learned/unlearned/weak) and a deterministic, explainable weak-case weighting model.
- **Speed timer** — WCA-style inspection (15s, then a +2 grace window, then auto-DNF), timestamp-based timing (`performance.now()`, never interval accumulation), +2/DNF penalties, persistent solve history for logged-in users, and Ao5/Ao12/Ao50 statistics.

## 2. Tech Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, TanStack Query, Three.js, React Three Fiber, Lucide icons
- **Server:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod, Helmet, express-rate-limit
- **Shared:** `shared/cube-engine` — a framework-independent TypeScript package (state, moves, parser, validation, scrambles, the solver, and the algorithm generators). It imports nothing from React, Express, or MongoDB.
- **Testing:** Vitest, Supertest, MongoDB Memory Server, Testing Library, and Playwright for end-to-end browser verification.

## 3. Architecture

```
React + TypeScript (client)  →  REST API  →  Express + TypeScript (server)  →  Mongoose  →  MongoDB
                                     ↑
                     shared/cube-engine (no framework dependency)
```

```
Cube State (facelets) → shared/cube-engine → Solver / Algorithm Library / Trainer → 3D Visualization (Three.js)
```

The cube engine is the single source of truth for cube state. The solver, the algorithm library's generators, the 3D renderer, the interactive cube input, and the trainer all read and write through it — there is no second, incompatible cube representation anywhere in the app, and no hand-typed sticker arrays.

### Solver architecture

```
Cube State (facelets)
      ↓
validateCube()               -- reject impossible cubes before ever searching
      ↓
Cubie Representation         -- faceletToCubie(): corner/edge permutation + orientation
      ↓
Coordinates                  -- corner/edge orientation, UD-slice membership, and
      ↓                         (phase 2) corner/edge/slice permutation, each ranked
      ↓                         into a small integer via combinatorics
Phase 1 Search (IDA*)        -- reach "all corners oriented, all edges oriented, the
      ↓                         4 middle-slice edges back in their own 4 slots" using
      ↓                         all 18 standard moves
Phase 2 Search (IDA*)        -- finish from there using only U/D (any turn) and
      ↓                         L2/R2/F2/B2, which can't undo phase 1's work
Solution Reconstruction      -- concatenate + simplifyMoves()
      ↓
Verification                 -- replay the final move list through applyMoves()/
                                 isSolved() on a fresh copy of the ORIGINAL input;
                                 an unverified candidate is never returned
```

This is the standard two-phase algorithm (the technique behind Kociemba's solver): phase 1 reduces an intractably large search space (43 quintillion states) down to a subgroup phase 2 can finish quickly. Both phases use iterative-deepening A* with BFS-generated pruning tables as an admissible heuristic. Move-coordinate transition tables and pruning tables are built once per process and memoized — in the browser this happens once per Web Worker lifetime, off the main thread, so the UI never blocks.

The `solve()` function is exported from `shared/cube-engine` and used identically by the client's Web Worker (`client/src/features/solver/solver.worker.ts`) and the server's `POST /api/cube/solve` endpoint — one solving algorithm, not a client version and a separately-maintained server version.

### Algorithm library generation

The 102 algorithm cases are not copied from a website or typed in by hand. Each set has its case definitions derived independently of any algorithm, and every algorithm is found by an IDA* search against the cube engine and then re-verified by actually applying it and checking the real goal state:

- **OLL (57)** — every valid last-layer orientation pattern, mathematically enumerated and deduplicated by rotation-orbit (an exact, provable count).
- **PLL (21)** — a curated set of structurally distinct permutations (8 well-known named cases plus 13 additional distinct 3-cycles), since 21 is a speedcubing convention rather than something derivable from pure enumeration.
- **F2L (24)** — see [Known Limitations](#known-limitations).

Generation lives in `shared/cube-engine/src/algorithms/` and is run via `scripts/generate-{oll,pll,f2l}.ts`, writing to `data/algorithms/*.json`, which `scripts/seed.ts` validates (schema + re-parses every algorithm string) before upserting into MongoDB.

### Authentication & personalization

JWT-based auth (`server/src/routes/auth.routes.ts`), with a `User` model and a separate `UserAlgorithm` model that holds one document per (user, algorithm case) — favorites, learned status, a personal preferred algorithm, personal alternatives, notes, and practice statistics. The canonical `Algorithm` collection is never written to by any personalization or trainer action; "effective algorithm" (what to show/practice) is computed at presentation time by preferring the user's override when one exists and falling back to the global algorithm otherwise. Every personalization query and mutation is scoped server-side by the authenticated user's id from the verified JWT — never a client-supplied id.

### Timer

The timer's elapsed time is always derived from real timestamps (`performance.now()`), never accumulated via a `setInterval` counter — the display updates via `requestAnimationFrame`, but the authoritative value at every state transition is a fresh subtraction of two timestamps, so it can't drift and can't go negative if a tab is backgrounded. Statistics (best, average, Ao5/Ao12/Ao50) are pure, independently unit-tested functions with an explicitly documented DNF-handling rule (see `shared` test files under `client/src/features/timer/`).

## 4. Project Structure

```
client/                      React app
  src/api/                     fetch wrappers for the REST API
  src/store/                   Zustand stores (auth)
  src/features/                algorithms, solver, trainer, timer -- each with its
                                pure logic, hooks, and UI kept separate
  src/pages/                   route-level page components
  src/three/                   the shared Cube3D renderer + animation queue
server/                      Express API
  src/models/                   User, Algorithm, UserAlgorithm, Solve (Mongoose)
  src/routes/, controllers/     REST endpoints
  src/middleware/                auth, error handling
  src/validators/                Zod schemas
shared/cube-engine/          Framework-independent cube logic
  src/cube/, moves/, parser/, validation/, scramble/   core engine
  src/solver/                    the two-phase solver
  src/algorithms/                OLL/PLL/F2L case generation + verification
data/algorithms/             Generated, verified OLL/PLL/F2L JSON (seeded into MongoDB)
scripts/                     generate-{oll,pll,f2l}.ts, seed.ts
```

## 5. Local Development

### Prerequisites

- **Node.js 18 or later** (20 LTS recommended — see `.nvmrc`; `engines.node` in `package.json` enforces `>=18.0.0`) and npm.
- A MongoDB connection string. **MongoDB Atlas is the recommended option** (no local database install required) — see [MongoDB Setup](#6-mongodb-setup) below. A local `mongod` also works if you already have one.

### Installation

```bash
git clone <repository-url>
cd CubeCoach
npm install
```

This is an npm-workspaces monorepo (`shared/cube-engine`, `server`, `client`) — a single `npm install` at the repo root installs every workspace's dependencies (and devDependencies) in one pass. You never need to run `npm install` inside a subdirectory.

### Environment

```bash
cp .env.example .env          # read by the server
cp .env.example client/.env   # read by the Vite dev server / build (only VITE_API_URL matters here)
```

Then edit **`.env`** and set:
- `MONGODB_URI` — your connection string (see [MongoDB Setup](#6-mongodb-setup)).
- `JWT_SECRET` — any long random string, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

The defaults for `PORT`, `NODE_ENV`, `CLIENT_URL`, and `VITE_API_URL` already match this project's local ports and don't need to change for a standard local setup. `client/.env` only needs its `VITE_API_URL` line to be correct — Vite ignores the other, non-`VITE_`-prefixed variables if you leave them in that copy.

Two separate files are required because the two dev servers read environment variables from different places: the Express API reads `.env` at the repo root, and Vite (by convention) only reads `.env` files inside `client/`, and only exposes variables prefixed `VITE_` to the browser bundle.

### Run

```bash
npm run dev
```

Starts the Express API and the Vite dev server together (via `concurrently`). `Ctrl+C` stops both.

- Frontend: **http://localhost:5173**
- API: **http://localhost:4000/api**
- Health check: **http://localhost:4000/api/health**

The API still starts and serves the stateless cube-solving routes even if MongoDB is unreachable — but auth, personalization, the algorithm library, and the timer's persistent history all require a working `MONGODB_URI`.

### Populate the algorithm library

The verified 57 OLL + 21 PLL + 24 F2L cases are pre-generated and already checked into `data/algorithms/*.json` — a fresh clone does not need to regenerate them. Just seed your database:

```bash
npm run seed
```

Safe to run any number of times: it upserts by `caseId` and never drops or resets a collection. You only need the `generate-{oll,pll,f2l}.ts` scripts (under `scripts/`) if you're deliberately regenerating that data from scratch.

## 6. MongoDB Setup

Recommended: a free **MongoDB Atlas** cluster (no local database server to install or manage).

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (the free M0 tier is enough for local development).
3. Under **Database Access**, add a database user with a username and password.
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` to allow access from anywhere, for local development only).
5. Click **Connect → Drivers**, copy the connection string, replace `<password>` with your database user's password, and add a database name before the query string, e.g. `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cubecoach`.
6. Paste that full string as `MONGODB_URI` in your `.env`.

[MongoDB Compass](https://www.mongodb.com/products/compass) is optional — useful if you want to browse the seeded collections visually, but nothing in this project requires it.

A local `mongod` also works: just set `MONGODB_URI=mongodb://localhost:27017/cubecoach` (the default in `.env.example`).

## 7. Environment Variables

See `.env.example` for the full, placeholder-only list (with comments). At minimum:

| Variable | Used by | Purpose |
|---|---|---|
| `PORT` | server | port the API listens on (default `4000`) |
| `NODE_ENV` | server | `development` / `production` / `test` |
| `MONGODB_URI` | server | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | server | signs/verifies auth tokens — **must** be set to a real secret in production (there is a development-only fallback, but the server refuses to start without one when `NODE_ENV=production`) |
| `CLIENT_URL` | server | the exact origin allowed by CORS (default `http://localhost:5173`) |
| `VITE_API_URL` | client (build-time) | the base URL the frontend calls for the API (default `http://localhost:4000/api`) |

No real credentials are committed anywhere in this repository — `.env`, every `.env.*` variant (`client/.env` included), are all git-ignored; only `.env.example` (placeholders only) is tracked.

## 8. Database

Four Mongoose models, all in `server/src/models/`:

- **User** — `username`, `email` (unique, lowercased), `passwordHash` (never returned in any API response; excluded via a `toJSON` transform and `select: false`).
- **Algorithm** — the canonical, verified OLL/PLL/F2L data; `caseId` is the stable lookup key used everywhere else.
- **UserAlgorithm** — one document per (user, algorithm) with a unique compound index on `{userId, algorithmId}`; a missing document is treated as "no personalization yet" rather than requiring 102 placeholder rows per user.
- **Solve** — one document per timed solve, indexed on `{userId, solvedAt: -1}` for the "most recent solves" query the history and statistics both use; `rawTimeMs`, `penalty`, and the server-calculated `finalTimeMs` are stored separately (never just a formatted string).

Every query that returns or mutates user-owned data is scoped by `req.user.id`, taken only from a verified JWT — a client-supplied `userId` anywhere in a request body is always ignored.

## 9. Testing

```bash
npm test              # cube-engine + server + client suites
npm run typecheck      # all three workspaces
npm run build           # all three workspaces
```

As of the last full regression: **522 automated tests passing** (156 cube-engine, 75 server, 291 client) across Vitest, plus Playwright-driven end-to-end browser verification for every phase (guest and authenticated flows, two-user ownership isolation, mobile viewport checks, and console-error checks). Server tests use `mongodb-memory-server`, so no real database connection is required to run them.

## 10. Production Build

```bash
npm run build
```

Builds `shared/cube-engine` first (the server and client both depend on its compiled output), then the server (`tsc`), then the client (`tsc --noEmit && vite build`, output in `client/dist/`). To run the built server: `npm run start --workspace=server` (requires the environment variables above to be set, and `NODE_ENV=production` to require a real `JWT_SECRET`).

## 11. Major Technical Decisions

- **One cube engine, no duplication.** Every feature that needs cube logic imports `shared/cube-engine` rather than re-implementing any part of it — this was enforced across every development phase specifically to avoid the classic bug class of "the 3D view and the solver silently disagree about what a move does."
- **Verification over trust.** The solver always re-verifies its own answer against the original input before returning it; every algorithm library case is verified by actually applying it and checking the real resulting cube state, never approximated or assumed correct because "it looks right."
- **Server is the source of truth for calculated values.** `finalTimeMs` (timer) and personalization ownership are always computed/enforced server-side from verified inputs (JWT, `rawTimeMs` + `penalty`), never trusted from the client even when the client also computes the same value locally for instant UI feedback.
- **Guest-first, account-optional.** Every core feature (solving, the algorithm library, the trainer, the timer) works fully without an account; accounts only add persistence and personalization on top.
- **Statistics computed once, reused everywhere.** The Ao5/Ao12/Ao50/PB rules live in one pure, unit-tested module and are applied identically whether the underlying solves came from a guest's in-memory session or an authenticated user's fetched history.

## 12. Known Limitations

These are documented, deliberate scope decisions — not bugs, and not things this project pretends aren't true:

- **F2L is 24 cases, not the traditional 41.** The 24 cases (corner + edge both still in the top layer, unpaired) are a mathematically well-defined, fully verified subset. The remaining ~17 traditional cases involve a piece already sitting in a slot, and the exact taxonomy for those is a curated speedcubing convention this project could not independently verify against a trustworthy source — rather than guess at it and risk presenting an unverified case as "verified," the generator is scoped to the subset it can prove.
- **Personal Best / statistics use the most recent 200 solves**, not a full all-time database aggregation. For realistic practice volumes on a project at this scale, this is effectively exact; it's a documented simplification rather than a hidden inaccuracy.
- **Guest progress (trainer sessions, timer history) is session-only** — it lives in React state and is gone on refresh, by design. There is no localStorage persistence and no guest-to-account merge on login; logging in always shows that account's own (empty, for a new account) history.
- **Statistics are computed client-side** from the fetched solve list rather than via a dedicated `/api/solves/stats` endpoint — this reuses the exact same pure statistics functions guests need locally anyway, rather than maintaining the Ao5/Ao12/Ao50 rule in two places.
- **No 2×2/4×4/other puzzles, no Ao5/Ao12 session management beyond the rolling stats shown, no admin tooling.** These were explicitly out of scope for every phase that touched the timer/trainer.

## 13. Future Improvements

- A dedicated, paginated solve-history endpoint if solve volume ever exceeds the current 200-solve window meaningfully.
- Extending the F2L set to the full 41 cases, if a trustworthy canonical case taxonomy can be sourced and independently verified against the cube engine the same way OLL/PLL were.
- Code-splitting the client bundle (Three.js is the largest contributor) to reduce the initial JS payload.
- A guest-session-to-account migration flow on first login, if that's ever a real user need rather than a convenience.
