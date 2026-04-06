import { useRef, useState } from 'react';
import type { Era, Species } from '../types';
import { SpeciesCard } from './SpeciesCard';
import { fetchMutationPreview } from '../api';

interface Props {
  era: Era;
  onAdvanceEra: () => void;
  advanceLoading?: boolean;
  isReadOnly?: boolean;
  nextEraPlayerSpecies?: Species;
}

export function EvolveView({ era, onAdvanceEra, advanceLoading = false, isReadOnly = false, nextEraPlayerSpecies }: Props) {
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Develop harder outer membrane',
    'Improve sensory detection',
    'Become more aggressive',
  ];

  async function handlePreview() {
    if (!mutationText.trim() || previewLoading) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await fetchMutationPreview({
        currentEra: era,
        playerSpecies,
        requestedChange: mutationText,
      });
      setPreview({
        species: result.species,
        reasoning: result.reasoning,
        variability: result.variabilityScore,
      });
      // Auto-scroll the card row to show the preview card
      setTimeout(() => {
        if (previewCardRef.current) {
          previewCardRef.current.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      }, 50);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
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
    <div ref={previewCardRef} className="evolve-placeholder-card">
      <span className="evolve-placeholder-text">? preview will appear here</span>
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
              disabled={isReadOnly || !mutationText.trim() || previewLoading}
            >
              {previewLoading ? 'Generating...' : 'Preview'}
            </button>
          </div>
          {previewError && <p className="error-text">{previewError}</p>}
          <div className={`suggestion-chips${isReadOnly ? ' disabled' : ''}`}>
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => setMutationText(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Preview details — shown when preview exists */}
      {preview && (!accepted || isReadOnly) && (
        <div className="evolve-preview-details">
          <p className="reasoning-text">{preview.reasoning}</p>
          {preview.variability > 0 && (
            <div className="variability-bar">
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
        <button className="btn btn-advance" onClick={onAdvanceEra} disabled={advanceLoading}>
          {advanceLoading ? 'Advancing...' : 'Advance to Next Era →'}
        </button>
      )}
    </div>
  );
}
