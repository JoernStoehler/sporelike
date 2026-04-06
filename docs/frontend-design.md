# Sporelike — Frontend Design

Visual and UX reference. Describes what exists in code today.

## Layout

The app is a single page capped at `max-width: 480px`, centered on desktop, full-width on mobile. It uses `min-height: 100dvh` (dynamic viewport height) to avoid mobile browser chrome clipping.

**Fixed chrome**:
- `TopBar` — 56px, pinned to top
- `BottomNav` — 64px, pinned to bottom

**Scrollable main area**: `main.main-content` fills the space between, `overflow-y: auto`, padded `56px 0 64px` to clear the fixed chrome.

## Navigation

### Top Bar

Displays the currently viewed era: `"Era 1"` (cyan, bold) followed by the era name (e.g. `"The Primordial Pools"`). A dropdown arrow on the right indicates it is tappable.

Tapping opens `.era-dropdown`, an absolute-positioned list of all eras. Selecting one sets `viewEraIndex` in App, enabling read-only time travel through history. Tapping anywhere in `main-content` while the dropdown is open closes it.

The era label color (#00e5ff) and the dropdown active-item color both use the primary cyan to signal "current."

### Bottom Nav

Four equal-width tabs, fixed at the bottom:

| Tab id | Icon | Label |
|---|---|---|
| `planet` | 🪐 | Planet |
| `ecosystem` | 🌿 | Ecosystem |
| `challenges` | ⚔️ | Challenges |
| `evolve` | 🧬 | Evolve |

Active tab icon and label are cyan (`#00e5ff`). Inactive tabs are muted (`#8892a8`). Transition: `color 0.2s`.

Default tab on load is `ecosystem`.

## Views

### Planet View (`PlanetView.tsx`)

Stats bar across the top: three `stat` blocks showing eras played, species alive this era, and total species discovered across all eras (deduped by id).

Below: a horizontal card scroll ("Your Worlds") showing planet cards. Currently two seeded planets (Aegis-7 and Borea-3) plus a "???" new-planet slot. The active planet (hardcoded `aegis-7`) uses `player-card` styling (cyan glow). The new-planet card uses a `+` icon and different gradient.

Planet cards render `<img>` when `planet.imageUrl` is set; otherwise show the 🪐 icon. Placeholder images for the seeded planets are served from `frontend/public/placeholders/`.

Bottom hint text: "Tap a planet to switch worlds" (tapping is not yet wired up — placeholder).

### Ecosystem View (`EcosystemView.tsx`)

A single horizontal card scroll containing both species and feature cards in sequence. Sort order:

1. Player species (first, always)
2. Other current-era species
3. Extinct species (present in previous era, absent in current)
4. Current-era features
5. Removed features (present in previous era, absent in current)

**Diff logic** (comparing current era to `previousEra`):
- Player species → `glowVariant: 'player'`
- Species with new id, or whose `parentId` is in the previous era → `glowVariant: 'new'`, label `'MUTATED'` or `'NEW'`
- Species present in both eras whose `description` changed → `glowVariant: 'changed'`, label `'ADAPTED'`
- Species in previous era but not in current → `glowVariant: 'extinct'`, label `'EXTINCT'`
- Feature with new id → `glowVariant: 'new'`
- Feature present in both with changed description → `glowVariant: 'changed'`
- Feature in previous era but not current → `glowVariant: 'removed'`

If there is no `previousEra` (era 1), all non-player cards show `glowVariant: 'none'`.

### Challenge View (`ChallengeView.tsx`)

One challenge displayed at a time. Progress dots at the top show position in the queue and completion state.

Each challenge card shows:
- Situation description text
- 3–4 action buttons (`.action-btn`)
- Freeform text input + "Go" button (hidden once a choice is made)

**Interaction states**:
- No choice yet: all action buttons are enabled; freeform input is visible
- Choice made (action): chosen button gains `.chosen` class (shows outcome text beneath label); other buttons gain `.dimmed` class; freeform input disappears
- Choice made (freeform): action buttons dimmed; a `.freeform-result` block shows the typed text and the AI-generated outcome
- `isReadOnly`: all buttons `disabled`, freeform hidden; previous choices pre-loaded from `challenge.playerChoice`

**Freeform AI call**: submitting the freeform input calls `fetchFreeformChallenge` (`POST /api/freeform-challenge`). `freeformLoading` state shows `"..."` on the Go button and disables the input while the call is in flight. Errors surface as `.error-text` beneath the input.

Nav buttons at bottom: `← Prev` / `Next →` step through challenges. When on the last challenge and all are complete, `Next →` becomes `"Ready to Evolve →"` which switches the active tab to `evolve`.

The "Complete all challenges" button (disabled) appears when on the last challenge but not all are done — a gentle nudge.

### Evolve View (`EvolveView.tsx`)

Horizontal card scroll at top shows:
- Current player species card (left, `glowVariant: 'player'`)
- Preview card (right): a placeholder until a mutation is generated, then the mutated species card with label `'PREVIEW'` or `'NEXT FORM'` after acceptance

**Input area** (hidden after active acceptance, or when `isReadOnly`):
- Text input: "Describe a mutation..." + `Preview` button (also triggers on Enter)
- Suggestion chips: three hardcoded quick-fills (`'Develop harder outer membrane'`, `'Improve sensory detection'`, `'Become more aggressive'`) — in production these will be dynamically generated based on current pressures

**Preview flow**: clicking Preview calls `fetchMutationPreview` (`POST /api/mutation-preview`). `previewLoading` state changes the button label to `"Generating..."` and disables it while the call is in flight. Errors surface as `.error-text`. On success the preview card is populated and auto-scrolled into view.

**Preview details** (shown when preview exists and not yet accepted):
- Reasoning text paragraph
- Variability bar (0–100% fill, only shown when `variability > 0`)
- `Accept Mutation` button

**After acceptance** (active era only):
- Input area and preview details disappear
- `"Advance to Next Era →"` button appears (`.btn-advance`); `advanceLoading` prop changes its label to `"Advancing..."` while the era progression call runs

**Read-only mode**: input disabled, suggestion chips have `.disabled` class, all buttons disabled; if `nextEraPlayerSpecies` is passed in, the mutation text pre-fills with `"Evolved into [name]"` and the preview shows the next-era species.

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#0a0e1a` | App background |
| Top/bottom bar bg | `#0d1225` | TopBar, BottomNav |
| Card bg | `#141b2d` | All `.card` elements, era dropdown |
| Card border | `#1e2a45` | Default card border, nav borders, dropdown border |
| Dropdown item border | `#1a2238` | Dividers within era dropdown |
| Trait pill bg | `#1e2a45` | Default trait pills |
| Cyan — primary accent | `#00e5ff` | Active tab, player badge bg, era number, active dropdown item |
| Cyan — card glow | `#00e5ff44` (border) / `#00e5ff28` (shadow) | Player species card |
| Cyan — player trait bg | `#00e5ff15` | Trait pills on player card |
| Amber — change accent | `#ffab40` | New/changed cards (border `#ffab4066`, shadow `#ffab4033`), amber badge text |
| Amber badge bg | `#ffab4022` | Badge background for amber badges |
| Red — extinct accent | `#ff4444` | Extinct cards (border `#ff444466`, shadow `#ff444428`), extinct badge text |
| Red badge bg | `#ff444422` | Badge background for extinct badges |
| Text — primary | `#e0e6f0` | Main text, TopBar button text |
| Text — muted | `#8892a8` | Secondary text, card descriptions, inactive nav, section titles |
| Text — trait pills | `#a0b4d0` | Default trait pill text |

**Era label gradient** (`era-label` in TopBar): pure `#00e5ff`, not gradient — the gradient idea from DESIGN.md is not yet implemented.

## Card System

### SpeciesCard

Props: `species`, `glowVariant`, `changeLabel`, `size`, `onClick`

Three sizes:
- `normal` (default): image 80px tall, description truncated to 80 chars if `onClick` is provided
- `large`: image 120px tall, full description always shown, full-width (`card-large`)
- `compact`: image 80px tall, only first 2 traits shown, description truncated to 40 chars

Glow variants and their CSS classes:
- `player` → `.player-card` (cyan border + shadow), badge `"YOUR SPECIES"` or `"YOU"` (compact)
- `new` or `changed` → `.amber-card` (amber border + shadow), badge uses `changeLabel` prop
- `extinct` → `.extinct-card` (red border + shadow, 0.85 opacity), image greyscale + skull overlay, card body 0.65 opacity
- `none` → base `.card` only

Image display: when `species.imageUrl` is set, an `<img>` element is rendered. Otherwise a placeholder background gradient and icon are shown:
- Player: `linear-gradient(135deg, #0a3d2a, #0d4f4f)` with 🧬 icon
- Others: `linear-gradient(135deg, #1a1a3e, #2d1b4e)` with 🦠 icon

### FeatureCard

Props: `feature`, `glowVariant`

Glow variants:
- `new` or `changed` → `.amber-card`, badge text `'NEW'` or `'SHIFTED'`
- `removed` → `.extinct-card`, badge text `'REMOVED'`
- `none` → base `.card`

Image display: when `feature.imageUrl` is set, an `<img>` element is rendered. Otherwise the type icon is shown: 🪨 for geological, 🌊 for ecological, with a dark green gradient background.

Feature cards are narrower than species cards (`min-width: 180px` vs `200px`).

### Horizontal Scroll Container (`.card-scroll`)

Used in EcosystemView, PlanetView, and EvolveView. Flexbox row, `overflow-x: auto`, `gap: 12px`, `scrollbar-width: none` (hidden scrollbar on all browsers). Cards have `min-width: 200px`, `max-width: 240px`, `flex-shrink: 0`.

EvolveView scrolls to bring the preview card into view after generating a mutation preview (`scrollIntoView` with `behavior: 'smooth'`).

## Interactive Patterns

**Action buttons** (`.action-btn`): large tap targets in ChallengeView. Disabled after a choice is made via React state (not the `disabled` attribute when in read-only mode — it uses the prop).

**Freeform input**: standard `<input type="text">` that also submits on Enter. Present in both ChallengeView (challenge response, calls `/api/freeform-challenge`) and EvolveView (mutation request, calls `/api/mutation-preview`).

**Suggestion chips** (`.chip`): small pill buttons in EvolveView that fill the mutation text input on tap. Currently hardcoded.

**Progress dots** (`.progress-dot`): in ChallengeView, one dot per challenge. Classes: `current` (active challenge), `done` (choice recorded).

**Variability bar**: a CSS bar fill showing `variabilityScore * 100%` width. Only rendered when `variability > 0`.

## Responsive / Mobile Considerations

- Target viewport: 390px (iPhone 14). Max-width cap of 480px means the layout doesn't stretch on tablets.
- All touch scrolling uses `-webkit-overflow-scrolling: touch` on `.card-scroll`.
- Fixed chrome (top/bottom bars) uses `dvh` units to handle mobile browser chrome correctly.
- No media queries currently — the design is designed for mobile and constrained on desktop.
- Font stack: system fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`).

## Current State vs Planned

**Implemented and working**:
- Full visual shell with all four views
- Era time travel (read-only viewing of past eras)
- Diff-aware card rendering (new / adapted / extinct badges)
- Challenge flow with action selection and freeform input (calls real AI via `/api/freeform-challenge`)
- Mutation preview flow (calls real AI via `/api/mutation-preview`; shows reasoning + variability bar)
- Accept mutation + advance era (calls real AI via `/api/era-progression` with `advanceLoading` spinner)
- Planet view with stats and planet cards
- Image display: SpeciesCard, FeatureCard, and PlanetView all render `<img>` when `imageUrl` is set; static placeholder images in `frontend/public/placeholders/` are used in mock data

**Not yet implemented**:
- Automated image generation via fal.ai (imagePrompt fields are populated by the AI but no image generation call is made)
- Planet switching / new game creation
- Persisted state (all state is in-memory, seeded from mockData)
- Dynamic mutation suggestion chips
- Color scheme evolution per era
