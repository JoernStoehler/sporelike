# Sporelike — Agent Quick Reference

Spore-inspired evolution game MVP. LLM (Gemini) replaces numerical simulation; image gen (fal.ai, deferred) creates creature art. Player guides a species through ecological eras.

## Commands

```bash
# Frontend (React + Vite)
cd frontend && npm run dev          # dev server on :5173
cd frontend && npm run build        # tsc + vite build → dist/

# Worker (Cloudflare Workers)
cd worker && npx wrangler dev --ip 0.0.0.0 --port 8787   # local dev (needs .dev.vars)
cd worker && npx wrangler deploy    # deploy to CF

# Deploy frontend
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=sporelike --commit-dirty=true

# Type-check worker (no tsconfig in build, but useful for validation)
cd worker && npx tsc --noEmit
```

## Architecture

- **Frontend**: React 19 + TypeScript + Vite SPA, mobile-first (390px target)
- **Backend**: Cloudflare Worker (`sporelike-api`) — API proxy that injects Gemini key
- **AI**: Gemini 2.5 Flash Lite via raw fetch (no SDK). Worker handles all AI calls.
- **Live URLs**: Frontend at `sporelike.pages.dev`, Worker at `sporelike-api.joern-ef1.workers.dev`

## Key Files

- `frontend/src/types.ts` — canonical type definitions (source of truth)
- `frontend/src/api.ts` — API client (fetchMutationPreview, fetchFreeformChallenge, fetchEraProgression)
- `frontend/src/gameReducer.ts` — useReducer actions + reducer for GameState
- `frontend/src/newGame.ts` — fresh game factory (era 1 seed)
- `frontend/src/mockData.ts` — 2 eras of mock data with placeholder images (dev reference only)
- `frontend/src/App.tsx` — root component, useReducer + UIState, localStorage persistence
- `worker/src/gemini.ts` — raw fetch to Gemini API + JSON response parser
- `worker/src/prompts.ts` — prompt builders (mutation, era progression, freeform challenge)
- `worker/src/index.ts` — 3 POST endpoints + CORS + validation

## API Endpoints

All POST with JSON body. Worker injects GEMINI_API_KEY — frontend never holds secrets.

- `POST /api/mutation-preview` — { currentEra, playerSpecies, requestedChange } → MutationPreviewOutput
- `POST /api/era-progression` — EraProgressionInput → { newEra: Era }
- `POST /api/freeform-challenge` — { challenge, freeformText, era } → { outcome, pointsAwarded }
- `GET /api/health` — { status: 'ok' }

## Secrets

- `GEMINI_API_KEY` — set as CF Worker secret (`wrangler secret put GEMINI_API_KEY`) and in `worker/.dev.vars` for local dev
- `.dev.vars` and `.env` are gitignored
- Gitleaks pre-commit hook with custom rules for fal.ai and Google API keys

## Principles

- KISS & YAGNI — GenAI content IS the complexity budget, everything else is boring/standard
- Species evolve by forking from parents (parentId required), traits accumulate (grow, don't replace)
- AI output must be "surprising but retrospectively logical" (constrained emergence)
- Mobile-first, single player, no persistence yet (in-memory state from mockData)
