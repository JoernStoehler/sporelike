import { useRef, useState } from 'react';
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
  const [mutationText, setMutationText] = useState(
    isReadOnly && nextEraPlayerSpecies ? `Evolved into ${nextEraPlayerSpecies.name}` : ''
  );
  const [preview, setPreview] = useState<{ species: Species; reasoning: string; variability: number } | null>(
    isReadOnly && nextEraPlayerSpecies
      ? { species: nextEraPlayerSpecies, reasoning: 'This mutation was accepted in a previous era', variability: 0 }
      : null
  );
  const [accepted, setAccepted] = useState(isReadOnly);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Develop harder outer membrane',
    'Improve sensory detection',
    'Become more aggressive',
  ];

  function handlePreview() {
    if (!mutationText.trim()) return;
    // Mock preview — in real app this calls the AI
    const newPreview = {
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
    };
    setPreview(newPreview);
    // Auto-scroll the card row to show the preview card
    setTimeout(() => {
      if (previewCardRef.current) {
        previewCardRef.current.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }, 50);
  }

  function handleAccept() {
    setAccepted(true);
  }

  const previewCard = preview ? (
    <div ref={previewCardRef}>
      <SpeciesCard
        species={preview.species}
        glowVariant="new"
        changeLabel={accepted ? 'NEXT FORM' : 'PREVIEW'}
      />
    </div>
  ) : (
    <div
      ref={previewCardRef}
      className="card"
      style={{
        minWidth: 200,
        maxWidth: 240,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        background: '#0f1628',
        border: '1px dashed #2a3550',
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 12, color: '#4a5570', textAlign: 'center', padding: 8 }}>
        ? preview will appear here
      </span>
    </div>
  );

  return (
    <div className="view evolve-view">
      {/* Horizontal scrollable card row */}
      <div className="card-scroll" ref={cardScrollRef}>
        <SpeciesCard species={playerSpecies} glowVariant="player" />
        {previewCard}
      </div>

      {/* Input area — disabled in read-only, hidden after active acceptance */}
      {(!accepted || isReadOnly) && (
        <div className="evolve-input-area">
          <div className="mutation-input">
            <input
              type="text"
              placeholder="Describe a mutation..."
              value={mutationText}
              onChange={e => setMutationText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isReadOnly && handlePreview()}
              disabled={isReadOnly}
            />
            <button
              className="btn btn-primary"
              onClick={handlePreview}
              disabled={isReadOnly || !mutationText.trim()}
            >
              Preview
            </button>
          </div>
          <div className="suggestion-chips" style={isReadOnly ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => setMutationText(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Preview details — shown when preview exists */}
      {preview && (!accepted || isReadOnly) && (
        <div className="evolve-preview-details">
          <p className="reasoning-text reasoning-text-compact">{preview.reasoning}</p>
          {preview.variability > 0 && (
            <div className="variability-bar variability-bar-compact">
              <span className="variability-label">Variability</span>
              <div className="variability-track">
                <div className="variability-fill" style={{ width: `${preview.variability * 100}%` }} />
              </div>
              <span className="variability-value">{(preview.variability * 100).toFixed(0)}%</span>
            </div>
          )}
          <button
            className="btn btn-primary btn-full"
            onClick={handleAccept}
            disabled={isReadOnly}
          >
            Accept Mutation
          </button>
        </div>
      )}

      {/* Advance button — shown only after active acceptance */}
      {accepted && !isReadOnly && (
        <button className="btn btn-advance" onClick={onAdvanceEra}>
          Advance to Next Era →
        </button>
      )}
    </div>
  );
}
