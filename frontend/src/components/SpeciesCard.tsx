import type { Species } from '../types';

interface Props {
  species: Species;
  isChanged?: boolean;
  changeLabel?: string;
  size?: 'normal' | 'large';
  onClick?: () => void;
}

export function SpeciesCard({ species, isChanged, changeLabel, size = 'normal', onClick }: Props) {
  const isLarge = size === 'large';
  return (
    <div
      className={`card species-card ${species.isPlayer ? 'player-card' : ''} ${isChanged ? 'changed-card' : ''} ${isLarge ? 'card-large' : ''}`}
      onClick={onClick}
    >
      {species.isPlayer && <span className="badge badge-player">YOUR SPECIES</span>}
      {isChanged && changeLabel && <span className="badge badge-changed">{changeLabel}</span>}
      <div className="card-image" style={{ background: species.isPlayer ? 'linear-gradient(135deg, #0a3d2a, #0d4f4f)' : 'linear-gradient(135deg, #1a1a3e, #2d1b4e)' }}>
        <span className="card-image-icon">{species.isPlayer ? '🧬' : '🦠'}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{species.name}</h3>
        <div className="trait-list">
          {species.traits.map(t => <span key={t} className="trait-pill">{t}</span>)}
        </div>
        {(isLarge || !onClick) && <p className="card-desc">{species.description}</p>}
        {!isLarge && onClick && <p className="card-desc">{species.description.slice(0, 80)}…</p>}
      </div>
    </div>
  );
}
