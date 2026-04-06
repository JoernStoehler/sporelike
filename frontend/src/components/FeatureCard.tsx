import type { Feature } from '../types';

interface Props {
  feature: Feature;
  glowVariant?: 'new' | 'changed' | 'none';
}

export function FeatureCard({ feature, glowVariant = 'none' }: Props) {
  const cardClass = [
    'card',
    'feature-card',
    glowVariant === 'new' || glowVariant === 'changed' ? 'amber-card' : '',
  ].filter(Boolean).join(' ');

  const icon = feature.type === 'geological' ? '🪨' : '🌊';

  return (
    <div className={cardClass}>
      {glowVariant !== 'none' && (
        <span className="badge badge-amber">{glowVariant === 'new' ? 'NEW' : 'CHANGED'}</span>
      )}
      <div className="card-image feature-card-image">
        <span className="card-image-icon">{icon}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{feature.name}</h3>
        <p className="card-desc">{feature.description}</p>
      </div>
    </div>
  );
}
