import type { Species } from '../types';

interface Props {
  species: Species;
  glowVariant?: 'player' | 'new' | 'changed' | 'extinct' | 'none';
  changeLabel?: string;
}

export function SpeciesCard({ species, glowVariant = 'none', changeLabel }: Props) {
  const isExtinct = glowVariant === 'extinct';

  const cardClass = [
    'card',
    glowVariant === 'player' ? 'player-card' : '',
    glowVariant === 'new' || glowVariant === 'changed' ? 'amber-card' : '',
    isExtinct ? 'extinct-card' : '',
  ].filter(Boolean).join(' ');

  const imageBg = glowVariant === 'player'
    ? 'linear-gradient(135deg, #0a3d2a, #0d4f4f)'
    : 'linear-gradient(135deg, #1a1a3e, #2d1b4e)';

  return (
    <div className={cardClass}>
      {glowVariant === 'player' && <span className="badge badge-player">YOUR SPECIES</span>}
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
          {species.traits.map(t => (
            <span key={t} className="trait-pill">{t}</span>
          ))}
        </div>
        <p className="card-desc">{species.description}</p>
      </div>
    </div>
  );
}
