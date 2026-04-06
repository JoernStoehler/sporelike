import type { Species } from '../types';

interface Props {
  species: Species;
  glowVariant?: 'player' | 'new' | 'changed' | 'extinct' | 'none';
  changeLabel?: string;
  size?: 'normal' | 'large';
  onClick?: () => void;
}

export function SpeciesCard({ species, glowVariant = 'none', changeLabel, size = 'normal', onClick }: Props) {
  const isLarge = size === 'large';
  const isExtinct = glowVariant === 'extinct';

  const cardClass = [
    'card',
    'species-card',
    glowVariant === 'player' ? 'player-card' : '',
    glowVariant === 'new' || glowVariant === 'changed' ? 'amber-card' : '',
    isExtinct ? 'extinct-card' : '',
    isLarge ? 'card-large' : '',
  ].filter(Boolean).join(' ');

  const imageBg = glowVariant === 'player'
    ? 'linear-gradient(135deg, #0a3d2a, #0d4f4f)'
    : isExtinct
      ? 'linear-gradient(135deg, #1a0a0a, #2d0f0f)'
      : 'linear-gradient(135deg, #1a1a3e, #2d1b4e)';

  return (
    <div className={cardClass} onClick={onClick}>
      {glowVariant === 'player' && <span className="badge badge-player">YOUR SPECIES</span>}
      {changeLabel && glowVariant !== 'player' && (
        <span className={`badge ${isExtinct ? 'badge-extinct' : 'badge-amber'}`}>{changeLabel}</span>
      )}
      <div className="card-image" style={{ background: imageBg }}>
        <span className="card-image-icon" style={{ opacity: isExtinct ? 0.3 : 0.6 }}>
          {glowVariant === 'player' ? '🧬' : isExtinct ? '💀' : '🦠'}
        </span>
      </div>
      <div className="card-body" style={{ opacity: isExtinct ? 0.5 : 1 }}>
        <h3 className="card-title">{species.name}</h3>
        {!isExtinct && (
          <div className="trait-list">
            {species.traits.map(t => <span key={t} className="trait-pill">{t}</span>)}
          </div>
        )}
        {isExtinct && (
          <div className="trait-list">
            {species.traits.map(t => <span key={t} className="trait-pill trait-pill-extinct">{t}</span>)}
          </div>
        )}
        {(isLarge || !onClick) && <p className="card-desc">{species.description}</p>}
        {!isLarge && onClick && <p className="card-desc">{species.description.slice(0, 80)}…</p>}
      </div>
    </div>
  );
}
