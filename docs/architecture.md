# Sporelike — Architecture

Technical contract for agents working on this codebase. Read this before touching any code.

## Repository Layout

```
sporelike/
├── frontend/          # Vite + React + TypeScript SPA
│   └── src/
│       ├── App.tsx            # Root component, tab routing, top-level state
│       ├── App.css            # All styles (single file, no CSS modules)
│       ├── types.ts           # Canonical type definitions (source of truth)
│       ├── mockData.ts        # Mock game state (2 eras, used while backend is placeholder)
│       ├── components/        # UI components (one per file)
│       │   ├── TopBar.tsx
│       │   ├── BottomNav.tsx
│       │   ├── PlanetView.tsx
│       │   ├── EcosystemView.tsx
│       │   ├── ChallengeView.tsx
│       │   ├── EvolveView.tsx
│       │   ├── SpeciesCard.tsx
│       │   └── FeatureCard.tsx
│       └── prompts/           # AI prompt builders (pure functions, no fetch)
│           ├── eraProgression.ts
│           └── mutationPreview.ts
├── worker/            # Cloudflare Worker (currently placeholder)
│   ├── src/index.ts
│   └── wrangler.toml
└── package.json       # Root scripts only (delegates to sub-packages)
```

## Frontend

**Stack**: React 19 + TypeScript 5.9 + Vite 8, no external state library, no router.

**State model**: All mutable state lives in `App.tsx` via `useState`. Currently seeded from `mockData.ts`. The eventual pattern is React context + `useReducer` for `GameState` as the app grows.

Key state variables in `App.tsx`:
- `gameState: GameState` — full era history + mutation candidates
- `viewEraIndex: number` — which era the UI is showing (enables read-only time travel)
- `activeTab: TabId` — which of the four views is visible
- `showEraDropdown: boolean` — controls the era picker overlay

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

**Build**: `npm run build:frontend` (tsc + vite build, output to `frontend/dist/`)

**Tests**: `npm run test:frontend` (vitest), `npm run test:e2e` (playwright)

## Backend (Cloudflare Worker)

**Current state**: Placeholder only. `worker/src/index.ts` returns `{ status: 'ok', message: 'Sporelike API - placeholder' }` for all requests.

**Planned stack**:
- **Cloudflare Workers** — HTTP handler, API key injection, request validation, rate limiting
- **D1 (SQLite)** — persistent game state (eras, species, challenges)
- **R2** — generated image storage (URLs stored in `Species.imageUrl`)

**wrangler.toml** (current):
```toml
name = "sporelike-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
```

D1 and R2 bindings are not yet configured.

**Dev**: `npm run dev:worker` (wrangler dev, default port 8787)

**Deploy**: `npm run deploy:worker`

## Planned API Contract

All endpoints are JSON over HTTP. The worker injects API keys for Claude and fal.ai — the frontend never holds secrets.

### POST /api/era/progress

Generates the next era. Expected to take 10–15 seconds. Input matches `EraProgressionInput` from `types.ts`.

```
Request body: EraProgressionInput
Response body: { newEra: Era }
```

### POST /api/mutation/preview

Generates a mutation candidate for the player species. Expected to take 3–5 seconds.

```
Request body: MutationPreviewInput
Response body: MutationPreviewOutput  (species + reasoning + variabilityScore)
```

### POST /api/challenge/freeform

Generates an outcome for a player-typed freeform challenge response. Expected to take 3–5 seconds.

```
Request body: { challengeId: string; context: Era; freeformText: string }
Response body: { outcome: string; pointsAwarded: number }
```

### GET /api/game/:planetId

Fetches saved game state for a planet (planned, not implemented).

```
Response body: GameState
```

### POST /api/game/:planetId

Saves game state (planned, not implemented).

## AI Services

### Claude Haiku (game logic)

Used for all three game logic calls. Prompts are pure TypeScript functions in `frontend/src/prompts/`:

- `buildEraProgressionPrompt(input: EraProgressionInput): string` — the main "next era" call. Instructs Haiku to act as an ecologist/game designer, enforces ecological coherence rules, and specifies exact JSON output schema matching `Era`.
- `buildMutationPrompt(input: MutationPreviewInput): string` — mutation preview. Builds on existing traits, addresses active pressures, returns mutated `Species` + `reasoning` + `variabilityScore`.

Both prompts end with "Respond with valid JSON only, no prose outside the JSON" and include the full expected schema in the prompt.

A third prompt (freeform challenge response) is not yet implemented in code but is specified in `types.ts` via the `Challenge` interface.

### Flux Schnell via fal.ai

Image generation for species and features. ~$0.005/image, <2 seconds, supports img2img. Each `Species` and `Feature` carries an `imagePrompt: string` field used as the txt2img prompt. Generated image URLs are stored in `imageUrl?: string` (hosted in R2). Images are generated asynchronously; placeholder icons are shown until ready.

Generation cadence is a tunable decision (every era vs. every N eras). See `game-design.md`.

## Data Flow

### Normal turn

```
Player completes challenges (ChallengeView)
    → navigates to Evolve tab
    → types mutation request → POST /api/mutation/preview → preview shown
    → accepts mutation
    → clicks "Advance to Next Era"
        → POST /api/era/progress (10-15s loading state)
        → response: new Era appended to gameState.eras
        → currentEraIndex incremented
        → async: POST images for new species to fal.ai → stored in R2 → Species.imageUrl updated
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

All canonical types are in `frontend/src/types.ts`. Do not duplicate them. Key interfaces:

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

## Deployment

- **Frontend**: Cloudflare Pages, serving `frontend/dist/`. Domain: joernstoehler.com (already on Cloudflare).
- **Worker**: Cloudflare Workers, name `sporelike-api`. Deployed via `wrangler deploy`.
- **No SSR**. The SPA is fully static; all dynamic behavior goes through the Worker API.
- **Environment variables**: API keys for Claude (Anthropic) and fal.ai are set as Worker secrets via `wrangler secret put`, never in the frontend bundle.
