// Prompt builders — self-contained copies of the frontend versions.
// Do NOT import from the frontend package. These may diverge over time.

import type {
  EraProgressionInput,
  MutationPreviewInput,
  Challenge,
  Era,
} from './types';

export function buildMutationPrompt(input: MutationPreviewInput): string {
  const { currentEra, playerSpecies, requestedChange } = input;

  const pressures = currentEra.challenges
    .map(c => `  - ${c.description}`)
    .join('\n');

  const otherSpecies = currentEra.species
    .filter(s => s.id !== playerSpecies.id)
    .map(s => `  - ${s.name} [${s.traits.join(', ')}]`)
    .join('\n');

  const features = currentEra.features
    .map(f => `  - ${f.name} (${f.type})`)
    .join('\n');

  return `You are an evolutionary biologist generating a mutation preview for a turn-based evolution game.

CURRENT ERA: ${currentEra.name}

PLAYER SPECIES — ${playerSpecies.name}:
  Traits: ${playerSpecies.traits.join(', ')}
  Description: ${playerSpecies.description}

ECOLOGICAL PRESSURES (active challenges):
${pressures || '  (none)'}

OTHER SPECIES IN THE ECOSYSTEM:
${otherSpecies || '  (none)'}

ENVIRONMENTAL FEATURES:
${features || '  (none)'}

PLAYER'S REQUESTED MUTATION: "${requestedChange}"

Rules:
1. BUILD on existing traits — grow and refine them, don't discard them wholesale.
2. The mutation should address at least one active ecological pressure.
3. Traits are short tags (e.g. "bioluminescent", "venomous", "deep-rooted"). Keep the existing ones unless directly replaced.
4. variabilityScore: 0.0–1.0. Conservative refinements = low (<0.4). Dramatic departures = high (>0.7).
5. reasoning must explain the ecological implication: what niche does this open or close?
6. imagePrompt should be a vivid txt2img description capturing the mutated form.

Respond with valid JSON only, no prose outside the JSON:
{
  "species": {
    "id": "${playerSpecies.id}",
    "name": "string",
    "description": "string",
    "imagePrompt": "string",
    "isPlayer": true,
    "traits": ["string"],
    "parentId": "${playerSpecies.id}"
  },
  "reasoning": "string",
  "variabilityScore": 0.0
}`;
}

export function buildEraProgressionPrompt(input: EraProgressionInput): string {
  const { currentEra, challengeResults, selectedMutation, history, config } = input;

  const speciesList = currentEra.species
    .map(s => `  - ${s.name} [${s.traits.join(', ')}]: ${s.description}`)
    .join('\n');

  const featureList = currentEra.features
    .map(f => `  - ${f.name} (${f.type}): ${f.description}`)
    .join('\n');

  const challengeSummary = challengeResults.map(r => {
    const challenge = currentEra.challenges.find(c => c.id === r.id);
    const situation = challenge?.description ?? r.id;
    if (r.playerChoice === 'freeform') {
      return `  - "${situation}" → player chose: "${r.playerFreeformText}" → ${r.playerOutcome}`;
    }
    if (typeof r.playerChoice === 'number' && challenge) {
      const action = challenge.actions[r.playerChoice];
      return `  - "${situation}" → player chose: "${action?.label}" → ${action?.outcome}`;
    }
    return `  - "${situation}" → skipped`;
  }).join('\n');

  const historySummary = history.map(h =>
    `  Era ${h.eraNumber} "${h.eraName}" — ${h.playerSpeciesName} [${h.playerTraits.join(', ')}]: ${h.events.join('; ')}`
  ).join('\n');

  return `You are an ecologist and game designer generating the next era of a turn-based evolution game.
Ecosystems have discoverable internal logic: changes should be surprising but retrospectively make sense.

CURRENT ERA: ${currentEra.name} (Era ${currentEra.number})

SPECIES:
${speciesList}

FEATURES:
${featureList}

PLAYER'S CHOSEN MUTATION (their species evolved):
  ${selectedMutation.name} [${selectedMutation.traits.join(', ')}]: ${selectedMutation.description}

CHALLENGE OUTCOMES THIS ERA:
${challengeSummary || '  (none)'}

HISTORY:
${historySummary || '  (first era)'}

TASK: Generate Era ${currentEra.number + 1}. Follow these parameters exactly:
- New species to introduce: ${config.targetNewSpecies}
- Species to go extinct: ${config.targetExtinctions}
- Challenges to create: ${config.targetChallenges}

Rules:
1. Extinctions and invasions must follow from challenge outcomes and the player's mutation — show visible ripple effects.
2. New species should fill niches opened or closed by what changed.
3. Each challenge must reference specific species/features by ID and have 3-4 pre-written actions with outcomes.
4. Events narrate the transition: what died, what arose, what shifted.
5. The player species ID in the new era is: "${selectedMutation.id}".
6. Give the new era a vivid, evocative name reflecting the dominant ecological shift.

Respond with valid JSON only, no prose outside the JSON:
{
  "newEra": {
    "number": ${currentEra.number + 1},
    "name": "string",
    "species": [ { "id": "string", "name": "string", "description": "string", "imagePrompt": "string", "isPlayer": false, "traits": ["string"] } ],
    "features": [ { "id": "string", "name": "string", "description": "string", "type": "geological|ecological", "imagePrompt": "string" } ],
    "challenges": [ {
      "id": "string",
      "description": "string",
      "involvedSpeciesIds": ["string"],
      "involvedFeatureIds": ["string"],
      "actions": [ { "label": "string", "outcome": "string", "pointsAwarded": 0 } ]
    } ],
    "events": [ { "type": "extinction|evolution|fork|invasion|geological|ecological", "description": "string", "speciesIds": ["string"], "featureIds": ["string"] } ],
    "playerSpeciesId": "${selectedMutation.id}"
  }
}`;
}

export function buildFreeformChallengePrompt(
  challenge: Challenge,
  freeformText: string,
  era: Era
): string {
  const involvedSpecies = era.species
    .filter(s => challenge.involvedSpeciesIds.includes(s.id))
    .map(s => `  - ${s.name} [${s.traits.join(', ')}]: ${s.description}`)
    .join('\n');

  const involvedFeatures = era.features
    .filter(f => challenge.involvedFeatureIds.includes(f.id))
    .map(f => `  - ${f.name} (${f.type}): ${f.description}`)
    .join('\n');

  const prewrittenActions = challenge.actions
    .map((a, i) => `  ${i + 1}. "${a.label}" → ${a.outcome} (${a.pointsAwarded} pts)`)
    .join('\n');

  return `You are a game master evaluating a player's freeform action in a turn-based evolution game.

CURRENT ERA: ${era.name} (Era ${era.number})

CHALLENGE SITUATION:
${challenge.description}

INVOLVED SPECIES:
${involvedSpecies || '  (none)'}

INVOLVED FEATURES:
${involvedFeatures || '  (none)'}

PRE-WRITTEN ACTIONS FOR REFERENCE (use as a baseline for scoring):
${prewrittenActions || '  (none)'}

PLAYER'S FREEFORM ACTION: "${freeformText}"

Rules:
1. Evaluate the player's action in the context of the ecological situation.
2. Write a vivid, specific outcome describing what happens as a result.
3. Award points between 0 and 10 based on creativity and ecological plausibility.
   - 0–2: implausible or counterproductive
   - 3–5: reasonable but unremarkable
   - 6–8: clever and ecologically sound
   - 9–10: exceptional — creative, surprising, and retrospectively inevitable
4. The outcome text should be 1–3 sentences, written in present tense.

Respond with valid JSON only, no prose outside the JSON:
{
  "outcome": "string",
  "pointsAwarded": 0
}`;
}
