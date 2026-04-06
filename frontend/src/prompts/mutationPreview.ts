import type { MutationPreviewInput, MutationPreviewOutput } from '../types';

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

// Re-export the output type so callers can import from one place
export type { MutationPreviewOutput };
