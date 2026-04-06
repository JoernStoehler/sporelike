import type { Era, Species, Feature } from '../types';
import { SpeciesCard } from './SpeciesCard';
import { FeatureCard } from './FeatureCard';

interface Props {
  era: Era;
  previousEra?: Era;
}

type CardItem =
  | { kind: 'species'; species: Species; glowVariant: 'player' | 'new' | 'changed' | 'extinct' | 'none'; label?: string }
  | { kind: 'feature'; feature: Feature; glowVariant: 'new' | 'changed' | 'none' };

export function EcosystemView({ era, previousEra }: Props) {
  const prevSpeciesMap = new Map(previousEra?.species.map(s => [s.id, s]) ?? []);
  const prevFeatureMap = new Map(previousEra?.features.map(f => [f.id, f]) ?? []);

  const currentSpeciesIds = new Set(era.species.map(s => s.id));

  const cards: CardItem[] = [];

  // --- Species ---
  const sortedSpecies = [...era.species].sort((a, b) =>
    a.id === era.playerSpeciesId ? -1 : b.id === era.playerSpeciesId ? 1 : 0
  );

  for (const species of sortedSpecies) {
    const isPlayer = species.id === era.playerSpeciesId;

    if (isPlayer) {
      cards.push({ kind: 'species', species, glowVariant: 'player' });
      continue;
    }

    if (previousEra == null) {
      // First era — no diff context
      cards.push({ kind: 'species', species, glowVariant: 'none' });
      continue;
    }

    const prev = prevSpeciesMap.get(species.id);
    const isNewId = !prevSpeciesMap.has(species.id);
    const evolvedFromPrev = species.parentId != null && prevSpeciesMap.has(species.parentId);

    if (isNewId || evolvedFromPrev) {
      const label = evolvedFromPrev ? 'EVOLVED' : 'NEW';
      cards.push({ kind: 'species', species, glowVariant: 'new', label });
    } else if (prev && prev.description !== species.description) {
      cards.push({ kind: 'species', species, glowVariant: 'changed', label: 'CHANGED' });
    } else {
      cards.push({ kind: 'species', species, glowVariant: 'none' });
    }
  }

  // --- Extinct species (in previous era but not in current) ---
  if (previousEra) {
    for (const prevSpecies of previousEra.species) {
      if (!currentSpeciesIds.has(prevSpecies.id)) {
        cards.push({ kind: 'species', species: prevSpecies, glowVariant: 'extinct', label: 'EXTINCT' });
      }
    }
  }

  // --- Features ---
  for (const feature of era.features) {
    if (previousEra == null) {
      cards.push({ kind: 'feature', feature, glowVariant: 'none' });
      continue;
    }

    const prev = prevFeatureMap.get(feature.id);
    if (!prev) {
      cards.push({ kind: 'feature', feature, glowVariant: 'new' });
    } else if (prev.description !== feature.description) {
      cards.push({ kind: 'feature', feature, glowVariant: 'changed' });
    } else {
      cards.push({ kind: 'feature', feature, glowVariant: 'none' });
    }
  }

  return (
    <div className="view ecosystem-view">
      <h3 className="section-title">Ecosystem</h3>
      <div className="card-scroll">
        {cards.map(item => {
          if (item.kind === 'species') {
            return (
              <SpeciesCard
                key={`species-${item.species.id}-${item.glowVariant}`}
                species={item.species}
                glowVariant={item.glowVariant}
                changeLabel={item.label}
              />
            );
          }
          return (
            <FeatureCard
              key={`feature-${item.feature.id}`}
              feature={item.feature}
              glowVariant={item.glowVariant}
            />
          );
        })}
      </div>
    </div>
  );
}
