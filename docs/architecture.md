# Sporelike — Architecture

Technical contract for agents working on this codebase. Read this before touching any code.

## Repository Layout

```
sporelike/
├── frontend/          # Vite + React + TypeScript SPA
│   ├── public/
│   │   └── placeholders/  # Static placeholder images for species/features/planets
│   └── src/
│       ├── App.tsx            # Root component, tab routing, top-level state
│       ├── App.css            # All styles (single file, no CSS modules)
│       ├── types.ts           # Canonical type definitions (source of truth)
│       ├── mockData.ts        # Mock game state (2 eras, used as seed data)
│       ├── api.ts             # Fetch client — thin wrappers over the three worker endpoints
│       └── components/        # UI components (one per file)
│           ├── TopBar.tsx
│           ├── BottomNav.tsx
│           ├── PlanetView.tsx
│           ├── EcosystemView.tsx
│           ├── ChallengeView.tsx
│           ├── EvolveView.tsx
│           ├── SpeciesCard.tsx
│           └── FeatureCard.tsx
├── worker/            # Cloudflare Worker — three live AI endpoints
│   ├── src/
│   │   ├── index.ts   # HTTP handler + routing
│   │   ├── gemini.ts  # Gemini API fetch wrapper + JSON parser
│   │   ├── prompts.ts # Prompt builder functions (worker-side copy)
│   │   └── types.ts   # Shared game types (self-contained, no frontend import)
│   └── wrangler.toml
└── package.json       # Root scripts only (delegates to sub-packages)
```

## Frontend

**Stack**: React 19 + TypeScript 5.9 + Vite 8, no external state library, no router.

**State model**: Two state objects with a clean boundary:

1. **`gameState`** (`useReducer` in App.tsx) — serializable game data, persisted to `localStorage` on every change. Reducer in `gameReducer.ts` with named actions: `MAKE_CHALLENGE_CHOICE`, `ACCEPT_MUTATION`, `ADVANCE_ERA`, `LOAD_SAVE`. Initialized from localStorage (key `sporelike:save:{planetId}`), falls back to `newGameState()` from `newGame.ts`.

2. **UI state** (`useState` in App.tsx) — survives tab switches but not refresh. Includes `viewEraIndex`, `activeTab`, `challengeIndex`, `freeformOutcomes`, etc. Reset when `viewEraIndex` changes.

3. **Evolve draft** (`useState` + localStorage) — mutation text, preview result, accepted flag. Persisted to `sporelike:draft:{planetId}` so the expensive AI preview survives refresh. Cleared on era advance.

Components receive state as props and dispatch changes via callbacks. Local component state is only for truly transient UI (loading spinners, error messages, in-progress freeform text).

**Component tree**:
```
App
├── TopBar          (era label + era-picker dropdown)
├── main.main-content
│   ├── PlanetView      (tab: planet)
│   ├── EcosystemView   (tab: ecosystem)
│   ├── ChallengeView   (tab: challenges)
│   └── EvolveView      (tab: evolve)
└── BottomNav       (4 icon tabs)
```

**Read-only mode**: When `viewEraIndex !== gameState.currentEraIndex` the user is time-traveling. `isReadOnly` prop is passed to `ChallengeView` and `EvolveView` which lock all interactive elements.

**Dev server**: `npm run dev:frontend` → `http://localhost:5173`

In a devcontainer, run the worker with `--ip 0.0.0.0` so the Vite proxy can reach it:
```
wrangler dev --ip 0.0.0.0
```

**Vite proxy**: `vite.config.ts` proxies `/api/*` to `http://localhost:8787` during local development so the frontend talks to the local worker without CORS issues and without needing `VITE_API_URL`.

**Build**: `npm run build:frontend` (tsc + vite build, output to `frontend/dist/`)

**Tests**: `npm run test:frontend` (vitest), `npm run test:e2e` (playwright)

## Backend (Cloudflare Worker)

**Current state**: Three endpoints are fully implemented and call the Gemini 2.5 Flash Lite API.

**Stack**:
- **Cloudflare Workers** — HTTP handler, API key injection, request validation, CORS
- **D1 (SQLite)** — not yet configured (planned for persistent game state)
- **R2** — not yet configured (planned for generated image storage)

**wrangler.toml** (current):
```toml
name = "sporelike-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
```

D1 and R2 bindings are not yet configured.

**Worker secret**: `GEMINI_API_KEY` — set via `wrangler secret put GEMINI_API_KEY`. Never in wrangler.toml or the frontend bundle.

**Dev**: `npm run dev:worker` (wrangler dev, default port 8787)

**Deploy**: `npm run deploy:worker`

**Live URL**: `https://sporelike-api.joern-ef1.workers.dev`

## API Contract

All endpoints are JSON over HTTP (`Content-Type: application/json` required). The worker injects the Gemini API key — the frontend never holds secrets.

### GET /api/health

Returns `{ status: 'ok' }`. Used for smoke-testing.

### POST /api/mutation-preview

Generates a mutation candidate for the player species. Expected to take 3–5 seconds.

```
Request body:  { currentEra: Era; playerSpecies: Species; requestedChange: string }
Response body: MutationPreviewOutput  (species + reasoning + variabilityScore)
```

### POST /api/era-progression

Generates the next era. Expected to take 10–15 seconds.

```
Request body:  EraProgressionInput
Response body: { newEra: Era }
```

### POST /api/freeform-challenge

Generates an outcome for a player-typed freeform challenge response. Expected to take 3–5 seconds.

```
Request body:  { challenge: Challenge; freeformText: string; era: Era }
Response body: { outcome: string; pointsAwarded: number }
```

### GET /api/game/:planetId (planned)

Fetches saved game state for a planet. Not yet implemented.

### POST /api/game/:planetId (planned)

Saves game state. Not yet implemented.

## AI Services

### Gemini 2.5 Flash Lite (game logic)

Used for all three game logic calls. The worker calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent` using plain `fetch` (no SDK). Implementation is in `worker/src/gemini.ts`.

Prompt builders live in `worker/src/prompts.ts` (worker-side only). The frontend has no prompt logic — all AI calls go through the worker.

- `buildMutationPrompt(input: MutationPreviewInput): string` — builds on existing traits, addresses active pressures, returns mutated `Species` + `reasoning` + `variabilityScore`.
- `buildEraProgressionPrompt(input: EraProgressionInput): string` — instructs the model to act as an ecologist/game designer, enforces ecological coherence rules, specifies exact JSON output schema matching `Era`.
- `buildFreeformChallengePrompt(challenge, freeformText, era): string` — evaluates a freeform player action and returns an outcome + points awarded.

All prompts end with "Respond with valid JSON only, no prose outside the JSON." `parseJsonResponse` in `gemini.ts` strips optional markdown code fences before parsing.

### Flux Schnell via fal.ai (planned)

Image generation for species and features. Not yet integrated. Each `Species` and `Feature` carries an `imagePrompt: string` field for future use. Generated image URLs would be stored in `imageUrl?: string` (to be hosted in R2). Static placeholder images are served from `frontend/public/placeholders/`.

Generation cadence is a tunable decision (every era vs. every N eras). See `game-design.md`.

## Data Flow

### Normal turn

```
Player completes challenges (ChallengeView)
    → real freeform actions: POST /api/freeform-challenge (~3-5s)
    → navigates to Evolve tab
    → types mutation request → POST /api/mutation-preview (~3-5s) → preview shown
    → accepts mutation
    → clicks "Advance to Next Era"
        → POST /api/era-progression (~10-15s, advanceLoading spinner)
        → response: new Era appended to gameState.eras
        → currentEraIndex incremented
```

### State shape summary

See `frontend/src/types.ts` for all TypeScript definitions. Key relationships:

- `GameState.eras` is ordered history; `eras[currentEraIndex]` is the live era.
- `Era.playerSpeciesId` identifies which `Species` in `Era.species` belongs to the player.
- `Species.parentId` links to the species it evolved from (always in a previous era).
- `Challenge.playerChoice` is the recorded decision: `number` (action index) or `"freeform"`.
- `GameState.mutationCandidates` holds species previews the player generated before accepting one.
- `EraSummary` is the compressed history format sent to the AI to avoid token bloat.

## Type Definitions Summary

All canonical types are in `frontend/src/types.ts`. The worker maintains a self-contained copy in `worker/src/types.ts` — do not import across packages. Key interfaces:

| Type | Purpose |
|---|---|
| `Planet` | Save-slot metadata (name, eraCount, speciesCount) |
| `Species` | One species: name, description, traits, imagePrompt, parentId, isPlayer |
| `Feature` | Geological or ecological element of an era |
| `ChallengeAction` | One pre-generated action: label, outcome, pointsAwarded |
| `Challenge` | A situation with 3-4 actions + optional freeform result |
| `EraEvent` | A narrative event (extinction, fork, etc.) recording what changed |
| `Era` | Full snapshot: species, features, challenges, events, playerSpeciesId |
| `GameState` | Ordered era history + current index + mutation candidates |
| `EraProgressionInput` | Payload for the era progression AI call |
| `EraSummary` | Compressed past-era summary (tokens-efficient) |
| `MutationPreviewInput` | Payload for the mutation preview AI call |
| `MutationPreviewOutput` | Result of mutation preview: species + reasoning + variabilityScore |
| `FreeformChallengeOutput` | Result of freeform challenge: outcome + pointsAwarded |

## Deployment

- **Frontend**: Cloudflare Pages, serving `frontend/dist/`. Live URL: `https://sporelike.pages.dev`
- **Worker**: Cloudflare Workers, name `sporelike-api`. Deployed via `wrangler deploy`. Live URL: `https://sporelike-api.joern-ef1.workers.dev`
- **No SSR**. The SPA is fully static; all dynamic behavior goes through the Worker API.
- **Secrets**: `GEMINI_API_KEY` is set as a Worker secret via `wrangler secret put`, never in the frontend bundle.
