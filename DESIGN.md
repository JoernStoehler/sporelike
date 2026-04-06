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

### Top Bar (fixed)
- Shows era number + name (e.g. "Era 1 · The Primordial Pools")
- Doubles as progress bar during era transition (animated fill)
- Tappable: opens dropdown to pick past eras (time travel, read-only)

### Bottom Nav (fixed, 4 icon tabs)
1. **🪐 Planet** - save game / new game selection
2. **🌿 Ecosystem** - era overview with species & feature cards
3. **⚔️ Challenges** - challenge queue
4. **🧬 Evolve** - player species mutation + era advance button

### 1. Planet View (dummy for MVP)
- Planet name, era count, species count, basic stats
- "New Planet" button (placeholder)
- Future: disc album of save games, share button for social play

### 2. Ecosystem View
- Horizontal scrollable row of species cards
- Each card: image placeholder, name, trait pills, 2-line description
- Player species card: cyan glow border + "YOUR SPECIES" badge
- Below species: smaller row of feature cards (geological/ecological)
- Cards changed this era: glowing border + "NEW" / "EVOLVED" badge
- Tap to expand card with full description + diff from previous era

### 3. Challenge View
- Sequential challenges (one at a time, or vertical scroll)
- Each: situation description + 3-4 action buttons
- Tap action → reveal pre-generated outcome, highlight chosen action
- Freeform text input + submit button always available
- After all challenges: summary + "Ready to evolve →" prompt

### 4. Evolution View
- Large current player species card
- "How should your species adapt?" text input
- Quick suggestion chips (based on current pressures)
- "Preview Mutation" → shows mutated species card + reasoning + variability score
- "Accept Mutation" / "Try Again" buttons
- **"Advance to Next Era →"** button at bottom (enabled after accepting mutation)
- Accepting mutation + advancing era are the same flow: lock in successor, then progress

### Color Scheme
- Background: dark navy (#0a0e1a)
- Cards: (#141b2d) with subtle border (#1e2a45)
- Accent: bioluminescent cyan (#00e5ff) for highlights, player species
- Warning: warm amber (#ffab40) for threats
- Text: light (#e0e6f0), muted (#8892a8) for secondary
- Changed cards: cyan glow effect
- Future: color scheme evolves per era / matches planet

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
