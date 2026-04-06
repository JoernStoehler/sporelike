// ---- Shared game entity types (self-contained, do NOT import from frontend) ----

export interface Species {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  parentId?: string;
  isPlayer: boolean;
  traits: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'geological' | 'ecological';
  imagePrompt?: string;
  imageUrl?: string;
}

export interface ChallengeAction {
  label: string;
  outcome: string;
  pointsAwarded: number;
}

export interface Challenge {
  id: string;
  description: string;
  involvedSpeciesIds: string[];
  involvedFeatureIds: string[];
  actions: ChallengeAction[];
  playerChoice?: number | 'freeform';
  playerFreeformText?: string;
  playerOutcome?: string;
}

export interface EraEvent {
  type: 'extinction' | 'evolution' | 'fork' | 'invasion' | 'geological' | 'ecological';
  description: string;
  speciesIds: string[];
  featureIds: string[];
}

export interface Era {
  number: number;
  name: string;
  species: Species[];
  features: Feature[];
  challenges: Challenge[];
  events: EraEvent[];
  playerSpeciesId: string;
}

export interface EraSummary {
  eraNumber: number;
  eraName: string;
  events: string[];
  playerSpeciesName: string;
  playerTraits: string[];
}

// ---- AI call schemas ----

export interface EraProgressionInput {
  currentEra: Era;
  challengeResults: Pick<Challenge, 'id' | 'playerChoice' | 'playerFreeformText' | 'playerOutcome'>[];
  selectedMutation: Species;
  history: EraSummary[];
  config: {
    targetNewSpecies: number;
    targetExtinctions: number;
    targetChallenges: number;
  };
}

export interface MutationPreviewInput {
  currentEra: Era;
  playerSpecies: Species;
  requestedChange: string;
}

export interface MutationPreviewOutput {
  species: Species;
  reasoning: string;
  variabilityScore: number;
}

// ---- Request body shapes for each endpoint ----

export type MutationPreviewRequestBody = MutationPreviewInput;

export type EraProgressionRequestBody = EraProgressionInput;

export interface FreeformChallengeRequestBody {
  challenge: Challenge;
  freeformText: string;
  era: Era;
}

export interface FreeformChallengeOutput {
  outcome: string;
  pointsAwarded: number;
}
