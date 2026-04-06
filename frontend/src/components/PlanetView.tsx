import type { GameState, Planet } from '../types';

interface Props {
  gameState: GameState;
  planets: Planet[];
}

const ACTIVE_PLANET_ID = 'aegis-7';

function planetImageClass(id: string): string {
  if (id === 'aegis-7') return 'planet-card-image planet-card-image--aegis';
  if (id === 'borea-3') return 'planet-card-image planet-card-image--borea';
  return 'planet-card-image planet-card-image--new';
}

export function PlanetView({ gameState, planets }: Props) {
  const currentEra = gameState.eras[gameState.currentEraIndex];
  const totalSpecies = new Set(gameState.eras.flatMap(e => e.species.map(s => s.id))).size;

  return (
    <div className="view planet-view">
      {/* Compact stats summary */}
      <div className="planet-stats">
        <div className="stat">
          <span className="stat-value">{gameState.eras.length}</span>
          <span className="stat-label">Eras</span>
        </div>
        <div className="stat">
          <span className="stat-value">{currentEra.species.length}</span>
          <span className="stat-label">Species</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totalSpecies}</span>
          <span className="stat-label">Discovered</span>
        </div>
      </div>

      {/* Planet cards */}
      <p className="section-title">Your Worlds</p>
      <div className="card-scroll">
        {planets.map(planet => {
          const isActive = planet.id === ACTIVE_PLANET_ID;
          const isNew = planet.id === 'new';
          return (
            <div
              key={planet.id}
              className={[
                'card',
                isActive ? 'player-card' : '',
                isNew ? 'planet-card--new' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={planetImageClass(planet.id)}>
                <span className="card-image-icon">
                  {isNew ? '➕' : '🪐'}
                </span>
              </div>
              <div className="card-body">
                <div className="card-title">{planet.name}</div>
                <div className="card-desc">{planet.description}</div>
                {!isNew && (
                  <div className="planet-stat-line">
                    {planet.eraCount} era{planet.eraCount !== 1 ? 's' : ''} &middot; {planet.speciesCount} species
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="planet-hint">Tap a planet to switch worlds</p>
    </div>
  );
}
