import type { Species } from '../types';

interface Props {
  species: Species;
  glowVariant?: 'player' | 'new' | 'changed' | 'extinct' | 'none';
  changeLabel?: string;
  size?: 'normal' | 'large' | 'compact';
  onClick?: () => void;
}

export function SpeciesCard({ species, glowVariant = 'none', changeLabel, size = 'normal', onClick }: Props) {
  const isLarge = size === 'large';
  const isCompact = size === 'compact';
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
    : 'linear-gradient(135deg, #1a1a3e, #2d1b4e)';

  // In compact mode only show up to 2 traits to save space
  const traitsToShow = isCompact ? species.traits.slice(0, 2) : species.traits;

  return (
    <div className={cardClass} onClick={onClick}>
      {glowVariant === 'player' && <span className="badge badge-player">{isCompact ? 'YOU' : 'YOUR SPECIES'}</span>}
      {changeLabel && glowVariant !== 'player' && (
        <span className={`badge ${isExtinct ? 'badge-extinct' : 'badge-amber'}`}>{changeLabel}</span>
      )}
      <div className={`card-image${isExtinct ? ' card-image-greyscale' : ''}`} style={{ background: species.imageUrl ? undefined : imageBg }}>
        {species.imageUrl ? (
          <img src={species.imageUrl} alt={species.name} className="card-image-img" />
        ) : (
          <span className="card-image-icon">
            {glowVariant === 'player' ? '🧬' : '🦠'}
          </span>
        )}
        {isExtinct && <span className="skull-overlay">💀</span>}
      </div>
      <div className="card-body">
        <h3 className="card-title">{species.name}</h3>
        <div className="trait-list">
          {traitsToShow.map(t => (
            <span key={t} className="trait-pill">{t}</span>
          ))}
        </div>
        {isCompact && (
          <p className="card-desc">{species.description.slice(0, 40)}{species.description.length > 40 ? '…' : ''}</p>
        )}
        {!isCompact && (isLarge || !onClick) && <p className="card-desc">{species.description}</p>}
        {!isCompact && !isLarge && onClick && <p className="card-desc">{species.description.slice(0, 80)}…</p>}
      </div>
    </div>
  );
}
