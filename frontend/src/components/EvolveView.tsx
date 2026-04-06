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

  function handleTryAgain() {
    setPreview(null);
    setMutationText('');
  }

  return (
    <div className="view evolve-view">
      <h3 className="section-title">Your Species</h3>
      <SpeciesCard species={playerSpecies} size="large" />

      {isReadOnly ? (
        nextEraPlayerSpecies && (
          <div className="accepted-section">
            <h3 className="section-title">Evolved into:</h3>
            <SpeciesCard species={nextEraPlayerSpecies} glowVariant="new" changeLabel="NEXT FORM" size="large" />
          </div>
        )
      ) : (
        <>
          {!accepted && (
            <>
              <h3 className="section-title">How should your species adapt?</h3>
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
            </>
          )}

          {preview && !accepted && (
            <div className="preview-section">
              <h3 className="section-title">Mutation Preview</h3>
              <SpeciesCard species={preview.species} glowVariant="new" changeLabel="MUTATED" />
              <p className="reasoning-text">{preview.reasoning}</p>
              <div className="variability-bar">
                <span className="variability-label">Variability</span>
                <div className="variability-track">
                  <div className="variability-fill" style={{ width: `${preview.variability * 100}%` }} />
                </div>
                <span className="variability-value">{(preview.variability * 100).toFixed(0)}%</span>
              </div>
              <div className="preview-actions">
                <button className="btn btn-primary" onClick={handleAccept}>Accept Mutation</button>
                <button className="btn btn-secondary" onClick={handleTryAgain}>Try Again</button>
              </div>
            </div>
          )}

          {accepted && preview && (
            <div className="accepted-section">
              <div className="accepted-banner">✓ Mutation accepted</div>
              <SpeciesCard species={preview.species} glowVariant="new" changeLabel="NEXT FORM" size="large" />
              <button className="btn btn-advance" onClick={onAdvanceEra}>
                Advance to Next Era →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
