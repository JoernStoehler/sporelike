import { useState } from 'react';
import type { Era, Species } from '../types';
import { SpeciesCard } from './SpeciesCard';

interface Props {
  era: Era;
  onAdvanceEra: () => void;
  isReadOnly?: boolean;
  nextEraPlayerSpecies?: Species;
}

export function EvolveView({ era, onAdvanceEra, isReadOnly = false, nextEraPlayerSpecies }: Props) {
  const playerSpecies = era.species.find(s => s.id === era.playerSpeciesId)!;
  const [mutationText, setMutationText] = useState('');
  const [preview, setPreview] = useState<{ species: Species; reasoning: string; variability: number } | null>(null);
  const [accepted, setAccepted] = useState(false);

  const suggestions = [
    'Develop harder outer membrane',
    'Improve sensory detection',
    'Become more aggressive',
  ];

  function handlePreview() {
    if (!mutationText.trim()) return;
    // Mock preview — in real app this calls the AI
    setPreview({
      species: {
        ...playerSpecies,
        id: playerSpecies.id + '-next',
        name: playerSpecies.name + ' (Mutated)',
        description: playerSpecies.description + ' Now adapting: ' + mutationText,
        traits: [...playerSpecies.traits, mutationText.split(' ').slice(0, 2).join('-').toLowerCase()],
        parentId: playerSpecies.id,
      },
      reasoning: `This mutation responds to current ecological pressures. ${mutationText} would allow the species to better compete for resources near the thermal vents while maintaining its existing adaptations.`,
      variability: 0.4,
    });
  }

  function handleAccept() {
    setAccepted(true);
  }

  // Read-only past era: show current species on left, next form on right
  if (isReadOnly) {
    return (
      <div className="view evolve-view">
        <div className="evolve-cards">
          <SpeciesCard species={playerSpecies} glowVariant="player" size="compact" />
          {nextEraPlayerSpecies ? (
            <SpeciesCard species={nextEraPlayerSpecies} glowVariant="new" changeLabel="NEXT FORM" size="compact" />
          ) : (
            <div className="card evolve-card-placeholder">
              <span className="evolve-placeholder-text">No next form</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active evolve view
  const rightCard = accepted && preview
    ? <SpeciesCard species={preview.species} glowVariant="new" changeLabel="NEXT FORM" size="compact" />
    : preview
      ? <SpeciesCard species={preview.species} glowVariant="new" changeLabel="PREVIEW" size="compact" />
      : (
        <div className="card evolve-card-placeholder">
          <span className="evolve-placeholder-text">? preview will appear here</span>
        </div>
      );

  return (
    <div className="view evolve-view">
      {/* Two-card row */}
      <div className="evolve-cards">
        <SpeciesCard species={playerSpecies} glowVariant="player" size="compact" />
        {rightCard}
      </div>

      {/* Input area — hidden after acceptance */}
      {!accepted && (
        <div className="evolve-input-area">
          <div className="mutation-input">
            <input
              type="text"
              placeholder="Describe a mutation..."
              value={mutationText}
              onChange={e => setMutationText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePreview()}
            />
            <button className="btn btn-primary" onClick={handlePreview} disabled={!mutationText.trim()}>
              Preview
            </button>
          </div>
          <div className="suggestion-chips">
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => setMutationText(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Preview details — shown only when preview exists and not yet accepted */}
      {preview && !accepted && (
        <div className="evolve-preview-details">
          <p className="reasoning-text reasoning-text-compact">{preview.reasoning}</p>
          <div className="variability-bar variability-bar-compact">
            <span className="variability-label">Variability</span>
            <div className="variability-track">
              <div className="variability-fill" style={{ width: `${preview.variability * 100}%` }} />
            </div>
            <span className="variability-value">{(preview.variability * 100).toFixed(0)}%</span>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleAccept}>Accept Mutation</button>
        </div>
      )}

      {/* Advance button — shown only after acceptance */}
      {accepted && (
        <button className="btn btn-advance" onClick={onAdvanceEra}>
          Advance to Next Era →
        </button>
      )}
    </div>
  );
}
