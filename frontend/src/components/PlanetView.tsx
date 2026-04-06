import type { GameState } from '../types';

interface Props {
  gameState: GameState;
}

export function PlanetView({ gameState }: Props) {
  const currentEra = gameState.eras[gameState.currentEraIndex];
  const totalSpecies = new Set(gameState.eras.flatMap(e => e.species.map(s => s.id))).size;

  return (
    <div className="view planet-view">
      <div className="planet-icon">🪐</div>
      <h2 className="planet-name">Planet Aegis-7</h2>
      <p className="planet-subtitle">Your journey through evolution</p>
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
          <span className="stat-label">Total Discovered</span>
        </div>
      </div>
      <button className="btn btn-secondary" disabled>New Planet (coming soon)</button>
    </div>
  );
}
