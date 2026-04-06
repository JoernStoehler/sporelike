import { useState } from 'react';
import type { Challenge, Era } from '../types';
import { fetchFreeformChallenge } from '../api';

interface Props {
  challenges: Challenge[];
  currentEra: Era;
  onAllComplete: () => void;
  onChoiceMade: (challengeId: string, choice: number | 'freeform', freeformText?: string, outcome?: string) => void;
  freeformOutcomes: Record<string, string>;
  challengeIndex: number;
  setChallengeIndex: (index: number) => void;
  isReadOnly?: boolean;
}

export function ChallengeView({ challenges, currentEra, onAllComplete, onChoiceMade, freeformOutcomes, challengeIndex, setChallengeIndex, isReadOnly = false }: Props) {
  const [freeformText, setFreeformText] = useState('');
  const [freeformLoading, setFreeformLoading] = useState(false);
  const [freeformError, setFreeformError] = useState<string | null>(null);

  const challenge = challenges[challengeIndex];
  const chosen = challenge
    ? challenge.playerChoice !== undefined
      ? { choice: challenge.playerChoice, text: challenge.playerFreeformText }
      : undefined
    : undefined;
  const allDone = challenges.every(c => c.playerChoice !== undefined);

  function pickAction(actionIndex: number) {
    if (chosen || isReadOnly) return;
    onChoiceMade(challenge.id, actionIndex, undefined, challenge.actions[actionIndex].outcome);
  }

  async function submitFreeform() {
    if (chosen || !freeformText.trim() || isReadOnly || freeformLoading) return;
    const submittedText = freeformText;
    setFreeformLoading(true);
    setFreeformError(null);
    try {
      const result = await fetchFreeformChallenge({
        challenge,
        freeformText: submittedText,
        era: currentEra,
      });
      setFreeformText('');
      onChoiceMade(challenge.id, 'freeform', submittedText, result.outcome);
    } catch (err) {
      setFreeformError(err instanceof Error ? err.message : String(err));
    } finally {
      setFreeformLoading(false);
    }
  }

  function next() {
    if (challengeIndex < challenges.length - 1) {
      setChallengeIndex(challengeIndex + 1);
    }
  }

  function prev() {
    if (challengeIndex > 0) {
      setChallengeIndex(challengeIndex - 1);
    }
  }

  if (!challenge) return null;

  return (
    <div className="view challenge-view">
      <div className="challenge-progress">
        {challenges.map((_, i) => (
          <span key={i} className={`progress-dot ${i === challengeIndex ? 'current' : ''} ${challenges[i].playerChoice !== undefined ? 'done' : ''}`} />
        ))}
      </div>

      <div className="challenge-card">
        <p className="challenge-desc">{challenge.description}</p>

        <div className="action-list">
          {challenge.actions.map((action, i) => (
            <button
              key={i}
              className={`action-btn ${chosen?.choice === i ? 'chosen' : ''} ${chosen && chosen.choice !== i ? 'dimmed' : ''}`}
              onClick={() => pickAction(i)}
              disabled={isReadOnly || chosen != null}
            >
              <span className="action-label">{action.label}</span>
              {chosen?.choice === i && (
                <span className="action-outcome">{action.outcome}</span>
              )}
            </button>
          ))}
        </div>

        {!isReadOnly && !chosen && (
          <div className="freeform-input">
            <input
              type="text"
              placeholder="Or describe your own action..."
              value={freeformText}
              onChange={e => setFreeformText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFreeform()}
              disabled={freeformLoading}
            />
            <button className="btn btn-small" onClick={submitFreeform} disabled={!freeformText.trim() || freeformLoading}>
              {freeformLoading ? '...' : 'Go'}
            </button>
          </div>
        )}

        {freeformError && !chosen && (
          <p className="error-text">{freeformError}</p>
        )}

        {chosen?.choice === 'freeform' && (
          <div className="freeform-result">
            <p className="freeform-action">You: "{chosen.text}"</p>
            <p className="action-outcome">{freeformOutcomes[challenge.id] ?? challenge.playerOutcome ?? 'The ecosystem responds...'}</p>
          </div>
        )}
      </div>

      <div className="challenge-nav">
        <button className="btn btn-small" onClick={prev} disabled={challengeIndex === 0}>← Prev</button>
        <span className="challenge-counter">{challengeIndex + 1} / {challenges.length}</span>
        {challengeIndex < challenges.length - 1 ? (
          <button className="btn btn-small" onClick={next}>Next →</button>
        ) : isReadOnly ? null : allDone ? (
          <button className="btn btn-primary" onClick={onAllComplete}>Ready to Evolve →</button>
        ) : (
          <button className="btn btn-small" disabled>Complete all challenges</button>
        )}
      </div>
    </div>
  );
}
