# Sporelike — Game Design

Theory, decisions, and open questions. The "why" behind the game.

## Vision

A turn-based evolution game where the player guides a species through an evolving ecosystem. Two comparison points define the design space:

- **Unlike Spore**: player creativity has mechanical consequences. A mutation you choose changes what challenges appear next. The world reacts.
- **Unlike AI Dungeon**: generation is constrained by ecological rules. The LLM is playing the role of an ecologist, not an improv partner. Surprises should be retrospectively logical, not random.

The novel ingredient is using LLM reasoning (Claude Haiku) as the game engine. Instead of a numerical simulation, a fast model reasons about ecology in natural language. This lets the game model things that are hard to encode numerically — niche-filling, arms races, cascading extinctions — while remaining coherent enough to be a game rather than a story.

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

Each phase feeds the next: challenges teach you the ecosystem, that knowledge informs mutations, mutations change what challenges appear next era.

The loop is intentionally compact. An era should feel like one session of a board game: you learn something, you make a choice, the world responds.

## Player Psychology

**Primary archetypes**: Explorer and Achiever.

The Explorer wants to discover what the ecosystem does — what happens if I become a predator? What if I go photosynthetic? The card diff system (NEW / ADAPTED / EXTINCT badges) makes discoveries legible without requiring the player to remember everything.

The Achiever wants to make smart choices. The challenge system rewards pattern recognition: if you understood the Gulper's behavior last era, you know how to play the Dartfin encounter this era. Points signal success but are informational, not gating.

**The fantasy of "outsmarting Darwin"**: the player feels clever when their mutation creates a cascade they anticipated. If you develop bioluminescence as a defense and then next era a new predator evolves that's been blinded to bioluminescent prey — that feels like mastery. The AI is constrained to make this plausible, but the player authored it.

**Emotional texture**: the game should feel like watching a nature documentary where you are also one of the animals. Extinctions are genuinely sad. New species are exciting. Your species surviving a hard era should feel earned.

## AI Prompt Strategy

### Constrained Emergence

The core prompt design principle: surprises must be retrospectively logical. The era progression prompt instructs Haiku to act as an "ecologist and game designer" and explicitly states: "Ecosystems have discoverable internal logic: changes should be surprising but retrospectively make sense."

The constraints that produce coherence:
1. New species fill niches opened or closed by what changed — no species appears from nowhere
2. Every new species forks from an existing one (parentId required, never null for non-first-era species)
3. Extinctions and evolutions must follow from challenge outcomes and the player's mutation
4. Events narrate the causation, making the logic visible to the player

### Config Parameters as Tuning Knobs

`EraProgressionInput.config` contains:
- `targetNewSpecies`: how many new species to introduce
- `targetExtinctions`: how many to remove
- `targetChallenges`: how many challenges to generate

These are the primary levers for controlling latency vs richness. Fewer changes = faster generation = smaller state = cheaper tokens. Good starting guesses: 1–2 new species, 0–1 extinctions, 3–5 challenges.

### Mutation Prompt Rules

The mutation preview prompt enforces:
1. Build on existing traits — don't discard them wholesale
2. Address at least one active ecological pressure
3. Traits are short tags, not sentences
4. `variabilityScore` is informational: conservative refinements score low (<0.4), dramatic departures score high (>0.7)
5. Reasoning explains the ecological implication, not just what changed

This means a player asking for "wings" when there's nothing airborne in the ecosystem gets a mutation that adds wings but acknowledges the tradeoff, rather than just granting it uncritically.

## Species and Ecosystem Model

### Species

Each species has:
- `name` + `description`: human-readable, also used directly in AI prompts for reasoning
- `traits`: short string tags (e.g. `"photosynthetic"`, `"armored"`, `"fast"`) — the AI reasons with these as ecological shorthand
- `imagePrompt`: txt2img prompt for Flux Schnell
- `parentId`: links the evolution tree; every non-primordial species has one
- `isPlayer`: boolean, exactly one species per era is the player

The description is the primary field the AI uses to reason about interactions. It should be ecology-dense: behavior, niche, relationship to other species, vulnerabilities.

### Evolution Tree

Species evolve, fork, and go extinct across eras. The `parentId` chain is the full evolutionary history. In the UI, `MUTATED` (player's species) and `MUTATED`/`NEW` labels distinguish forked descendants from genuinely new arrivals.

The player's species always carries `isPlayer: true` and a new id each era to allow diff tracking. Example from mock data: `sp-cilia` → `sp-cilia-v2` across eras.

### Features

Geological (e.g. thermal vent field, tidal flats) and ecological (e.g. detritus web, nutrient cycle) elements that define the physical environment. Features don't evolve like species but can shift, expand, collapse, or disappear. They contextualize challenges and constrain viable mutations.

### Ecosystem Coherence

The AI is responsible for maintaining coherence. The prompt provides the full current species + features + challenge outcomes + player mutation as context. The compressed `EraSummary` history prevents token bloat while keeping long-term causation visible.

## Challenge System

### Purpose

Challenges serve two functions:
1. **Teach the ecosystem**: each challenge forces the player to engage with specific species and features, building the mental model they'll use when choosing a mutation
2. **Generate input for AI**: challenge outcomes are part of the era progression prompt — what the player chose shapes what happens next

### Structure

Each challenge has:
- A `description`: the situation (one paragraph, specific, ecological)
- 3–4 `ChallengeAction`s: pre-generated options with pre-written outcomes and point values
- `involvedSpeciesIds` + `involvedFeatureIds`: for context and future UI linking
- Freeform input: always available as an alternative to the pre-generated actions

### Action Design

Pre-generated actions are not all equally good. There should be a "wrong" choice (survive but weakened), a "safe" choice (survive cleanly), and an "insight" choice (survive and discover something new about the ecosystem). Point values signal which is which: 0-1 for poor outcomes, 2 for safe, 3 for insightful.

The freeform option lets players try things the game designer didn't anticipate. The backend generates the outcome on demand. This is the highest-variance path and should feel exciting to use.

### Freeform Challenge Response

When the player types a custom action:
- Input: challenge context + player's text
- Output: outcome text + points awarded
- Latency: ~3–5s (fast call)
- The outcome should take the player's intent seriously and find an ecologically plausible result

The question for playtesting: is freeform fun enough to justify the latency and AI call cost? If players mostly use the pre-generated options, freeform may be cut from MVP or deferred.

## Evolution System

### Mutation Preview Flow

1. Player types a freeform mutation request ("Develop a harder shell to resist the Dartfins")
2. Hits "Preview" → POST /api/mutation/preview → ~3-5s
3. Result shows: mutated species card, reasoning paragraph, variability score bar
4. Player can accept, or type a new request and preview again
5. Multiple previews are supported (candidates tracked in `GameState.mutationCandidates`)

### What the AI Does with Mutation Requests

The mutation prompt receives:
- Full current ecology (species, features, pressures)
- The player's existing traits and description
- The freeform request

It produces a species that builds on existing traits rather than replacing them wholesale. A request for "harder shell" on a `photosynthetic, fast-spinning, fragile` species might produce `photosynthetic, fast-spinning, chitinous-membrane` — adding the defense without erasing what made the species itself.

The variability score tells the player how "wild" this mutation is. High variability = the AI stretched to accommodate the request. This is informational — it doesn't block acceptance — but gives a signal that might matter for risk tolerance.

### Accepting and Advancing

These are a two-step flow in EvolveView:
1. "Accept Mutation" locks in the chosen candidate
2. "Advance to Next Era →" triggers era progression

The accepted mutation becomes `selectedMutation` in the `EraProgressionInput`. The era progression AI sees this as the player's species going forward, and all ecological consequences (what evolves to compete with it, what goes extinct because of it) flow from that choice.

## End Conditions

The game is player-evaluated. There is no fixed win or loss condition.

Soft endpoints the AI is designed to make legible:
- **Emergence of intelligence**: player species develops social traits, tool use, language precursors
- **Ecological dominance**: player species has colonized most niches, other species are dependent on or displaced by it
- **Mass extinction**: ecological collapse leaves few species; the player must decide whether to seed a new world or try to recover

After N eras, the game will prompt: "Your species has developed [key trait]. Continue evolving or seed a new world?" This is a checkpoint, not a gate — the player can always continue or start fresh.

Starting fresh creates a new planet with a new starting species and an empty history.

## What's Deliberately Cut for MVP

These are explicitly out of scope to keep MVP shippable:

- **No multiplayer / shared creatures**: no cross-player ecosystem seeding
- **No multi-biome simultaneous view**: one ecosystem at a time
- **No branching timelines**: linear era history only; no forking your own timeline
- **No gene/variability points system**: variability score is informational only, not a resource
- **No real-time animation**: static cards only
- **No undo across eras**: undo only works within current mutation candidate selection
- **No invasive species from other biomes**: no cross-planet events
- **Image generation not every turn**: cadence TBD during playtesting (every era or every N eras)
- **No SSR / complex framework**: static SPA only

## Open Questions for Playtesting

These are unresolved and require real play to answer:

1. **Optimal species count per era**: starting guess 5–8; too few = trivial, too many = cognitively overwhelming
2. **Optimal challenges per era**: starting guess 3–5; needs to feel like a satisfying puzzle set, not a chore
3. **Image generation cadence**: every era regenerates all species images vs. only changed species vs. every 3 eras to control cost
4. **Freeform challenge value**: are players actually using it? Does the 3–5s wait feel worth it? Consider cutting if usage is low
5. **Variability score as mechanic**: should high-variability mutations have actual risk (species might fail to thrive)? Or stay purely informational?
6. **Era transition pacing**: is 10–15s for era progression acceptable? Can it be broken into streaming chunks to feel faster?
7. **Pre-generation**: the next era could begin generating while the player is doing challenges. Feasible if challenges are long enough.
8. **Challenge skip**: should players be able to skip challenges and advance with fewer challenge results? Does incomplete information make the AI output worse?
9. **Point system meaning**: right now points are informational. Should they unlock something, or is the feedback loop (points → ecology changes → better/worse position) sufficient?
