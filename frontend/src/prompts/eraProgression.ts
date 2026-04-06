import type { EraProgressionInput } from '../types';

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
3. Each challenge must reference specific species/features by ID and have ${3}-4 pre-written actions with outcomes.
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
