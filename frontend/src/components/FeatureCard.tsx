import type { Feature } from '../types';

interface Props {
  feature: Feature;
  isChanged?: boolean;
}

export function FeatureCard({ feature, isChanged }: Props) {
  return (
    <div className={`card feature-card ${isChanged ? 'changed-card' : ''}`}>
      {isChanged && <span className="badge badge-changed">CHANGED</span>}
      <div className="card-body">
        <h4 className="card-title">
          {feature.type === 'geological' ? '🪨' : '🌊'} {feature.name}
        </h4>
        <p className="card-desc">{feature.description}</p>
      </div>
    </div>
  );
}
