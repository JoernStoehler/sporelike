// ---- Core game entities ----

export interface Species {
  id: string;
  name: string;
  description: string; // reasoning-friendly text about behavior, traits, niche
  imagePrompt: string; // txt2img prompt for generating the species image
  imageUrl?: string; // generated image URL (stored in R2)
  parentId?: string; // if this species evolved from another
  isPlayer: boolean;
  traits: string[]; // short tags like "photosynthetic", "armored", "fast"
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: "geological" | "ecological";
  imagePrompt?: string;
  imageUrl?: string;
}

// ---- Challenges ----

export interface ChallengeAction {
  label: string; // e.g. "Flee through underwood"
  outcome: string; // pre-generated result text
  pointsAwarded: number; // simple reward signal
}

export interface Challenge {
  id: string;
  description: string; // situation text
  involvedSpeciesIds: string[]; // which species/features are relevant
  involvedFeatureIds: string[];
  actions: ChallengeAction[]; // 3-4 suggested actions with pre-generated outcomes
  // freeform input is always available; backend generates outcome on demand
  playerChoice?: number | "freeform"; // index into actions, or freeform
  playerFreeformText?: string;
  playerOutcome?: string; // result of freeform choice (generated on demand)
}

// ---- Era (one "level") ----

export interface EraEvent {
  type: "extinction" | "evolution" | "fork" | "invasion" | "geological" | "ecological";
  description: string; // what happened
  speciesIds: string[]; // which species involved
  featureIds: string[]; // which features involved
}

export interface Era {
  number: number;
  name: string; // e.g. "The Thermal Vents Open"
  species: Species[];
  features: Feature[];
  challenges: Challenge[];
  events: EraEvent[]; // what changed from the previous era
  playerSpeciesId: string;
}

// ---- Full game state ----

export interface GameState {
  currentEraIndex: number;
  eras: Era[]; // full history, ordered
  // Player mutation candidates for the current era transition
  mutationCandidates: Species[]; // player can undo/redo among these
  selectedMutationIndex?: number;
}

// ---- AI call schemas ----

export interface EraProgressionInput {
  currentEra: Era;
  challengeResults: Pick<Challenge, "id" | "playerChoice" | "playerFreeformText" | "playerOutcome">[];
  selectedMutation: Species; // the player's chosen evolution
  history: EraSummary[]; // compressed past
  config: {
    targetNewSpecies: number; // tunable parameter
    targetExtinctions: number;
    targetChallenges: number;
  };
}

export interface EraSummary {
  eraNumber: number;
  eraName: string;
  events: string[]; // short text summaries
  playerSpeciesName: string;
  playerTraits: string[];
}

export interface MutationPreviewInput {
  currentEra: Era; // full ecology context
  playerSpecies: Species;
  requestedChange: string; // freeform text from player
}

export interface MutationPreviewOutput {
  species: Species; // the mutated version
  reasoning: string; // why this mutation makes sense / how it relates to pressures
  variabilityScore: number; // how "wild" this change is (informational, not blocking)
}
