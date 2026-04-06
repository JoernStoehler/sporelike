# Sporelike - Design Document

## Vision

A turn-based evolution game where the player guides a species through an evolving ecosystem. Unlike Spore, player creativity has mechanical consequences. Unlike AI Dungeon, generation is constrained by ecological rules, keeping the world coherent.

The novel ingredient: LLM reasoning replaces numerical simulation. The "game engine" is a prompt that makes a fast model (Haiku) reason about ecology in natural language. Image generation (Flux Schnell) creates evolving creature/environment art.

## Core Loop

```
┌─── ERA ────────────────────────────────────────────┐
│                                                     │
│  1. DISCOVER  - View the ecosystem (cards)          │
│       ↓         Species, features, what changed     │
│  2. PLAY      - Face challenges (queue)             │
│       ↓         Situations with actions + freeform  │
│  3. BUILD     - Evolve your species                 │
│       ↓         Freeform mutation + preview          │
│  4. ADVANCE   - AI generates next era               │
│       ↓         Consequences ripple through ecology  │
│       └─────────────────────────────────────────────┘
```

Each phase feeds the next: challenges teach you the ecosystem, that knowledge informs mutations, mutations change what challenges appear next.

## Game State

One big state object. See `frontend/src/types.ts` for full TypeScript definitions.

Key entities:
- **Species**: name, description (for AI reasoning), traits (tags), imagePrompt, parentId (evolution tree)
- **Feature**: geological or ecological (thermal vents, algae blooms, etc.)
- **Challenge**: a situation + 3-4 pre-generated actions with outcomes + freeform option
- **Era**: a snapshot containing all species, features, challenges, and events (diffs from last era)
- **GameState**: ordered list of eras (full history) + mutation candidates

## AI Calls

### 1. Era Progression (between eras, can be slow ~10-15s)

**Input**: current era (all cards) + challenge results + player's chosen mutation + compressed history + config params (target counts for species additions/extinctions/challenges)

**Output**: JSON - next era with updated species, features, challenges, events

Key prompt constraints:
- Consequences are surprising but retrospectively logical
- Ecosystem has discoverable internal rules
- Player's mutation ripples visibly through the food web
- New species fork from existing ones (1 parent, never 0)
- Config params control output size (tunable for latency)

### 2. Mutation Preview (on demand, should be fast ~3-5s)

**Input**: current ecology + player species + freeform change request

**Output**: JSON - mutated species + reasoning + variability score

Player can: generate multiple candidates, undo/redo, directly edit fields, or accept.

### 3. Freeform Challenge Response (on demand, fast ~3-5s)

**Input**: challenge context + player's freeform text

**Output**: outcome text + points

Only triggered when player types a custom response instead of picking a suggestion.

## Views (Mobile-First)

### 1. Era Overview
- Scrollable horizontal cards (species + features)
- Player species pinned/prominent
- Cards with glowing border if changed this era
- Tap card to see full description + diff from last era
- Era name + number header

### 2. Challenge Queue
- Sequential challenges (less decision paralysis than pick-any)
- Each: situation text + 3-4 action buttons + freeform text input
- Tap action → reveal pre-generated outcome
- Freeform → send to AI → show generated outcome
- Progress through ~3-5 challenges per era

### 3. Evolution View
- Current species card (full detail)
- Text input: "What do you want to change?"
- Quick suggestion chips
- Preview: shows mutated species card + reasoning + variability score
- Accept / try again / edit directly
- History of candidates (undo/redo within current era transition)

### Navigation
- Bottom tabs or swipe between the three views
- "Advance Era" button visible when challenges are done and mutation is chosen
- Past eras viewable in read-only mode (time travel)

## Architecture

### Frontend
- **React + TypeScript + Vite** - standard, boring, works
- Single-page app, mobile-first (390px target)
- State: React context + useReducer (no external state library)
- No router needed (tab-based navigation within single page)

### Backend
- **Cloudflare Workers** - API proxy + game logic orchestration
- **D1 (SQLite)** - game state persistence (eras, species, challenges)
- **R2** - generated image storage
- Worker injects API keys, validates requests, rate-limits

### AI Services
- **Claude Haiku** - game logic (era progression, mutation preview, freeform challenges)
- **Flux Schnell via fal.ai** - image generation (~$0.005/img, <2s, supports img2img)

### Deployment
- **Cloudflare Pages** - frontend static hosting
- **Cloudflare Workers** - backend API
- Domain: joernstoehler.com (already on CF)

## What's Deliberately Cut for MVP

- No multiplayer / shared creatures
- No multi-biome simultaneous view
- No branching timelines (just linear era history)
- No gene/variability points system (informational score only)
- No real-time animation
- No undo across eras (only within current mutation selection)
- No invasive species from other biomes
- Image generation every few eras, not every turn
- No SSR / complex framework

## Latency Strategy

- Era progression is the slow call (~10-15s). Show a loading screen with "the ecosystem is evolving..." flavor text.
- Mutation preview and freeform challenges are fast (~3-5s). Show inline spinner.
- Images generated asynchronously, placeholder shown until ready.
- Config params (targetNewSpecies etc.) are the tuning knob for latency vs richness.
- Future: could pre-generate next era while player does challenges.

## End Conditions

- Player-evaluated. After N eras, occasionally prompt: "Your species has developed [trait]. Continue or seed a new world?"
- Natural endpoints: emergence of intelligence, ecological dominance, mass extinction
- Player can always choose to start fresh (new world, new starting species)

## Open Questions (Resolve During Playtesting)

- Optimal number of species per era (starting guess: 5-8)
- Optimal number of challenges per era (starting guess: 3-5)
- How often to regenerate images (every era? every 3?)
- Whether freeform challenge responses are fun enough to justify the AI call latency
- Whether variability score should become a real game mechanic (gene points)
- Turn pacing: is 10-15s era transition acceptable?
