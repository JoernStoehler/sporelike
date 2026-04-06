import type { Era } from '../types';
import { SpeciesCard } from './SpeciesCard';
import { FeatureCard } from './FeatureCard';

interface Props {
  era: Era;
  previousEra?: Era;
}

export function EcosystemView({ era, previousEra }: Props) {
  const prevSpeciesIds = new Set(previousEra?.species.map(s => s.id) ?? []);
  const prevFeatureDescs = new Map(previousEra?.features.map(f => [f.id, f.description]) ?? []);

  return (
    <div className="view ecosystem-view">
      {era.events.length > 0 && (
        <div className="events-banner">
          <h3 className="section-title">What Changed</h3>
          {era.events.map((event, i) => (
            <div key={i} className={`event-item event-${event.type}`}>
              <span className="event-icon">
                {event.type === 'extinction' ? '💀' : event.type === 'evolution' ? '🔄' : event.type === 'fork' ? '🌱' : event.type === 'geological' ? '🌋' : event.type === 'ecological' ? '🌊' : '👾'}
              </span>
              <span>{event.description}</span>
            </div>
          ))}
        </div>
      )}

      <h3 className="section-title">Species</h3>
      <div className="card-scroll">
        {era.species
          .sort((a, b) => (a.isPlayer ? -1 : b.isPlayer ? 1 : 0))
          .map(species => {
            const isNew = !prevSpeciesIds.has(species.id) && previousEra != null;
            const isEvolved = species.parentId != null && prevSpeciesIds.has(species.parentId);
            return (
              <SpeciesCard
                key={species.id}
                species={species}
                isChanged={isNew || isEvolved}
                changeLabel={isNew ? (isEvolved ? 'EVOLVED' : 'NEW') : undefined}
              />
            );
          })}
      </div>

      <h3 className="section-title">Environment</h3>
      <div className="card-scroll">
        {era.features.map(feature => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            isChanged={prevFeatureDescs.has(feature.id) && prevFeatureDescs.get(feature.id) !== feature.description}
          />
        ))}
      </div>
    </div>
  );
}
