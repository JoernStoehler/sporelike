import type { Feature } from '../types';

interface Props {
  feature: Feature;
  glowVariant?: 'new' | 'changed' | 'removed' | 'none';
}

export function FeatureCard({ feature, glowVariant = 'none' }: Props) {
  const cardClass = [
    'card',
    'feature-card',
    glowVariant === 'new' || glowVariant === 'changed' ? 'amber-card' : '',
    glowVariant === 'removed' ? 'extinct-card' : '',
  ].filter(Boolean).join(' ');

  const icon = feature.type === 'geological' ? '🪨' : '🌊';

  const badgeText =
    glowVariant === 'new' ? 'NEW' :
    glowVariant === 'changed' ? 'SHIFTED' :
    glowVariant === 'removed' ? 'REMOVED' :
    null;

  return (
    <div className={cardClass}>
      {badgeText != null && (
        <span className={`badge ${glowVariant === 'removed' ? 'badge-red' : 'badge-amber'}`}>{badgeText}</span>
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
